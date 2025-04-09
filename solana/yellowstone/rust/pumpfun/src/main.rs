use {
    bs58,
    futures::{sink::SinkExt, stream::StreamExt},
    log::{info, error, warn},
    std::{collections::HashMap, env},
    tokio,
    tonic::{
        transport::ClientTlsConfig,
        service::Interceptor,
        Status,
    },
    yellowstone_grpc_client::GeyserGrpcClient,
    yellowstone_grpc_proto::{
        geyser::SubscribeUpdate,
        prelude::{
            subscribe_update::UpdateOneof,
            CommitmentLevel,
            SubscribeRequest,
            SubscribeRequestFilterTransactions,
        },
    },
};

// Constants
const RUST_LOG_LEVEL: &str = "info";
const PUMP_FUN_FEE_ACCOUNT: &str = "CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM";
const PUMP_FUN_PROGRAM: &str = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";

// For HTTP Provider URL: https://example-guide-demo.solana-mainnet.quiknode.pro/123456789/
const ENDPOINT: &str = "https://example-guide-demo.solana-mainnet.quiknode.pro:10000";
const AUTH_TOKEN: &str = "123456789";

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    setup_logging();
    info!("Starting to monitor account: {}", PUMP_FUN_FEE_ACCOUNT);

    let mut client = setup_client().await?;
    info!("Connected to gRPC endpoint");
    let (subscribe_tx, subscribe_rx) = client.subscribe().await?;
    
    send_subscription_request(subscribe_tx).await?;
    info!("Subscription request sent. Listening for updates...");
    
    process_updates(subscribe_rx).await?;
    
    info!("Stream closed");
    Ok(())
}

/// Initialize the logging system
fn setup_logging() {
    env::set_var("RUST_LOG", RUST_LOG_LEVEL);
    env_logger::init();
}

/// Create and connect to the gRPC client
async fn setup_client() -> Result<GeyserGrpcClient<impl Interceptor>, Box<dyn std::error::Error>> {
    
    info!("Connecting to gRPC endpoint: {}", ENDPOINT);
    
    // Build the gRPC client with TLS config
    let client = GeyserGrpcClient::build_from_shared(ENDPOINT.to_string())?
        .x_token(Some(AUTH_TOKEN.to_string()))?
        .tls_config(ClientTlsConfig::new().with_native_roots())?
        .connect()
        .await?;
    
    Ok(client)
}

/// Send the subscription request with transaction filters
async fn send_subscription_request<T>(
    mut tx: T,
) -> Result<(), Box<dyn std::error::Error>> 
where 
    T: SinkExt<SubscribeRequest> + Unpin,
    <T as futures::Sink<SubscribeRequest>>::Error: std::error::Error + 'static,
{
    // Create account filter with the target accounts
    let mut accounts_filter = HashMap::new();
    accounts_filter.insert(
        "account_monitor".to_string(),
        SubscribeRequestFilterTransactions {
            account_include: vec![],
            account_exclude: vec![],
            account_required: vec![
                PUMP_FUN_FEE_ACCOUNT.to_string(), 
                PUMP_FUN_PROGRAM.to_string()
            ],
            vote: Some(false),
            failed: Some(false),
            signature: None,
        },
    );
    
    // Send subscription request
    tx.send(SubscribeRequest {
        transactions: accounts_filter,
        commitment: Some(CommitmentLevel::Processed as i32),
        ..Default::default()
    }).await?;
    
    Ok(())
}

/// Process updates from the stream
async fn process_updates<S>(
    mut stream: S,
) -> Result<(), Box<dyn std::error::Error>> 
where 
    S: StreamExt<Item = Result<SubscribeUpdate, Status>> + Unpin,
{
    while let Some(message) = stream.next().await {
        match message {
            Ok(msg) => handle_message(msg),
            Err(e) => {
                error!("Error receiving message: {:?}", e);
                break;
            }
        }
    }
    
    Ok(())
}

/// Handle an individual message from the stream
fn handle_message(msg: SubscribeUpdate) {
    match msg.update_oneof {
        Some(UpdateOneof::Transaction(transaction_update)) => {
            if let Some(tx_info) = &transaction_update.transaction {
                let signature = &tx_info.signature;
                let tx_id = bs58::encode(signature).into_string();
                info!("Transaction update received! ID: {}", tx_id);
            } else {
                warn!("Transaction update received but no transaction info available");
            }
        },
        Some(other) => {
            info!("Other update received: {:?}", other);
        },
        None => {
            warn!("Empty update received");
        }
    }
}