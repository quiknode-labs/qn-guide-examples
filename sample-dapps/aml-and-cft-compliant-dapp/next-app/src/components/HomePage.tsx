// src/components/HomePage.tsx
"use client";

import React from "react";
import { Container } from "@mantine/core";
import { Header } from "./Header";
import { InfoBanner } from "@/components/InfoBanner";
import { StakingForm } from "./StakingForm";


export function HomePage() {
  // Your component code
  return (
    <div>
      <Header />
      <Container size="md" py="xl">
        <InfoBanner />
        <StakingForm />
      </Container>
    </div>
  );
}