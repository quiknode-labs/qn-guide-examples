import { GetProgramAccountsDatasizeFilter } from "@solana/kit";
import { GetProgramAccountsMemcmpFilter } from "@solana/kit";
import { Address } from "@solana/kit";
import { STAKE_PROGRAM } from "../../constants";

type GetProgramAccountsFilter =
  | GetProgramAccountsDatasizeFilter
  | GetProgramAccountsMemcmpFilter;
type GetProgramAccountsFilters = Array<GetProgramAccountsFilter>;

interface StakeAccountsFilterInput {
  owner: Address;
  vote?: Address;
}

export const stakeAccountsFilter = ({
  owner,
  vote
}: StakeAccountsFilterInput): GetProgramAccountsFilters => {
  const filters = [
    {
      memcmp: {
        offset: BigInt(STAKE_PROGRAM.STAKE_ACCOUNT_FILTERS.ownerOffset),
        encoding: "base58" as const,
        bytes: owner
      }
    },
    {
      dataSize: BigInt(STAKE_PROGRAM.STAKE_ACCOUNT_FILTERS.sizeOf)
    }
  ];

  if (vote) {
    filters.push({
      memcmp: {
        offset: BigInt(STAKE_PROGRAM.STAKE_ACCOUNT_FILTERS.voteOffset),
        encoding: "base58" as const,
        bytes: vote
      }
    });
  }

  return filters;
};
