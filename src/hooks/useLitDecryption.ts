// src/hooks/useLitDecryption.ts
import { decryptToString } from '@lit-protocol/encryption';
import { LitNodeClientNodeJs } from '@lit-protocol/lit-node-client-nodejs';
import { LIT_NETWORK } from '@lit-protocol/constants';
import * as LitJsSdk from '@lit-protocol/lit-node-client';


export const useLitDecryption = () => {
  const getAuthSig = async (chain: string) => {
    try {
      const authSig = await LitJsSdk.checkAndSignAuthMessage({ 
        chain,
        nonce: "randomnonce" });
      if (!authSig || !authSig.sig) {
        throw new Error('authSig is required – no valid signature was returned.');
      }
      return authSig;
    } catch (error) {
      console.error('Error generating authSig:', error);
      throw error;
    }
  };

  const decryptData = async (encryptedDataHash: string) => {
    try {
      if (!encryptedDataHash) throw new Error('Data hash cannot be empty');

      // Parse and validate the JSON payload
      let payload;
      try {
        payload = JSON.parse(encryptedDataHash);
      } catch (e) {
        throw new Error('Malformed encrypted data payload');
      }
      const { ciphertext, dataToEncryptHash, accessControlConditions } = payload;

      const chain = 'sepolia';
      const litNodeClient = new LitNodeClientNodeJs({
        litNetwork: LIT_NETWORK.DatilDev,
        alertWhenUnauthorized: false,
      });
      await litNodeClient.connect();

      const authSig = await getAuthSig(chain);

      const decryptedCid = await decryptToString(
        {
          accessControlConditions,
          ciphertext,
          dataToEncryptHash,
          chain,
          authSig,
        },
        litNodeClient
      );

      await litNodeClient.disconnect();
      return decryptedCid;
    } catch (error) {
      console.error('Error during decryption:', error);
      throw error;
    }
  };

  return { decryptData };
};
