// src/pages/api/download.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PinataSDK } from 'pinata';

const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
});

const ipfsRegex = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58})$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { hash } = req.query;

  if (!hash || typeof hash !== 'string') {
    return res.status(400).json({ error: 'Data hash is required' });
  }

  // Validate the hash format (if you expect an IPFS CID)
  if (!ipfsRegex.test(hash)) {
    return res.status(400).json({ error: 'Invalid data hash format' });
  }

  try {
    // Fetch the dataset from Pinata
    const { data, contentType } = await pinata.gateways.get(hash);

    // Retrieve the filename from Pinata's file list
    const { files } = await pinata.files.list().cid(hash);
    const filename = files[0].name || 'dataset';

    // Set the proper content type for the response
    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    // Set the Content-Disposition header with the filename so the browser downloads with the original filename
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send the data directly to the client
    res.send(data);
  } catch (error) {
    console.error('Error fetching data from Pinata:', error);
    res.status(500).json({ error: 'Error fetching dataset' });
  }
}
