// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface IDataStorage {



    struct TokenPairUserBalance {
        //256 * 4
        uint balanceA;
        uint indexA;
        uint balanceB;
        uint indexB;
    }
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

        //160 + 8 + 16 + 8 =192
        address aavePoolAddressesProvider;
        bool enabled;
        uint16 tokenPairSegmentSize;
        uint8 tokenPairDecimalNumber;

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
        uint24 min;
        uint24 max;
        uint16 amount;
        uint8 scalingFactor;
        uint32 creationDate;
        DCADelayEnum dcaDelay;

        //256
        uint lastSwapTime;
    }

    struct SegmentDCAEntry {
        //160 + 16 = 178
        address owner;
        uint16 amount;

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

function getTokenPair(uint _pairId) external returns (TokenPair memory);

function addTokenPair(
        address _tokenAddressA, 
        uint16 _tokenPairSegmentSize,
        uint8 _tokenPairDecimalNumber,  
        address _tokenAddressB, 
        address _chainLinkPriceFetcher,
        address _aavePoolAddressesProvider,
        address _uniswapV3SwapRouter) external returns (uint256);


function addDCAConfig( 
        uint _pairId,
        bool _isBuyTokenASellTokenB, 
        uint24 _min, 
        uint24 _max, 
        uint16 _amount, 
        uint8 _scalingFactor,
        IDataStorage.DCADelayEnum _dcaDelay
    ) external returns (uint configId);

function getDCAConfig (uint _dcaConfigId) external returns(DCAConfig memory);

function getDCASegment(
        uint _pairId, 
        uint price, 
        IDataStorage.DCADelayEnum delay
    ) external view returns(SegmentDCAEntry[][2] memory);


    function  getTokenPairUserBalances (
        uint _pairId, 
        address _user
        ) external view returns( TokenPairUserBalance memory);

    function  setTokenPairUserBalances (
        uint _pairId, 
        address _user, 
        TokenPairUserBalance memory _userBalance
        ) external;

    function getDCASegmentEntries (
        uint _pairId,
        uint _price, 
        IDataStorage.DCADelayEnum delay,
        IDataStorage.TokenEnum _token
        ) external view returns (IDataStorage.SegmentDCAEntry[] memory);
}