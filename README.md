# GhostBid - FHE-Powered Sealed-Bid NFT Auctions

A privacy-preserving NFT auction platform using Zama's Fully Homomorphic Encryption (FHE) technology. Bidders can submit encrypted bids that remain private until the auction ends.

## 🔐 Key Features

- **Sealed Bids**: All bids are encrypted using FHE before submission
- **Privacy-Preserving**: Bid amounts remain hidden until auction finalization
- **Transparent Audit**: Encrypted bids visible on-chain for verification
- **Homomorphic Comparison**: Winner determined without decrypting bids
- **Optional Reveal**: Winner can be revealed after finalization

## 🏗️ Architecture

- **Smart Contracts**: Solidity with Zama fhEVM
- **Frontend**: React + TypeScript + Vite
- **Blockchain**: Ethereum Sepolia Testnet
- **FHE**: Zama FHE SDK

## 📦 Deployed Contracts (Sepolia)

- **EncryptedAuction**: `0xc9850ef02d3f38B2aE77DF3be23fe3790F135FE6`
- **AuctionManager**: `0xeF7FcaFE5659A4C2b5f6C8232d71FAfb621FF8D9`

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask wallet
- Sepolia ETH (from faucets)

### Local Development

```bash
# Install dependencies
cd ghostbid
npm install

cd frontend
npm install

# Start local blockchain (optional)
cd ../
npx hardhat node

# Deploy contracts
npx hardhat deploy --network sepolia

# Start frontend
cd frontend
npm run dev
```

### Deploy to Vercel (Recommended for Real FHE)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd ghostbid/frontend
vercel --prod
```

The Vercel deployment includes proper CORS headers for the Zama FHE SDK.

## 🎯 Usage

1. **Create Auction**: Set NFT details, reserve price, and duration
2. **Submit Bids**: Bids are encrypted client-side before submission
3. **View Audit Panel**: See encrypted bids on-chain
4. **Finalize Auction**: Run relayer to determine winner (FHE comparison)
5. **Reveal Winner**: Optionally decrypt and reveal the winning bid

## 🔧 Configuration

### Environment Variables

**Backend (`ghostbid/.env`)**:
```env
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=YOUR_PRIVATE_KEY
FHE_CHAIN_ID=11155111
```

**Frontend (`ghostbid/frontend/.env`)**:
```env
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
VITE_ENCRYPTED_AUCTION=0xc9850ef02d3f38B2aE77DF3be23fe3790F135FE6
VITE_AUCTION_MANAGER=0xeF7FcaFE5659A4C2b5f6C8232d71FAfb621FF8D9
VITE_FHE_RELAYER_URL=https://gateway.zama.ai
VITE_FHE_CHAIN_ID=11155111
```

## 📚 Tech Stack

- **Solidity 0.8.24**: Smart contract language
- **Hardhat**: Development environment
- **React 18**: Frontend framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **ethers.js**: Ethereum library
- **Zama fhEVM**: FHE for Ethereum
- **TailwindCSS**: Styling

## 🧪 Testing

```bash
# Run contract tests
cd ghostbid
npx hardhat test

# Run frontend in dev mode
cd frontend
npm run dev
```

## 📖 How FHE Works

1. **Client-Side Encryption**: Bid amounts encrypted in browser using Zama SDK
2. **On-Chain Storage**: Only ciphertext stored on blockchain
3. **Homomorphic Operations**: Smart contract compares encrypted bids without decryption
4. **Winner Determination**: FHE adapter finds highest bid while maintaining privacy
5. **Optional Decryption**: Winner can be revealed using FHE decryption oracle

## 🛠️ Development Notes

### Local Testing
- Uses mock FHE encryption for local development
- Real FHE requires proper CORS headers (COOP/COEP)
- Vercel deployment configured with required headers

### Production Deployment
- Deploy frontend to Vercel for real FHE support
- Contracts deployed to Sepolia testnet
- Use Alchemy/Infura for reliable RPC access

## 🔗 Links

- [Zama Documentation](https://docs.zama.ai/)
- [fhEVM Docs](https://docs.zama.ai/fhevm)
- [Sepolia Faucet](https://sepoliafaucet.com/)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

Built with ❤️ using Zama FHE technology
