const { BigNumber } = require("ethers")

module.exports = Object.freeze({
    ADDRESS_0 : '0x0000000000000000000000000000000000000000',
    MCKA_NAME : 'Mock Token A',
    MCKA_SYMBOL : 'MCKA',
    MCKB_NAME : 'Mock Token B',
    MCKB_SYMBOL : 'MCKB',
    BAD_PAIR_ID : new BigNumber.from('01010101010'),
    
    //token pair constante
    TOCKEN_PAIR_SEGMENT_SIZE : 25,
    TOCKEN_PAIR_DECIMAL_NUMBER : 0,
    
    //TOKEN amount constants
    TOKEN_INITIAL_SUPPLY : new BigNumber.from(1000),
    TOKENA_DEPOSIT_AMOUNT : new BigNumber.from(500),
    TOKENA_WITHDRAW_AMOUNT : new BigNumber.from(300),
    TOKENB_DEPOSIT_AMOUNT : new BigNumber.from(250),
    TOKENB_WITHDRAW_AMOUNT : new BigNumber.from(250),
    TOKEN_AMOUNT_ABOVE_BALANCE : new BigNumber.from(9999),

    //DCA config constants
    //ex  WETH/USDC => swap USDC for WETH
    DCA_CONFIG_1_IS_SWAP_TOKEN_A_FOR_TOKEN_B : true,
    DCA_CONFIG_1_MIN : new BigNumber.from(1000),
    DCA_CONFIG_1_MAX : new BigNumber.from(1500),
    DCA_CONFIG_1_AMOUNT : new BigNumber.from(50),
    DCA_CONFIG_1_SCALING_FACTOR : new BigNumber.from(2),

    //ex  WETH/USDC => swap WETH fo USDC
    DCA_CONFIG_2_IS_SWAP_TOKEN_A_FOR_TOKEN_B : false,
    DCA_CONFIG_2_MIN : new BigNumber.from(2500),
    DCA_CONFIG_2_MAX : new BigNumber.from(3000),
    DCA_CONFIG_2_AMOUNT : new BigNumber.from(100),
    DCA_CONFIG_2_SCALING_FACTOR : new BigNumber.from(3),

    //ex  WETH/USDC => swap USDC for WETH
    DCA_CONFIG_3_IS_SWAP_TOKEN_A_FOR_TOKEN_B : true,
    DCA_CONFIG_3_MIN : new BigNumber.from(1250),
    DCA_CONFIG_3_MAX : new BigNumber.from(1750),
    DCA_CONFIG_3_AMOUNT : new BigNumber.from(10),
    DCA_CONFIG_3_SCALING_FACTOR : new BigNumber.from(5),

    //ex  WETH/USDC => swap WETH fo USDC
    DCA_CONFIG_4_IS_SWAP_TOKEN_A_FOR_TOKEN_B : false,
    DCA_CONFIG_4_MIN : new BigNumber.from(2250),
    DCA_CONFIG_4_MAX : new BigNumber.from(3250),
    DCA_CONFIG_4_AMOUNT : new BigNumber.from(5),
    DCA_CONFIG_4_SCALING_FACTOR : new BigNumber.from(10),


    // mult factor for arithmetics
    MULT_FACTOR : BigNumber.from(1000)

    });