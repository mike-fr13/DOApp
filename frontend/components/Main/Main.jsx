"use client"
import { Flex, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react"
import { DashBoard } from "../DashBoard/DashBoard"
import { DCAConfigList } from "../DCAConfigList/DCAConfigList"
import { TokenPairList } from "../TokenPairList/TokenPairList"
import { History } from "../History/History"
import { Simulation } from "../Simulation/Simulation"
import { EthContext } from '@/context/EthContext';

import { useState, useEffect, useContext } from 'react'


export const Main = () => { 
    const { account} = useContext(EthContext);

    return (
        <Flex p="1rem" width="100%" height="85vh" justifyContent="center" alignItems="center" 
            backgroundPosition="center"
            backgroundRepeat="no-repeat"
            bgSize="100%"            
            >
            {account ? (
                <Flex direction="column" width="100%" height="700px">
                    <Tabs variant='enclosed' width="100%">
                    <TabList>
                        <Tab>DashBoard</Tab>
                        <Tab>DCA configurations</Tab>
                        <Tab>Token Pair</Tab>
                        <Tab>History</Tab>
                        <Tab>Simulation</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            <DashBoard/>
                        </TabPanel>
                        <TabPanel>
                            <DCAConfigList />
                        </TabPanel>
                        <TabPanel>
                            <TokenPairList />
                        </TabPanel>
                        <TabPanel>
                            <History />
                        </TabPanel>
                        <TabPanel>
                            <Simulation />
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
