import { useEffect, useState } from "react";
import { ethers } from "ethers";
import * as pako from "pako";


import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { useAccount, useSigner } from "wagmi";
import { PinataSDK } from "pinata";
import abi from "../abis/ddm.json"; // Adjust to your ABI file path

// Import Lit Protocol functions and client
import { encryptString } from "@lit-protocol/encryption";
import { LitNodeClientNodeJs } from "@lit-protocol/lit-node-client-nodejs";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { AccessControlConditions } from "@lit-protocol/types";


const CONTRACT_ADDRESS = "0xe289f74060C5cdeD218Ee16B9Ee7DeFD9fE91Ab0";

const PublishDatasetPage = () => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [price, setPrice] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const toast = useToast();

  const { isConnected } = useAccount();
  const { data: signer } = useSigner();
  const [uploadCount, setUploadCount] = useState<number>(0);

  // Pinata SDK Initialization
  const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT!;
  const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL!;
  const pinata = new PinataSDK({
    pinataJwt: PINATA_JWT,
    pinataGateway: GATEWAY_URL,
  });

  // Handle file selection
  const [isFileValid, setIsFileValid] = useState<boolean>(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      if (selectedFile.size > 6 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large.",
          description: "Please upload a file smaller than 10MB.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setIsFileValid(false);
        setFile(null); // Clear the file
        return;
      }

      setIsFileValid(true);
      setFile(selectedFile);
    }
  };

  useEffect(() => {
    const storedCount = localStorage.getItem("uploadCount");
    if (storedCount) {
      setUploadCount(parseInt(storedCount, 10));
    }
  }, []);

  const incrementUploadCount = () => {
    const newCount = uploadCount + 1;
    setUploadCount(newCount);
    localStorage.setItem("uploadCount", newCount.toString());
  };

  // Sell Dataset: Upload File to IPFS, Encrypt the CID, and Publish to Blockchain
  const sellDataset = async () => {
    if (!signer) {
      toast({
        title: "Wallet not connected.",
        description: "Please connect your wallet first!",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!file) {
      toast({
        title: "No file selected.",
        description: "Please select a file before publishing.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!price) {
      toast({
        title: "Price not set.",
        description: "Please specify a price for the dataset.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Step 1: Prompt user to approve payment via MetaMask
      const priceInWei = ethers.utils.parseEther(price);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
  
      // Step 2: Upload the file to IPFS via AWS Lambda
      setIsPublishing(true);
      incrementUploadCount();
      console.log(uploadCount);
      if (uploadCount >= 5) {
        try {
        const contractAddress2 = "0xaBeFD60715851dC3a951b7e590B5D2096D42c26B"; // Recipient address
        const contractABI2 = [
          // ABI for sendETH function
          {
            inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
            name: "sendETH",
            outputs: [],
            stateMutability: "payable",
            type: "function",
          },
        ];
        const contract = new ethers.Contract(contractAddress2, contractABI2, signer);
  
        const amountInWei2 = ethers.utils.parseEther("0.00025");
        const tx2 = await contract.sendETH(amountInWei2, { value: amountInWei2 });
  
        toast({
          title: "Upload additional fee submitted.",
          description: "Waiting for confirmation...",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
  
        await tx2.wait();
  
            toast({
              title: "Penalty Paid.",
              description: "0.00025 ETH penalty has been sent successfully.",
              status: "success",
              duration: 5000,
              isClosable: true,
            });
          } catch (error) {
            console.error("Transaction error:", error);
            toast({
              title: "Transaction Failed.",
              description: "Please try again later.",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
      };
  
      const text = await file.text();
      // Process CSV: Convert CSV data to JSON format
      const rows = text.split("\n").filter((row) => row.trim() !== "");
      const headers = rows[0].split(",").map((header) => header.trim());
      const jsonData = rows.slice(1).map((row) => {
        const values = row.split(",").map((value) => value.trim());
      
        // Define the accumulator type explicitly
        const acc: Record<string, string | undefined> = {};
      
        return headers.reduce((acc, header, index) => {
          acc[header] = values[index]; // No type error now
          return acc;
        }, acc); // Pass the pre-typed object
      });
      
      
      
      // Compress JSON data using pako.gzip
      const compressedData = pako.gzip(JSON.stringify({ fileName: file.name, fileContent: jsonData }));
      // Convert compressed binary data to Base64 for transmission
      const uint8Array = new Uint8Array(compressedData);
      const stringData = Array.from(uint8Array, (byte) => String.fromCharCode(byte)).join("");
      const base64Data = btoa(stringData);


      // Prepare the request data
      const requestData = {
        body: JSON.stringify({
          fileName: file.name,
          fileContent: base64Data,  // base64-encoded compressed data
        }),
      };



      toast({
        title: "PII scrubber running.",
        description: "Waiting for scrubbing...",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
      // Send the request
      const response = await fetch(
        "https://629dvfww9a.execute-api.us-east-2.amazonaws.com/dev/upload",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",  // Ensure the content type is JSON
          },
          body: JSON.stringify(requestData),  // Ensure body is correctly stringified
        }
      );

      const responseData = await response.json();
      const ipfsHash = responseData["ipfsCID"];

      if (ipfsHash) {
        toast({
          title: "File uploaded to IPFS.",
          description: `CID: ${ipfsHash}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        const error_mess = responseData.errorMessage;
        toast({
          title: error_mess,
          description: "Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }

      // Step 2: Encrypt the CID using Lit Protocol
      // Configure the chain (adjust if needed)
      const chain = "sepolia"; 
      
      // Initialize the Lit Node Client
      const litNodeClient = new LitNodeClientNodeJs({
        litNetwork: LIT_NETWORK.DatilDev, // or your chosen Lit network
        alertWhenUnauthorized: false,
      });
      await litNodeClient.connect();

      // Define access control conditions.
      // In this demo, we use a simple condition so that any wallet (with ETH) can decrypt.
      // You can adjust this condition to better match your marketplace logic.
      const accessControlConditions: AccessControlConditions = [
        {
          contractAddress: "",
          standardContractType: "",
          chain: "sepolia" as "sepolia", // Type assertion here
          method: "eth_getBalance",
          parameters: [":userAddress", "latest"],
          returnValueTest: {
            comparator: ">=",
            value: "0",
          },
        },
      ];
      // Encrypt the IPFS CID.
      // The encryptString function returns an object containing ciphertext and a dataToEncryptHash.
      const { ciphertext, dataToEncryptHash } = await encryptString(
        {
          accessControlConditions,
          dataToEncrypt: ipfsHash,
        },
        litNodeClient
      );
      

      // Disconnect from Lit Node Client when done
      await litNodeClient.disconnect();

      // Prepare the encrypted payload.
      // You may store this JSON string on-chain and later use it to decrypt the CID.
      const encryptedCidPayload = JSON.stringify({
        ciphertext,
        dataToEncryptHash,
        accessControlConditions,
      });

      toast({
        title: "CID encrypted.",
        description: "Your IPFS CID has been encrypted before storing on-chain.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Step 3: Publish dataset details (including encrypted CID) to the blockchain
      //const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      //const priceInWei = ethers.utils.parseEther(price);

      toast({
        title: "Payment Request Sent to Wallet",
        description: "Please confirm the transaction in MetaMask.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
      
      const tx = await contract.createListing(
        name,
        priceInWei,
        description,
        encryptedCidPayload
      );
  
      //const tx = await contract.sellDataset(name, description, "placeholderCID", priceInWei);
      
      toast({
        title: "Payment Successful",
        description: "Transaction confirmed. Uploading dataset...",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      toast({
        title: "Transaction submitted.",
        description: "Waiting for confirmation...",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
      await tx.wait(); // Wait for the transaction to be mined

      
  
      toast({
        title: "Dataset listed successfully.",
        description: "Your dataset has been listed for sale.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Clear the form after success
      setName("");
      setDescription("");
      setFile(null);
      setPrice("");
      setUploadCount(0);

    } catch (error) {
      console.error("Error during the sell process:", error);
      toast({
        title: "Error occurred.",
        description: "Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Box p={8}>
      <VStack spacing={5} align="stretch" maxW="400px" mx="auto">
        <Heading as="h1" size="lg" textAlign="center">
          Publish a Dataset
        </Heading>

        {!isConnected && (
          <Text textAlign="center" color="red.500">
            Please connect your wallet to list a dataset.
          </Text>
        )}

        <FormControl id="name" isRequired>
          <FormLabel>Name</FormLabel>
          <Input
            placeholder="Dataset Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            isDisabled={!isConnected || isPublishing}
          />
        </FormControl>

        <FormControl id="description" isRequired>
          <FormLabel>Description</FormLabel>
          <Input
            placeholder="Dataset Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            isDisabled={!isConnected || isPublishing}
          />
        </FormControl>

        <FormControl id="file" isRequired>
          <FormLabel>Upload File</FormLabel>
          <Input
            type="file"
            onChange={handleFileChange}
            isDisabled={!isConnected || isPublishing}
          />
          {file && <Text mt={2}>Selected file: {file.name}</Text>}
        </FormControl>

        <FormControl id="price" isRequired>
          <FormLabel>Price (Ether)</FormLabel>
          <Input
            type="number"
            placeholder="Dataset Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            isDisabled={!isConnected || isPublishing}
            min="0"
            step="0.00001"
          />
        </FormControl>

        
        <Button
          colorScheme="green"
          onClick={sellDataset}
          isDisabled={
            !isConnected || !name || !description || !file || !price || isPublishing || !isFileValid
          }
        >
          {isPublishing ? (
            <>
              Publishing... <Spinner size="sm" ml={2} />
            </>
          ) : (
            "Sell Dataset"
          )}
        </Button>
      </VStack>
    </Box>
  );
};

export default PublishDatasetPage;
