
"use client"
import { Box, Flex, List, ListItem, ListIcon, Text, Stat, StatLabel } from '@chakra-ui/react';
import { MdCheckCircle } from 'react-icons/md';
import React, { createContext, useContext, useEffect, useState } from "react";

import { EventContext } from "@/context/EventContext";

export const AdminDCAHistory = () => {
    const { DCAExecutionResults } = useContext(EventContext);
      

    return (
    <Box w="100%" p={4}>
      <Text fontSize="2xl" mb={4}>
        DCA Execution Results
      </Text>
      <List spacing={3}>
      {DCAExecutionResults.map((result, index) => (
        <ListItem key={index}>
          <Box p={5} shadow="md" borderWidth="1px">
            <ListIcon as={MdCheckCircle} color="green.500" />
            <Flex align="baseline" mt={2}>
              <Stat>
                <StatLabel>Pair ID:</StatLabel>
                <Text>{result.pairID.toString().substring(0, 6)}...{result.pairID.toString().substring(result.pairID.toString().length - 6,result.pairID.toString().length)}</Text>
              </Stat>
              <Stat ml={5}>
                <StatLabel>Amount In:</StatLabel>
                <Text>{result.amountIn.toString()}</Text>
              </Stat>
              <Stat ml={5}>
                <StatLabel>Amount Out:</StatLabel>
                <Text>{result.amountOut.toString()}</Text>
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
            <Flex align="baseline" mt={2}>
              <Stat>
                <StatLabel>Has remaining jobs:</StatLabel>
                <Text>{result.hasRemainingJobs.toString()}</Text>
              </Stat>
            </Flex>
          </Box>
        </ListItem>
      ))}
    </List>
    </Box>
    )
}


