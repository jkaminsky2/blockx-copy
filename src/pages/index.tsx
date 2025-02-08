import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useAccount } from "wagmi"; // Import the useAccount hook

const Home: NextPage = () => {
  const { address, isConnected } = useAccount(); // Get the connected address

  return (
    <div className={styles.container}>
      <Head>
        <title>DataX</title>
        <meta name="description" content="DSC180a Project" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to{" "}
          <a href="https://github.com/gchongg/dataX">
            DataX 
          </a>
        </h1>
        <p className={styles.description}>
          Connect your wallet and start playing around!!
        </p>

        {/* Wallet Connect Button */}
        <div className={styles.connectButton}>
          <ConnectButton />
        </div>

        {/* Display Connected Address */}
        {isConnected && (
          <p className={styles.address}>
            Connected Address: <strong>{address}</strong>
          </p>
        )}
      </main>
    </div>
  );
};

export default Home;
