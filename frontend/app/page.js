"use client"
import { Flex, Text, Input, Button ,Tabs,TabList, Tab, TabPanels, TabPanel,} from "@chakra-ui/react"
import { useState, useEffect, useContext } from 'react'

import { EthContext } from '@/context/EthContext';
import { Main } from "@/components/Main/Main"


export default function Home() {

 const { account} = useContext(EthContext);

  return (
    <Flex p="2rem" width="100%" height="85vh" justifyContent="center" alignItems="center" 
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
        bgSize="100%"            
        >
            
        <Main/>
    </Flex>
  )
}
