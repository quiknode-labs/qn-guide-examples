"""
Monitor Solana transactions for new Pump.fun mints using Yellowstone gRPC.
"""

import asyncio
import base58
import grpc
import logging
from typing import Iterator, Optional

import generated.geyser_pb2 as geyser_pb2
import generated.geyser_pb2_grpc as geyser_pb2_grpc
import generated.solana_storage_pb2 as solana_storage_pb2

logger = logging.getLogger(__name__)

class PumpMonitor:
    """
    Attributes:
        endpoint (str): The gRPC endpoint URL
        token (str): Authentication token for the gRPC service
        channel (grpc.Channel): Secure gRPC channel
        stub (geyser_pb2_grpc.GeyserStub): gRPC stub for communication
    """

    PUMP_FUN_ACCOUNT = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'
    PUMP_INSTRUCTION_PREFIX = bytes([24, 30, 200, 40, 5, 28, 7, 119])
    COMMITMENT_LEVEL = geyser_pb2.CommitmentLevel.CONFIRMED

    def __init__(self, endpoint: str, token: str) -> None:
        """
        Initializer. For information on initialization, refer to README.md.

        Args:
            endpoint: gRPC service endpoint URL (your RPC endpoint with port 10000)
            token: Authentication token for the service
        """
        self.endpoint = endpoint.replace('http://', '').replace('https://', '')
        self.token = token
        self.channel = self._create_secure_channel()
        self.stub = geyser_pb2_grpc.GeyserStub(self.channel)

    def _create_secure_channel(self) -> grpc.Channel:
        """Create a secure gRPC channel with authentication credentials."""
        auth = grpc.metadata_call_credentials(
            lambda context, callback: callback((("x-token", self.token),), None)
        )
        ssl_creds = grpc.ssl_channel_credentials()
        combined_creds = grpc.composite_channel_credentials(ssl_creds, auth)
        return grpc.secure_channel(self.endpoint, credentials=combined_creds)

    def request_iterator(self) -> Iterator[geyser_pb2.SubscribeRequest]:
        """
        Generate subscription requests for monitoring.

        Yields:
            geyser_pb2.SubscribeRequest: Configured subscription request
        """
        request = geyser_pb2.SubscribeRequest()
        request.transactions["pumpFun"].account_include.extend([self.PUMP_FUN_ACCOUNT])
        request.commitment = self.COMMITMENT_LEVEL
        yield request

    def handle_update(self, update: geyser_pb2.SubscribeUpdate) -> None:
        """
        Process transaction updates from the subscription. Verifies that the transaction includes a valid
        new Pump.fun mint instruction based on our instruction discriminator prefix.

        Args:
            update: Update message from the gRPC subscription
        """
        if not self._is_valid_pump_transaction(update):
            return

        tx_info = update.transaction.transaction
        message = tx_info.transaction.message

        for instruction in message.instructions:
            if instruction.data.startswith(self.PUMP_INSTRUCTION_PREFIX):
                self._log_mint_information(
                    signature=base58.b58encode(bytes(tx_info.signature)).decode(),
                    slot=update.transaction.slot,
                    mint=base58.b58encode(
                        bytes(message.account_keys[instruction.accounts[0]])
                    ).decode()
                )

    def _is_valid_pump_transaction(self, update: geyser_pb2.SubscribeUpdate) -> bool:
        """
        Validate if the update contains a relevant Pump.fun transaction and our filter, which we defined 
        in the request_iterator() method.

        Args:
            update: Update message to validate

        Returns:
            bool: True if the update contains a valid Pump.fun transaction
        """
        return (
            hasattr(update, 'transaction') 
            and update.transaction 
            and "pumpFun" in update.filters
            and update.transaction.transaction
            and update.transaction.transaction.transaction
            and update.transaction.transaction.transaction.message
        )

    def _log_mint_information(self, signature: str, slot: int, mint: str) -> None:
        """
        Log information about a new mint.

        Args:
            signature: Transaction signature
            slot: Transaction slot
            mint: Mint address
        """
        print(f"\n💊 New Pump.fun Mint!")
        print(f"Signature: {signature}")
        print(f"Slot: {slot}")
        print(f"Mint: {mint}\n")

    async def start_monitoring(self) -> None:
        """
        Start monitoring for Pump.fun transactions.

        Raises:
            grpc.RpcError: If gRPC communication fails
        """
        try:
            responses = self.stub.Subscribe(self.request_iterator())
            for response in responses:
                self.handle_update(response)
        except grpc.RpcError as e:
            logger.error(f"gRPC error occurred: {e}")
            raise
        finally:
            self.channel.close()

def main():
    logging.basicConfig(level=logging.INFO)
    monitor = PumpMonitor(
        "https://REPLACE_ME.solana-mainnet.quiknode.pro:10000",
        "REPALCE_ME_1234567890"
    )
    try:
        asyncio.run(monitor.start_monitoring())
    except KeyboardInterrupt:
        print("\nShutting down...")

if __name__ == "__main__":
    main()

