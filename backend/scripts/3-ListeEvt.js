const { ethers, upgrades } = require('hardhat');
const { getDoAppAbi, addTokenPair } = require("./lib/DOApp_lib.js");

// ABI du contrat
const contractABI = getDoAppAbi();

const {
    DOAppcontractAddress, 
    TokenAcontractAddress, 
    TokenBcontractAddress, 
    MockChainlinkcontractAddress, 
    MockAAVEPoolcontractAddress, 
    MockUniswapContractAddress, 
    ADD_owner } = require ("./lib/deployedContractAddresses.js")

async function listenToEvmPrintEvents() {
  // Récupérer le compte déployant le contrat
  const [deployer] = await ethers.getSigners();

  // Connexion au contrat
  const contract = new ethers.Contract(DOAppcontractAddress, contractABI, deployer);

  // Écoute de l'événement EvmPrint
  contract.on('EvmPrint', (message) => {
    console.log('Received EvmPrint event:', message);
  });
}

// Appel de la fonction pour écouter les événements
listenToEvmPrintEvents().catch((error) => {
  console.error('An error occurred:', error);
});
