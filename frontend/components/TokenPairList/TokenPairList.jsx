import {
  Card, CardBody, CardHeader, Text, Heading, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, useDisclosure,
  Box, FormControl, FormLabel, Input, SimpleGrid, FormErrorMessage
} from "@chakra-ui/react"
import React, { createContext, useContext, useEffect, useState } from "react";
import { EventContext } from "@/context/EventContext";
import { EthContext } from "@/context/EthContext";
import { dataStoreContractWithSigner } from "@/context/EthContext"
import { getTokenSymbolFromList } from "../../utils/tools"
import { ethers } from "ethers";
import { useToast } from "@chakra-ui/react";
import { ReadOnlyInputWithCopy } from "../ReadOnlyInputWithCopy/ReadOnlyInputWithCopy"

export const TokenPairList = () => {
  const {
    dataStoreContractWithSigner,
    ethers
  } = useContext(EthContext);


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

  const [formErrors, setFormErrors] = useState({});


  const validateForm = () => {
    console.log("validateForm");
    let errors = {};

    if (firstToken === undefined || firstToken === null || firstToken === '') errors.firstToken = 'First token is required';
    if (secondToken === undefined || secondToken === null || secondToken === '') errors.secondToken = 'Second token is required';
    if (segmentSize === undefined || segmentSize === null || segmentSize === '') errors.segmentSize = 'Segment size is required';
    if (aavePoolAddressProvider === undefined || aavePoolAddressProvider === null || aavePoolAddressProvider === '') errors.aavePoolAddressProvider = 'AAVE pool provider is required';
    if (chainLinkPriceFetcher === undefined || chainLinkPriceFetcher === null || chainLinkPriceFetcher === '') errors.chainLinkPriceFetcher = 'Chainlink price fetcher is required';
    if (swapRouter === undefined || swapRouter === null || swapRouter === '') errors.swapRouter = 'Uniswap router is required';

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      console.log("validateForm return false");
      console.log("validateForm : ", errors);
      return false;
    }

    console.log("validateForm return true");
    return true;

  };

  useEffect(() => {
    validateForm();
  }, [firstToken, secondToken, chainLinkPriceFetcher, aavePoolAddressProvider, segmentSize, swapRouter]);


  const addTokenPair = async () => {
    try {
      if (validateForm()) {
        console.log("addTokenPair - start")

        const _tokenAddressA = firstToken
        const _tokenPairSegmentSize = ethers.BigNumber.from(segmentSize);
        const _tokenAddressB = secondToken
        const _chainLinkPriceFetcher = chainLinkPriceFetcher
        const _aavePoolAddressesProvider = aavePoolAddressProvider
        const _uniswapV3SwapRouter = swapRouter


        console.log("addTokenPair - just before transaction")
        const result = await dataStoreContractWithSigner.addTokenPair(
          _tokenAddressA,
          _tokenPairSegmentSize,
          _tokenAddressB,
          _chainLinkPriceFetcher,
          _aavePoolAddressesProvider,
          _uniswapV3SwapRouter)

        console.log(`addTokenPair - result : ${result}`);
        console.log("addTokenPair - end")

        toast({
          title: "Success",
          description: "Token Pair added successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }
    }
    catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while adding Token Pair",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error(`addTokenPair - error : ${err}`);
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
          <Box p={1}>
            <ReadOnlyInputWithCopy label="PairId:" value={selectedPair.pairID?.toString()} />
            <ReadOnlyInputWithCopy label="1st Token:" value={selectedPair.tokenA?.toString()} />
            <ReadOnlyInputWithCopy label="2nd Token:" value={selectedPair.tokenB?.toString()} />
            <ReadOnlyInputWithCopy label="chainlink Price Fetcher:" value={selectedPair.chainlinkPriceFetcher?.toString()} />
            <ReadOnlyInputWithCopy label="AAve pool address provider:" value={selectedPair.aavePoolAddressesProvider?.toString()} />
            <ReadOnlyInputWithCopy label="Segment size:" value={selectedPair.tokenPairSegmentSize?.toString()} />
            <ReadOnlyInputWithCopy label="SwapRouter:" value={selectedPair.swapRouter?.toString()} />
            <ReadOnlyInputWithCopy label="1st AToken:" value={selectedPair.aTokenA?.toString()} />
            <ReadOnlyInputWithCopy label="2nd AToken:" value={selectedPair.aTokenB?.toString()} />
          </Box>
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
            <FormControl mb={0} mt={0} isInvalid={!!formErrors.firstToken}>
              <FormLabel fontSize="sm" mb={0} mt={0}>1st Token</FormLabel>
              <Input size="sm" placeholder="Enter 1st Token" value={firstToken} onChange={e => setFirstToken(e.target.value)} />
              <FormErrorMessage>{formErrors.firstToken}</FormErrorMessage>
            </FormControl>

            <FormControl mb={0} mt={0} isInvalid={!!formErrors.secondToken}>
              <FormLabel fontSize="sm" mb={0} mt={0}>2nd Token</FormLabel>
              <Input size="sm" placeholder="Enter 2nd Token" value={secondToken} onChange={e => setSecondToken(e.target.value)} />
              <FormErrorMessage>{formErrors.secondToken}</FormErrorMessage>
            </FormControl>

            <FormControl mb={0} mt={0} isInvalid={!!formErrors.segmentSize}>
              <FormLabel fontSize="sm" mb={0} mt={0}>Segment Size</FormLabel>
              <Input size="sm" placeholder="Enter Segment Size" value={segmentSize} onChange={e => setSegmentSize(e.target.value)} />
              <FormErrorMessage>{formErrors.segmentSize}</FormErrorMessage>
            </FormControl>

            <FormControl mb={0} mt={0} isInvalid={!!formErrors.chainLinkPriceFetcher}>
              <FormLabel fontSize="sm" mb={0} mt={0}>ChainLink Price Fetcher</FormLabel>
              <Input size="sm" placeholder="Enter ChainLink Price Fetcher" value={chainLinkPriceFetcher} onChange={e => setChainLinkPriceFetcher(e.target.value)} />
              <FormErrorMessage>{formErrors.chainLinkPriceFetcher}</FormErrorMessage>
            </FormControl>

            <FormControl mb={0} mt={0} isInvalid={!!formErrors.aavePoolAddressProvider}>
              <FormLabel fontSize="sm" mb={0} mt={0}>AAve Pool Address Provider</FormLabel>
              <Input size="sm" placeholder="Enter AAve Pool Address Provider" value={aavePoolAddressProvider} onChange={e => setAavePoolAddressProvider(e.target.value)} />
              <FormErrorMessage>{formErrors.aavePoolAddressProvider}</FormErrorMessage>
            </FormControl>

            <FormControl mb={0} mt={0} isInvalid={!!formErrors.swapRouter}>
              <FormLabel fontSize="sm" mb={0} mt={0}>SwapRouter</FormLabel>
              <Input size="sm" placeholder="Enter SwapRouter" value={swapRouter} onChange={e => setSwapRouter(e.target.value)} />
              <FormErrorMessage>{formErrors.swapRouter}</FormErrorMessage>
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