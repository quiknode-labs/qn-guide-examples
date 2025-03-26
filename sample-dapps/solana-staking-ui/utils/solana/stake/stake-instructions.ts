import {
  getStructEncoder,
  getU32Encoder,
  transformEncoder,
  upgradeRoleToSigner,
  ReadonlySignerAccount,
  AccountRole,
  type Address,
  type Encoder,
  type IAccountMeta,
  type IInstruction,
  type IInstructionWithAccounts,
  type IInstructionWithData,
  type ReadonlyAccount,
  type WritableAccount,
  type IAccountSignerMeta,
  type ProgramDerivedAddress,
  type TransactionSigner
} from "@solana/kit";
import {
  STAKE_PROGRAM_ADDRESS,
  getAuthorizedEncoder,
  getLockupEncoder,
  type AuthorizedArgs,
  type LockupArgs
} from "@solana-program/stake";

type InitializeInstruction<
  TProgram extends string = typeof STAKE_PROGRAM_ADDRESS,
  TAccountStake extends string | IAccountMeta<string> = string,
  TAccountRentSysvar extends
    | string
    | IAccountMeta<string> = "SysvarRent111111111111111111111111111111111",
  TRemainingAccounts extends readonly IAccountMeta<string>[] = []
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
      TAccountStake extends string
        ? WritableAccount<TAccountStake>
        : TAccountStake,
      TAccountRentSysvar extends string
        ? ReadonlyAccount<TAccountRentSysvar>
        : TAccountRentSysvar,
      ...TRemainingAccounts
    ]
  >;

type InitializeInstructionDataArgs = {
  authorized: AuthorizedArgs;
  lockup: LockupArgs;
};

function getInitializeInstructionDataEncoder(): Encoder<InitializeInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ["discriminator", getU32Encoder()],
      ["authorized", getAuthorizedEncoder()],
      ["lockup", getLockupEncoder()]
    ]),
    (value) => ({ ...value, discriminator: 0 })
  );
}

type InitializeInput<
  TAccountStake extends string = string,
  TAccountRentSysvar extends string = string
> = {
  /** Uninitialized stake account */
  stake: Address<TAccountStake>;
  /** Rent sysvar */
  rentSysvar?: Address<TAccountRentSysvar>;
  authorized: InitializeInstructionDataArgs["authorized"];
  lockup: InitializeInstructionDataArgs["lockup"];
};

export function getInitializeInstruction<
  TAccountStake extends string,
  TAccountRentSysvar extends string,
  TProgramAddress extends Address = typeof STAKE_PROGRAM_ADDRESS
>(
  input: InitializeInput<TAccountStake, TAccountRentSysvar>,
  config?: { programAddress?: TProgramAddress }
): InitializeInstruction<TProgramAddress, TAccountStake, TAccountRentSysvar> {
  // Program address.
  const programAddress = config?.programAddress ?? STAKE_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    stake: { value: input.stake ?? null, isWritable: true },
    rentSysvar: { value: input.rentSysvar ?? null, isWritable: false }
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Original args.
  const args = { ...input };

  // Resolve default values.
  if (!accounts.rentSysvar.value) {
    accounts.rentSysvar.value =
      "SysvarRent111111111111111111111111111111111" as Address<"SysvarRent111111111111111111111111111111111">;
  }

  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  const instruction = {
    accounts: [
      getAccountMeta(accounts.stake),
      getAccountMeta(accounts.rentSysvar)
    ],
    programAddress,
    data: getInitializeInstructionDataEncoder().encode(
      args as InitializeInstructionDataArgs
    )
  } as InitializeInstruction<
    TProgramAddress,
    TAccountStake,
    TAccountRentSysvar
  >;

  return instruction;
}

function getAccountMetaFactory(
  programAddress: Address,
  optionalAccountStrategy: "omitted" | "programId"
) {
  return (
    account: ResolvedAccount
  ): IAccountMeta | IAccountSignerMeta | undefined => {
    if (!account.value) {
      if (optionalAccountStrategy === "omitted") return;
      return Object.freeze({
        address: programAddress,
        role: AccountRole.READONLY
      });
    }

    const writableRole = account.isWritable
      ? AccountRole.WRITABLE
      : AccountRole.READONLY;
    const address = expectAddress(account.value);
    return Object.freeze({
      address,
      role:
        typeof account.value === "object" && "address" in account.value
          ? upgradeRoleToSigner(writableRole)
          : writableRole,
      ...(typeof account.value === "object" && "address" in account.value
        ? { signer: account.value }
        : {})
    });
  };
}
type ResolvedAccount<
  T extends string = string,
  U extends
    | Address<T>
    | ProgramDerivedAddress<T>
    | TransactionSigner<T>
    | null = Address<T> | ProgramDerivedAddress<T> | TransactionSigner<T> | null
> = {
  isWritable: boolean;
  value: U;
};
function expectAddress<T extends string = string>(
  value:
    | Address<T>
    | ProgramDerivedAddress<T>
    | TransactionSigner<T>
    | null
    | undefined
): Address<T> {
  if (!value) {
    throw new Error("Expected a Address.");
  }
  if (typeof value === "object" && "address" in value) {
    return value.address;
  }
  if (Array.isArray(value)) {
    return value[0];
  }
  return value as Address<T>;
}

