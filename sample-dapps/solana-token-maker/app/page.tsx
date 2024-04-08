'use client'

import Minter from "@/components/Minter";
import { Toaster } from "sonner";

export default function Home() {
  return (
    <main className=" ">
      <Minter />
      <Toaster richColors />
    </main>
  );
}
