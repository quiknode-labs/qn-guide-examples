'use client'

import Uploader from "@/components/Uploader";

export default function Home() {
  return (
    <main className=" ">
      <div className="bg-white/30 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto w-full">
        <Uploader />
      </div>
    </main>
  );
}
