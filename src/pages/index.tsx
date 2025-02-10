import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { useAccount } from "wagmi";

import filters_img from "../assets/filters.png";
import backend_img from "../assets/backend_example.png";
import buy_img from "../assets/buy_transact.png";
import catalog_img from "../assets/catalog_page.png";
import datasets_img from "../assets/datasets_example.png";
import buying_data_img from "../assets/datasets_buy.png";
import sell_info_img from "../assets/sell_info_data.png";
import publish_img from "../assets/publish_page.png";
import pii_img from "../assets/redacted_pii.png";
import fee_img from "../assets/pay_fee.png";
import ipfs_img from "../assets/ipfs_chunk.png";
import sell_img from "../assets/ads_result.png";
import solo_sc_img from "../assets/solo_sc.jpeg";

const Home: NextPage = () => {
  const { address, isConnected } = useAccount();

  return (
    <div className={styles.container}>
      <Head>
        <title>BlockX</title>
        <meta name="description" content="DSC180 Project" />
      </Head>

      <h1 className={styles.title}>
        Welcome to <a href="https://github.com/gchongg/blockX">BlockX</a>
      </h1>

      <main className={styles.main}>
        <p className={styles.smalltext}>
          An innovative, blockchain-powered solution for exchanging data and code
        </p>

        <p className={styles.header}>How does it work?</p>

        <div className={styles.buttonContainer}>
          <a href="#buyText" className={styles.button}>
            <button className={styles.button}>Buying Data</button>
          </a>
          <a href="#sellText" className={styles.button}>
            <button className={styles.button}>Selling Data</button>
          </a>
        </div>

        <div id="buyText" className={styles.targetText}>
          <p className={styles.header}>Buy Data</p>
          <div className={styles.buttonContainer}>
            <button className={styles.button}>Text Version</button>
          </div>
        </div>
        <br />

        <div className="card-container">
          <div className={styles.card}>
            <p>
              Navigate to the <a href="https://data-x-delta.vercel.app/catalog">Catalog</a>
            </p>
            <header>
              This contains every dataset part of the marketplace; this is paired with a description and the price of the dataset.
            </header>
            <Image src={catalog_img} alt="Catalog" width={500} height={40} />
            <Image src={datasets_img} alt="datasets" width={250} height={200} />
          </div>

          <div className={styles.card}>
            <p>Backend blockchain querying</p>
            <h3>
              Backend blockchain querying occurs to get all dataset offerings within the marketplace.
            </h3>
            <Image src={backend_img} alt="backend query" width={170} height={250} />
          </div>

          <div className={styles.card}>
            <p>Data Description</p>
            <h3>
              Fill out relevant information regarding the data and click &quot;Sell Dataset&quot;. A more thorough description is likely to lead to more purchases.
            </h3>
            <Image src={sell_info_img} alt="dataset info" width={350} height={250} />
          </div>

          <div className={styles.card}>
            <p>Backend Smart Contract Execution</p>
            <h3>
              To add the data to the marketplace, execute the smart contract by clicking on the blue &quot;Confirm&quot; button. Before the data is added to the marketplace, however, a couple of steps need to occur.
            </h3>
            <Image src={fee_img} alt="Smart contract execute" width={350} height={220} />
          </div>
        </div>
      </main>

      {/* Footer */}
      {!isConnected && (
        <footer className={styles.footer}>
          {/* Wallet Connect Button */}
          <div className={styles.connectButton}>
            <ConnectButton />
          </div>
        </footer>
      )}
    </div>
  );
};

export default Home;
