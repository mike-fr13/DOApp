"use client";
import React from "react";
import { Button, Text,  Box, Stack  } from "@chakra-ui/react";
import { EthContext } from "@/context/EthContext";
import { useContext } from "react";
import { EventContext, useEvents } from "@/context/EventContext";
import Link from "next/link";

const admin = () => {
  const { isOwner } = useContext(EthContext);
  const {} = useContext(EventContext);
  return isOwner ? (
    <Box
      minHeight="100vh"
      w="100%"
      p="5"
      display="flex"
      flexDirection="column"
      alignItems={"center"}
    >
      <Stack
        flexDirection={"column"}
        justifyContent={"center"}
        align={"center"}
        gap={10}
        m={20}
        maxWidth={890}
      >

      </Stack>
    </Box>
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
