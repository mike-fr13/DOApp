"use client"
import {
  SimpleGrid, Card, CardHeader, CardBody, CardFooter, Heading, Button,
  Text, Input, Flex, Box, FormControl, FormLabel, Select
} from "@chakra-ui/react"
import { useEffect, useState, useContext } from "react"
import { EthContext } from "@/context/EthContext";
import { EventContext } from "../../context/EventContext"
import ERC20 from "../../utils/ABI/ERC20.json"
import { getTokenSymbolFromList,findTokenPosition } from "../../utils/tools"
import { useToast } from "@chakra-ui/react";

export const DashBoard = () => {
  const {
    account,
    doAppContractWithSigner,
    doAppContract,
    provider,
    ethers,
  } = useContext(EthContext);

  const {
    tokenPairs,
    tokenList
  } = useContext(EventContext);


  const toast = useToast();  

  const [doAppUserBalances, setDoAppUserBalances] = useState([])
  const [userBalances, setUserBalances] = useState([])

  const [depositAmount, setDepositAmount] = useState(0)
  const [depositToken, setDepositToken] = useState(0)
  const [depositPair, setDepositPair] = useState(0)

  const [withdrawAmount, setWithdrawAmount] = useState(0)
  const [withdrawToken, setWithdrawToken] = useState(0)
  const [withdrawPair, setWithdrawPair] = useState(0)

  const [selectedDepositPairTokens, setSelectedDepositPairTokens] = useState([]);
  const [selectedWithdrawPairTokens, setSelectedWithdrawPairTokens] = useState([]);


  useEffect(() => {
    if (depositPair !== null && depositPair !== undefined && depositPair !== "") {
      const selectedPair = tokenPairs[depositPair];
      if (selectedPair) {
        const tokenA = tokenList.find(token => token.tokenAddress === selectedPair.tokenA);
        const tokenB = tokenList.find(token => token.tokenAddress === selectedPair.tokenB);
        setSelectedDepositPairTokens([tokenA, tokenB]);
      }
    } else {
      setSelectedDepositPairTokens([]);
    }
  }, [depositPair]);

  useEffect(() => {
    if (withdrawPair !== null && withdrawPair !== undefined && withdrawPair !== "") {
      const selectedPair = tokenPairs[withdrawPair];
      if (selectedPair) {
        const tokenA = tokenList.find(token => token.tokenAddress === selectedPair.tokenA);
        const tokenB = tokenList.find(token => token.tokenAddress === selectedPair.tokenB);
        setSelectedWithdrawPairTokens([tokenA, tokenB]);
      }
    } else {
      setSelectedWithdrawPairTokens([]);
    }
  }, [withdrawPair]);


  const deposit = async () => {
    try {
      console.log("deposit- start ")

      // Use the selected token's address
      const selectedToken = tokenList[depositToken];
      const selectedTokenAddress = selectedToken.tokenAddress;
      console.log('deposit- selectedToken : ', selectedToken)
      console.log('deposit- selectedTokenAddress : ', selectedTokenAddress)

      const ERC20Contract = new ethers.Contract(
        selectedTokenAddress,
        ERC20.abi,
        provider
      );
      const ERC20ContractWithSigner = ERC20Contract.connect(provider.getSigner());

      await ERC20ContractWithSigner.approve(
        doAppContract.address,
        depositAmount
      )

      // Determine if the selected token is Token A or Token B
      const tokenPosition = findTokenPosition(tokenPairs, depositPair, selectedTokenAddress);
      console.log('deposit - tokenPosition : ', tokenPosition)

      // Call either depositTokenA or depositTokenB accordingly
      if (tokenPosition === 0) {
        console.log(`deposit - selectedToken.PairID : ${selectedToken.PairID}, depositAmount  ${depositAmount}`)
        await doAppContractWithSigner.depositTokenA(
          selectedToken.pairID,
          depositAmount
        )
      } else if (tokenPosition === 1) {
        await doAppContractWithSigner.depositTokenB(
          selectedToken.pairID,
          depositAmount
        )
      } else {
        // Handle error case (tokenPosition === -1)
        console.error("deposit- Error: selected token is neither Token A nor Token B.");
        return;
      }

      await getUserBalances()
      await getDoAppUserBalances()
      console.log("deposit - end")
      toast({
        title: "Success",
        description: "Deposit successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.log(err.message)
      toast({
        title: "Error",
        description: "An error occurred while trying to Deposit",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }


  const withdraw = async () => {
    try {
      console.log("withdraw - start")

      // Use the selected token's address
      const selectedToken = tokenList[withdrawToken];
      const selectedTokenAddress = selectedToken.tokenAddress;
      console.log('withdraw - selectedToken : ', selectedToken)
      console.log('withdraw- selectedTokenAddress : ', selectedTokenAddress)

      const ERC20Contract = new ethers.Contract(
        selectedTokenAddress,
        ERC20.abi,
        provider
      );
      const ERC20ContractWithSigner = ERC20Contract.connect(provider.getSigner());

      await ERC20ContractWithSigner.approve(
        doAppContract.address,
        withdrawAmount
      )

      // Determine if the selected token is Token A or Token B
      const tokenPosition = findTokenPosition(tokenPairs, withdrawPair, selectedTokenAddress);
      console.log('withdraw - tokenPosition : ', tokenPosition)

      // Call either depositTokenA or depositTokenB accordingly
      if (tokenPosition === 0) {
        console.log(`withdraw -  selectedToken.PairID : ${selectedToken.PairID}, withdrawAmount  ${withdrawAmount}`)
        await doAppContractWithSigner.withdrawTokenA(
          selectedToken.pairID,
          withdrawAmount
        )
      } else if (tokenPosition === 1) {
        await doAppContractWithSigner.withdrawTokenB(
          selectedToken.pairID,
          withdrawAmount
        )
      } else {
        // Handle error case (tokenPosition === -1)
        console.error("withdraw - Error: selected token is neither Token A nor Token B.");
        return;
      }

      await getUserBalances()
      await getDoAppUserBalances()
      console.log("withdraw - end")
      toast({
        title: "Success",
        description: "Withdraw successfull",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.log(err.message)
      toast({
        title: "Error",
        description: "An error occurred while withdrawing",
        status: "error",
        duration: 5000,
        isClosable: true,
      });

    }
  }

  const getUserBalances = async () => {
    try {
      console.log("getUserBalances - start");
      let userBalances = [];

      for (let token of tokenList) {
        console.log('getUserBalances - token : ', token)
        
        const ERC20Contract = new ethers.Contract(
          token.tokenAddress,
          ERC20.abi,
          provider
        );
        const ERC20ContractWithSigner = ERC20Contract.connect(provider.getSigner());
        let bal = await ERC20ContractWithSigner.balanceOf(account)        
        console.log('getUserBalances balance : ', bal)

        console.log('getBalances - balance :', (bal).toString());
        userBalances.push({ name: token.name, symbol: token.symbol, balance: bal.toString()});
      }

      setUserBalances(userBalances);
      console.log("getBalances - end");
      
    } catch (err) {
      console.log(err.message);
      toast({
        title: "Error",
        description: "An error occurred while refereshing balance",
        status: "error",
        duration: 5000,
        isClosable: true,
      });

    }
  }



  const getDoAppUserBalances = async () => {
    try {
      console.log("getBalances - start");
      let balances = [];

      for (let token of tokenList) {
        console.log('getBalances - token : ', token)
        let bal = await doAppContract.getTokenUserBalances(
          token.tokenAddress,
          account
        )
        console.log('getBalances - balance :', (bal.balance).toString(), ' index ', bal.index.toString());
        balances.push({ name: token.name, symbol: token.symbol, balance: bal.balance.toString(), index: bal.index.toString() });
      }

      setDoAppUserBalances(balances);
      console.log("getBalances - end");
      
    } catch (err) {
      console.log(err.message);
      toast({
        title: "Error",
        description: "An error occurred while refereshing balance",
        status: "error",
        duration: 5000,
        isClosable: true,
      });

    }
  }


  useEffect(() => {
    if (account) {
      getUserBalances()
      getDoAppUserBalances()
    }
  }, [account, tokenList])

  return (
    <SimpleGrid spacing={4} templateColumns='repeat(auto-fill, minmax(300px, 1fr))'>

      <Card>
        <CardHeader>
          <Heading size='md'> User balances</Heading>
        </CardHeader>
        <CardBody>
          {userBalances.map((tokenBalance, index) => (
            <Box key={index} p={2} borderWidth={1} borderRadius="md">
              <Heading size="sm">{tokenBalance.name} ({tokenBalance.symbol})</Heading>
              <Text>Balance: {tokenBalance.balance}</Text>
            </Box>
          ))}
          <Button mt={3} onClick={() => getUserBalances()}>Refresh</Button>
        </CardBody>
        <CardFooter>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <Heading size='md'> DOApp User balances</Heading>
        </CardHeader>
        <CardBody>
          {doAppUserBalances.map((tokenBalance, index) => (
            <Box key={index} p={2} borderWidth={1} borderRadius="md">
              <Heading size="sm">{tokenBalance.name} ({tokenBalance.symbol})</Heading>
              <Text>Balance: {tokenBalance.balance}</Text>
            </Box>
          ))}
          <Button mt={3} onClick={() => getDoAppUserBalances()}>Refresh</Button>
        </CardBody>
        <CardFooter>
        </CardFooter>
      </Card>


      <Card>
        <CardHeader>
          <Heading size='md'> Deposit </Heading>
        </CardHeader>
        <CardBody>
          <FormControl>
            <FormLabel>Token Pair</FormLabel>
            <Select
              placeholder='Select token pair'
              onChange={e => setDepositPair(e.target.value)}
              value={depositPair}
            >
              {tokenPairs?.map((pair, index) => (
                <option key={index} value={index}>
                  {getTokenSymbolFromList(pair.tokenA, tokenList)} - {getTokenSymbolFromList(pair.tokenB, tokenList)}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl mt={4}>
            <FormLabel>Token</FormLabel>
            <Select
              placeholder='Select token to deposit'
              onChange={e => setDepositToken(e.target.value)}
              value={depositToken}
            >
              {selectedDepositPairTokens.map((token, index) => (
                <option key={index} value={index}>{token.symbol} - {token.name}</option>
              ))}
            </Select>
          </FormControl>

          <Text mt={4}>Amount : </Text>
          <Input onChange={e => setDepositAmount(e.target.value)} placeholder="Amount to deposit" value={depositAmount} />
          <Button mt={4} onClick={() => deposit()}>Deposit</Button>
        </CardBody>
        <CardFooter>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <Heading size='md'> Withdraw </Heading>
        </CardHeader>
        <CardBody>
          <FormControl>
              <FormLabel>Token Pair</FormLabel>
              <Select
                placeholder='Select token pair'
                onChange={e => setWithdrawPair(e.target.value)}
                value={withdrawPair}
              >
                {tokenPairs?.map((pair, index) => (
                  <option key={index} value={index}>
                    {getTokenSymbolFromList(pair.tokenA, tokenList)} - {getTokenSymbolFromList(pair.tokenB, tokenList)}
                  </option>
                ))}
              </Select>
            </FormControl>

          <FormControl mt={4}>
            <FormLabel>Token</FormLabel>
            <Select
              placeholder='Select token to withdraw'
              onChange={e => setWithdrawToken(e.target.value)}
              value={withdrawToken}
            >
              {selectedWithdrawPairTokens.map((token, index) => (
                <option key={index} value={index}>{token.symbol} - {token.name}</option>
              ))}
            </Select>
          </FormControl>
          <Flex direction="column">
            <Text mt={4}>Amount : </Text>
            <Input onChange={e => setWithdrawAmount(e.target.value)} placeholder="Amount to withdraw" value={withdrawAmount} />
          </Flex>
          <Button mt={4} onClick={() => withdraw()}>withdraw</Button>
        </CardBody>
        <CardFooter>
        </CardFooter>
      </Card>

    </SimpleGrid>
  )
}

