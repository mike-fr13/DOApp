
"use client"
import { Box, Flex, List, ListItem, ListIcon, Text, Stat, StatLabel,SimpleGrid } from '@chakra-ui/react';
import { MdCheckCircle } from 'react-icons/md';
import React, { createContext, useContext, useEffect, useState } from "react";
import { ReadOnlyInputWithCopy } from '../ReadOnlyInputWithCopy/ReadOnlyInputWithCopy';

import { EthContext } from "@/context/EthContext";

export const DCAHistory = () => {
  const {
    ethers,
    account,
    doAppContract,
  } = useContext(EthContext);

  const [UserDCAExecutionResults, setUserDCAExecutionResults] = useState([]);

  useEffect(() => {
    setUserDCAExecutionResults([]);
    if (account) {
      // Créez le filtre pour l'événement spécifique
      console.log('DCAHistory - ', account)
//      console.log('DCAHistory - ', account.address)
      console.log('DCAHistory - ', ethers.utils.getAddress(account))
      const userDcaResultFilter = doAppContract.filters.UserDCAExecutionResult(null, ethers.utils.getAddress(account), null, null, null);

      // Récupérez les anciens événements
      doAppContract
        .queryFilter(userDcaResultFilter)
        .then((events) => {
          // Pour chaque événement, extraire les données et les ajouter à l'état
          events.forEach((event) => {
            const newUserDcaExecutionResult = {
              pairID: event.args._pairId,
              user: event.args._user,
              amountOTC: event.args._amountOTC,
              amountSwap: event.args._amountSwap,
              timestamp: event.args._timeStamp
            };

            setUserDCAExecutionResults((prevState) => {
              if (
                !prevState.find(
                  (userDcaExecutionResult) =>
                    userDcaExecutionResult.pairID.toString() === newUserDcaExecutionResult.pairID.toString() &&
                    userDcaExecutionResult.user.toString() === newUserDcaExecutionResult.user.toString() &&
                    userDcaExecutionResult.timestamp.toString() === newUserDcaExecutionResult.timestamp.toString()
                )
              ) {
                  console.log(`DCAHistory - ${account}`)
                  console.log(`DCAHistory - ${newUserDcaExecutionResult.user}`)
                if (ethers.utils.getAddress(account) != ethers.utils.getAddress(newUserDcaExecutionResult.user))   {
                  return [...prevState, newUserDcaExecutionResult];
                }
                else {
                  return prevState;
                }
              } else {
                return prevState;
              }
            });
          });
        })
        .catch((err) => console.log(err));

      // Écoutez les nouveaux événements
      doAppContract.on("UserDCAExecutionResult", (_pairId, _user, _amountOTC, _amountSwap, _timeStamp) => {
        const newUserDcaExecutionResult = {
          pairID: _pairId,
          user: _user,
          amountOTC: _amountOTC,
          amountSwap: _amountSwap,
          timestamp: _timeStamp
        };
        console.log(`DCAHistory - ${account}`)
        console.log(`DCAHistory - ${newUserDcaExecutionResult.user}`)

        setUserDCAExecutionResults((prevState) => {
          if (
            !prevState.find(
              (userDcaExecutionResult) =>
                userDcaExecutionResult.pairID.toString() === newUserDcaExecutionResult.pairID.toString() &&
                userDcaExecutionResult.user.toString() === newUserDcaExecutionResult.user.toString() &&
                userDcaExecutionResult.timestamp.toString() === newUserDcaExecutionResult.timestamp.toString() 
            )
          ) {
            if (ethers.utils.getAddress(account) != ethers.utils.getAddress(newUserDcaExecutionResult.user))   {
                return [...prevState, newUserDcaExecutionResult];
              }
              else {
                return prevState;
              }
          } else {
            return prevState;
          }
        });
      });

      // N'oubliez pas de vous désinscrire de l'événement lorsque le composant est démonté
      return () => {
        doAppContract.removeAllListeners("UserDCAExecutionResult");
      };
    }
  }, [account, doAppContract]);


  return (
    <SimpleGrid spacing={4} templateColumns='repeat(auto-fill, minmax(300px, 1fr))'>
        {UserDCAExecutionResults.map((result, index) => (
            <Box p={5} shadow="md" borderWidth="1px">
            <Text align="center" as='b' >DCA execution Result </Text>
            <ReadOnlyInputWithCopy label="PairId:" value={result.pairID.toString().substring(0, 6)+'...'+result.pairID.toString().substring(result.pairID.toString().length - 6, result.pairID.toString().length)} />
            <ReadOnlyInputWithCopy label="User:" value={result.user.toString().substring(0, 4)+'...'+result.user.toString().substring(result.user.length - 4)} />
            <ReadOnlyInputWithCopy label="Amount OTC:" value={result.amountOTC.toString()} />
            <ReadOnlyInputWithCopy label="Amount Swap:" value={result.amountSwap.toString()} />
            <ReadOnlyInputWithCopy label="Timestamp:" value={new Date(result.timestamp * 1000).toLocaleString()} />
            </Box>
        ))}
    </SimpleGrid>
  )
}



