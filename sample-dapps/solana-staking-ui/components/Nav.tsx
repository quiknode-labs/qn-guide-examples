import { Box, Text } from "@radix-ui/themes";
import { getNetworkIdentifier } from "@/utils/config";

export function Nav() {
  const isDevnet = getNetworkIdentifier() === "devnet";
  return (
    <Box
      style={{
        backgroundColor: "var(--background)",
        borderBottom: "1px solid var(--gray-a6)",
        zIndex: 1,
        textAlign: "center"
      }}
      position="sticky"
      p="4"
      top="0"
      mb="-8"
    >
      {isDevnet && (
        <Text color="red" size="3" weight="bold">
          Devnet
        </Text>
      )}
    </Box>
  );
}
