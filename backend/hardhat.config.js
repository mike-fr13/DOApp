require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
require("@nomiclabs/hardhat-etherscan")
require('solidity-coverage');
require("hardhat-gas-reporter");
require('hardhat-docgen');

const PK_ACCOUNT0 = process.env.PK_ACCOUNT0 || ""
const INFURA_GOERLI_URL = process.env.INFURA_GOERLI_URL || ""
const INFURA_SEPOLIA_URL = process.env.INFURA_SEPOLIA_URL || ""
const ALCHEMY_MUMBAI_URL = process.env.ALCHEMY_MUMBAI_URL || ""
const ETHERSCAN = process.env.ETHERSCAN || ""

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    sepolia: {
      url: INFURA_SEPOLIA_URL,
      accounts: [PK_ACCOUNT0],
      chainId: 11155111
    },
    goerli: {
      url: INFURA_GOERLI_URL,
      accounts: [PK_ACCOUNT0],
      chainId: 5
    },
    mumbai: {
      url: ALCHEMY_MUMBAI_URL,
      accounts: [PK_ACCOUNT0],
      chainId: 80001
     }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.20"
      }
    ]
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN
    }
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    gasPrice: 21
  }
};