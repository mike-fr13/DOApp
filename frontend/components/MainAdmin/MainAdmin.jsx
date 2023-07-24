"use client"
import { Flex, Tab, TabList, TabPanel, TabPanels, Tabs, Text ,Heading} from "@chakra-ui/react"
import { AdminDashBoard } from "../AdminDashBoard/AdminDashBoard"
import { TokenPairList } from "../TokenPairList/TokenPairList"
import {AdminDCAHistory} from "../AdminDCAHistory/AdminDCAHistory"
import { EthContext } from '@/context/EthContext';

import { useState, useEffect, useContext } from 'react'


export const MainAdmin = () => { 
    const { account} = useContext(EthContext);

    return (
        <Flex p="1" width="100%" height="85vh" justifyContent="center" alignItems="center" 
            backgroundPosition="center"
            backgroundRepeat="no-repeat"
            bgSize="100%"            
            >
            {account ? (
                <Flex direction="column" width="100%" height="700px" alignItems="start">
                    <Heading color="red">Administration page</Heading>
                    <Tabs variant='enclosed' width="100%">
                    <TabList>
                        <Tab>DashBoard</Tab>
                        <Tab>Token Pair</Tab>
                        <Tab>DCA history</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            <AdminDashBoard/>
                        </TabPanel>
                        <TabPanel>
                            <TokenPairList />
                        </TabPanel>
                        <TabPanel>
                            <AdminDCAHistory />
                        </TabPanel>
                    </TabPanels>
                    </Tabs>

                </Flex>
            ) : (
                <Flex p="2rem" justifyContent="center" alignItems="center">
                    <Text fontSize='4xl'>Please connect your Wallet.</Text>
                </Flex>
            )}
        </Flex>
    )
}
