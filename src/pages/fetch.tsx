import { useState } from "react";
import { Button, Box, Input } from "@chakra-ui/react";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL!,
});

const DownloadFile: React.FC = () => {
  const [cid, setCid] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const downloadFile = async () => {
    try {
      if (!cid) {
        throw new Error("CID cannot be empty");
      }

      setLoading(true);

      // Fetching the file using Pinata SDK for private files
      const { data, contentType } = await pinata.gateways.get(cid);

      // Converting data to a string before creating a Blob if needed
      const dataString = typeof data === "string" ? data : JSON.stringify(data);
      const blob = new window.Blob([dataString], { type: contentType || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "downloaded-file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the file:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box textAlign="center" mt={4}>
      <Input
        placeholder="Enter CID"
        value={cid}
        onChange={(e) => setCid(e.target.value)}
        mb={4}
      />
      <Button onClick={downloadFile} isLoading={loading} loadingText="Downloading..." colorScheme="teal" disabled={!cid}>
        Download File
      </Button>
    </Box>
  );
};

export default DownloadFile;
