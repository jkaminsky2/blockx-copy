// src/hooks/useListings.ts
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from '../abis/ddm.json';

export type Dataset = {
  id: number;
  title: string;
  owner: string;
  description: string;
  dataHash: string;
  price: string;
  active: boolean;
};

const useListings = (
  currentPage: number,
  listingCount: number,
  alchemyUrl: string,
  contractAddress: string
) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      if (listingCount === 0) return;
      try {
        setLoading(true);
        setError(null);
        const provider = new ethers.providers.JsonRpcProvider(alchemyUrl);
        const contract = new ethers.Contract(contractAddress, abi, provider);

        const startId = (currentPage - 1) * 10 + 1;
        const endId = Math.min(currentPage * 10, listingCount);

        const listingPromises = [];
        for (let id = startId; id <= endId; id++) {
          listingPromises.push(contract.listings(id));
        }
        const listingDetails = await Promise.all(listingPromises);

        const formattedDatasets: Dataset[] = listingDetails
          .map((listing: any, index: number) => ({
            id: startId + index,
            title: listing.title,
            owner: listing.owner,
            description: listing.description,
            dataHash: listing.dataHash,
            price: ethers.utils.formatEther(listing.price),
            active: listing.active,
          }))
          .filter((dataset) => dataset.active);

        setDatasets(formattedDatasets);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to fetch listings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [currentPage, listingCount, alchemyUrl, contractAddress]);

  return { datasets, loading, error };
};

export default useListings;
