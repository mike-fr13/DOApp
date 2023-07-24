# DOoAPP

DOoAPP is a decentralized application developed as part of the Blockchain Developer certification module at Alyra (Buterin batch, May-July 2023).

## Developpers:

    Yannick Tison

# Demo

You can find a video demonstration of the DApp at this link: 

https://drive.google.com/drive/folders/1dkVT9MyWHcPlld373rmoOWRJqRxM9SZc?usp=sharing

=> Il y a 2 vidéos , un eréalisée avec zoom : l'odinateur rame telment que lestests plantent 
=> une autre avec uniquement la video, pas de son et pas d'incrustation : les tests fonctionnnent



# Overview

DOApp is an application designed to enable efficient investment using the dollar-cost averaging method, but in a decentralized setting. This investment approach helps you mitigate the impact of price volatility when purchasing assets, by dividing the total sum to be invested into equal amounts spread across regular intervals. DOApp leverages the power of blockchain technology to offer this investment method in a decentralized way, making investment more transparent, secure, and democratic.

The project follows a client-server architecture, with separate components for the **backend** and **frontend**.

# Backend

The backend of DOApp plays a pivotal role in creating DCA (Dollar Cost Averaging) configuration data, as well as in administering the necessary configuration processes. It handles all the operational intricacies involved in setting up and managing your DCA strategy, thereby ensuring an optimized and streamlined investment process.

Detailed documentation for the backend can be found [here](backend/README.md).

# Frontend

The application's user interface, crafted using React.js and Chakra UI, serves as an interactive platform for engaging with the DCA process. The frontend empowers users by providing functionalities to formulate their DCA configuration, manage their token transactions including deposits and withdrawals, and monitor their DCA investments, all within a seamless and user-friendly environment.

Detailed documentation for the frontend can be found [here](frontend/README.md).

# Getting Started

To get started with the application, please refer to the individual README files in the backend and frontend directories for setup instructions and usage guidelines.

# Deployment

The DOApp App is deployed on [Vercel](https://do-app.vercel.app/)  
This DApp is linked to solidity contracts deployed on Goerli :


DOApp deployed to [0x71A8c2Ac13a406f2C7CE71a36deD09fA6133F473](https://goerli.etherscan.io/address/0x71A8c2Ac13a406f2C7CE71a36deD09fA6133F473)
dataStorage deployed to 0xfDd9248fAB6e47d251E3E347F32b06d70F33b6C1
TokenA deployed to 0x3AcB780e5ea7E508728b5089B46B325302CC08E5
TokenB deployed to 0xc5e8eB58055737d61aa19990289F23e0F2E746d1
MockChainLinkAggregatorV3 deployed to 0x9bfB16E984bC4435ACAD691DbFeA6E73158c714E
MockAAVEPoolAddressesProvider deployed to 0x752446066f20fEb0A5D7B97c087E5835A8015e81
MockAavePool deployed to 0x21B10a8f824609bDb9d41765C2062B54E4bf2DFd
AAVE Pool Implementation set to 0x21B10a8f824609bDb9d41765C2062B54E4bf2DFd
ATokenA address :  0x7268c27bc2f8b1e8C0cb1329a5B14666b87bB92B
ATokenB address :  0x4718196CBA3B75f29D1490Da20911c53B96eeb16
MockUniswapISwapRouter deployed to 0x496e70d51c25Eb6ffdCC5f4Ca55E22afD2b67BA3



Feel free to explore the code and documentation to understand the inner workings. Happy DCA!
