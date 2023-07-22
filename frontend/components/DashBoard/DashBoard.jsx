"use client"
import { SimpleGrid,Card,CardHeader,CardBody,CardFooter,Heading,Button,Text} from "@chakra-ui/react"
import { useEffect } from "react"

export const DashBoard = () => {
  
  return (
  <Card>
    <CardHeader>
      <Heading size='md'> Customer dashboard</Heading>
    </CardHeader>
    <CardBody>
      <Text>MAX : </Text>
      <Text>Balance : </Text>      
      <Button onclick=""> SET </Button>
      <Text>View a summary of all your customers over the last month.</Text>
    </CardBody>
    <CardFooter>
      <Button>View here</Button>
    </CardFooter>
  </Card>
  )
}

