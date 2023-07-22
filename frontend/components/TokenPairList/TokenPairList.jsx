"use client"
import { SimpleGrid,Card,CardHeader,CardBody,CardFooter,Heading,Button,Text} from "@chakra-ui/react"
import React, { createContext, useContext, useEffect, useState } from "react";
import { EventContext } from "@/context/EventContext";


export const TokenPairList = () => {
  const { tokenPairs } = useContext(EventContext);
  console.log("TokenPairList - tokenPairs : ", tokenPairs);
  console.log("TokenPairList - tokenPairs : ", tokenPairs[0]);


  return (
    <SimpleGrid spacing={4} templateColumns='repeat(auto-fill, minmax(200px, 1fr))'>
      {tokenPairs?.map((tokenPair, index) => (
        <Card>
          <CardHeader>
            <Heading size='md'>{tokenPair.tokenPairId?.toString()}</Heading>
          </CardHeader>
          <CardBody>
          <Text>ID : {tokenPair.tokenPairId?.toString()}</Text>
            <Text>PairId : {tokenPair.pairID?.toString()}</Text>
            <Text>1st Token : {tokenPair.tokenA}</Text>
            <Text>1st token index balance : {tokenPair.indexBalanceTokenA?.toString()}</Text>
            <Text>2nd Token : {tokenPair.tokenB}</Text>
            <Text>1st token index balance : {tokenPair.indexBalanceTokenB?.toString()}</Text>
            <Text>ChainLink Price Fetcher : {tokenPair.chainlinkPriceFetcher}</Text>
            <Text>AAve pool address procider : {tokenPair.aavePoolAddressesProvider}</Text>
            <Text>token Pair enabled : {tokenPair.enabled}</Text>
            <Text>Segment size : {tokenPair.tokenPairSegmentSize?.toString()}</Text>
            <Text>Decimal number : {tokenPair.tokenPairDecimalNumber}</Text>
            <Text>SwapRouter : {tokenPair.swapRouter}</Text>
            <Text>1st AToken : {tokenPair.aTokenA}</Text>
            <Text>2nd AToken : {tokenPair.aTokenB}</Text>
          </CardBody>
          <CardFooter>
            <Button>View here</Button>
          </CardFooter>
        </Card>
        )
      )}
    </SimpleGrid>
  )
}

