"use client"
import {
  SimpleGrid, Card, CardHeader, CardBody, CardFooter, Heading, Button,
  Text, Input, Flex, Box, FormControl, FormLabel, Select
} from "@chakra-ui/react"
import { useEffect, useState, useContext } from "react"
import { EthContext } from "@/context/EthContext";
import { EventContext}  from "../../context/EventContext"
import ERC20 from "../../utils/ABI/ERC20.json"

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



  const TOKENA_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
  const PAIR_ID = "39913520734075264574753032560315884887767475056922141184524271681014526542945"

  const [balanceState, setBalance] = useState([])

  const [depositAmount, setDepositAmount] = useState(0)
  const [depositToken, setDepositToken] = useState(0)

  const [WithdrawAmount, setWithdrawAmount] = useState(0)
  const [withdrawToken, setWithdrawToken] = useState(0)


  const deposit = async () => {
    try {
      console.log("start - deposit")

      const ERC20Contract = new ethers.Contract(
        TOKENA_ADDRESS,
        ERC20.abi,
        provider
      );
      const ERC20ContractWithSigner = ERC20Contract.connect(provider.getSigner());


      await ERC20ContractWithSigner.approve(
        doAppContract.address,
        depositAmount
      )
      await doAppContractWithSigner.depositTokenA(
        PAIR_ID,
        depositAmount
      )
      await getBalance()
      console.log("end - deposit")
    } catch (err) {
      console.log(err.message)
    }
  }

  const getBalances = async () => {
    try {
      console.log("start - GetBalances");
      let balances = [];
  
      for(let token of tokenList){
        let bal = await doAppContract.getTokenUserBalances(
          token.tokenAddress, 
          account
        )
        console.log('balance :', (bal.balance).toString(), ' index ', bal.index.toString());
        balances.push({name: token.name, symbol: token.symbol, balance: bal.balance.toString()});
      }
      
      setBalance(balances); // You may need to declare this state variable as an array
      console.log("end - GetBalances");
    } catch (err) {
      console.log(err.message);
    }
  }
  

  useEffect(() => {
    if (account) {
      getBalances()
    }
  }, [account, tokenPairs, tokenList])

  return (
    <SimpleGrid spacing={4} templateColumns='repeat(auto-fill, minmax(300px, 1fr))'>

    <Card>
      <CardHeader>
        <Heading size='md'> User token balances</Heading>
      </CardHeader>
      <CardBody>
        {balanceState.map((tokenBalance, index) => (
          <Box key={index} p={2} borderWidth={1} borderRadius="md">
            <Heading size="sm">{tokenBalance.name} ({tokenBalance.symbol})</Heading>
            <Text>Balance: {tokenBalance.balance}</Text>
            <Text>Index: {tokenBalance.index}</Text>
          </Box>
        ))}
        <Button mt={3} onClick={() => getBalances()}>Refresh</Button>
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
            <FormLabel>Token</FormLabel>
            <Select
              placeholder='Select token to deposit'
              onChange={e => setDepositToken(e.target.value)}
              value={depositToken}
            >
              {tokenList?.map((token, index) => (
                <option key={index} value={index}>{token.symbol} - {token.name}</option>
              ))}
            </Select>
          </FormControl>

          <Text>Amount : </Text>
          <Input onChange={e => setDepositAmount(e.target.value)} placeholder="Amount to deposit" value={depositAmount} />
          <Button onClick={() => deposit()}>Deposit</Button>
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
            <FormLabel>Token</FormLabel>
            <Select
              placeholder='Select token to withdraw'
              onChange={e => setWithdrawToken(e.target.value)}
              value={withdrawToken}
            >
              {tokenList?.map((token, index) => (
                <option key={index} value={index}>{token.symbol} - {token.name}</option>
              ))}
            </Select>
          </FormControl>
          <Flex direction="column">
            <Text>Amount : </Text>
            <Input onChange={e => setWithdrawAmount(e.target.value)} placeholder="Amount to withdraw" value={WithdrawAmount} />
          </Flex>
          <Button onClick={() => withdraw()}>withdraw</Button>
        </CardBody>
        <CardFooter>
        </CardFooter>
      </Card>

    </SimpleGrid>
  )
}

