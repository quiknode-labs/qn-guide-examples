"use client";
import { Card, Flex, Text, Separator } from "@radix-ui/themes";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import {
  Form,
  FormControl,
  FormMessage,
  FormField
} from "@radix-ui/react-form";
import { useState, useEffect, useContext, useCallback } from "react";
import {
  fetchSolanaPrice,
  formatUsdPrice,
  WRAPPED_SOL_ADDRESS
} from "@/utils/solana/price";
import { SelectedWalletAccountContext } from "@/context/SelectedWalletAccountContext";
import { PRIORITY_FEE_BUFFER, STAKE_PROGRAM } from "@/utils/constants";
import { useIsWalletConnected } from "@/hooks/useIsWalletConnected";
import { WalletConnectButton } from "../WalletConnectButton";
import { WalletDisconnectButton } from "../WalletDisconnectButton";
import { StakeAccountsTable } from "./StakeAccountsTable";
import { GetStakeAccountResponse } from "@/utils/solana/stake/get-stake-accounts";
import { WalletHeader } from "./WalletHeader";
import { ValidatorInfo } from "./ValidatorInfo";
import { StakeButton } from "./StakeButton";
import { FeaturesList } from "./FeaturesList";
import { install } from "@solana/webcrypto-ed25519-polyfill";
install();
export function StakingForm() {
  const [selectedWalletAccount] = useContext(SelectedWalletAccountContext);
  const [balance, setBalance] = useState<number>(0);
  const [solPrice, setSolPrice] = useState<number>(0);
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [formattedStakeAmount, setFormattedStakeAmount] = useState<string>("");
  const [stakeAccounts, setStakeAccounts] = useState<GetStakeAccountResponse[]>(
    []
  );
  const isConnected = useIsWalletConnected();
  const apy = "7.58%";
  const [showStakeAccounts, setShowStakeAccounts] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      setBalance(0);
      setStakeAccounts([]);
    }
  }, [isConnected]);

  useEffect(() => {
    if (!selectedWalletAccount) {
      setBalance(0);
      setStakeAccounts([]);
      return;
    }

    // Fetch balance
    fetch(`/api/balance?address=${selectedWalletAccount.address}`)
      .then((res) => res.json())
      .then((data) => {
        setBalance(parseFloat(data.solBalance));
      })
      .catch((error) => console.error("Failed to fetch balance:", error));

    // Fetch stake accounts
    fetch(`/api/stake/fetch?owner=${selectedWalletAccount.address}`)
      .then((res) => res.json())
      .then((data) => {
        setStakeAccounts(data.stakeAccounts || []);
      })
      .catch((error) =>
        console.error("Failed to fetch stake accounts:", error)
      );
  }, [selectedWalletAccount]);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const priceData = await fetchSolanaPrice();
        const price = priceData?.data?.[WRAPPED_SOL_ADDRESS]?.price;
        if (price) {
          setSolPrice(parseFloat(price));
        } else {
          console.error("Invalid price data structure:", priceData);
        }
      } catch (error) {
        console.error("Failed to fetch SOL price:", error);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (value: string) => {
    // Remove non-digit and non-decimal characters
    let cleanValue = value.replace(/[^\d.]/g, "");

    // Handle special case where input starts with decimal
    if (cleanValue.startsWith(".")) {
      cleanValue = "0" + cleanValue;
    }

    // Split into integer and decimal parts
    const parts = cleanValue.split(".");

    // Handle integer part
    let integerPart = parts[0];
    // Remove leading zeros unless it's just "0"
    integerPart = integerPart === "0" ? "0" : integerPart.replace(/^0+/, "");
    // Limit to 7 digits
    integerPart = integerPart.slice(0, 7);

    // Handle decimal part (keep only first decimal point)
    let decimalPart = "";
    if (parts.length > 1) {
      // Limit decimal places to 2
      decimalPart = parts[1].slice(0, 2);
    }

    // Combine parts, ensuring decimal point is preserved when there's a decimal part
    cleanValue =
      parts.length > 1 ? `${integerPart}.${decimalPart}` : integerPart;

    // Set the raw value (without commas)
    setStakeAmount(cleanValue);

    // Format with commas for display, preserving decimal part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formattedValue =
      parts.length > 1
        ? `${formattedInteger}.${decimalPart}`
        : formattedInteger;
    setFormattedStakeAmount(formattedValue || "0");
  };

  const handleMaxClick = useCallback(() => {
    let max = balance - STAKE_PROGRAM.STAKE_ACCOUNT_RENT - PRIORITY_FEE_BUFFER;
    if (max < 0) {
      max = 0;
    }
    const maxWithPrecision = Math.floor(max * 100) / 100;
    const formattedBalance = maxWithPrecision.toFixed(2);
    const [integerPart, decimalPart] = formattedBalance.split(".");
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formattedValue = decimalPart
      ? `${formattedInteger}.${decimalPart}`
      : formattedInteger;
    setStakeAmount(formattedBalance); // Store raw value
    setFormattedStakeAmount(formattedValue); // Store formatted value for display
  }, [balance]);

  const resetFormAndRefreshBalance = useCallback(() => {
    setStakeAmount("");
    setFormattedStakeAmount("");

    // Refresh balance if wallet is connected
    if (selectedWalletAccount) {
      fetch(`/api/balance?address=${selectedWalletAccount.address}`)
        .then((res) => res.json())
        .then((data) => {
          setBalance(parseFloat(data.solBalance));
        })
        .catch((error) => console.error("Failed to fetch balance:", error));

      fetch(`/api/stake/fetch?owner=${selectedWalletAccount.address}`)
        .then((res) => res.json())
        .then((data) => {
          setStakeAccounts(data.stakeAccounts || []);
        });
    }
  }, [selectedWalletAccount]);
  const stakeSol = parseFloat(stakeAmount);
  const inSufficientBalance =
    stakeSol > balance - STAKE_PROGRAM.STAKE_ACCOUNT_RENT - PRIORITY_FEE_BUFFER;

  return (
    <Card
      size="3"
      style={{ width: "100%", maxWidth: "480px", background: "var(--gray-1)" }}
    >
      <Flex direction="column" gap="5">
        {isConnected && (
          <>
            {/* Wallet Balance Header */}
            <Flex align="center" justify="between">
              <WalletHeader
                address={selectedWalletAccount?.address}
                balance={balance}
              />
            </Flex>

            <Separator size="4" />

            {/* Staking Input Section */}
            <Form id="stakeForm">
              <FormField name="stakeAmount">
                <div className="relative w-full">
                  <FormControl asChild>
                    <input
                      name="stakeAmount"
                      type="text"
                      inputMode="decimal"
                      value={formattedStakeAmount}
                      onChange={(e) =>
                        handleInputChange(e.target.value.replace(/,/g, ""))
                      }
                      className="w-full bg-black text-4xl font-bold outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-4 text-left"
                      placeholder="0.00"
                      aria-label="Stake Amount"
                    />
                  </FormControl>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Text size="3" className="text-gray-500">
                      SOL
                    </Text>
                    {selectedWalletAccount && balance > 0 && (
                      <button
                        type="button"
                        onClick={handleMaxClick}
                        className="px-2 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        MAX
                      </button>
                    )}
                  </div>
                  <FormMessage match="valueMissing">
                    Please enter an amount
                  </FormMessage>
                  <FormMessage match="typeMismatch">
                    Please enter a valid number
                  </FormMessage>
                </div>
              </FormField>
            </Form>
            <Text size="2" color="gray" className="ml-4">
              ≈ {formatUsdPrice(stakeAmount, solPrice)}
            </Text>

            {/* Validator Info */}
            <ValidatorInfo apy={apy} />
          </>
        )}

        {/* Features */}
        <FeaturesList />

        {/* Stake Button */}
        {isConnected && selectedWalletAccount ? (
          <>
            <StakeButton
              account={selectedWalletAccount}
              stakeAmount={stakeAmount}
              onSuccess={resetFormAndRefreshBalance}
              inSufficientBalance={inSufficientBalance}
            />
            <WalletDisconnectButton />
          </>
        ) : (
          <WalletConnectButton />
        )}

        {/* Stake Accounts Table */}
        {stakeAccounts.length > 0 && (
          <>
            <Separator size="4" />
            <Flex
              align="center"
              gap="2"
              style={{ cursor: "pointer" }}
              onClick={() => setShowStakeAccounts(!showStakeAccounts)}
            >
              <Text size="2" weight="bold">
                Your Stake Accounts
              </Text>
              <ChevronDownIcon
                style={{
                  transform: showStakeAccounts
                    ? "rotate(0deg)"
                    : "rotate(-90deg)",
                  transition: "transform 0.2s ease"
                }}
              />
            </Flex>
            {showStakeAccounts && (
              <StakeAccountsTable
                stakeAccounts={stakeAccounts}
                key={stakeAccounts.length}
              />
            )}
          </>
        )}
      </Flex>
    </Card>
  );
}
