import { Table, Text, Flex, Button } from "@radix-ui/themes";
import { shortenAddress } from "@/utils/solana/address";
import { getValidatorAddress } from "@/utils/config";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { GetStakeAccountResponse } from "@/utils/solana/stake/get-stake-accounts";
import Image from "next/image";

interface StakeAccountsTableProps {
  stakeAccounts: GetStakeAccountResponse[];
}

const ROWS_PER_PAGE = 3;

export function StakeAccountsTable({ stakeAccounts }: StakeAccountsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(stakeAccounts.length / ROWS_PER_PAGE);

  if (!stakeAccounts.length) {
    return (
      <Text
        size="2"
        color="gray"
        style={{ textAlign: "center", padding: "1rem" }}
      >
        No stake accounts found
      </Text>
    );
  }

  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const currentAccounts = stakeAccounts
    .sort((a, b) => b.solBalance - a.solBalance)
    .slice(startIndex, endIndex);

  return (
    <Flex direction="column" gap="2">
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell
              style={{ textAlign: "center", verticalAlign: "middle" }}
            >
              Address
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell
              style={{ textAlign: "center", verticalAlign: "middle" }}
            >
              Stake
              <br />
              (SOL)
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell
              style={{ textAlign: "center", verticalAlign: "middle" }}
            >
              Activation
              <br />
              Epoch
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell
              style={{ textAlign: "center", verticalAlign: "middle" }}
            >
              Validator
            </Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {currentAccounts.map((account) => (
            <Table.Row key={account.address}>
              <Table.Cell style={{ textAlign: "center" }}>
                {shortenAddress(account.address)}
              </Table.Cell>
              <Table.Cell style={{ textAlign: "center" }}>
                {account.solBalance.toFixed(2)}
              </Table.Cell>
              <Table.Cell style={{ textAlign: "center" }}>
                {account.activationEpoch}
              </Table.Cell>
              <Table.Cell style={{ textAlign: "center" }}>
                {account.voter === getValidatorAddress() ? (
                  <Image
                    src="/quicknode.svg"
                    alt="QuickNode Validator"
                    width={20}
                    height={20}
                    style={{ margin: "0 auto" }}
                  />
                ) : (
                  shortenAddress(account.voter)
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      {/* Pagination Controls */}
      <Flex gap="2" justify="between" align="center">
        <Text size="1" color="gray">
          Page {currentPage} of {totalPages}
        </Text>
        <Flex gap="1">
          <Button
            variant="soft"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            style={{ cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="soft"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            style={{
              cursor: currentPage === totalPages ? "not-allowed" : "pointer"
            }}
          >
            <ChevronRightIcon />
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
