// src/hooks/usePurchaseStatus.ts
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from '../abis/ddm.json';

const usePurchaseStatus = (
  datasetId: number,
  refreshTrigger: number,
  accountAddress?: string  // IMPORTANT: This is the optional parameter
) => {
  const [purchased, setPurchased] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    const checkPurchaseStatus = async () => {
      // If no wallet is connected, skip the purchase check.
      if (!accountAddress) {
        setStatusLoading(false);
        return;
      }
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
          abi,
          provider
        );
        const hasPurchased = await contract.hasPurchased(accountAddress, datasetId);
        setPurchased(hasPurchased);
      } catch (err) {
        console.error('Error checking purchase status:', err);
      } finally {
        setStatusLoading(false);
      }
    };

    checkPurchaseStatus();
  }, [datasetId, refreshTrigger, accountAddress]);

  return { purchased, statusLoading };
};

export default usePurchaseStatus;