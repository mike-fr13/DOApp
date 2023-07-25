"use client"
import {
  SimpleGrid, Card, CardHeader, CardBody, CardFooter, Heading, Button,Spacer,
  Text, Input, Flex, Box, FormControl, FormLabel, Select, FormErrorMessage
} from "@chakra-ui/react"
import { useEffect, useState, useContext } from "react"
import { EthContext } from "@/context/EthContext";
import { EventContext } from "../../context/EventContext"
import { useToast } from "@chakra-ui/react";
import { TokenPairSelect } from "../TokenPairSelect/TokenPairSelect";
import ChainLink from "../../utils/ABI/MockChainLinkAggregatorV3.json"

export const AdminDashBoard = () => {
  const toast = useToast();  
  const [maxDCAProcessSegmentPerCall, setMaxDCAProcessSegmentPerCall] = useState(0)
  const [chainLinkMockAddress, setChainLinkMockAddress] = useState(0)
  const [chainLinkMockPrice, setChainLinkMockPrice] = useState(0)
  const [pairID, setPairID] = useState("");
  const [formErrors, setFormErrors] = useState({});
  
  const {
    account,
    doAppContractWithSigner,
    doAppContract,
    provider,
    ethers,
  } = useContext(EthContext);

  const validateForm = () => {
    console.log ("validateForm");
    let errors = {};
    if (!pairID) errors.pairID = 'Select a token pair';
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      console.log ("validateForm return false");
      console.log ("validateForm : ", errors);
      return false;
    }
  
    console.log ("validateForm return true");
    return true;

  };


  useEffect(() => {
    const fetchData = async () => {
        if (maxDCAProcessSegmentPerCall !== null && maxDCAProcessSegmentPerCall !== undefined && maxDCAProcessSegmentPerCall !== "") {
          setMaxDCAProcessSegmentPerCall((await doAppContractWithSigner.MAX_DCA_SEGMENT_PROCESSED_BY_DCA_EXECUTION_CALL()).toString());
        }
      }
      fetchData();
  }, []);


  const updateMaxDCAProcessSegmentPerCall = async () => {
    try {
      console.log("deposit- start ")

      await doAppContractWithSigner.setMaxDCAProcessSegmentPerCall(
        maxDCAProcessSegmentPerCall
      )

      console.log("deposit - end")
      toast({
        title: "Success",
        description: "Updated successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.log(err.message)
      toast({
        title: "Error",
        description: "An error occurred while updating",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }

  const processDCA = async () => {
    try {
      console.log("processDCA- start ")

      await doAppContractWithSigner.executeDCA(
        pairID
      )

      console.log("processDCA - end")
      toast({
        title: "Success",
        description: "DCA successfully processed",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.log(err.message)
      toast({
        title: "Error",
        description: "An error occurred while rpocessing DCA",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }

  const updateChainLinkMockPrice = async () => {
    try {
      console.log("updateChainLinkMockPrice- start ")

      console.log("updateChainLinkMockPrice - chainLinkMockAddress : ",chainLinkMockAddress)
      console.log("updateChainLinkMockPrice - chainLinkMockPrice : ",chainLinkMockPrice)
      console.log("updateChainLinkMockPrice - ChainLink.abi : ",ChainLink.abi)
      const ChainLinkContract = new ethers.Contract(
        chainLinkMockAddress,
        ChainLink.abi,
        provider
      );
      const ChainLinkContractWithSigner = ChainLinkContract.connect(provider.getSigner());

      await ChainLinkContractWithSigner.setPrice(ethers.BigNumber.from(chainLinkMockPrice))
      

      console.log("updateChainLinkMockPrice - end")
      toast({
        title: "Success",
        description: "Price successfully updated",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.log(err.message)
      toast({
        title: "Error",
        description: "An error occurred while updating price",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }

  const getChainLinkMockPrice = async () => {
    try {
      console.log("getChainLinkMockPrice- start ")

      console.log("getChainLinkMockPrice - chainLinkMockAddress : ",chainLinkMockAddress)
      console.log("getChainLinkMockPrice - chainLinkMockPrice : ",chainLinkMockPrice)
      console.log("getChainLinkMockPrice - ChainLink.abi : ",ChainLink.abi)
      const ChainLinkContract = new ethers.Contract(
        chainLinkMockAddress,
        ChainLink.abi,
        provider
      );
      const ChainLinkContractWithSigner = ChainLinkContract.connect(provider.getSigner());
      const { roundId, answer, startedAt, updatedAt, answeredInRound }  = await ChainLinkContractWithSigner.latestRoundData()

      setChainLinkMockPrice(answer.toString());
      

      console.log("getChainLinkMockPrice - end")
    } catch (err) {
      console.log(err.message)
      toast({
        title: "Error",
        description: "An error occurred while fetching price",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }


  const handleSelectPairChange = (value) => {
    setPairID(value);
  };


  return (
    <SimpleGrid spacing={4} templateColumns='repeat(auto-fill, minmax(300px, 1fr))'>

      <Card>
        <CardHeader>
          <Heading size='md'> Maximum Number of DCA Processed Per Execution</Heading>
        </CardHeader>
        <CardBody>
        <FormControl mt={4}>
            <FormLabel>Value</FormLabel>
            <Input onChange={e => setMaxDCAProcessSegmentPerCall(e.target.value)} value={maxDCAProcessSegmentPerCall} />
          </FormControl>
        </CardBody>
        <CardFooter>
        <Button mt={4} onClick={() => updateMaxDCAProcessSegmentPerCall()}>Update</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <Heading size='md'> DCA execution</Heading>
        </CardHeader>
        <CardBody>
        <FormControl mb={0} mt={0} isInvalid={!!formErrors.pairID}>
          <TokenPairSelect label="select a token pair" value={pairID} onChange={handleSelectPairChange} />
          <FormErrorMessage>{formErrors.pairID}</FormErrorMessage>
        </FormControl>
        </CardBody>
        <CardFooter>
        <Button mt={4} onClick={() => processDCA()}>Launch a DCA process</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <Heading size='md'> Set Price for chainlink Mock</Heading>
        </CardHeader>
        <CardBody>
        <FormControl mt={4}>
            <FormLabel>Address</FormLabel>
            <Input onChange={e => setChainLinkMockAddress(e.target.value)} value={chainLinkMockAddress} />
          </FormControl>
        <FormControl mt={4}>
            <FormLabel>Value</FormLabel>
            <Input onChange={e => setChainLinkMockPrice(e.target.value)} value={chainLinkMockPrice} />
          </FormControl>
        </CardBody>
        <CardFooter>
          <Flex w="100%">
          <Button mt={4} onClick={() => getChainLinkMockPrice()}>Get price</Button>
            <Spacer />
          <Button mt={4} onClick={() => updateChainLinkMockPrice()}>Update</Button>
          </Flex>
        </CardFooter>
      </Card>

    </SimpleGrid>
  )
}

