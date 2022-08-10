import type { NextPage } from "next";
import Head from "next/head";
import { ExplorerView } from "../views";

const Explorer: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solana Scaffold</title>
        <meta
          name="description"
          content="Basic Functionality"
        />
      </Head>
      <ExplorerView />
    </div>
  );
};

export default Explorer;
