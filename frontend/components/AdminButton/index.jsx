'use client'
import React, { useContext } from 'react';
import { EthContext } from '@/context/EthContext';
import { Button } from '@chakra-ui/react';
import { Link } from '@chakra-ui/react';


const AdminButton = () => {
  const { isOwner} = useContext(EthContext);

  return (
    isOwner ? (
        <Button
            px='3'
            py='2'
            rounded='md'
            bg={location.pathname === '/' ? ('red.400') :('blue.400')}
            hover={location.pathname === '/' ? ('red.600') :('blue.600')}
            >
            {location.pathname === '/admin' ? (
                <Link href="/">Go to Home page</Link>
                ) : (
                    <Link href="/admin">Go to Admin page</Link>
                )
            }
        </Button>
    ) : (
        <></>
    )
    );
};

export default AdminButton;
