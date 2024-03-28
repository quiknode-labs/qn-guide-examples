## Quick Tac Toe

This is the final example of the [QuickNode Solana Basics Course](https://www.quicknode.com/courses/solana/solana-basics/overview). In this example, we build a simple tic-tac-toe game on the Solana blockchain. The game is played between two players, and the game state is stored on the Solana blockchain. 

## Getting Started

### Clone the Reponsitory

Clone the repository to your local machine:
```sh
git clone https://github.com/quiknode-labs/qn-guide-examples.git
```
Change to the directory of the example:
```sh
cd courses/solana-basics/final
```

### Environment Variables

Rename the `.env.example` file to `.env` and update the values with your own:

```sh
NEXT_PUBLIC_ENDPOINT=https://sample.solana-devnet.quiknode.pro/123456/
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_PROGRAM_ADDRESS=QTTmCrRSrMhPtZS431TSmtiosubJoqfExRhi7JHcJhC
```
Make sure to replace with your own endpoint and program address.

### Install Dependencies

```bash
npm install
# or
yarn
# or
pnpm install
# or
bun install
```

### Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.