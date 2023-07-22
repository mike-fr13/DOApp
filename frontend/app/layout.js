"use client";
import { Layout } from "@/components/Layout/Layout";
import { EthProvider } from "@/context/EthContext";
import { EventProvider } from "@/context/EventContext";
import { ChakraProvider } from "@chakra-ui/react";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
            <ChakraProvider>
              <EthProvider>
                <EventProvider>
                    <Layout>
                       {children}
                    </Layout>
                  </EventProvider>
              </EthProvider>
            </ChakraProvider>
      </body>
    </html>
  )
}
