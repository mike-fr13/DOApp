"use client";
import React, { createContext, useEffect, useState } from "react";
import { Contract, ContractInterface, ethers } from "ethers";
import votingABI from "@/utils/abi"
import { useToast } from "@chakra-ui/react";


const doAppContractAddress = process.env.NEXT_PUBLIC_DOAPP_CONTRACT_ADDRESS;
console.log('process.env.NEXT_PUBLIC_DOAPP_CONTRACT_ADDRESS : ',doAppContractAddress);

const dataStoreContractAddress = process.env.NEXT_PUBLIC_DATASTORE_CONTRACT_ADDRESS;
console.log('process.env.NEXT_PUBLIC_DATASTORE_CONTRACT_ADDRESS : ',dataStoreContractAddress);


export const EthContext = createContext(null);

export const EthProvider = ({ children }) => {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isVoter, setIsVoter] = useState(false);
  const toast = useToast();

  const { ethereum } = (typeof window !== "undefined" ? window : {});
  if (!ethereum) return null;
  const ethereumWindow = !!window
    ? ((window).ethereum) : null;
  const provider = new ethers.providers.Web3Provider(ethereumWindow);

  console.log('EthProvider  - process.env.VOTING_CONTRACT_ADDRESS : ',doAppContractAddress);
  console.log('EthProvider  - process.env.NEXT_PUBLIC_DATASTORE_CONTRACT_ADDRESS : ',dataStoreContractAddress);
  const doAppContract = new ethers.Contract(
    doAppContractAddress,
    votingABI,
    provider
  );

  const dataStoreContract = new ethers.Contract(
    dataStoreContractAddress,
    votingABI,
    provider
  );


  const doAppContractWithSigner = doAppContract.connect(provider.getSigner());
  const dataStoreContractWithSigner = dataStoreContract.connect(provider.getSigner());

  const checkEthereumExists = () => {
    if (!ethereum) {
      toast({
        title: "Error",
        description: "Please Install MetaMask.".slice(0, 500) + "...",
        status: "error",
      });
      return false;
    }
    return true;
  };

  function getConnectedAccounts() {
    ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        console.log("getConnectedAccounts - accounts.length : ", accounts.length)
        if (accounts.length >0) {
          setAccount(ethers.utils.getAddress(accounts[0]));
        } 
        else {
          setAccount("")
        }
      })
      .catch((error) => {
        console.log("getConnectedAccounts - error :", error.message);
        toast({
          title: "Error",
          description: error.message.slice(0, 500) + "...",
          status: "error",
        });
      });
  }

  function connectWallet() {
    console.log("ETHContext - connectWallet")
    if (checkEthereumExists()) {
      contract;
      ethereum
        .request({ method: "eth_requestAccounts" })
        .then((accounts) => {
          setAccount(ethers.utils.getAddress(accounts[0]));
          console.log("connectWallet - account : ", accounts);
        })
        .catch((err) => {
          if (err.code === 4001) {
            toast({
              title: "Error",
              description: "Please connect to Metamask".slice(0, 500) + "...",
              status: "error",
            });
          } else {
            toast({
              title: "Error",
              description: err.message.slice(0, 500) + "...",
              status: "error",
            });
          }
        });
    }
  }

  const handleAccountEvents = async () => {
    ethereum.on("accountsChanged", getConnectedAccounts);
    ethereum.on("chainChanged", (chainId) => setChainId(chainId));
  };

  const removeHandledAccountEvents = async () => {
    ethereum.removeAllListeners("accountsChanged");
    ethereum.removeAllListeners("chainChanged");
  };

  useEffect(() => {
    if (checkEthereumExists()) {
      getConnectedAccounts();
      ethereum.request({ method: "eth_chainId" }).then((chainId) => {
        setChainId(chainId);
      });
      handleAccountEvents();
      console.log("useLayoutEffect[] - {isOwner, account} : ", {
        isOwner,
        account,
      });
    }
    return () => {
      if (checkEthereumExists()) {
        removeHandledAccountEvents();
      }
    };
  }, []);

  useEffect(() => {
    const getOwner = async () => {
      console.log(doAppContract, "contract");
      const ownerAddress = await doAppContract.owner();
      return ownerAddress;
    };

    if (account) {
      getOwner().then((ownerAddress) => {
        console.log("useEffect[account] - ownerAddress : ", ownerAddress);
        if (
          ethers.utils.getAddress(ownerAddress) === account
        ) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      });
    }
  }, [account]);

  return (
    <EthContext.Provider
      value={{
        provider,
        account,
        chainId,
        connectWallet,
        isOwner,
        setIsVoter,
        isVoter,
        doAppContractWithSigner,
        dataStoreContractWithSigner,
        doAppContract,
        dataStoreContract
      }}
    >
      {children}
    </EthContext.Provider>
  );
};
