export const DECIMAL_PLACES = 18;
const SCALE = 10n ** BigInt(DECIMAL_PLACES);
const DECIMAL_PATTERN = /^(?:0|[1-9]\d*)(?:\.(\d*))?$|^\.(\d+)$/;

export type Decimal = bigint;

export function parseDecimal(input: string): Decimal {
  const match = DECIMAL_PATTERN.exec(input);
  if (!match) throw new Error(`Invalid non-negative decimal: ${input}`);

  const [integerRaw = "0", fractionalRaw = ""] = input.startsWith(".")
    ? ["0", input.slice(1)]
    : input.split(".");
  if (fractionalRaw.length > DECIMAL_PLACES) {
    throw new Error(
      `Decimal has more than ${DECIMAL_PLACES} fractional places: ${input}`,
    );
  }
  const fraction = fractionalRaw.padEnd(DECIMAL_PLACES, "0");
  return BigInt(integerRaw) * SCALE + BigInt(fraction || "0");
}

export function formatDecimal(value: Decimal): string {
  if (value < 0n) throw new Error("Cannot format a negative book decimal");
  const integer = value / SCALE;
  const fraction = (value % SCALE)
    .toString()
    .padStart(DECIMAL_PLACES, "0")
    .replace(/0+$/, "");
  return fraction ? `${integer}.${fraction}` : integer.toString();
}

