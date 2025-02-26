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
	"encoding/base64"
	"encoding/json"
	"fmt"
	"google.golang.org/grpc/credentials"
	"log"
	"net/url"
	"strings"

	"google.golang.org/grpc"
	pb "tron-grpc/proto"
)

func getGrpcOptions(endpointURL string) (string, []grpc.DialOption) {
	parsed, err := url.Parse(endpointURL)
	if err != nil {
		log.Fatal(err)
	}

	username := strings.Split(parsed.Host, ".")[0]
	password := strings.Trim(parsed.Path, "/")
	grpcOpts := []grpc.DialOption{
		grpc.WithDefaultCallOptions(grpc.MaxCallRecvMsgSize(1024 * 1024 * 1024)),
	}

	grpcOpts = append(grpcOpts, grpc.WithTransportCredentials(credentials.NewTLS(&tls.Config{})))
	port := 50051

	target := fmt.Sprintf("%s:%d", parsed.Hostname(), port)
	if password == "" {
		log.Println("no auth token (password) set, skipping basic auth")
		return target, grpcOpts
	}

	creds := basicAuth{username: username, password: password}
	grpcOpts = append(grpcOpts, grpc.WithPerRPCCredentials(creds))

	return target, grpcOpts
}

type basicAuth struct {
	username string
	password string
}

func (b basicAuth) GetRequestMetadata(ctx context.Context, in ...string) (map[string]string, error) {
	auth := b.username + ":" + b.password
	enc := base64.StdEncoding.EncodeToString([]byte(auth))
	return map[string]string{
		"authorization": "Basic " + enc,
	}, nil
}

func (basicAuth) RequireTransportSecurity() bool {
	return false
}

func main() {
	endpoint := "YOUR_QUICKNODE_ENDPOINT"
	target, opts := getGrpcOptions(endpoint)
	grpcConn, err := grpc.Dial(target, opts...)
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

- Remember to replace `"YOUR_QUICKNODE_ENDPOINT"` with your actual Tron node endpoint URL before running the application.
- Tron gRPC runs on PORT 50051

Your endpoint will be visible on the QuickNode dashboard with a format like: `https://my-endpoint-name.tron-mainnet.quiknode.pro/xxxtoken-1234-abcd/jsonrpc`

**Important**: Make sure to remove `/jsonrpc` from the end of your endpoint URL when using it for gRPC calls.