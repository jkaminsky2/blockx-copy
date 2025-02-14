// src/pages/my-datasets.tsx

import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  Flex,
  Text,
  Button,
  Spinner,
  Stack,
  useToast,
  Badge,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { PinataSDK } from 'pinata';
import abi from '../abis/ddm.json';
import { useLitDecryption } from '../hooks/useLitDecryption'; // Add Lit decryption hook

// Get contract and network settings from environment variables.
const CONTRACT_ADDRESS = ethers.utils.getAddress(
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!
);
const ALCHEMY_API_URL = process.env.NEXT_PUBLIC_ALCHEMY_API_URL!;

// Initialize Pinata (used for file downloads).
const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
});

// Type definitions for the data from the contract.
type DataListing = {
  owner: string;
  title: string;
  price: ethers.BigNumber;
  description: string;
  dataHash: string;
  active: boolean;
};

type Purchase = {
  buyer: string;
  amount: ethers.BigNumber;
  deliveryConfirmed: boolean;
};

type PurchasedDataset = {
  listingId: number;
  purchase: Purchase;
  listing: DataListing;
};

const MyDatasets = () => {
  const [purchasedDatasets, setPurchasedDatasets] = useState<
    PurchasedDataset[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const toast = useToast();
  const { decryptData } = useLitDecryption(); // Add Lit decryption

  // On component mount, connect to the wallet and fetch the user’s purchases.
  useEffect(() => {
    const fetchUserPurchases = async () => {
      if (!window.ethereum) {
        setError('Please install MetaMask');
        return;
      }
      try {
        setLoading(true);

        // Request account access if needed.
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(
          window.ethereum as unknown as ethers.providers.ExternalProvider
        );
        
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);

        // Create contract instance with signer.
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
        // Call the helper function on the contract to get user purchases.
        const [listingIds, purchaseData, listingsData] =
          await contract.getUserPurchases(address);

        // Combine the returned arrays into one list.
        const purchased: PurchasedDataset[] = listingIds.map(
          (id: any, index: number) => ({
            listingId: id.toNumber(),
            purchase: {
              buyer: purchaseData[index].buyer,
              amount: purchaseData[index].amount,
              deliveryConfirmed: purchaseData[index].deliveryConfirmed,
            },
            listing: {
              owner: listingsData[index].owner,
              title: listingsData[index].title,
              price: listingsData[index].price,
              description: listingsData[index].description,
              dataHash: listingsData[index].dataHash,
              active: listingsData[index].active,
            },
          })
        );

        setPurchasedDatasets(purchased);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load your purchases.');
        toast({
          title: 'Error',
          description: 'Failed to load your purchases.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserPurchases();
  }, [toast]);

  // Function to download a dataset file using your API proxy (to avoid CORS issues).
  const downloadDataset = async (dataHash: string) => {
    try {
      const decryptedCid = await decryptData(dataHash);
      const response = await fetch(`/api/download?hash=${decryptedCid}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dataset from server.');
      }

      // Extract filename from headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'dataset';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch?.[1]) filename = filenameMatch[1];
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Successful',
        description: 'Dataset downloaded successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error downloading dataset:', error);
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Could not download dataset',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Optionally, allow the user to confirm delivery if they haven't already.
  // This will call the contract's confirmDelivery function.
  const confirmDelivery = async (listingId: number) => {
    try {
      if (!window.ethereum) throw new Error('Please install MetaMask');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as unknown as ethers.providers.ExternalProvider
      );
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      const tx = await contract.confirmDelivery(listingId);
      await tx.wait();
      toast({
        title: 'Delivery Confirmed',
        description: 'Funds released to the seller.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      // Refresh the page or update state to reflect the new delivery status.
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={8} minH="100vh" bg="gray.50">
      <VStack spacing={4} align="stretch">
        <Text fontSize="2xl" fontWeight="bold">
          My Purchased Datasets
        </Text>
        {loading ? (
          <Spinner />
        ) : error ? (
          <Text color="red.500">{error}</Text>
        ) : purchasedDatasets.length === 0 ? (
          <Text>You have not purchased any datasets yet.</Text>
        ) : (
          purchasedDatasets.map((dataset) => (
            <Box
              key={dataset.listingId}
              p={4}
              bg="white"
              borderRadius="md"
              boxShadow="md"
            >
              <Flex justify="space-between" align="center">
                <Text fontSize="xl" fontWeight="bold">
                  {dataset.listing.title}
                </Text>
                <Badge colorScheme="green">
                  {ethers.utils.formatEther(dataset.listing.price)} ETH
                </Badge>
              </Flex>
              <Text color="gray.600" mt={2}>
                {dataset.listing.description}
              </Text>
              <Stack mt={4} direction="row" spacing={4}>
                <Button
                  size="sm"
                  onClick={() =>
                    downloadDataset(dataset.listing.dataHash)
                  }
                >
                  Download
                </Button>
                {!dataset.purchase.deliveryConfirmed && (
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() =>
                      confirmDelivery(dataset.listingId)
                    }
                  >
                    Confirm Delivery
                  </Button>
                )}
              </Stack>
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
};

export default MyDatasets;
