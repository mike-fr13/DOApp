"use client"
import {
  Card, CardBody, CardHeader, Text, Heading, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, useDisclosure,
  Box, FormControl, FormLabel, Input, CardFooter, SimpleGrid, Switch, RadioGroup, Radio, Stack
} from "@chakra-ui/react"
import React, { createContext, useContext, useEffect, useState } from "react";
import { EventContext } from "@/context/EventContext";
import { EthContext } from "@/context/EthContext";
import { TokenPairSelect } from "../TokenPairSelect/TokenPairSelect";
import { useToast } from "@chakra-ui/react";




export const DCAConfigList = () => {
  const {
    dataStoreContractWithSigner,
    ethers
  } = useContext(EthContext);

  const toast = useToast();  // <- ajoutez ceci

  const [selectedConfig, setSelectedConfig] = useState(null);
  const { dcaConfigs } = useContext(EventContext);

  const { isOpen: isOpen1, onOpen: onOpen1, onClose: onClose1 } = useDisclosure();
  const { isOpen: isOpen2, onOpen: onOpen2, onClose: onClose2 } = useDisclosure();

  const [pairID, setPairID] = useState("");
  const [isSwapTookenAForTokenB, setIsSwapTookenAForTokenB] = useState(true);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [amount, setAmount] = useState("");
  const [scalingFactor, setScalingFactor] = useState("");
  const [dcaDelay, setDcaDelay] = useState("");

  const dataStoreContractAddress = process.env.NEXT_PUBLIC_DATASTORE_CONTRACT_ADDRESS;

  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    console.log ("validateForm");
    let errors = {};

    if (!pairID) errors.pairID = 'Select a token pair';
    if (min === undefined || min === null || min === '') errors.min = 'Min is required';
    if (max === undefined || max === null || max === '') errors.max = 'Max is required';
    if (amount === undefined || amount === null || amount === '') errors.amount = 'Amount is required';
    if (scalingFactor === undefined || scalingFactor === null || scalingFactor === '') errors.scalingFactor = 'Scaling Factor is required';
    if (dcaDelay === undefined || dcaDelay === null || dcaDelay === '') errors.dcaDelay = 'DCA Delay is required';
    if (min >= max) errors.range = 'Min must be less than Max';

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
    validateForm();
  }, [pairID, min, max, amount, scalingFactor, dcaDelay]);
  


  const addDCAConfig = async () => {
    if (validateForm()) {
      try {
        console.log("addDCAConfig - start")

        const _pairId = ethers.BigNumber.from(pairID);
        console.log(`addDCAConfig - pairID : ${pairID}`)
        const _isBuyTokenASellTokenB = isSwapTookenAForTokenB;
        console.log(`addDCAConfig - _isBuyTokenASellTokenB : ${_isBuyTokenASellTokenB}`)
        const _min = ethers.BigNumber.from(min);
        console.log(`addDCAConfig - min : ${min}`)
        const _max = ethers.BigNumber.from(max);
        console.log(`addDCAConfig - max : ${max}`)
        const _amount = ethers.BigNumber.from(amount);
        console.log(`addDCAConfig - amount : ${amount}`)
        const _scalingFactor = Number(scalingFactor);
        console.log(`addDCAConfig - scalingFactor : ${scalingFactor}`)
        const _dcaDelay = ethers.BigNumber.from(dcaDelay);
        console.log(`addDCAConfig - dcaDelay : ${dcaDelay}`)

        console.log("addDCAConfig - just before transaction")

        const result = await dataStoreContractWithSigner.addDCAConfig(
          _pairId,
          _isBuyTokenASellTokenB,
          _min,
          _max,
          _amount,
          _scalingFactor,
          _dcaDelay
        );
        console.log(`addDCAConfig - result : ${result}`);

        toast({
          title: "Success",
          description: "DCA configuration added successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        onClose2();
        console.log("addDCAConfig - end")

      } catch (err) {
        toast({
          title: "Error",
          description: "An error occurred while adding DCA configuration",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        console.error(`addDCAConfig - error : ${error}`);
      }
    }
  }




  const handleCardClick = (dcaConfig) => {
    setSelectedConfig(dcaConfig);
    onOpen1();
  }

  const handleToggle = () => setIsSwapTookenAForTokenB(!isSwapTookenAForTokenB);

  const handleSelectPairChange = (value) => {
    setPairID(value);
  };


  const renderConfigModal = () => (
    <Modal border="2px" borderColor="gray.200" isOpen={isOpen1} onClose={onClose1}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Pair Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>pairID: {selectedConfig.pairID?.toString()}</Text>
          <Text>isSwapTookenAForTokenB: {selectedConfig.isSwapTookenAForTokenB}</Text>
          <Text>min: {selectedConfig.min?.toString()}</Text>
          <Text>max: {selectedConfig.max?.toString()}</Text>
          <Text>amount: {selectedConfig.amount?.toString()}</Text>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose1}>Close</Button>
        </ModalFooter>dcaConfigs
      </ModalContent>
    </Modal>
  );
  return (
    <SimpleGrid spacing={4} templateColumns='repeat(auto-fill, minmax(300px, 1fr))'>
      {/* New Card component with a "+" button */}
      <Card border="2px" borderColor="gray.200">
        <CardHeader>
          <Heading size='md'> Add new config </Heading>
        </CardHeader>
        <CardBody>
          <Box display="flex" alignItems="center" justifyContent="center" height="100%">
            <Button onClick={onOpen2} size="lg">+</Button>
          </Box>
        </CardBody>
      </Card>

      {dcaConfigs?.map((dcaConfig, index) => (
        <Card key={index} onClick={() => handleCardClick(dcaConfig)} border="2px" borderColor="gray.200">
          <CardHeader>
            <Heading size='md'>Config: {index + 1}</Heading>
          </CardHeader>
          <CardBody>
            <Text>pairID: {dcaConfig.pairID?.toString()}</Text>
            <Text>isSwapTookenAForTokenB: {dcaConfig.isSwapTookenAForTokenB.toString()}</Text>
            <Text>min: {dcaConfig.min?.toString()}</Text>
            <Text>max: {dcaConfig.max?.toString()}</Text>
            <Text>amount: {dcaConfig.amount?.toString()}</Text>
          </CardBody >
        </Card >
      ))}

      {/* Modal for adding a new pair */}
      <Modal isOpen={isOpen2} onClose={onClose2}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add new DCA configuration</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={0} mt={0} isInvalid={!!formErrors.pairID}>
              <TokenPairSelect label="select a token pair" value={pairID} onChange={handleSelectPairChange} />
            </FormControl>
          </ModalBody>
          <ModalBody>
            <FormControl mb={0} mt={0} isInvalid={!!formErrors.isSwapTookenAForTokenB}>
              <FormLabel fontSize="sm" mb={0} mt={0}>Sell A to Buy B</FormLabel>
              <Switch size="md" isChecked={isSwapTookenAForTokenB} onChange={handleToggle} />
            </FormControl>
          </ModalBody>
          <ModalBody>
            <FormControl mb={0} mt={0} isInvalid={!!formErrors.min}>
              <FormLabel fontSize="sm" mb={0} mt={0}>Min</FormLabel>
              <Input size="sm" placeholder="Enter pair token to use" value={min} onChange={e => setMin(e.target.value)} />
            </FormControl>
          </ModalBody>
          <ModalBody>
            <FormControl mb={0} mt={0} isInvalid={!!formErrors.max}>
              <FormLabel fontSize="sm" mb={0} mt={0}>Max</FormLabel>
              <Input size="sm" placeholder="Enter pair token to use" value={max} onChange={e => setMax(e.target.value)} />
            </FormControl>
          </ModalBody>
          <ModalBody>
            <FormControl mb={0} mt={0} isInvalid={!!formErrors.amount}>
              <FormLabel fontSize="sm" mb={0} mt={0}>Amount</FormLabel>
              <Input size="sm" placeholder="Enter pair token to use" value={amount} onChange={e => setAmount(e.target.value)} />
            </FormControl>
          </ModalBody>
          <ModalBody>
            <FormControl mb={0} mt={0} isInvalid={!!formErrors.scalingFactor}>
              <FormLabel fontSize="sm" mb={0} mt={0}>ScalingFactor</FormLabel>
              <Input size="sm" placeholder="Enter pair token to use" value={scalingFactor} onChange={e => setScalingFactor(e.target.value)} />
            </FormControl>
          </ModalBody>
          <ModalBody>
            <FormControl mb={0} mt={0} isInvalid={!!formErrors.dcaDelay}>
              <FormLabel fontSize="sm" mb={0} mt={0}>Dca Delay</FormLabel>
              <RadioGroup value={dcaDelay} onChange={setDcaDelay}>
                <Stack direction='row'>
                  <Radio value='0'>Hourly</Radio>
                  <Radio value='1'>Daily</Radio>
                  <Radio value='2'>Weekly</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={addDCAConfig}>
              Save
            </Button>
            <Button variant="ghost" onClick={onClose2}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>



      {selectedConfig && renderConfigModal()}


    </SimpleGrid>
  )
}

