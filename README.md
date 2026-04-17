# Arc Contracts Deployer

A web app for deploying ERC-20 tokens and ERC-721 NFT collections on Arc Testnet directly from your browser wallet.

Built by **wija** while exploring the Arc blockchain ecosystem.

## What it does

- Deploy your own ERC-20 fungible token (name, symbol, initial supply)
- Deploy your own ERC-721 NFT collection (name, symbol, optional metadata URI)
- All tokens are minted to your wallet on deployment
- View deployed contracts with direct links to ArcScan explorer
- No backend, no private keys — your wallet signs everything

## How it works

The app uses pre-compiled Solidity bytecode for a simple ERC-20 and ERC-721 contract. When you click Deploy, your wallet (MetaMask, Rabby, OKX, etc.) signs the deployment transaction and broadcasts it to Arc Testnet.

## Built with

- [Next.js](https://nextjs.org/)
- [Wagmi](https://wagmi.sh/) + [Viem](https://viem.sh/)
- [RainbowKit](https://www.rainbowkit.com/)
- [Solidity](https://soliditylang.org/) + [solc](https://www.npmjs.com/package/solc)
- [Arc Testnet](https://docs.arc.network/)

## Getting started

1. Clone the repo
```bash
   git clone https://github.com/marekma65/arc-contracts-deployer.git
   cd arc-contracts-deployer
```

2. Install dependencies
```bash
   npm install
```

3. Add your WalletConnect Project ID in `lib/wagmi-config.ts`
```ts
   projectId: "YOUR_PROJECT_ID"
```

4. Run the app
```bash
   npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Live demo

[arc-contracts-deployer.vercel.app](https://arc-contracts-deployer.vercel.app)

## Network

Arc Testnet — Chain ID: 5042002 — Explorer: [testnet.arcscan.app](https://testnet.arcscan.app)

## Notes

- Testnet only — no real funds at risk
- Get free testnet USDC from [Circle Faucet](https://faucet.circle.com/)
- After deploying an NFT collection, use the mint() function to mint individual tokens