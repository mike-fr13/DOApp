export const getTokenSymbolFromList = (tokenAddress, tokenList) => {
    const token = tokenList.find(t => t.tokenAddress === tokenAddress);
    return token ? token.symbol : '';
  }

export const findTokenPosition = (tokenPairs, index, tokenAddress) => {
    // find the pair with the given pairID
    //const pair = tokenPairs.find(pair => pair.pairID === pairID);
    console.log(`findTokenPosition - tokenPairs : ${tokenPairs}, token pair index ${index}, token address : ${tokenAddress}`)
    const pair = tokenPairs[index]
    if (!pair) {
        // if there's no such pair, return -1 or some other error code
        return -1;
    }
    console.log('findTokenPosition - pair :', pair)
    
    // determine whether the given token is token A or token B
    if (pair.tokenA === tokenAddress) {
        return 0;
    } else if (pair.tokenB === tokenAddress) {
        return 1;
    } else {
        // if the token is neither A nor B, return -1 or some other error code
        return -1;
    }
}

export const findPairIdByTokenAddress = (tokenAddress) => {
  // iterate over the tokenPairs array
  for (let pair of tokenPairs) {
      // check if the given address matches either tokenA or tokenB
      if (pair.tokenA === tokenAddress || pair.tokenB === tokenAddress) {
          // if it matches, return the pairID
          return pair.pairID;
      }
  }
  // if no match found, return null or some default value
  return null;
}

export const determineTokenPositionInPair = (pairID, tokenAddress) => {
  // find the pair with the given pairID
  const pair = tokenPairs.find(pair => pair.pairID === pairID);
  if (!pair) {
      // if there's no such pair, return null or some default value
      return null;
  }
  
  // determine whether the given token is token A or token B
  if (pair.tokenA === tokenAddress) {
      return 'A';
  } else if (pair.tokenB === tokenAddress) {
      return 'B';
  } else {
      // if the token is neither A nor B, return null or some default value
      return null;
  }
}