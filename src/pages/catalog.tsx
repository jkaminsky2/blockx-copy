import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Flex,
  Button,
  Text,
  Badge,
  Divider,
  Stack,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { FaDatabase, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { ethers } from 'ethers';
import { PinataSDK } from 'pinata';
import abi from '../abis/ddm.json';

type Dataset = {
  id: number;
  title: string;
  owner: string;
  description: string;
  dataHash: string;
  price: string;
  active: boolean;
};

const CONTRACT_ADDRESS = ethers.utils.getAddress(
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!
);
const ALCHEMY_API_URL = process.env.NEXT_PUBLIC_ALCHEMY_API_URL!;
const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
});

const ListView = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listingCount, setListingCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isBuying, setIsBuying] = useState<{ [key: number]: boolean }>({});
  // This state will force DatasetCard to re-check purchase status when updated.
  const [refreshPurchaseStatus, setRefreshPurchaseStatus] = useState(0);
  const toast = useToast();

  // Fetch the total listing count on mount.
  useEffect(() => {
    const fetchListingCount = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_API_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
        const count = await contract.listingCount();
        setListingCount(count.toNumber());
        setTotalPages(Math.ceil(count.toNumber() / 10));
      } catch (err) {
        console.error('Error fetching listing count:', err);
        setError('Failed to fetch listing count.');
      }
    };
    fetchListingCount();
  }, []);

  // Fetch the listings for the current page.
  useEffect(() => {
    const fetchListings = async () => {
      if (listingCount === 0) return;

      try {
        setLoading(true);
        setError(null);
        const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_API_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

        const startId = (currentPage - 1) * 10 + 1;
        const endId = Math.min(currentPage * 10, listingCount);

        const listingPromises = [];
        for (let id = startId; id <= endId; id++) {
          listingPromises.push(contract.listings(id));
        }

        const listingDetails = await Promise.all(listingPromises);

        const formattedDatasets: Dataset[] = listingDetails
          .map((listing, index) => ({
            id: startId + index,
            title: listing.title,
            owner: listing.owner,
            description: listing.description,
            dataHash: listing.dataHash,
            price: ethers.utils.formatEther(listing.price),
            active: listing.active,
          }))
          .filter((dataset) => dataset.active); // Only show active listings

        setDatasets(formattedDatasets);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to fetch listings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [currentPage, listingCount]);

// Handles purchasing a dataset.
const handleBuyDataset = async (listingId: number, priceInEth: string) => {
  try {
    setIsBuying((prev) => ({ ...prev, [listingId]: true }));

    if (!window.ethereum) {
      throw new Error('Please install MetaMask!');
    }

    // Connect to MetaMask.
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(
      window.ethereum as unknown as ethers.providers.ExternalProvider
    );
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    // Convert price to wei.
    const priceWei = ethers.utils.parseEther(priceInEth);

    // Execute the purchase transaction.
    const tx = await contract.purchaseData(listingId, { value: priceWei });
    await tx.wait();

    // Automatically download the dataset after purchase.
    const dataset = datasets.find((d) => d.id === listingId);
    if (dataset) {
      await downloadDataset(dataset.dataHash);
    }

    toast({
      title: 'Purchase Successful',
      description: 'Dataset purchased and downloaded successfully!',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });

    // Force a refresh of purchase status in DatasetCard components.
    setRefreshPurchaseStatus((prev) => prev + 1);
  } catch (error: any) {
    // Check if the error is due to the user rejecting the transaction.
    if (
      error.code === 4001 ||
      error.code === 'ACTION_REJECTED' ||
      (error.message && error.message.toLowerCase().includes('user rejected'))
    ) {
      console.log('Transaction cancelled by user.');
      toast({
        title: 'Transaction Cancelled',
        description: 'You cancelled the transaction.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return; // Exit early; no need to show a purchase failed error.
    }

    console.error('Purchase failed:', error);
    toast({
      title: 'Purchase Failed',
      description:
        error instanceof Error ? error.message : 'Transaction rejected',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  } finally {
    setIsBuying((prev) => ({ ...prev, [listingId]: false }));
  }
};


  // Downloads the dataset from Pinata.
  const downloadDataset = async (dataHash: string) => {
    try {
      if (!dataHash) throw new Error('Data hash cannot be empty');
      
      // Fetch from your own API endpoint
      const response = await fetch(`/api/download?hash=${dataHash}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dataset from server.');
      }
      
      // Read the data as a blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dataset'; // Adjust the filename if needed.
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading dataset:', error);
      toast({
        title: 'Download Failed',
        description:
          error instanceof Error ? error.message : 'Could not download dataset',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      w="100%"
      minH="100vh"
      bg="gray.50"
      p={8}
      pb={24} // Extra bottom padding so pagination isn't blocked.
      overflowX="hidden"
    >
      <VStack spacing={0} align="stretch" w="100%">
        {loading ? (
          <Text textAlign="center">Loading datasets...</Text>
        ) : error ? (
          <Text color="red.500" textAlign="center">
            {error}
          </Text>
        ) : (
          <>
            {datasets.map((dataset) => (
              <React.Fragment key={dataset.id}>
                <DatasetCard
                  dataset={dataset}
                  handleBuyDataset={handleBuyDataset}
                  downloadDataset={downloadDataset}
                  isBuying={isBuying[dataset.id]}
                  refreshPurchaseStatus={refreshPurchaseStatus}
                />
                <Divider borderColor="gray.200" />
              </React.Fragment>
            ))}
            {/* Pagination Controls */}
            <Flex justify="center" mt={4}>
              <Button
                onClick={() =>
                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                }
                isDisabled={currentPage === 1}
                mr={2}
              >
                <FaChevronLeft />
              </Button>
              <Text alignSelf="center">
                Page {currentPage} of {totalPages}
              </Text>
              <Button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                isDisabled={currentPage === totalPages}
                ml={2}
              >
                <FaChevronRight />
              </Button>
            </Flex>
          </>
        )}
      </VStack>
    </Box>
  );
};

type DatasetCardProps = {
  dataset: Dataset;
  handleBuyDataset: (listingId: number, priceInEth: string) => void;
  downloadDataset: (dataHash: string) => void;
  isBuying: boolean;
  refreshPurchaseStatus: number;
};

const DatasetCard = ({
  dataset,
  handleBuyDataset,
  downloadDataset,
  isBuying,
  refreshPurchaseStatus,
}: DatasetCardProps) => {
  const [purchased, setPurchased] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  // Check purchase status when the component mounts and whenever refreshPurchaseStatus changes.
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!window.ethereum) {
        setStatusLoading(false);
        return;
      }
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(
          window.ethereum as unknown as ethers.providers.ExternalProvider
        );
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          abi,
          signer
        );
        const userAddress = await signer.getAddress();
        const hasPurchased = await contract.hasPurchased(userAddress, dataset.id);
        setPurchased(hasPurchased);
      } catch (err) {
        console.error('Error checking purchase status:', err);
      } finally {
        setStatusLoading(false);
      }
    };

    checkPurchaseStatus();
  }, [dataset.id, refreshPurchaseStatus]);

  return (
    <Box
      p={8}
      borderRadius="xl"
      bg="white"
      boxShadow="base"
      transition="all 0.3s"
      _hover={{ bg: 'gray.100' }}
    >
      <Flex align="start">
        <Icon as={FaDatabase} boxSize={10} color="blue.600" mr={4} />
        <Stack spacing={3} flex="1">
          <Flex justify="space-between" align="center">
            <Text fontSize="xl" fontWeight="bold">
              {dataset.title}
            </Text>
            <Badge colorScheme="green" fontSize="0.9em">
              {dataset.price} ETH
            </Badge>
          </Flex>
          <Text color="blue.500" fontWeight="medium">
            {dataset.owner}
          </Text>
          <Text noOfLines={2} color="gray.700">
            {dataset.description}
          </Text>
          {statusLoading ? (
            <Text>Loading status...</Text>
          ) : purchased ? (
            <Button
              mt={2}
              colorScheme="teal"
              size="sm"
              onClick={() => downloadDataset(dataset.dataHash)}
            >
              Download Dataset
            </Button>
          ) : (
            <Button
              mt={2}
              colorScheme="blue"
              size="sm"
              onClick={() =>
                handleBuyDataset(dataset.id, dataset.price)
              }
              isLoading={isBuying}
              loadingText="Processing..."
            >
              Buy Dataset
            </Button>
          )}
        </Stack>
      </Flex>
    </Box>
  );
};

export default ListView;
