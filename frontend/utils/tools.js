export const getTokenSymbolFromList = (tokenAddress, tokenList) => {
    const token = tokenList.find(t => t.tokenAddress === tokenAddress);
    return token ? token.symbol : '';
  }