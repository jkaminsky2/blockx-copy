// src/pages/api/download.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PinataSDK } from 'pinata';

const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { hash } = req.query;
  
  if (!hash || typeof hash !== 'string') {
    return res.status(400).json({ error: 'Data hash is required' });
  }
  
  try {
    // Fetch the dataset from Pinata
    const { data, contentType } = await pinata.gateways.get(hash);
    
    // Set the proper content type for the response
    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    
    // Optionally set a header for file download if needed:
    // res.setHeader('Content-Disposition', 'attachment; filename="dataset"');
    
    // Send the data directly to the client
    res.send(data);
  } catch (error) {
    console.error('Error fetching data from Pinata:', error);
    res.status(500).json({ error: 'Error fetching dataset' });
  }
}
