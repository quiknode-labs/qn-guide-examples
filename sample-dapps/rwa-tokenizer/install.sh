#!/bin/bash

# Install Foundry dependencies
echo "Installing Foundry dependencies..."

# Create lib directory if it doesn't exist
mkdir -p lib

# Install OpenZeppelin Contracts
if [ ! -d "lib/openzeppelin-contracts" ]; then
    echo "Installing OpenZeppelin Contracts..."
    git clone https://github.com/OpenZeppelin/openzeppelin-contracts.git lib/openzeppelin-contracts
    cd lib/openzeppelin-contracts
    git checkout v5.0.0
    cd ../..
else
    echo "OpenZeppelin Contracts already installed"
fi

# Install Forge Standard Library
if [ ! -d "lib/forge-std" ]; then
    echo "Installing Forge Standard Library..."
    git clone https://github.com/foundry-rs/forge-std.git lib/forge-std
else
    echo "Forge Standard Library already installed"
fi

echo "Dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and fill in your PRIVATE_KEY"
echo "2. Run 'forge build' to compile contracts"
echo "3. Run 'forge test' to run tests"
