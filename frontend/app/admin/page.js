"use client";
import React from "react";
import { Button, Text, Box, Stack, Flex } from "@chakra-ui/react";
import { EthContext } from "@/context/EthContext";
import { useContext } from "react";
import { EventContext, useEvents } from "@/context/EventContext";
import { MainAdmin } from "../../components/MainAdmin/MainAdmin"
import Link from "next/link";

const admin = () => {
  const { isOwner } = useContext(EthContext);
  const { } = useContext(EventContext);
  return isOwner ? (
      <Flex p="2rem" width="100%" height="85vh" justifyContent="center" alignItems="center"
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
        bgSize="100%"
      >
        <MainAdmin />
      </Flex>
  ) : (
    <Stack height={"80vh"} alignItems={"center"} justifyContent={"center"}>
      <Text fontWeight={"bold"}>
        Sorry only the owner can access this page !
      </Text>
      <Button px="3" py="2" rounded="md" bg="red.400" hover="red.600">
        <Link href="/">Get back to Home page !</Link>
      </Button>
    </Stack>
  );
};

export default admin;
