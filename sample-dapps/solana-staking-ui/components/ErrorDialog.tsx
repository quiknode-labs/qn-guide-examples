import { AlertDialog, Text, Button, Flex } from "@radix-ui/themes";
import { useState } from "react";
import { getErrorMessage } from "@/utils/errors";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

type Props = Readonly<{
  error: unknown;
  onClose?(): false | void;
  title?: string;
}>;

export function ErrorDialog({ error, onClose, title }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <AlertDialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (!onClose || onClose() !== false) {
            setIsOpen(false);
          }
        }
      }}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
      <AlertDialog.Content
        style={{
          background: "var(--gray-1)",
          border: "1px solid var(--gray-5)",
          maxWidth: "480px",
          padding: "24px"
        }}
      >
        <Flex direction="column" gap="4">
          {/* Error Icon and Title */}
          <Flex direction="column" gap="3" style={{ textAlign: "center" }}>
            <div style={{ margin: "0 auto", position: "relative" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "rgba(255, 86, 86, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto"
                }}
              >
                <ExclamationTriangleIcon
                  width={24}
                  height={24}
                  color="#FF5656"
                />
              </div>
            </div>
            <AlertDialog.Title>
              <Text
                size="6"
                weight="bold"
                style={{
                  color: "#FF5656",
                  fontSize: "20px"
                }}
              >
                {title ?? "Staking failed"}
              </Text>
            </AlertDialog.Title>
          </Flex>

          {/* Error Message */}
          <AlertDialog.Description>
            <Text
              size="3"
              style={{
                color: "#999999",
                textAlign: "center",
                margin: "0 auto",
                maxWidth: "320px",
                lineHeight: "1.5"
              }}
            >
              {getErrorMessage(error, "An unexpected error occurred")}
            </Text>
          </AlertDialog.Description>

          {/* Action Button */}
          <Flex mt="4" justify="center" style={{ marginTop: "20px" }}>
            <AlertDialog.Action>
              <Button
                size="3"
                className="error-close-button"
                style={{
                  background: "#242424",
                  color: "white",
                  cursor: "pointer",
                  padding: "20px 32px",
                  borderRadius: "12px",
                  border: "1px solid #2C2C2C",
                  transition: "all 0.2s ease",
                  fontWeight: "500",
                  minWidth: "120px"
                }}
              >
                Close
              </Button>
            </AlertDialog.Action>
          </Flex>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
