import {
  Address,
  FixedSizeCodec,
  getAddressCodec,
  getBytesCodec,
  getU64Codec,
  getF64Codec,
  getU8Codec,
  getStructCodec,
  fixCodecSize,
  ReadonlyUint8Array
} from "@solana/kit";

export interface Lockup {
  timestamp: bigint; // u64
  epoch: bigint; // u64
  custodian: Address;
}

export const lockupCodec: FixedSizeCodec<Lockup> = getStructCodec([
  ["timestamp", getU64Codec()],
  ["epoch", getU64Codec()],
  ["custodian", getAddressCodec()]
]);

export interface StakeAccount {
  state: StakeAccountState;
  buffer: ReadonlyUint8Array;
  rentExemptReserve: bigint;
  staker: Address;
  withdrawer: Address;
  lockup: Lockup;
  voter: Address;
  stake: bigint;
  activationEpoch: bigint;
  deactivationEpoch: bigint;
  warmupCooldownRate: number;
  creditsObserved: bigint;
  flags: number;
}

export const stakeAccountCodec: FixedSizeCodec<StakeAccount> = getStructCodec([
  ["state", getU8Codec()],
  ["buffer", fixCodecSize(getBytesCodec(), 3)],
  ["rentExemptReserve", getU64Codec()],

  // Authority
  ["staker", getAddressCodec()],
  ["withdrawer", getAddressCodec()],

  // Lockup
  ["lockup", lockupCodec],

  // Delegation
  ["voter", getAddressCodec()],
  ["stake", getU64Codec()],
  ["activationEpoch", getU64Codec()],
  ["deactivationEpoch", getU64Codec()],
  ["warmupCooldownRate", getF64Codec()],

  // Other
  ["creditsObserved", getU64Codec()],
  ["flags", getU8Codec()]
]);

export enum StakeAccountState {
  Uninitialized = 0,
  Initialized = 1,
  Delegated = 2,
  RewardsPool = 3
}
