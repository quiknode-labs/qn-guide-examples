import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createQR, encodeURL } from '@solana/pay';
async function fetchCount() {
  const response = await fetch('/api/pay?count=true');
  if (!response.ok) throw new Error('Unable to read the counter');
  const { count } = await response.json();
  return count as string;
}

export default function Home() {
  const [qrCode, setQrCode] = useState<string>();
  const [count, setCount] = useState<string>('');

  useEffect(() => {
    generateQr();
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function pollCount() {
      try {
        const value = await fetchCount();
        if (active) setCount(value);
      } catch {
        if (active) setCount('Unavailable');
      } finally {
        if (active) timer = setTimeout(pollCount, 3000);
      }
    }

    pollCount();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const generateQr = async () => {
    const apiUrl = new URL('/api/pay', window.location.origin);
    const label = 'label';
    const message = 'message';
    const url = encodeURL({ link: apiUrl, label, message });
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
        <title>Quicknode Solana Pay Demo: Quick Count</title>
        <meta name="description" content="Quicknode Guide: Solana Pay" />
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