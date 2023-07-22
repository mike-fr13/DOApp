"use client"
import React from 'react'
import { Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react'

export const NotConnected = () => {
  return (
    <Alert status='warning'>
        <AlertIcon />
        Please connect your Wallet.
    </Alert>
  )
}
