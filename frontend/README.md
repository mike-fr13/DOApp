# DOApp Frontend

This repository houses the frontend codebase for the DOApp project. The project takes shape as a Decentralized Application (DApp), employing the power of blockchain technology to facilitate users in executing Dollar Cost Averaging (DCA) investments.

## Prerequisites

Before running the frontend application, make sure you have the following dependencies installed:

- Node.js
- npm (Node Package Manager)

## Installation

1. Clone this repository to your local machine.
2. Navigate to the project directory.
3. Run the following command to install the required dependencies:

`npm install`


## Configuration

1. Create a `.env.local` file in the project root directory.
2. Set the following environment variables in the `.env.local` file:

`NEXT_PUBLIC_DOAPP_CONTRACT_ADDRESS=<DOApp_contract_address>`
`NEXT_PUBLIC_DATASTORE_CONTRACT_ADDRESS=<DataStorage_contract_addres>`


Replace `<DOApp_contract_address>` with the address of the deployed DOApp contract on the Ethereum network.
Replace `<DataStorage_contract_addres>` with the address of the deployed DataStorage contract on the Ethereum network.


## Usage

To start the frontend application, run the following command:

`npm run dev`


The application will be accessible at `http://localhost:3000`.

## Folder Structure

The important directories and files in the project are as follows:

- `components`: Contains reusable UI components used throughout the application.
- `context`: Contains context providers and hooks for sharing data between components.
- `pages`: Contains the main application pages.
- `utils`: Contains utility functions and contracts ABIs.

## Technologies Used

- React: JavaScript library for building user interfaces.
- Next.js: React framework for server-side rendering and routing.
- Chakra UI: Component library for building accessible and responsive UI.
- ethers.js: Ethereum library for interacting with smart contracts.

## Contributing

Contributions to the project are welcome. If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

The development of this project was inspired by the Ethereum blockchain and Mean Finance project

---

Thank you for your interest in the DOApp frontend project. If you have any further questions, feel free to reach out. Happy DCA!


