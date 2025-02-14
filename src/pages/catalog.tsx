// src/pages/catalog.tsx
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
  Skeleton,
  Spinner,
  Tooltip,
} from '@chakra-ui/react';
import { FaDatabase, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { ethers } from 'ethers';
import useListings, { Dataset } from '../hooks/useListings';
import usePurchaseStatus from '../hooks/usePurchaseStatus';
import { useLitDecryption } from '../hooks/useLitDecryption';
import abi from '../abis/ddm.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const ALCHEMY_API_URL = process.env.NEXT_PUBLIC_ALCHEMY_API_URL!;
const ITEMS_PER_PAGE = 10;

const ListView: React.FC = () => {
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [listingCount, setListingCount] = useState(0);
  // Used to trigger refresh of purchase status in child components.
  const [refreshPurchaseStatus, setRefreshPurchaseStatus] = useState(0);
  // Store the connected wallet address.
  const [userAddress, setUserAddress] = useState<string | null>(null);

  // Function to connect the wallet.
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: 'Wallet not found',
        description: 'Please install a wallet like Rainbow or MetaMask.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setUserAddress(accounts[0]);
        setRefreshPurchaseStatus((prev) => prev + 1);
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast({
        title: 'Error connecting wallet',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // On mount, check for a connected wallet and listen for account changes.
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
            setUserAddress(accounts[0]);
            setRefreshPurchaseStatus((prev) => prev + 1);
        } else {
            setUserAddress(null);
        }
    };

    if (window.ethereum) {
        (window.ethereum as any).on('accountsChanged', handleAccountsChanged); // Type assertion

        return () => {
            (window.ethereum as any).removeListener('accountsChanged', handleAccountsChanged); // Type assertion
        };
    }

    return () => {
        // No need to remove listener if ethereum was never defined.  Just return.
    };
}, []);

  // Fetch total listing count.
  useEffect(() => {
    const fetchListingCount = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_API_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
        const count = await contract.listingCount();
        setListingCount(count.toNumber());
      } catch (err) {
        console.error('Error fetching listing count:', err);
        toast({
          title: 'Error',
          description: 'Could not load listing count.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    fetchListingCount();
  }, [toast]);

  // Get listings via custom hook.
  const { datasets, loading, error } = useListings(
    currentPage,
    listingCount,
    ALCHEMY_API_URL,
    CONTRACT_ADDRESS
  );

  // Purchase a dataset.
  const handleBuyDataset = async (listingId: number, priceInEth: string) => {
    if (!userAddress) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      const priceWei = ethers.utils.parseEther(priceInEth);
      const tx = await contract.purchaseData(listingId, { value: priceWei });
      await tx.wait();
      toast({
        title: 'Purchase Successful',
        description: 'Dataset purchased successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setRefreshPurchaseStatus((prev) => prev + 1);
    } catch (error: any) {
      if (
        error.code === 4001 ||
        error.code === 'ACTION_REJECTED' ||
        (error.message && error.message.toLowerCase().includes('user rejected'))
      ) {
        toast({
          title: 'Transaction Cancelled',
          description: 'You cancelled the transaction.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      console.error('Purchase failed:', error);
      toast({
        title: 'Purchase Failed',
        description: error instanceof Error ? error.message : 'Transaction rejected',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box w="100%" minH="100vh" bg="gray.50" p={8} pb={24} overflowX="hidden">
      <VStack spacing={4} align="stretch" w="100%">
        {/* Show a connect wallet banner if no wallet is connected */}
        {!userAddress && (
          <Box mb={4} textAlign="center">
            <Text mb={2}>Please connect your wallet to view your purchased datasets.</Text>
            <Button onClick={connectWallet}>Connect Wallet</Button>
          </Box>
        )}

        {loading ? (
          <VStack spacing={4}>
            <Skeleton height="80px" width="100%" />
            <Skeleton height="80px" width="100%" />
            <Skeleton height="80px" width="100%" />
          </VStack>
        ) : error ? (
          <Text color="red.500" textAlign="center">
            {error}
          </Text>
        ) : (
          <>
            {datasets.map((dataset: Dataset) => (
              <React.Fragment key={dataset.id}>
                <DatasetCard
                  dataset={dataset}
                  handleBuyDataset={handleBuyDataset}
                  refreshPurchaseStatus={refreshPurchaseStatus}
                  userAddress={userAddress}
                  connectWallet={connectWallet}
                />
                <Divider borderColor="gray.200" />
              </React.Fragment>
            ))}
            {/* Pagination Controls */}
            <Flex justify="center" mt={4}>
              <Tooltip label={currentPage === 1 ? 'Already on the first page' : ''}>
                <Button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  isDisabled={currentPage === 1}
                  mr={2}
                >
                  <FaChevronLeft />
                </Button>
              </Tooltip>
              <Text alignSelf="center">
                Page {currentPage} of {Math.ceil(listingCount / ITEMS_PER_PAGE)}
              </Text>
              <Tooltip
                label={
                  currentPage === Math.ceil(listingCount / ITEMS_PER_PAGE)
                    ? 'Already on the last page'
                    : ''
                }
              >
                <Button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, Math.ceil(listingCount / ITEMS_PER_PAGE))
                    )
                  }
                  isDisabled={currentPage === Math.ceil(listingCount / ITEMS_PER_PAGE)}
                  ml={2}
                >
                  <FaChevronRight />
                </Button>
              </Tooltip>
            </Flex>
          </>
        )}
      </VStack>
    </Box>
  );
};

interface DatasetCardProps {
  dataset: Dataset;
  handleBuyDataset: (listingId: number, priceInEth: string) => void;
  refreshPurchaseStatus: number;
  userAddress: string | null;
  connectWallet: () => Promise<void>;
}

const DatasetCard: React.FC<DatasetCardProps> = ({
  dataset,
  handleBuyDataset,
  refreshPurchaseStatus,
  userAddress,
  connectWallet,
}) => {
  const toast = useToast();
  const { decryptData } = useLitDecryption();

  // If a wallet is connected, check purchase status.
  const { purchased, statusLoading } = usePurchaseStatus(dataset.id, refreshPurchaseStatus, userAddress ?? undefined);

  // Function to download dataset (decrypts the data hash first).
  const downloadDataset = async () => {
    try {
      const decryptedCid = await decryptData(dataset.dataHash);
      console.log('Decrypted CID:', decryptedCid);
      const response = await fetch(`/api/download?hash=${decryptedCid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dataset from server.');
      }
      console.log(response);
  
      // Parse the Content-Disposition header to extract the filename
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'dataset';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
  
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename; // Use the filename from the header
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

  // Render the appropriate action button.
  const renderActionButton = () => {
    if (!userAddress) {
      return (
        <Button mt={2} colorScheme="blue" size="sm" onClick={connectWallet}>
          Connect Wallet
        </Button>
      );
    }
    if (statusLoading) {
      return <Spinner size="sm" mt={2} />;
    }
    if (purchased) {
      return (
        <Button mt={2} colorScheme="teal" size="sm" onClick={downloadDataset}>
          Download Dataset
        </Button>
      );
    }
    return (
      <Button mt={2} colorScheme="blue" size="sm" onClick={() => handleBuyDataset(dataset.id, dataset.price)}>
        Buy Dataset
      </Button>
    );
  };

  return (
    <Box p={8} borderRadius="xl" bg="white" boxShadow="base" transition="all 0.3s" _hover={{ bg: 'gray.100' }}>
      <Flex align="start">
        <Box mr={4}>
          <FaDatabase size={40} color="blue.600" />
        </Box>
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
          <Text noOfLines={1} color="gray.700">
            {dataset.description}
          </Text>
          {renderActionButton()}
        </Stack>
      </Flex>
    </Box>
  );
};

export default ListView;
