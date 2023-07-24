# README

    Disclaimer: Development Code

    The code provided in this repository is intended for development and learning purposes only. It is not suitable for production use without proper review, testing, and security considerations. The code may contain bugs, vulnerabilities, or other issues that could result in unexpected behavior or compromise the security of the system.


# Backend Description of DOApp

This repository contains the backend code for the DOApp project. The backend is developed using Hardhat, a development environment for Ethereum. It includes the smart contract code and test cases.


# Backend Deployment and Tests run

- To run the tests for the backend, use the following commands:

    `npx hardhat test`

- For gas reporting during tests, use the following command:

    `REPORT_GAS=true npx hardhat test`

## Deploying the Backend Locally with Hardhat

- To start a local blockchain, run the following command:

    `npx hardhat node`

- To deploy the contract locally, use the following command:

    `npx hardhat run scripts/deploy.js --network localhost`

- To inject test data, use the following command:

    `npx hardhat run scripts/inject_data.js --network localhost`

- To deploy the backend on the Goerli testnet, use the following command:

    `npx hardhat run scripts/deploy.js --network goerli`

# Key Concepts and Overarching Philosophy of DOApp

1 - DDApp employs segment definitions to pinpoint users who are interested in DCA. For instance, if a user wishes to invest between $1000 and $1500, given the segment size defined by the admin (let's say 50), 10 segments will be created (1000 - 1049, 1050-1099, ... 1450-1499). These segments enable DOApp to precisely identify users who are looking to buy or sell within these boundaries, simplifying the search for eligible DCA users at the expense of a slight overhead during creation.

2 - DOApp aims to maximize Over-The-Counter (OTC) transactions as opposed to using swaps like Uniswap. With these segments, OTC exchanges are facilitated for people who may have contrary orders (one buying, one selling). Each time a DCA is initiated, DOApp strives to maximize this aspect by alternating between buyer and seller lists. In the end, after grouping orders, if X is the buyer's amount and Y is the seller's amount, min(x,y) will be traded OTC, and only |x-y| will be swapped.

3 - DOApp utilizes a scaling factor for DCA. This implies that if a user desires to invest in a range of $1000 to $1500, and they choose a base amount of $10 with a factor of 3, then when the price reaches $1500, DOApp will invest $10, but if it drops to $1000, DOApp will invest $103. The computed amount linearly scales between $1500 to $1000.

4 - All tokens deposited into DOApp are supplied to AAVE, implying a careful selection of tokens is made. This action allows DOApp to simultaneously contribute to the liquidity of AAVE ;) while facilitating the user's DCA investment.


# Testing Strategy for the Voting Contract
## General Organization

The test file is divided into multiple sections, each corresponding to a specific functionality of the DOApp contracts.

Several fixture functions are defined at the beginning of the file to deploy the voting contract and prepare it for various test scenarios:

