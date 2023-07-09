pragma solidity ^0.8.0;

// Import des bibliothèques et interfaces nécessaires
import { IERC20, ILendingPool, IProtocolDataProvider } from "./interfaces.sol";

contract AaveDeposit {
    // Adresse du contrat USDC
    address private constant USDC_ADDRESS = 0x65aFADD39029741B3b8f0756952C74678c9cEC93;

    // Adresse du contrat AAVE Lending Pool
    address private constant LENDING_POOL_ADDRESS = 0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe;

    // Adresse du contrat AAVE Protocol Data Provider
    address private constant DATA_PROVIDER_ADDRESS = 0x3c73A5E5785cAC854D468F727c606C07488a29D6;

    // Instance du contrat USDC
    IERC20 private usdcToken = IERC20(USDC_ADDRESS);

    // Instance du contrat AAVE Lending Pool
    ILendingPool private lendingPool = ILendingPool(LENDING_POOL_ADDRESS);

    // Instance du contrat AAVE Protocol Data Provider
    IProtocolDataProvider private dataProvider = IProtocolDataProvider(DATA_PROVIDER_ADDRESS);

    // Fonction pour déposer des USDC dans AAVE
    function deposit(uint256 amount) external {
        // Autoriser le pool de prêt à transférer des jetons USDC depuis ce contrat
        usdcToken.approve(LENDING_POOL_ADDRESS, amount);

        // Obtenir l'adresse du contrat USDC et l'adresse du noyau du pool de prêt d'AAVE
        address usdcTokenAddress = USDC_ADDRESS;
        address lendingPoolCoreAddress = lendingPool.core();

        // Appeler la fonction de dépôt du pool de prêt d'AAVE pour déposer des USDC dans AAVE
        lendingPool.deposit(usdcTokenAddress, amount, lendingPoolCoreAddress, 0);
    }

    // Fonction pour obtenir le solde USDC disponible de ce contrat
    function getUSDCBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }
}
