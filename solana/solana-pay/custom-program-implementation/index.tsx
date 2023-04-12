import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createQR, encodeURL } from '@solana/pay';
import { Connection, PublicKey } from '@solana/web3.js';
import { u64 } from '@solana/buffer-layout-utils';
import { struct } from '@solana/buffer-layout';

const quickNodeEndpoint = 'https://example.solana-devnet.quiknode.pro/0123456/'; // 👈 Replace with your own devnet endpoint
const connection = new Connection(quickNodeEndpoint, 'confirmed');
const programId = new PublicKey('yV5T4jugYYqkPfA2REktXugfJ3HvmvRLEw7JxuB2TUf');
const counterSeed = 'counter';
const [counterPda] = PublicKey.findProgramAddressSync([Buffer.from(counterSeed)], programId);

interface Counter {
  discriminator: bigint;
  count: bigint;
}
const CountLayout = struct<Counter>([
  u64('discriminator'),
  u64('count'),
]);

async function fetchCount() {
  let { data } = await connection.getAccountInfo(counterPda) || {};
  if (!data) throw new Error('Account not found');
  const deserialized = CountLayout.decode(data);
  return deserialized.count.toString();
}

export default function Home() {
  const [qrCode, setQrCode] = useState<string>();
  const [count, setCount] = useState<string>('');

  useEffect(() => {
    generateQr();
    fetchCount().then(setCount);
    const subscribe = connection.onProgramAccountChange(
      programId,
      () => fetchCount().then(setCount),
      'finalized'
    )
    return () => {
      connection.removeProgramAccountChangeListener(subscribe);
    }
  }, []);

  const generateQr = async () => {
    const apiUrl = `${window.location.protocol}/${window.location.host}/api/pay`;
    const label = 'label';
    const message = 'message';
    const url = encodeURL({ link: new URL(apiUrl), label, message });
    const qr = createQR(url);
    const qrBlob = await qr.getRawData('png');
    if (!qrBlob) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setQrCode(event.target.result);
      }
    };
    reader.readAsDataURL(qrBlob);
  }

  return (
    <>
      <Head>
        <title>QuickNode Solana Pay Demo: Quick Count</title>
        <meta name="description" content="QuickNode Guide: Solana Pay" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
          <h1 className='text-2xl font-semibold'>Solana Pay Demo: QuickCount</h1>
          <h1 className='text-xl font-semibold'>Count: {count}</h1>
        </div>
        {qrCode && (
          <Image
            src={qrCode}
            style={{ position: "relative", background: "white" }}
            alt="QR Code"
            width={200}
            height={200}
            priority
          />
        )}
      </main>
    </>
  );
}