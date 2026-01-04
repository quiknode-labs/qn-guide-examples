# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is Quicknode's guide examples repository containing sample applications, tutorials, and reference implementations for various blockchain technologies and Web3 development patterns. The codebase is organized by blockchain networks and use cases, with a focus on educational content.

## Architecture Structure

### Main Categories
- **sample-dapps/**: Production-ready dApp examples (token factories, wallet explorers, DEX aggregators)
- **AI/**: AI-powered blockchain tools (MCP servers, AI agents, trading bots)
- **ethereum/**: Ethereum-specific examples (smart contracts, DeFi protocols, NFTs)
- **solana/**: Solana ecosystem examples (token creation, staking, Jupiter integration)
- **defi/**: Cross-chain DeFi implementations
- **enhanced-apis/**: Quicknode API integration examples
- **Streams/**: Real-time blockchain data streaming applications
- **QuickAlerts/**: Notification and alerting systems

### Technology Stack Patterns
- **Frontend**: Next.js (primary), React with Vite, vanilla HTML/CSS
- **Backend**: Node.js/Express, TypeScript throughout
- **Web3 Libraries**: ethers.js, @solana/web3.js, viem, wagmi
- **Styling**: Tailwind CSS (ubiquitous), shadcn/ui components
- **Development**: TypeScript, ESLint, nodemon for hot reload

## Common Development Commands

### Build Commands (by framework)
```bash
# Next.js projects (most common)
npm run build        # Uses: next build

# React projects
npm run build        # Uses: react-scripts build

# Vite projects  
npm run build        # Uses: tsc && vite build

# TypeScript only
npm run build        # Uses: tsc -p .
```

### Development Commands
```bash
# Next.js
npm run dev          # Uses: next dev

# React
npm start           # Uses: react-scripts start

# Vite
npm run dev         # Uses: vite

# Node.js with TypeScript
npm run dev         # Uses: nodemon (with TypeScript watching)
```

### Lint Commands
```bash
# Next.js projects
npm run lint        # Uses: next lint

# Custom ESLint setup
npm run lint        # Uses: eslint . --ext ts,tsx
```

### Test Commands
```bash
# React projects
npm test           # Uses: react-scripts test (Jest)

# Custom TypeScript tests
npm test           # Uses: ts-node src/test.ts
```

## Development Workflow

### Project Structure Recognition
- Each directory typically contains a README.md with setup instructions
- Most projects follow the TEMPLATE_README.md format for consistency
- Smart contract projects may include Hardhat or Foundry configurations
- Solana projects often use anchor framework or direct web3.js

### Environment Setup
- Projects require API keys for Quicknode endpoints
- Many use .env files (check example.env when present)
- Solana projects need local validator setup for development
- Ethereum projects may require local Hardhat network

### Working with Smart Contracts
- **Ethereum**: Typically uses Hardhat with ethers.js, some use Foundry
- **Solana**: Mix of Anchor framework and native programs
- **Contract deployment**: Each project has specific deployment scripts in scripts/ or src/
- **ABIs/IDLs**: Located in contracts/, abis/, or generated directories

### API Integration Patterns
- Quicknode RPC endpoints are central to most examples
- Enhanced APIs (NFT, token data) used extensively
- Streaming APIs for real-time data applications
- Authentication patterns for protected endpoints

## Key Development Notes

### Code Conventions
- TypeScript is mandatory across all projects
- Component-based architecture for React/Next.js applications
- Modular smart contract patterns
- Environment-based configuration management

### Testing Approach
- Testing coverage varies significantly between projects
- React projects use Jest through react-scripts
- Smart contract testing varies by framework (Hardhat, Anchor)
- Many examples focus on demonstration over comprehensive testing

### Package Management
- Repository supports npm, yarn, and pnpm
- Lock files present indicate preferred package manager per project
- Dependencies tend to be framework-specific but share common Web3 libraries