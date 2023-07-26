
"use client"
import { Box,     Text,  SimpleGrid } from '@chakra-ui/react';
import React, {  useContext } from "react";
import { ReadOnlyInputWithCopy } from '../ReadOnlyInputWithCopy/ReadOnlyInputWithCopy';

import { EventContext } from "@/context/EventContext";

export const AdminDCAHistory = () => {
    const { DCAExecutionResults } = useContext(EventContext);
      

    return (

      <SimpleGrid spacing={4} templateColumns='repeat(auto-fill, minmax(300px, 1fr))'>
      {DCAExecutionResults.map((result, index) => (
          <Box p={5} shadow="md" borderWidth="1px">
          <Text align="center" as='b' >DCA execution Result </Text>
          <ReadOnlyInputWithCopy label="PairId:" value={result.pairID.toString().substring(0, 6)+'...'+result.pairID.toString().substring(result.pairID.toString().length - 6, result.pairID.toString().length)} />
          <ReadOnlyInputWithCopy label="Amount In:" value={result.amountIn.toString()} />
          <ReadOnlyInputWithCopy label="Amount Out:" value={result.amountOut.toString()} />
          <ReadOnlyInputWithCopy label="Amount OTC:" value={result.amountOTC.toString()} />
          <ReadOnlyInputWithCopy label="Amount Swap:" value={result.amountSwap.toString()} />
          <ReadOnlyInputWithCopy label="Timestamp:" value={new Date(result.timestamp * 1000).toLocaleString()} />
          <ReadOnlyInputWithCopy label="Jobs remainings:" value={result.hasRemainingJobs.toString()} />
          </Box>
      ))}
  </SimpleGrid>

    )
}