const DELEGATE_STAKE_DISCRIMINATOR = 2;

type DelegateStakeInstruction<
  TProgram extends string = typeof STAKE_PROGRAM_ADDRESS,
  TAccountStake extends string | IAccountMeta<string> = string,
  TAccountVote extends string | IAccountMeta<string> = string,
  TAccountClockSysvar extends
    | string
    | IAccountMeta<string> = "SysvarC1ock11111111111111111111111111111111",
  TAccountStakeHistory extends string | IAccountMeta<string> = string,
  TAccountUnused extends string | IAccountMeta<string> = string,
  TAccountStakeAuthority extends string | IAccountMeta<string> = string,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = []
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
      TAccountStake extends string
        ? WritableAccount<TAccountStake>
        : TAccountStake,
      TAccountVote extends string
        ? ReadonlyAccount<TAccountVote>
        : TAccountVote,
      TAccountClockSysvar extends string
        ? ReadonlyAccount<TAccountClockSysvar>
        : TAccountClockSysvar,
      TAccountStakeHistory extends string
        ? ReadonlyAccount<TAccountStakeHistory>
        : TAccountStakeHistory,
      TAccountUnused extends string
        ? ReadonlyAccount<TAccountUnused>
        : TAccountUnused,
      TAccountStakeAuthority extends string
        ? ReadonlySignerAccount<TAccountStakeAuthority> &
            IAccountSignerMeta<TAccountStakeAuthority>
        : TAccountStakeAuthority,
      ...TRemainingAccounts
    ]
  >;

type DelegateStakeInstructionDataArgs = {};

function getDelegateStakeInstructionDataEncoder(): Encoder<DelegateStakeInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([["discriminator", getU32Encoder()]]),
    (value) => ({ ...value, discriminator: DELEGATE_STAKE_DISCRIMINATOR })
  );
}

type DelegateStakeInput<
  TAccountStake extends string = string,
  TAccountVote extends string = string,
  TAccountClockSysvar extends string = string,
  TAccountStakeHistory extends string = string,
  TAccountUnused extends string = string,
  TAccountStakeAuthority extends string = string
> = {
  /** Initialized stake account to be delegated */
  stake: Address<TAccountStake>;
  /** Vote account to which this stake will be delegated */
  vote: Address<TAccountVote>;
  /** Clock sysvar */
  clockSysvar?: Address<TAccountClockSysvar>;
  /** Stake history sysvar */
  stakeHistory: Address<TAccountStakeHistory>;
  /** Unused account, formerly the stake config */
  unused: Address<TAccountUnused>;
  /** Stake authority */
  stakeAuthority: TransactionSigner<TAccountStakeAuthority>;
};

export function getDelegateStakeInstruction<
  TAccountStake extends string,
  TAccountVote extends string,
  TAccountClockSysvar extends string,
  TAccountStakeHistory extends string,
  TAccountUnused extends string,
  TAccountStakeAuthority extends string,
  TProgramAddress extends Address = typeof STAKE_PROGRAM_ADDRESS
>(
  input: DelegateStakeInput<
    TAccountStake,
    TAccountVote,
    TAccountClockSysvar,
    TAccountStakeHistory,
    TAccountUnused,
    TAccountStakeAuthority
  >,
  config?: { programAddress?: TProgramAddress }
): DelegateStakeInstruction<
  TProgramAddress,
  TAccountStake,
  TAccountVote,
  TAccountClockSysvar,
  TAccountStakeHistory,
  TAccountUnused,
  TAccountStakeAuthority
> {
  // Program address.
  const programAddress = config?.programAddress ?? STAKE_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    stake: { value: input.stake ?? null, isWritable: true },
    vote: { value: input.vote ?? null, isWritable: false },
    clockSysvar: { value: input.clockSysvar ?? null, isWritable: false },
    stakeHistory: { value: input.stakeHistory ?? null, isWritable: false },
    unused: { value: input.unused ?? null, isWritable: false },
    stakeAuthority: { value: input.stakeAuthority ?? null, isWritable: false }
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Resolve default values.
  if (!accounts.clockSysvar.value) {
    accounts.clockSysvar.value =
      "SysvarC1ock11111111111111111111111111111111" as Address<"SysvarC1ock11111111111111111111111111111111">;
  }

  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  const instruction = {
    accounts: [
      getAccountMeta(accounts.stake),
      getAccountMeta(accounts.vote),
      getAccountMeta(accounts.clockSysvar),
      getAccountMeta(accounts.stakeHistory),
      getAccountMeta(accounts.unused),
      getAccountMeta(accounts.stakeAuthority)
    ],
    programAddress,
    data: getDelegateStakeInstructionDataEncoder().encode({})
  } as DelegateStakeInstruction<
    TProgramAddress,
    TAccountStake,
    TAccountVote,
    TAccountClockSysvar,
    TAccountStakeHistory,
    TAccountUnused,
    TAccountStakeAuthority
  >;

  return instruction;
}
