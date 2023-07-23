"use client";
import { BigNumber, ethers } from "ethers";
import React, { createContext, useContext, useEffect, useState } from "react";
import { EthContext } from "./EthContext";
import ERC20 from "../utils/ABI/ERC20.json"

export const EventContext = createContext(null);

export const EventProvider = ({ children }) => {
  const [dcaConfigs, setDcaConfigs] = useState([]);
  const [tokenPairs, setTokenPairs] = useState([]);
  const [tokenList, setTokenList] = useState([]);

  const {
    provider,
    account,
    doAppContractWithSigner,
    dataStoreContractWithSigner,
    doAppContract,
    dataStoreContract,
  } = useContext(EthContext);

  useEffect(() => {
    if (account) {
    const dcaConfigsFilter = dataStoreContract.filters.DCAConfigCreation(account);
    const dcaConfigsID = dataStoreContract
      .queryFilter(dcaConfigsFilter)
      .then((events) => {
        return events.map((event) => event.args._configId);
      });


      dcaConfigsID.then((ids) => {
      console.log("PARCOURS EVENTS DCAConfigCreation found : ", ids)
      Promise.all(ids.map((id) => dataStoreContractWithSigner.getDCAConfig(id)))
        .then((dcaConfig) => {
          console.log("PARCOURS EVENTS DCAConfigCreation : we found a DCA config : ", dcaConfig)
          const dcaConfigWithId = dcaConfig.map(
            (dcaConfig, index) => ({
              dcaConfigId: dcaConfig.dcaConfigId,
              pairID: dcaConfig.pairID,
              isSwapTookenAForTokenB: dcaConfig.isSwapTookenAForTokenB,
              min: dcaConfig.min,
              max: dcaConfig.max,
              amount: dcaConfig.amount,
              scalingFactor: dcaConfig.scalingFactor,
              creationDate: dcaConfig.creationDate,
              dcaDelay: dcaConfig.dcaDelay,
              lastDCATime: dcaConfig.lastDCATime,
              creator: dcaConfig.creator
            })
          );
          console.log("PARCOURS EVENTS DCAConfigCreation : tokenPairsWithId : ", dcaConfigWithId)
          setDcaConfigs(dcaConfigWithId);
        })
        .catch((err) => console.log(err))
    }
    );

    dataStoreContract.on("DCAConfigCreation", (_sender,_pairId,_configId) => {

      console.log("RECEPTION EVENT DCAConfigCreation : ", _configId)
      dataStoreContractWithSigner.getDCAConfig(_configId).then((dcaConfig) => {
        console.log("RECEPTION EVENT DCAConfigCreation : serialisation ")
        const newDcaConfig = {
          dcaConfigId: dcaConfig.dcaConfigId,
          pairID: dcaConfig.pairID,
          isSwapTookenAForTokenB: dcaConfig.isSwapTookenAForTokenB,
          min: dcaConfig.min,
          max: dcaConfig.max,
          amount: dcaConfig.amount,
          scalingFactor: dcaConfig.scalingFactor,
          creationDate: dcaConfig.creationDate,
          dcaDelay: dcaConfig.dcaDelay,
          lastDCATime: dcaConfig.lastDCATime,
          creator: dcaConfig.creator
        };
        setDcaConfigs((prevState) => {
          if (
            !!prevState.find(
              (dcaConfig) =>
              dcaConfig.dcaConfigId.toString() ===
              newDcaConfig.dcaConfigId.toString()
            )
          ) {
            console.log("RECEPTION EVENT DCAConfigCreation : token deja existant ")
            return prevState;
          } else {
            console.log("RECEPTION EVENT DCAConfigCreation : token deja existant ")
            return [...prevState, newDcaConfig];
          }
        });
      });


    });

    return () => {
      dataStoreContract.removeAllListeners("TokenPAirAdded");
    };
  }
  }, [account]);


  useEffect(() => {
    const tokenPairsFilter = dataStoreContract.filters.TokenPAirAdded();
    const tokenPairsID = dataStoreContract
      .queryFilter(tokenPairsFilter)
      .then((events) => {
        return events.map((event) => event.args._pairId);
      });


    tokenPairsID.then((ids) => {
      console.log("PARCOURS EVENTS TokenPAirAdded found : ", ids)
      Promise.all(ids.map((id) => dataStoreContractWithSigner.getTokenPair(id)))
        .then((tokenPairs) => {
          console.log("PARCOURS EVENTS TokenPAirAdded : we found a Pair : ", tokenPairs)
          const tokenPairsWithId = tokenPairs.map(
            (tokenPair, index) => ({
              tokenPairId: tokenPair._pairId,
              tokenA: tokenPair.tokenA,
              indexBalanceTokenA: tokenPair.indexBalanceTokenA,
              tokenB: tokenPair.tokenB,
              indexBalanceTokenB: tokenPair.indexBalanceTokenB,
              chainlinkPriceFetcher: tokenPair.chainlinkPriceFetcher,
              aavePoolAddressesProvider: tokenPair.aavePoolAddressesProvider,
              enabled: tokenPair.enabled,
              tokenPairSegmentSize: tokenPair.tokenPairSegmentSize,
              tokenPairDecimalNumber: tokenPair.tokenPairDecimalNumber,
              swapRouter: tokenPair.swapRouter,
              pairID: tokenPair.pairID,
              aTokenA: tokenPair.aTokenA,
              aTokenB: tokenPair.aTokenB

            })
          );
          console.log("PARCOURS EVENTS TokenPAirAdded : tokenPairsWithId : ", tokenPairsWithId)
          setTokenPairs(tokenPairsWithId);
        })
        .catch((err) => console.log(err))
    }
    );

    dataStoreContract.on("TokenPAirAdded", (tokenPairId) => {

      console.log("RECEPTION EVENT TokenPAirAdded : ", tokenPairId)
      dataStoreContractWithSigner.getTokenPair(tokenPairId).then((tokenPair) => {
        console.log("RECEPTION EVENT TokenPAirAdded : serialisation ")
        const newTokenPair = {
          tokenA: tokenPair.tokenA,
          indexBalanceTokenA: tokenPair.indexBalanceTokenA,
          tokenB: tokenPair.tokenB,
          indexBalanceTokenB: tokenPair.indexBalanceTokenB,
          chainlinkPriceFetcher: tokenPair.chainlinkPriceFetcher,
          aavePoolAddressesProvider: tokenPair.aavePoolAddressesProvider,
          enabled: tokenPair.enabled,
          tokenPairSegmentSize: tokenPair.tokenPairSegmentSize,
          tokenPairDecimalNumber: tokenPair.tokenPairDecimalNumber,
          swapRouter: tokenPair.swapRouter,
          pairID: tokenPair.pairID,
          aTokenA: tokenPair.aTokenA,
          aTokenB: tokenPair.aTokenB
        };
        setTokenPairs((prevState) => {
          if (
            !!prevState.find(
              (tokenPair) =>
                tokenPair.tokenPairId.toString() ===
                newTokenPair.tokenPairId.toString()
            )
          ) {
            console.log("RECEPTION EVENT TokenPAirAdded : token deja existant ")
            return prevState;
          } else {
            console.log("RECEPTION EVENT TokenPAirAdded : token deja existant ")
            return [...prevState, newTokenPair];
          }
        });
      });


    });

    return () => {
      dataStoreContract.removeAllListeners("TokenPAirAdded");
    };
  }, [account]);



  useEffect(() => {
    const searchTokenList = async () => {
      let _tokenList = [];
  
      for (let i = 0; i < tokenPairs.length; i++) {
        let tokenPair = tokenPairs[i];
  
        for (let tokenAddress of [tokenPair.tokenA, tokenPair.tokenB]) {
          const ERC20Contract = new ethers.Contract(
            tokenAddress,
            ERC20.abi,
            provider
          );
          
          console.log("search token  - tokenAddress")
          const ERC20ContractWithSigner = ERC20Contract.connect(provider.getSigner());
  
          // retrieve name and symbol
          try {
            const name = await ERC20ContractWithSigner.name();
            const symbol = await ERC20ContractWithSigner.symbol();

            console.log("found  token - ", symbol, '-', name)

            // add to token list
            let pairID = tokenPair.pairID
            _tokenList.push({ name, symbol, tokenAddress , pairID});
          } catch (error) {
            console.error(`Failed to fetch name or symbol for token at address ${tokenAddress}`, error);
          }
        }
      }
        setTokenList(_tokenList);
    };
  
    searchTokenList();
  }, [tokenPairs, provider]);
  


  /*
    useEffect(() => {
      const votersFilter = doAppContract.filters.VoterRegistered();
      doAppContract.queryFilter(votersFilter).then((events) => {
        setVotersAddress(events.map((event) => event.args.voterAddress));
      });
  
      doAppContract.on("VoterRegistered", (voterAddress) => {
        setVotersAddress((prevState) => {
          if (prevState.includes(voterAddress)) return prevState;
          return [...prevState, voterAddress];
        });
      });
  
      return () => {
        doAppContract.removeAllListeners("VoterRegistered");
      };
    }, []);
  
    useEffect(() => {
      const voteFilter = doAppContract.filters.Voted();
  
      doAppContract.queryFilter(voteFilter).then((events) => {
        events.forEach((event) => {
          const voter = event.args.voter;
          const proposalId = event.args.proposalId;
  
          setVotes((prevVotes) =>
            prevVotes.set(ethers.utils.getAddress(voter), proposalId)
          );
          console.log("new voter : ", voter, " - ", proposalId);
          console.log("votes : ", votes);
        });
      });
  
      doAppContract.on("Voted", (voter, proposalId) => {
        setVotes((prevVotes) =>
          new Map(prevVotes).set(ethers.utils.getAddress(voter), proposalId)
        );
        doAppContractWithSigner.winningProposalID().then((id) => {
          setWinningProposalId(id.toNumber());
        });
      });
  
      return () => {
        doAppContract.removeAllListeners("Voted");
      };
    }, []);
  
    useEffect(() => {
      doAppContractWithSigner
        .workflowStatus()
        .then((status) => setCurrentWorkflowStatus(status));
  
      doAppContract.on("WorkflowStatusChange", (_, newStatus) => {
        console.log("WorkflowStatusChange", newStatus);
        setCurrentWorkflowStatus(newStatus);
      });
  
      return () => {
        doAppContract.removeAllListeners("WorkflowStatusChange");
      };
    }, [account]);
  
    useEffect(() => {
      doAppContractWithSigner.winningProposalID().then((id) => {
        setWinningProposalId(id.toNumber());
      });
  
      doAppContract.on("WorkflowStatusChange", (_, newStatus) => {
        if (newStatus === 4) {
          doAppContractWithSigner.winningProposalID().then((id) => {
            setWinningProposalId(id.toNumber());
          });
        }
      });
  
      return () => {
        doAppContract.removeAllListeners("WorkflowStatusChange");
      };
    }, []);
    */

  return (
    <EventContext.Provider
      value={{
        dcaConfigs,
        tokenPairs,
        tokenList
        //        proposals,
        //        votes,
        //        currentWorkflowStatus,
        //        votersAddress,
        //        winningProposalId,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => useContext(EventContext);
