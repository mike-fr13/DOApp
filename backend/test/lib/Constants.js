const { BigNumber } = require("ethers")

module.exports = Object.freeze({
    ADDRESS_0 : '0x0000000000000000000000000000000000000000',
    MCKA_NAME : 'Mock Token A',
    MCKA_SYMBOL : 'MCKA',
    MCKB_NAME : 'Mock Token B',
    MCKB_SYMBOL : 'MCKB',
    BAD_PAIR_ID : new BigNumber.from('01010101010'),
    
    //token pair constante
    TOKEN_PAIR_SEGMENT_SIZE : 2500000000,
    TOKEN_PAIR_DECIMAL_NUMBER : 8,
    
    //TOKEN amount constants
    TOKEN_INITIAL_SUPPLY : new BigNumber.from(100000000000),
    TOKENA_DEPOSIT_AMOUNT : new BigNumber.from(50000000000),
    TOKENA_WITHDRAW_AMOUNT : new BigNumber.from(30000000000),
    TOKENB_DEPOSIT_AMOUNT : new BigNumber.from(25000000000),
    TOKENB_WITHDRAW_AMOUNT : new BigNumber.from(25000000000),
    TOKEN_AMOUNT_ABOVE_BALANCE : new BigNumber.from(999900000000),

    //DCA config constants
    //ex  WETH/USDC => swap USDC for WETH
    DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B : true,
    DCA_CONFIG_1_MIN : new BigNumber.from(100000000000),
    DCA_CONFIG_1_MAX : new BigNumber.from(160000000000),
    DCA_CONFIG_1_AMOUNT : new BigNumber.from(5000000000),
    DCA_CONFIG_1_SCALING_FACTOR : new BigNumber.from(2),
    DCA_CONFIG_1_DELAY : new BigNumber.from(0),

    //ex  WETH/USDC => swap WETH fo USDC
    DCA_CONFIG_2_IS_SWAP_TOKEN_A_FOR_TOKEN_B : false,
    DCA_CONFIG_2_MIN : new BigNumber.from(250000000000),
    DCA_CONFIG_2_MAX : new BigNumber.from(300000000000),
    DCA_CONFIG_2_AMOUNT : new BigNumber.from(10000000000),
    DCA_CONFIG_2_SCALING_FACTOR : new BigNumber.from(3),
    DCA_CONFIG_2_DELAY : new BigNumber.from(2),

    //ex  WETH/USDC => swap USDC for WETH
    DCA_CONFIG_3_IS_SWAP_TOKEN_A_FOR_TOKEN_B : true,
    DCA_CONFIG_3_MIN : new BigNumber.from(125000000000),
    DCA_CONFIG_3_MAX : new BigNumber.from(175000000000),
    DCA_CONFIG_3_AMOUNT : new BigNumber.from(1000000000),
    DCA_CONFIG_3_SCALING_FACTOR : new BigNumber.from(5),
    DCA_CONFIG_3_DELAY : new BigNumber.from(1),

    //ex  WETH/USDC => swap WETH fo USDC
    DCA_CONFIG_4_IS_SWAP_TOKEN_A_FOR_TOKEN_B : false,
    DCA_CONFIG_4_MIN : new BigNumber.from(225000000000),
    DCA_CONFIG_4_MAX : new BigNumber.from(325000000000),
    DCA_CONFIG_4_AMOUNT : new BigNumber.from(500000000),
    DCA_CONFIG_4_SCALING_FACTOR : new BigNumber.from(10),
    DCA_CONFIG_4_DELAY : new BigNumber.from(2),

    //DCA config constants
    //ex  WETH/USDC => swap USDC for WETH
    DCA_CONFIG_5_IS_SWAP_TOKEN_A_FOR_TOKEN_B : true,
    DCA_CONFIG_5_MIN : new BigNumber.from(150000000000),
    DCA_CONFIG_5_MAX : new BigNumber.from(210000000000),
    DCA_CONFIG_5_AMOUNT : new BigNumber.from(5000000000),
    DCA_CONFIG_5_SCALING_FACTOR : new BigNumber.from(2),
    DCA_CONFIG_5_DELAY : new BigNumber.from(0),

    //ex  WETH/USDC => swap WETH fo USDC
    DCA_CONFIG_6_IS_SWAP_TOKEN_A_FOR_TOKEN_B : false,
    DCA_CONFIG_6_MIN : new BigNumber.from(170000000000),
    DCA_CONFIG_6_MAX : new BigNumber.from(220000000000),
    DCA_CONFIG_6_AMOUNT : new BigNumber.from(10000000000),
    DCA_CONFIG_6_SCALING_FACTOR : new BigNumber.from(3),
    DCA_CONFIG_6_DELAY : new BigNumber.from(1),
    //ex  WETH/USDC => swap USDC for WETH
    DCA_CONFIG_7_IS_SWAP_TOKEN_A_FOR_TOKEN_B : true,
    DCA_CONFIG_7_MIN : new BigNumber.from(180000000000),
    DCA_CONFIG_7_MAX : new BigNumber.from(240000000000),
    DCA_CONFIG_7_AMOUNT : new BigNumber.from(1000000000),
    DCA_CONFIG_7_SCALING_FACTOR : new BigNumber.from(5),
    DCA_CONFIG_7_DELAY : new BigNumber.from(0),
    //ex  WETH/USDC => swap WETH fo USDC
    DCA_CONFIG_8_IS_SWAP_TOKEN_A_FOR_TOKEN_B : false,
    DCA_CONFIG_8_MIN : new BigNumber.from(200000000000),
    DCA_CONFIG_8_MAX : new BigNumber.from(250000000000),
    DCA_CONFIG_8_AMOUNT : new BigNumber.from(500000000),
    DCA_CONFIG_8_SCALING_FACTOR : new BigNumber.from(10),
    DCA_CONFIG_8_DELAY : new BigNumber.from(2),
        //ex  WETH/USDC => swap USDC for WETH
    DCA_CONFIG_9_IS_SWAP_TOKEN_A_FOR_TOKEN_B : true,
    DCA_CONFIG_9_MIN : new BigNumber.from(250000000000),
    DCA_CONFIG_9_MAX : new BigNumber.from(300000000000),
    DCA_CONFIG_9_AMOUNT : new BigNumber.from(1000000000),
    DCA_CONFIG_9_SCALING_FACTOR : new BigNumber.from(5),
    DCA_CONFIG_9_DELAY : new BigNumber.from(0),
    //ex  WETH/USDC => swap WETH fo USDC
    DCA_CONFIG_10_IS_SWAP_TOKEN_A_FOR_TOKEN_B : false,
    DCA_CONFIG_10_MIN : new BigNumber.from(200000000000),
    DCA_CONFIG_10_MAX : new BigNumber.from(300000000000),
    DCA_CONFIG_10_AMOUNT : new BigNumber.from(500000000),
    DCA_CONFIG_10_SCALING_FACTOR : new BigNumber.from(10),
    DCA_CONFIG_10_DELAY : new BigNumber.from(2),



    // mult factor for arithmetics
    MULT_FACTOR : BigNumber.from(100000000),

    // oracle price scenario
    SET_ORACLE_PRICE_3_BUY_CONFIG : 
        new BigNumber.from("155000000000"),
    SET_ORACLE_PRICE_3_SELL_CONFIG :
        new BigNumber.from("245000000000"),
    SET_ORACLE_PRICE_MIDDLE_MAX_CONFIG :
        new BigNumber.from("200000000000"),
    
    });