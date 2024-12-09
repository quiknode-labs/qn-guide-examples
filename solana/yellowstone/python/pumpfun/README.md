# Solana Geyser Yellowstone gRPC Python Example

The example demonstrates a simple Python script that uses the [QuickNode Yellowstone gRPC Add-on](https://marketplace.quicknode.com/add-on/yellowstone-grpc-geyser-plugin?utm_source=internal&utm_campaign=sample-apps&utm_content=yellowstone-python) to monitor transactions related to Pump.fun minting operations.

```bash
💊 New Pump.fun Mint!
Signature: 5hPKsGQHmufQLCFeVbqk2bwqNuToGuZ251Uot31C2YqwJhp3kQErK1kywFSGBApjSvi9Ckq1gpHwusrzbQYi9kA7
Slot: 306454422
Mint: 4kM9gt9Kt2M2skXMWbwtmkXbJFr5EoP1G5EJNgk1pump


💊 New Pump.fun Mint!
Signature: 5J5uY1XicdeL94nd6sAA9ASvSUm7mWsMiEUoZ3rCApyxSfbaeV29AUa9d45Ye7ycJfyd89TsbC4GQM18yjPQTrBV
Slot: 306454423
Mint: 2hz5ziHN1BgaMvjQwj4Y1BaMvcTCovQRGhqHqxPipump
```

## Requirements

- [QuickNode Account](https://www.quicknode.com/signup?utm_source=internal&utm_campaign=sample-apps&utm_content=yellowstone-python)
- [QuickNode Yellowstone gRPC Add-on Enabled](https://marketplace.quicknode.com/add-on/yellowstone-grpc-geyser-plugin?utm_source=internal&utm_campaign=sample-apps&utm_content=yellowstone-python)
- [Python 3.10+](https://www.python.org/downloads/)
- [pip](https://pypi.org/project/pip/)
- Script assumes your Certificate Authority (CA) trust store on your machine allows trust the CA from your RPC endpoint.
- This example uses [grpc.io](https://grpc.io/) library.

## Installation

Clone this repository:

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
```

Navigate to this example directory:

```bash
cd solana/yellowstone/python/pumpfun
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment:

```bash
source venv/bin/activate # macOS / Linux
```
or 

```bash
venv\Scripts\activate.bat # Windows
```

Install the dependencies:

```bash
(venv) $ python -m pip install -r requirements.txt
```

## Configuration

Get your [QuickNode Yellowstone gRPC Add-on Enabled](https://marketplace.quicknode.com/add-on/yellowstone-grpc-geyser-plugin?utm_source=internal&utm_campaign=sample-apps&utm_content=yellowstone-python) RPC endpoint. 

Yellowstone gRPC operates on port 10000. This is a dedicated secure port for gRPC communication and is separate from the standard Solana RPC endpoint. When connecting to the service the port must be specified in the URL:

- **Endpoint**: The name of your gRPC-enabled endpoint (by default, this is three randomly generated words) followed by `.solana-mainnet.quiknode.pro` and the port number `10000` (e.g., `https://example-guide-demo.solana-mainnet.quiknode.pro:10000`)
- **Token**: The alphanumeric string that follows the endpoint name in the URL (additional tokens can be generated from the [QuickNode Dashboard](https://dashboard.quicknode.com/)) Endpoint Security tab.

Given the following example HTTP Provider URL: `https://example-guide-demo.solana-mainnet.quiknode.pro/123456789/`, your authentication your credentials would be:
- Endpoint: `https://example-guide-demo.solana-mainnet.quiknode.pro:10000`
- Token: `123456789` 

Update the `main.py` file with your RPC endpoint and authentication token:

```python
    monitor = PumpMonitor(
        "https://example-guide-demo.solana-mainnet.quiknode.pro:10000",
        "123456789"
    )
```

## Usage

Run the script:

```bash
(venv) $ python main.py
```

## Additional Resources

- [Yellowstone gRPC Add-on](https://marketplace.quicknode.com/add-on/yellowstone-grpc-geyser-plugin?utm_source=internal&utm_campaign=sample-apps&utm_content=yellowstone-python)
- [Yellowstone Docs](https://www.quicknode.com/docs/solana/yellowstone-grpc/overview)
- For more information about the code in this example you can refer to the context in our [Yellowstone TypeScript Guide](https://www.quicknode.com/guides/solana-development/tooling/geyser/yellowstone), which explains some of the concepts and terminology used in this example.
- [Yellowstone gRPC Source Code](https://github.com/rpcpool/yellowstone-grpc)

## Advanced

If you prefer, you can generate all the stubs and data types using the following command:

```bash
(venv) $ python -m grpc_tools.protoc \
  -I./proto/ \
  --python_out=./generated \
  --pyi_out=./generated \
  --grpc_python_out=./generated \
  ./proto/*
```

This will generate the following files in your `generated` directory (which is where `main.py` currently imports from):
- geyser_pb2.py
- geyser_pb2.pyi
- geyser_pb2_grpc.py
- solana_storage_pb2.py
- solana_storage_pb2.pyi
- solana_storage_pb2_grpc.py