## Test Sections
```

  DOApp Contract tests
    Deployment
      ✓ Should set the right owner

  MockERC20
    Deployment
      ✓ Should have correct name 
      ✓ Should have correct symbol 
      ✓ Should have correct inital balance 
      ✓ Should mint a specified amount for a specified wallet 

  MockChainLinkAggregatorV3
    local Deployment
      latestRoundData() tests
        ✓ Should return 0 before setting price
        ✓ Should return a 0 roundID before setting a first price
        ✓ Should return a 0 startedAt timestamp before setting a first price
        ✓ Should return a 0 updatedAt timestamp before setting a first price
        ✓ Should return a 0 for answeredInRound 
        ✓ Should return correct value after setting price 
      getRoundData() tests
        ✓ Should return a 0 price before setting a first price
        ✓ Should return a 0 roundID before setting a first price
        ✓ Should return a 0 startedAt timestamp before setting a first price
        ✓ Should return a 0 updatedAt timestamp before setting a first price
        ✓ Should return a 0 for answeredInRound 
        ✓ Should return correct value after setting price 
        ✓ Should increment roundID by 1 after setting a price
      description() tests
        ✓ Should return 'Local Mock' description when locally deployed  
      decimals() tests
        ✓ Should return 8 when locally deployed  
      version() tests
        ✓ Should return 0 when locally deployed  

  MockAavePool tests
    Mock function tests
      getReserveData() test
        ✓ Should revert with a 0 address for token
        ✓ Should revert if aTokennot created (mock only)
      supply() tests
        ✓ Should revert with a 0 address for token
        ✓ Should revert with a 0 amount
        ✓ Should revert with a 0 onBehalf address
        ✓ Should supply token to the pool
      withdraw() tests
        ✓ Should revert with a 0 address for token
        ✓ Should revert with a 0 amount
        ✓ Should revert with a 0 onBehalf address
        ✓ Should withdraw token to the pool
    Non Mock function tests
      ✓ Should revert if calling a non monck function
      getAtoken() tests
        ✓ Should revert with a 0 address
      createAToken() tests
        ✓ Should revert with a 0 address
        ✓ Should create aToken for given token
        ✓ Should keep same aToken if call twice

  MockAAVEPoolAddressesProvider
    getPool() tests
      ✓ Should return an empty address after contract init
    setPoolImpl() tests
      ✓ Should return a Pool contract
    Non Mock function tests
      ✓ Should revert if calling a non monck function

  MockUniswapISwapRouter
    exactInputSingle() tests
      ✓ Should return an empty address after contract init
    exactInputSingle() tests
      ✓ Should revert if balance too low
    Non Mock function tests
      ✓ Should revert if calling a non mock function

  Token Pair Management
    addTokenPair() tests
      ✓ Should revert if caller is not a owner
      ✓ Should revert when trying to add a pair with a null tokenA address
      ✓ Should revert when trying to add a pair with a null tokenB address
      ✓ Should revert when trying to add a pair with a null ChainLinkAggregatorV3 address
      ✓ Should revert when trying to add a pair with a null AAVEPoolAddressesProvider address
      ✓ Should revert when trying to add a pair with a null mockUniswapISwapRouter address
      ✓ Should add a token Pair and emit TokenPAirAdded event
      ✓ Should be able to get an added tokenPair
      ✓ Should revert when trying to add the same tokenPair
      ✓ Should revert when trying to add the same tokenPair with a revert order

  DOApp Contract - Deposit and Withdraw tests
    Token Deposit
      depositTokenA() tests
        ✓ Should Revert when trying to deposit TokenA to an unknow token pair (pairId)
        ✓ Should Revert when trying to deposit zero TokenA
        ✓ Should be able to deposit a specified amount of token A and check balance
        ✓ Should emit a TokenDeposit event on depositTokenA success
      depositTokenB() tests
        ✓ Should Revert when trying to deposit TokenB to an unknow token pair (pairId)
        ✓ Should Revert when trying to deposit zero TokenB
        ✓ Should Deposit a specified amount of token B
        ✓ Should emit a TokenDeposit event on depositTokenB success
    getTokenUserBalances() tests
      ✓ Should Revert when trying to get token Balance from a zero address for token
      ✓ Should Revert when trying to get token Balance from a zero address for user
    withdrawTokenA() tests
      ✓ Should Revert when trying to withdraw TokenA from an unknow token pair (pairId)
      ✓ Should Revert when trying to withdraw zero TokenA
      ✓ Should Revert when trying to withdraw Token A with amount > account balance
      ✓ Should withdraw a specified amount of token A
      ✓ Should emit a TokenWithdrawal event on withdrawTokenA() success
    withdrawTokenB() tests
      ✓ Should Revert when trying to withdraw TokenB from an unknow token pair (pairId)
      ✓ Should Revert when trying to withdraw zero TokenB
      ✓ Should Revert when trying to withdraw token B with amount > account balance
      ✓ Should withdraw a specified amount of token B
      ✓ Should emit a TokenWithdrawal event on withdrawTokenB() success

  DOApp Contract - DCA configuration tests
    Create DCA Configuration 
      addDCAConfig() tests
        ✓ Should Revert when trying to create a DCA configuration to an unknow token pair (pairId)
        ✓ Should Revert when trying to create a DCA configuration with min >= max
        ✓ Should Revert when trying to create a DCA configuration with amount <=0 
        ✓ Should Revert when trying to create a DCA configuration with scaling factor <= 0 
        ✓ Should Revert when trying to create a DCA configuration with too many segments
        ✓ Should emit a DCAConfigCreation event on success
        ✓ Should add a valid segment entry for each segment interval (swap Token A for Token B)
        ✓ Should add a valid segment entry for each segment interval (swap Token B for Token A)
        ✓ Should add a valid segment entry with scaling factor for each segment interval on success (swap Token A for Token B)
        ✓ Should add a valid segment entry with scaling factor for each segment interval on success (swap Token B for Token A)
        ✓ Should add 2 dca config and get segment entries for each segment interval on success (swap Token A for Token B)
        ✓ Should add 2 dca config and get segment entries for each segment interval on success  (swap Token B for Token A)
      deleteDCAConfig() tests
        ✓ Should Revert when trying to delete a DCA configuration with ana unknow id 
        ✓ Should Delete a DCA configuration when called by contract owner
        ✓ Should Delete a Buy DCA configuration when called by dca config creator
        ✓ Should Delete a Sell DCA configuration when called by dca config creator
        ✓ Should remove all segment entries for each segment interval (swap Token A for Token B)
        ✓ Should remove all segment entries fro all DCA config 

  DOApp DCA execution
    executeDCA() tests
      ✓ Should revert if call with a wrong token Pair
      ✓ Should do nothing whent launch executeDCA() for an existing TokenPair with oracle price not in DCA interval
      ✓ Should DCA Buy for an existing TokenPair with oracle price set in DCA interval - 2 Segments max by request
      ✓ Should DCA Sell for an existing TokenPair with oracle price set in DCA interval - 2 Segments max by request
      ✓ Should DCA for an existing TokenPair and multiple 3 DCA buy config with oracle price set in DCA interval - 2 Segments max by request
      ✓ Should DCA for an existing TokenPair and 3 DCA Sell config with oracle price set in DCA interval - 2 Segments max by request
      ✓ Should DCA for an existing TokenPair and multiple 3 DCA buy config with oracle price set in DCA interval - 1 Segments max by request
      ✓ Should DCA for an existing TokenPair and 3 DCA Sell config with oracle price set in DCA interval - 1 Segments max by request
      ✓ Should DCA for an existing TokenPair and a mix DCA Sell & Buy config with oracle price set in DCA interval - 3 Segments max by request

  100 passing (31s)


------------------------------------|----------|----------|----------|----------|----------------|
File                                |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
------------------------------------|----------|----------|----------|----------|----------------|
 contracts/                         |    99.14 |    90.16 |    96.97 |    98.71 |                |
  DOApp.sol                         |    99.37 |    91.67 |      100 |    99.53 |            665 |
  DataStorage.sol                   |    98.67 |       88 |    92.86 |    96.88 |      84,85,345 |
  IDataStorage.sol                  |      100 |      100 |      100 |      100 |                |
 contracts/mocks/                   |    91.47 |    84.21 |     92.5 |    91.49 |                |
  MockAAVEPool.sol                  |    88.41 |    92.86 |    86.96 |    89.04 |... 327,333,383 |
  MockAAVEPoolAddressesProvider.sol |      100 |      100 |      100 |      100 |                |
  MockChainLinkAggregatorV3.sol     |       75 |       50 |      100 |    77.78 |    30,41,54,68 |
  MockERC20.sol                     |      100 |      100 |      100 |      100 |                |
  MockUniswapISwapRouter.sol        |      100 |      100 |      100 |      100 |                |
------------------------------------|----------|----------|----------|----------|----------------|
All files                           |    96.41 |    88.75 |    93.81 |    96.45 |                |
------------------------------------|----------|----------|----------|----------|----------------|

```

# License

This project is licensed under the MIT License.
Acknowledgements


Thank you for your interest in the DOApp backend project. If you have any further questions, feel free to reach out. Happy DCA!
