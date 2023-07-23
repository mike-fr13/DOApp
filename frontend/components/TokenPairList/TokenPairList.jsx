import {
  Card, CardBody, CardHeader, Text, Heading, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, useDisclosure,
  Box, FormControl, FormLabel, Input,SimpleGrid
} from "@chakra-ui/react"
import React, { createContext, useContext, useEffect, useState } from "react";
import { EventContext } from "@/context/EventContext";
import {dataStoreContractWithSigner} from "@/context/EthContext"
import { getTokenSymbolFromList } from "../../utils/tools"
import { ethers } from "ethers";
import { useToast } from "@chakra-ui/react";

export const TokenPairList = () => {
  const [selectedPair, setSelectedPair] = useState(null);
  const { tokenPairs, tokenList } = useContext(EventContext);


  const { isOpen: isOpen1, onOpen: onOpen1, onClose: onClose1 } = useDisclosure();
  const { isOpen: isOpen2, onOpen: onOpen2, onClose: onClose2 } = useDisclosure();


  const [firstToken, setFirstToken] = useState("");
  const [firstTokenIndexBalance, setFirstTokenIndexBalance] = useState("");
  const [secondToken, setSecondToken] = useState("");
  const [secondTokenIndexBalance, setSecondTokenIndexBalance] = useState("");
  const [chainLinkPriceFetcher, setChainLinkPriceFetcher] = useState("");
  const [aavePoolAddressProvider, setAavePoolAddressProvider] = useState("");
  const [tokenPairEnabled, setTokenPairEnabled] = useState("");
  const [segmentSize, setSegmentSize] = useState("");
  const [decimalNumber, setDecimalNumber] = useState("");
  const [swapRouter, setSwapRouter] = useState("");
  const [firstAToken, setFirstAToken] = useState("");
  const [secondAToken, setSecondAToken] = useState("");


  const toast = useToast();  

  const addTokenPair = async () => {
    try {
      console.log("addTokenPair - start")
/*
      const _pairId = ethers.BigNumber.from(firstToken);
      const _isBuyTokenASellTokenB = tokenPairEnabled === "true";
      const _min = ethers.BigNumber.from(firstTokenIndexBalance);
      const _max = ethers.BigNumber.from(secondTokenIndexBalance);
      const _amount = ethers.BigNumber.from(chainLinkPriceFetcher);
      const _scalingFactor = Number(decimalNumber);
      const _dcaDelay = ethers.BigNumber.from();

      address _tokenAddressA, 
      uint _tokenPairSegmentSize,
      address _tokenAddressB, 
      address _chainLinkPriceFetcher,
      address _aavePoolAddressesProvider,
      address _uniswapV3SwapRouter) external returns (uint256);
*/

      console.log("addTokenPair - just before transaction")
      try {
        const result = await dataStoreContractWithSigner.addTokenPair(
          _pairId,
          _isBuyTokenASellTokenB,
          _min,
          _max,
          _amount,
          _scalingFactor,
          _dcaDelay
        );
        console.log(`addTokenPair - result : ${result}`);
      } catch (error) {
        console.error(`addTokenPair - error : ${error}`);
      }

      await getBalances()
      console.log("addTokenPair - end")
    } catch (err) {
      console.log(err.message)
    }
  }




  const handleCardClick = (pair) => {
    setSelectedPair(pair);
    onOpen1();
  }

  const renderPairModal = () => (
    <Modal border="2px" borderColor="gray.200" isOpen={isOpen1} onClose={onClose1}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Pair Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>ID : {selectedPair.tokenPairId?.toString()}</Text>
          <Text>PairId : {selectedPair.pairID?.toString()}</Text>
          <Text>1st Token : {getTokenSymbolFromList(selectedPair.tokenA, tokenList)}</Text>
          <Text>1st token index balance : {selectedPair.indexBalanceTokenA?.toString()}</Text>
          <Text>2nd Token : {getTokenSymbolFromList(selectedPair.tokenB, tokenList)}</Text>
          <Text>2nd token index balance : {selectedPair.indexBalanceTokenB?.toString()}</Text>
          <Text>ChainLink Price Fetcher : {selectedPair.chainlinkPriceFetcher}</Text>
          <Text>AAve pool address provider : {selectedPair.aavePoolAddressesProvider}</Text>
          <Text>Token Pair enabled : {selectedPair.enabled.toString()}</Text>
          <Text>Segment size : {selectedPair.tokenPairSegmentSize?.toString()}</Text>
          <Text>Decimal number : {selectedPair.tokenPairDecimalNumber}</Text>
          <Text>SwapRouter : {selectedPair.swapRouter}</Text>
          <Text>1st AToken : {selectedPair.aTokenA}</Text>
          <Text>2nd AToken : {selectedPair.aTokenB}</Text>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose1}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );


  return (
    <SimpleGrid spacing={4} templateColumns='repeat(auto-fill, minmax(300px, 1fr))'>
      {/* New Card component with a "+" button */}
      <Card border="2px" borderColor="gray.200">
        <CardHeader>
          <Heading size='md'> Add new pair </Heading>
        </CardHeader>
        <CardBody>
          <Box display="flex" alignItems="center" justifyContent="center" height="100%">
            <Button onClick={onOpen2} size="lg">+</Button>
          </Box>
        </CardBody>
      </Card>

      {/* Token pair list*/}
      {tokenPairs?.map((pair, index) => (
        <Card key={index} onClick={() => handleCardClick(pair)} border="2px" borderColor="gray.200">
          <CardHeader>
            <Heading size='md'>Pair: {index + 1}</Heading>
          </CardHeader>
          <CardBody>
            <Text>Token A: {getTokenSymbolFromList(pair.tokenA, tokenList)}</Text>
            <Text>Token B: {getTokenSymbolFromList(pair.tokenB, tokenList)}</Text>
          </CardBody>
        </Card>
      ))}
      {/* Modal for adding a new pair */}
      <Modal isOpen={isOpen2} onClose={onClose2}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add new pair</ModalHeader>
          <ModalCloseButton />


          <ModalBody>
            <FormControl mb={0} mt={0}>
              <FormLabel fontSize="sm" mb={0} mt={0}>1st Token</FormLabel>
              <Input size="sm" placeholder="Enter 1st Token" value={firstToken} onChange={e => setFirstToken(e.target.value)} />
            </FormControl>

            <FormControl mb={0} mt={0}>
              <FormLabel fontSize="sm" mb={0} mt={0}>1st Token Index Balance</FormLabel>
              <Input size="sm" placeholder="Enter 1st Token Index Balance" value={firstTokenIndexBalance} onChange={e => setFirstTokenIndexBalance(e.target.value)} />
            </FormControl>

            <FormControl mb={0} mt={0}>
              <FormLabel fontSize="sm" mb={0} mt={0}>2nd Token</FormLabel>
              <Input size="sm" placeholder="Enter 2nd Token" value={secondToken} onChange={e => setSecondToken(e.target.value)} />
            </FormControl>

            <FormControl mb={0} mt={0}>
              <FormLabel fontSize="sm" mb={0} mt={0}>2nd Token Index Balance</FormLabel>
              <Input size="sm" placeholder="Enter 2nd Token Index Balance" value={secondTokenIndexBalance} onChange={e => setSecondTokenIndexBalance(e.target.value)} />
            </FormControl>

            <FormControl mb={0} mt={0}>
              <FormLabel fontSize="sm" mb={0} mt={0}>ChainLink Price Fetcher</FormLabel>
              <Input size="sm" placeholder="Enter ChainLink Price Fetcher" value={chainLinkPriceFetcher} onChange={e => setChainLinkPriceFetcher(e.target.value)} />
            </FormControl>

            <FormControl mb={0} mt={0}>
              <FormLabel fontSize="sm" mb={0} mt={0}>AAve Pool Address Provider</FormLabel>
              <Input size="sm" placeholder="Enter AAve Pool Address Provider" value={aavePoolAddressProvider} onChange={e => setAavePoolAddressProvider(e.target.value)} />
            </FormControl>

            <FormControl mb={0} mt={0}>
              <FormLabel fontSize="sm" mb={0} mt={0}>Token Pair Enabled</FormLabel>
              <Input size="sm" placeholder="Enter Token Pair Enabled" value={tokenPairEnabled} onChange={e => setTokenPairEnabled(e.target.value)} />
            </FormControl>

            <FormControl mb={0} mt={0}>
              <FormLabel fontSize="sm" mb={0} mt={0}>Segment Size</FormLabel>
              <Input size="sm" placeholder="Enter Segment Size" value={segmentSize} onChange={e => setSegmentSize(e.target.value)} />
            </FormControl>

            <FormControl mb={0} mt={0}>
              <FormLabel fontSize="sm" mb={0} mt={0}>Decimal Number</FormLabel>
              <Input size="sm" placeholder="Enter Decimal Number" value={decimalNumber} onChange={e => setDecimalNumber(e.target.value)} />
            </FormControl>

            <FormControl mb={0} mt={0}>
              <FormLabel fontSize="sm" mb={0} mt={0}>SwapRouter</FormLabel>
              <Input size="sm" placeholder="Enter SwapRouter" value={swapRouter} onChange={e => setSwapRouter(e.target.value)} />
            </FormControl>

            <FormControl mb={0} mt={0}>
              <FormLabel fontSize="sm" mb={0} mt={0}>1st AToken</FormLabel>
              <Input size="sm" placeholder="Enter 1st AToken" value={firstAToken} onChange={e => setFirstAToken(e.target.value)} />
            </FormControl>

            <FormControl mb={0} mt={0}>
              <FormLabel fontSize="sm" mb={0} mt={0}>2nd AToken</FormLabel>
              <Input size="sm" placeholder="Enter 2nd AToken" value={secondAToken} onChange={e => setSecondAToken(e.target.value)} />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={addTokenPair}>
              Save
            </Button>
            <Button variant="ghost" onClick={onClose2}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>



      {selectedPair && renderPairModal()}
      </SimpleGrid>
  );
}