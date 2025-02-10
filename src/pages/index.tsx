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
  const { address, isConnected } = useAccount(); // Get the connected address

  return (
    <div className={styles.container}>
      <Head>
        <title>BlockX</title>
        <meta name="description" content="DSC180 Project" />
      </Head>

      <h1 className={styles.title}>
        Welcome to{" "}
        <a href="https://github.com/gchongg/blockx">
          BlockX
        </a>
      </h1>

      <main className={styles.main}>
        <p className={styles.smalltext}>
        An innovative, blockchain-powered solution for exchanging data and code
        </p>

        <p className={styles.header}>
          How does it work?
        </p>

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
        <br></br>


        <div className="card-container">
          
            <div className={styles.card}>
              <p>Navigate to the <a href="https://data-x-delta.vercel.app/catalog">Catalog</a></p>
              <header>This contains every dataset part of the marketplace; this is paired with a description and the price of the dataset.</header>
              <Image src={catalog_img} alt="Catalog" width={500} height={40} />
              <Image src={datasets_img} alt="datasets" width={250} height={200} />
            </div>

            <div className={styles.card}>
              <p>Backend blockchain querying</p>
              <h3>Backend blockchain querying occurs to get all dataset offerings within the marketplace.</h3>
              <Image src={backend_img} alt="backend query" width={170} height={250} />
            </div>

            <div className={styles.card}>
              <p>Filters</p>
              <h3>Filter based on what you are looking for; filters include text search, price, category, and more!</h3>
              <Image src={filters_img} alt="Filters" width={350} height={250} />
            </div>

            <div className={styles.card}>
              <p>Buy Data</p>
              <h3>Once you have located a dataset of interest, buy the dataset for the listed price.</h3>
              <Image src={buying_data_img} alt="Purchase" width={270} height={150} />
            </div>

            <div className={styles.card}>
              <p>Backend Smart Contract Execution</p>
              <h3>A smart contract is executed to give Ether to the dataset owner and give you access the dataset.</h3>
              <Image src={buy_img} alt="smart contract" width={270} height={150} />
            </div>

            <div className={styles.card}>
              <p>Access your new data</p>
              <h3>Once the smart contract is executed, a signed URL will be created for you to access your purchased data.</h3>
              
            </div>

        </div>

        <div id="sellText" className={styles.targetText}>
          <p className={styles.header}>Sell Data</p>
          
          <div className={styles.buttonContainer}>
            <button className={styles.button}>Text Version</button>
          </div>
        </div>
        <br></br>

        <div className={styles.card}>
              <p>Navigate to the <a href="https://data-x-delta.vercel.app/publish">Publish</a> page</p>
              <Image src={publish_img} alt="publish" width={500} height={40} />
            </div>

            <div className={styles.card}>
              <p>Data Description</p>
              <h3>Fill out relevant information regarding the data and click "Sell Dataset". A more thorough description is likely to lead to more purchases.</h3>
              <Image src={sell_info_img} alt="dataset info" width={350} height={250} />
            </div>

            <div className={styles.card}>
              <p>Backend Smart Contract Execution</p>
              <h3>To add the data to the marketplace, execute the smart contract by clicking on the blue "Confirm" button. Before the data is added to the marketplace, however, a couple of steps need to occur.</h3>
              <Image src={fee_img} alt="Smart contract execute" width={350} height={220} />
              
            </div>

            <div className={styles.card}>
              <p>Personally Identifiable Information (PII) check</p>
              <h3>The Personally Identifiable Information (PII) check ensures privacy by removing sensitive data. Note that it is your responsibility to remvoe PII--this is only a surface-level check.</h3>
              <Image src={pii_img} alt="PII check" width={350} height={250} />
            </div>

            <div className={styles.card}>
              <p>Data Storage: Interplanetary File System (IPFS)</p>
              <h3>The data is then stored in chunks on Interplanetary File System (IPFS); this prevents your data from a total data leak, which is a main issue associated with centralized storage.</h3>
              <Image src={ipfs_img} alt="IPFS chunking" width={350} height={150} />
            </div>

            <div className={styles.card}>
              <p>Dataset Identifier Creation</p>
              <h3>After the PII check and upload to IPFS, a Content Identifier (CID) is created for your data. Tt is then passed into the smart contract; the smart contract is executed and the data is added to the blockchain.</h3>
              <Image src={solo_sc_img} alt="smart contract execution" width={350} height={150} />
            </div>

            <div className={styles.card}>
              <p>Now your data should be available to purchase on the <a href="https://data-x-delta.vercel.app/catalog">Catalog</a>.</p>
              <Image src={sell_img} alt="Your data on the catalog" width={270} height={100} />
      
            </div>
      </main>

      {/* Footer */}
      {!isConnected && (
  <footer className={styles.footer}>
    {/* Wallet Connect Button */}
    <div className={styles.connectButton}>
      <ConnectButton />
    </div>

    {/* Display Connected Address */}
    {isConnected && (
      <p className={styles.address}>
        yer
      </p>
    )}
  </footer>
)}
    </div>
  );
};

export default Home;
