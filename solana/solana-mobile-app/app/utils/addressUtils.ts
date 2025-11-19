export const shortenAddress = (address: string): string => {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export const formatSolAmount = (amount: number): string => {
  // Remove trailing zeros and unnecessary decimal points
  // Use higher precision to avoid truncation
  return parseFloat(amount.toFixed(9)).toString();
};
