export function getChainName(chainId) {
    switch (chainId) {
      case '0x1':
        return 'Ethereum Mainnet';
      case '0x3':
        return 'Ropsten Testnet';
      case '0x4':
        return 'Rinkeby Testnet';
      case '0x2a':
        return 'Kovan Testnet';
      case '0x5':
        return 'Goerli Testnet';
      case '0x89':
        return 'Polygon Mainnet';
      case '0x13881':
        return 'Mumbai Testnet';
      case '0xa':
        return 'Optimism Mainnet';
      case '0x69':
        return 'Optimism Testnet (Kovan)';
      case '0xa4b1':
        return 'Arbitrum Mainnet';
      case '0x4d539':
        return 'Arbitrum Testnet (Rinkeby)';
      case '0x7a69':
        return 'Hardhat';
        default:
        return 'Unknown - ' + chainId;
    }
  }
  export default getChainName