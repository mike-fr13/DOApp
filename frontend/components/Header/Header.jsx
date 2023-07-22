"use client";
import React from "react";
import MetamaskButton from "../MetamaskButton/index";
import AdminButton from "../AdminButton";
import { Flex, Spacer, Stack, Text } from "@chakra-ui/react";

export const Header = () => {
  return (
    <Flex width={"100%"} mb={10}>
      <Text ml={10} fontSize={28} fontWeight={"bold"}>
        DOApp Dapp
      </Text>
      <Spacer />
      <Stack direction={"row"} alignItems={"center"}>
        <AdminButton />
        <MetamaskButton />
      </Stack>
    </Flex>
  );
};

export default Header;
