// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface IDataStorage {



       /**
     *  @Dev This structure contains configuration for a specific pair of token 
     */
    struct TokenPair {
        // 160 +96 = 256
        address tokenA;
        uint96 indexBalanceTokenA;

        //160 + 96 = 256
        address tokenB;
        uint96 indexBalanceTokenB;

        //160
        address chainlinkPriceFetcher;

        //160 + 8 + 16 =192
        address aavePoolAddressesProvider;
        bool enabled;
        uint tokenPairSegmentSize;

        //160
        address swapRouter;

        //256
        uint pairID;

        //256
        address aTokenA;

        //256
        address aTokenB;
    }

    struct DCAConfig {
        //256
        uint dcaConfigId;

        // 256
        uint pairID;

        //8+24+24+16+8+32 = 112
        bool isSwapTookenAForTokenB;
        uint min;
        uint max;
        uint amount;
        uint8 scalingFactor;
        uint32 creationDate;
        DCADelayEnum dcaDelay;

        //256
        uint lastDCATime;

        //160 
        address creator;
    }

    struct SegmentDCAEntry {
        //160 
        address owner;

        //256
        uint amount;

        //256
        uint  dcaConfigId;
    }

    struct SegmentDCAToProcess {    
        SegmentDCAEntry[]  segmentBuyEntries;
        SegmentDCAEntry[]  segmentSellEntries;
        uint amountBuy;
        uint amountSell;
    }

    /// @notice workflow status list for the voting process
    enum  TokenEnum {
        TokenA,
        TokenB
    }

        /// @notice workflow status list for the voting process
    enum  DCADelayEnum {
        Hourly,
        Daily,
        Weekly
    }


    /// @notice Retrieves the token pair configuration for a given pair ID
    /// @param _pairId The ID of the token pair
    /// @return The token pair configuration
    function getTokenPair(uint _pairId) external view returns (TokenPair memory);

    /// @notice Adds a new token pair configuration
    /// @param _tokenAddressA The address of token A
    /// @param _tokenPairSegmentSize The segment size for the token pair
    /// @param _tokenAddressB The address of token B
    /// @param _chainLinkPriceFetcher The address of the Chainlink price fetcher
    /// @param _aavePoolAddressesProvider The address of the Aave pool addresses provider
    /// @param _uniswapV3SwapRouter The address of the Uniswap V3 swap router
    /// @return The ID of the newly added token pair
    function addTokenPair(
        address _tokenAddressA, 
        uint _tokenPairSegmentSize,
        address _tokenAddressB, 
        address _chainLinkPriceFetcher,
        address _aavePoolAddressesProvider,
        address _uniswapV3SwapRouter) external returns (uint256);

    /// @notice Adds a new DCA configuration
    /// @param _pairId The ID of the token pair
    /// @param _isBuyTokenASellTokenB Flag indicating whether to buy token A and sell token B
    /// @param _min The minimum amount for the DCA
    /// @param _max The maximum amount for the DCA
    /// @param _amount The amount for the DCA
    /// @param _scalingFactor The scaling factor for the DCA
    /// @param _dcaDelay The delay for the DCA
    /// @return The ID of the newly added DCA configuration
    function addDCAConfig( 
        uint _pairId,
        bool _isBuyTokenASellTokenB, 
        uint _min, 
        uint _max, 
        uint _amount, 
        uint8 _scalingFactor,
        IDataStorage.DCADelayEnum _dcaDelay
    ) external returns (uint );

    /// @notice Retrieves the DCA configuration for a given DCA config ID
    /// @param _dcaConfigId The ID of the DCA configuration
    /// @return The DCA configuration
    function getDCAConfig (uint _dcaConfigId) external returns(DCAConfig memory);

    /// @notice Updates the last DCA time for a given DCA config ID
    /// @param _dcaConfigId The ID of the DCA configuration
    /// @param _lastDCATime The new last DCA time
    function updateDCAConfigLastDCATime (uint _dcaConfigId, uint _lastDCATime) external;

    /// @notice Retrieves the DCA segment for a given pair ID, price, and delay
    /// @param _pairId The ID of the token pair
    /// @param price The price for the DCA
    /// @param delay The delay for the DCA
    /// @return The DCA segment
    function getDCASegment(
        uint _pairId, 
        uint price, 
        IDataStorage.DCADelayEnum delay
    ) external view returns(SegmentDCAEntry[][2] memory);

    /// @notice Retrieves the DCA segment entries for a given pair ID, price, delay, and token
    /// @param _pairId The ID of the token pair
    /// @param _price The price for the DCA
    /// @param delay The delay for the DCA
    /// @param _token The token for the DCA
    /// @return The DCA segment entries
    function getDCASegmentEntries (
        uint _pairId,
        uint _price, 
        IDataStorage.DCADelayEnum delay,
        IDataStorage.TokenEnum _token
        ) external view returns (IDataStorage.SegmentDCAEntry[] memory);
}

