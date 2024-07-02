'use client'

import Blink from "@/components/Blink";
import { Toaster } from "sonner";

export default function Home() {
  return (
    <main className=" ">
      <Blink />
      <Toaster richColors />
    </main>
  );
}
