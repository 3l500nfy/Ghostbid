import { type HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-network-helpers';
import '@nomicfoundation/hardhat-verify';
import '@typechain/hardhat';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import '@fhevm/hardhat-plugin';
import 'dotenv/config';
import './tasks/accounts';

const { RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY, REPORT_GAS } = process.env;

const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion: 'cancun'
    }
  },
  defaultNetwork: 'hardhat',
  namedAccounts: {
    deployer: {
      default: 0
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      blockGasLimit: 30_000_000
    },
    fhevm: {
      url: RPC_URL ?? 'http://127.0.0.1:8545',
      accounts
    },
    sepolia: {
      url: RPC_URL ?? 'https://sepolia.gateway.tenderly.co',
      accounts,
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY ?? ''
  },
  gasReporter: {
    enabled: REPORT_GAS === 'true',
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY ?? ''
  },
  paths: {
    cache: 'hh-cache',
    artifacts: 'hh-artifacts'
  },

  typechain: {
    outDir: 'types',
    target: 'ethers-v6'
  }
};

export default config;

