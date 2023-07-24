
"use client"
import { Box, Flex, List, ListItem, ListIcon, Text, Stat, StatLabel } from '@chakra-ui/react';
import { MdCheckCircle } from 'react-icons/md';
import React, { createContext, useContext, useEffect, useState } from "react";

import { EthContext } from "@/context/EthContext";

export const DCAHistory = () => {
  const {
    ethers,
    account,
    doAppContract,
  } = useContext(EthContext);

  const [UserDCAExecutionResults, setUserDCAExecutionResults] = useState([]);

  useEffect(() => {
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
                return [...prevState, newUserDcaExecutionResult];
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

        setUserDCAExecutionResults((prevState) => {
          if (
            !prevState.find(
              (userDcaExecutionResult) =>
                userDcaExecutionResult.pairID.toString() === newUserDcaExecutionResult.pairID.toString() &&
                userDcaExecutionResult.user.toString() === newUserDcaExecutionResult.user.toString() &&
                userDcaExecutionResult.timestamp.toString() === newUserDcaExecutionResult.timestamp.toString()
            )
          ) {
            return [...prevState, newUserDcaExecutionResult];
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
    <Box w="100%" p={4}>
      <Text fontSize="2xl" mb={4}>
        DCA Execution Results
      </Text>
      <List spacing={3}>
        {UserDCAExecutionResults.map((result, index) => (
          <ListItem key={index}>
            <Box p={5} shadow="md" borderWidth="1px">
              <ListIcon as={MdCheckCircle} color="green.500" />
              <Flex align="baseline" mt={2}>
                <Stat>
                  <StatLabel>Pair ID:</StatLabel>
                  <Text>{result.pairID.toString().substring(0, 6)}...{result.pairID.toString().substring(result.pairID.toString().length - 6, result.pairID.toString().length)}</Text>
                </Stat>
                <Stat ml={5}>
                  <StatLabel>User:</StatLabel>
                  <Text>{result.user.toString().substring(0, 4)}...{result.user.toString().substring(result.user.length - 4)}</Text>
                </Stat>
              </Flex>
              <Flex align="baseline" mt={2}>
                <Stat>
                  <StatLabel>Amount OTC:</StatLabel>
                  <Text>{result.amountOTC.toString()}</Text>
                </Stat>
                <Stat ml={5}>
                  <StatLabel>Amount Swap:</StatLabel>
                  <Text>{result.amountSwap.toString()}</Text>
                </Stat>
                <Stat ml={5}>
                  <StatLabel>Timestamp:</StatLabel>
                  <Text>{new Date(result.timestamp * 1000).toLocaleString()}</Text>
                </Stat>
              </Flex>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}



