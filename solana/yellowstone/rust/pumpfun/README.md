# Solana Geyser Yellowstone gRPC Rust Example

The example demonstrates a simple Rust script that uses the [QuickNode Yellowstone gRPC Add-on](https://marketplace.quicknode.com/add-on/yellowstone-grpc-geyser-plugin?utm_source=internal&utm_campaign=sample-apps&utm_content=yellowstone-rust) to monitor transactions related to Pump.fun minting operations.

```bash
[2025-04-09T16:08:21Z INFO  solana_account_monitor] Connected to gRPC endpoint
[2025-04-09T16:08:21Z INFO  solana_account_monitor] Subscription request sent. Listening for updates...
[2025-04-09T16:08:22Z INFO  solana_account_monitor] Transaction update received! ID: 3WTQBZkrJEjGCLmyn852hKvYhHvGfUXf4oNp4mTvik6oHPQ3BSjyGmiGLuhfBXniHMXrjPvaYRZgiN6d7Giva7wZ
[2025-04-09T16:08:22Z INFO  solana_account_monitor] Transaction update received! ID: 5utWh1Mwe9n52WfVGcYu22ARqJ7gbUQoUBHG76XHKfNpYrfyZge9EdRku7Z9opZv2UVDQfyTSXZFRAQqaB6YUgrd
```

## Requirements

- [QuickNode Account](https://www.quicknode.com/signup?utm_source=internal&utm_campaign=sample-apps&utm_content=yellowstone-rust)
- [QuickNode Yellowstone gRPC Add-on Enabled](https://marketplace.quicknode.com/add-on/yellowstone-grpc-geyser-plugin?utm_source=internal&utm_campaign=sample-apps&utm_content=yellowstone-rust)
- [Rust](https://rustup.rs/)


## Installation

Clone this repository:

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
```

Navigate to this example directory:

```bash
cd solana/yellowstone/rust/pumpfun
```

## Configuration

Get your [QuickNode Yellowstone gRPC Add-on Enabled](https://marketplace.quicknode.com/add-on/yellowstone-grpc-geyser-plugin?utm_source=internal&utm_campaign=sample-apps&utm_content=yellowstone-rust) RPC endpoint. 

Yellowstone gRPC operates on port 10000. This is a dedicated secure port for gRPC communication and is separate from the standard Solana RPC endpoint. When connecting to the service the port must be specified in the URL:

- **Endpoint**: The name of your gRPC-enabled endpoint (by default, this is three randomly generated words) followed by `.solana-mainnet.quiknode.pro` and the port number `10000` (e.g., `https://example-guide-demo.solana-mainnet.quiknode.pro:10000`)
- **Token**: The alphanumeric string that follows the endpoint name in the URL (additional tokens can be generated from the [QuickNode Dashboard](https://dashboard.quicknode.com/)) Endpoint Security tab.

Given the following example HTTP Provider URL: `https://example-guide-demo.solana-mainnet.quiknode.pro/123456789/`, your authentication your credentials would be:
- Endpoint: `https://example-guide-demo.solana-mainnet.quiknode.pro:10000`
- Token: `123456789` 

Update your endpoint/token in the `src/main.rs` file:

```rust
// For HTTP Provider URL: https://example-guide-demo.solana-mainnet.quiknode.pro/123456789/
const ENDPOINT: &str = "https://example-guide-demo.solana-mainnet.quiknode.pro:10000";
const AUTH_TOKEN: &str = "123456789";
```


## Filters

Modify your search filters as needed

```rust
const PUMP_FUN_FEE_ACCOUNT: &str = "CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM";
const PUMP_FUN_PROGRAM: &str = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
// ...
            account_required: vec![
                PUMP_FUN_FEE_ACCOUNT.to_string(), 
                PUMP_FUN_PROGRAM.to_string()
            ],
```


## Build

Build the project:

```bash
cargo build
```

## Usage

Run the script:

```bash
cargo run
```

## Additional Resources

- [Yellowstone gRPC Add-on](https://marketplace.quicknode.com/add-on/yellowstone-grpc-geyser-plugin?utm_source=internal&utm_campaign=sample-apps&utm_content=yellowstone-rust)
- [Yellowstone Docs](https://www.quicknode.com/docs/solana/yellowstone-grpc/overview)
- [Yellowstone gRPC Source Code](https://github.com/rpcpool/yellowstone-grpc)