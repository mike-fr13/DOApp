const { BigNumber } = require("ethers")

module.exports = Object.freeze({
    ADDRESS_0 : '0x0000000000000000000000000000000000000000',
    MCKA_NAME : 'Mock Token A',
    MCKA_SYMBOL : 'MCKA',
    MCKB_NAME : 'Mock Token B',
    MCKB_SYMBOL : 'MCKB',
    BAD_PAIR_ID : new BigNumber.from('01010101010'),
    
    //token pair constante
    TOCKENA_SEGMENT_SIZE : 10,
    TOCKENA_DECIMAL_NUMBER : 0,
    
    TOCKENB_SEGMENT_SIZE : 10,
    TOCKENB_DECIMAL_NUMBER : 2,
    
    //TOKEN amount constants
    TOKEN_INITIAL_SUPPLY : new BigNumber.from(1000),
    TOKENA_DEPOSIT_AMOUNT : new BigNumber.from(500),
    TOKENA_WITHDRAW_AMOUNT : new BigNumber.from(300),
    TOKENB_DEPOSIT_AMOUNT : new BigNumber.from(250),
    TOKENB_WITHDRAW_AMOUNT : new BigNumber.from(250),
    TOKEN_AMOUNT_ABOVE_BALANCE :  new BigNumber.from(9999)
    });