# Tron gRPC Project Setup Guide

This guide walks you through setting up a basic Tron gRPC project in Go. You'll create a simple project that connects to a Tron node via gRPC, retrieves the latest block information from the blockchain, and displays it in a formatted JSON output.

## Prerequisites

- Go installed on your system ([Download Go](https://golang.org/dl/))
- Basic familiarity with command-line operations

## Steps to Initialize the Project

### Step 1. Create a new project directory

```bash
mkdir tron-grpc
cd tron-grpc/
```

This creates a new directory `tron-grpc` and navigates into it.

### Step 2. Initialize a Go module

```bash
go mod init tron-grpc
```

This initializes a new Go module named `tron-grpc` and creates a `go.mod` file.

### Step 3. Create a directory for Protocol Buffers (proto files)

```bash
mkdir proto
```

The `proto` directory is used to store `.pb.go` files for gRPC.

Download the [api.pb.go](https://github.com/quiknode-labs/qn-guide-examples/tron/protobuf-file/api.pb.go) file and place it inside the `proto` directory.

### Step 4. Create the main Go file

```bash
touch main.go
```

This creates an empty `main.go` file, which will be used to define the logic.

### Step 5. Add code to main.go

```go
package main

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"log"
	pb "tron-grpc/proto"
)

type tokenAuth struct {
	token string
}

// GetRequestMetadata adds the token to the request metadata
func (t tokenAuth) GetRequestMetadata(ctx context.Context, in ...string) (map[string]string, error) {
	return map[string]string{"x-token": t.token}, nil
}

// RequireTransportSecurity indicates whether the credentials require transport security
func (tokenAuth) RequireTransportSecurity() bool {
	return true
}

func main() {

    // Configuring QuickNode gRPC endpoint and authentication token:
    //
    // Your QuickNode's Tron endpoint will be structured as follows:
    //   https://<your-endpoint-name>.tron-mainnet.quiknode.pro/<your-api-token>
    //
    // To correctly set up the gRPC connection:
    // - Extract "<your-endpoint-name>" and assign it to the `target` variable, appending ":50051" (the gRPC port).
    // - Extract "<your-api-token>" and assign it to the `token` variable.
    //
    // Example:
    //   Given QuickNode URL: https://docs-demo.tron-mainnet.quiknode.pro/abcd1234xyz
    //   Set `target`        : "docs-demo.tron-mainnet.quiknode.pro:50051"
    //   Set `token`         : "abcd1234xyz"
    //
    // This ensures proper authentication when connecting to the QuickNode gRPC service.

	target := "my-endpoint-name.tron-mainnet.quiknode.pro:50051"
	token := "YOUR_TOKEN"
	creds := tokenAuth{token: token}

	// Define gRPC options
	grpcOpts := []grpc.DialOption{
		grpc.WithPerRPCCredentials(creds),
		grpc.WithTransportCredentials(credentials.NewTLS(&tls.Config{})),
	}

	// Establish connection
	grpcConn, err := grpc.Dial(target, grpcOpts...)
	if err != nil {
		log.Fatal(err)
	}
	defer grpcConn.Close()

	client := pb.NewWalletClient(grpcConn)

	// Call GetNowBlock
	block, err := client.GetNowBlock(context.Background(), &pb.EmptyMessage{})
	if err != nil {
		log.Fatalf("Failed to get latest block: %v", err)
	}

	blockJSON, err := json.MarshalIndent(block, "", "  ")
	if err != nil {
		log.Fatalf("Failed to format block data: %v", err)
	}

	// Print the formatted JSON block data
	fmt.Println("Latest Block Information:")
	fmt.Println(string(blockJSON))
}

```

### Step 6. Install dependencies

Run the following command to download and install all required dependencies:

```bash
go mod tidy
```

### Step 7. Run the application

Now you can run the code with:

```bash
go run main.go
```

This will execute the `GetNowBlock` method and display the latest block information from the Tron network.

## Final Folder Structure

Once you've completed all the steps, your project structure should look like this:

```
tron-grpc/
├── go.mod
├── go.sum
├── main.go
└── proto/
    └── api.pb.go
```

Make sure your files are organized in this structure to ensure everything works correctly.

## Note

Your endpoint will be visible on the QuickNode dashboard with a format like: `https://your-endpoint-name.tron-mainnet.quiknode.pro/xxxtoken-1234-abcd/jsonrpc`

**Important**: Make sure to remove `/jsonrpc` from the end of your endpoint URL when using it for gRPC calls.