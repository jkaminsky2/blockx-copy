import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import {
  Box,
  VStack,
  Text,
  Spinner,
  Button,
  Flex,
  Badge,
  useToast,
} from '@chakra-ui/react';
import abi from '../abis/ddm.json';

// Make sure your environment variables are set.
const CONTRACT_ADDRESS = ethers.utils.getAddress(
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!
);
const ALCHEMY_API_URL = process.env.NEXT_PUBLIC_ALCHEMY_API_URL!;

// Type for a listing as defined in the contract.
type DataListing = {
  owner: string;
  title: string;
  price: ethers.BigNumber;
  description: string;
  dataHash: string;
  active: boolean;
};

// Type for a listing combined with performance metrics.
type ListingWithMetrics = {
  id: number;
  listing: DataListing;
  purchaseCount: number;
};

const MyListedDatasets = () => {
  const [listings, setListings] = useState<ListingWithMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const toast = useToast();

  useEffect(() => {
    const fetchMyListings = async () => {
      if (!window.ethereum) {
        setError('Please install MetaMask');
        return;
      }
      try {
        setLoading(true);
        // Request account access.
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);

        // Create a read-only contract instance.
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

        // Get the total number of listings.
        const totalListingsBN = await contract.listingCount();
        const totalListings = totalListingsBN.toNumber();

        const myListings: ListingWithMetrics[] = [];

        // Loop over each listing (IDs are assumed to be sequential and starting at 1).
        for (let i = 1; i <= totalListings; i++) {
          // Get the listing details.
          const listing: DataListing = await contract.listings(i);
          // Check if the listing belongs to the current user.
          if (listing.owner.toLowerCase() === address.toLowerCase()) {
            // Get the purchase count for this listing.
            const purchaseCountBN = await contract.purchaseCounts(i);
            myListings.push({
              id: i,
              listing,
              purchaseCount: purchaseCountBN.toNumber(),
            });
          }
        }

        setListings(myListings);
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch your listings.');
        toast({
          title: 'Error',
          description: 'Failed to fetch your listings.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMyListings();
  }, [toast]);

  return (
    <Box p={8} minH="100vh" bg="gray.50">
      <VStack spacing={4} align="stretch">
        <Text fontSize="2xl" fontWeight="bold">
          My Listed Datasets
        </Text>
        {loading ? (
          <Spinner />
        ) : error ? (
          <Text color="red.500">{error}</Text>
        ) : listings.length === 0 ? (
          <Text>You have not listed any datasets yet.</Text>
        ) : (
          listings.map((item) => (
            <Box
              key={item.id}
              p={4}
              bg="white"
              borderRadius="md"
              boxShadow="md"
            >
              <Flex justify="space-between" align="center">
                <Text fontSize="xl" fontWeight="bold">
                  {item.listing.title}
                </Text>
                <Badge colorScheme="green">
                  {ethers.utils.formatEther(item.listing.price)} ETH
                </Badge>
              </Flex>
              <Text mt={2}>{item.listing.description}</Text>
              <Flex mt={2} justify="space-between" align="center">
                <Text>
                  Purchases: <strong>{item.purchaseCount}</strong>
                </Text>
                <Button size="sm" colorScheme="blue">
                  View Details
                </Button>
              </Flex>
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
};

export default MyListedDatasets;
