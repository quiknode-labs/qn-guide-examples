# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: solana-storage.proto
# Protobuf Python Version: 5.26.1
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x14solana-storage.proto\x12\x1dsolana.storage.ConfirmedBlock\"\xa1\x03\n\x0e\x43onfirmedBlock\x12\x1a\n\x12previous_blockhash\x18\x01 \x01(\t\x12\x11\n\tblockhash\x18\x02 \x01(\t\x12\x13\n\x0bparent_slot\x18\x03 \x01(\x04\x12I\n\x0ctransactions\x18\x04 \x03(\x0b\x32\x33.solana.storage.ConfirmedBlock.ConfirmedTransaction\x12\x36\n\x07rewards\x18\x05 \x03(\x0b\x32%.solana.storage.ConfirmedBlock.Reward\x12@\n\nblock_time\x18\x06 \x01(\x0b\x32,.solana.storage.ConfirmedBlock.UnixTimestamp\x12@\n\x0c\x62lock_height\x18\x07 \x01(\x0b\x32*.solana.storage.ConfirmedBlock.BlockHeight\x12\x44\n\x0enum_partitions\x18\x08 \x01(\x0b\x32,.solana.storage.ConfirmedBlock.NumPartitions\"\x9b\x01\n\x14\x43onfirmedTransaction\x12?\n\x0btransaction\x18\x01 \x01(\x0b\x32*.solana.storage.ConfirmedBlock.Transaction\x12\x42\n\x04meta\x18\x02 \x01(\x0b\x32\x34.solana.storage.ConfirmedBlock.TransactionStatusMeta\"Z\n\x0bTransaction\x12\x12\n\nsignatures\x18\x01 \x03(\x0c\x12\x37\n\x07message\x18\x02 \x01(\x0b\x32&.solana.storage.ConfirmedBlock.Message\"\xad\x02\n\x07Message\x12<\n\x06header\x18\x01 \x01(\x0b\x32,.solana.storage.ConfirmedBlock.MessageHeader\x12\x14\n\x0c\x61\x63\x63ount_keys\x18\x02 \x03(\x0c\x12\x18\n\x10recent_blockhash\x18\x03 \x01(\x0c\x12H\n\x0cinstructions\x18\x04 \x03(\x0b\x32\x32.solana.storage.ConfirmedBlock.CompiledInstruction\x12\x11\n\tversioned\x18\x05 \x01(\x08\x12W\n\x15\x61\x64\x64ress_table_lookups\x18\x06 \x03(\x0b\x32\x38.solana.storage.ConfirmedBlock.MessageAddressTableLookup\"~\n\rMessageHeader\x12\x1f\n\x17num_required_signatures\x18\x01 \x01(\r\x12$\n\x1cnum_readonly_signed_accounts\x18\x02 \x01(\r\x12&\n\x1enum_readonly_unsigned_accounts\x18\x03 \x01(\r\"d\n\x19MessageAddressTableLookup\x12\x13\n\x0b\x61\x63\x63ount_key\x18\x01 \x01(\x0c\x12\x18\n\x10writable_indexes\x18\x02 \x01(\x0c\x12\x18\n\x10readonly_indexes\x18\x03 \x01(\x0c\"\xda\x05\n\x15TransactionStatusMeta\x12<\n\x03\x65rr\x18\x01 \x01(\x0b\x32/.solana.storage.ConfirmedBlock.TransactionError\x12\x0b\n\x03\x66\x65\x65\x18\x02 \x01(\x04\x12\x14\n\x0cpre_balances\x18\x03 \x03(\x04\x12\x15\n\rpost_balances\x18\x04 \x03(\x04\x12L\n\x12inner_instructions\x18\x05 \x03(\x0b\x32\x30.solana.storage.ConfirmedBlock.InnerInstructions\x12\x1f\n\x17inner_instructions_none\x18\n \x01(\x08\x12\x14\n\x0clog_messages\x18\x06 \x03(\t\x12\x19\n\x11log_messages_none\x18\x0b \x01(\x08\x12G\n\x12pre_token_balances\x18\x07 \x03(\x0b\x32+.solana.storage.ConfirmedBlock.TokenBalance\x12H\n\x13post_token_balances\x18\x08 \x03(\x0b\x32+.solana.storage.ConfirmedBlock.TokenBalance\x12\x36\n\x07rewards\x18\t \x03(\x0b\x32%.solana.storage.ConfirmedBlock.Reward\x12!\n\x19loaded_writable_addresses\x18\x0c \x03(\x0c\x12!\n\x19loaded_readonly_addresses\x18\r \x03(\x0c\x12>\n\x0breturn_data\x18\x0e \x01(\x0b\x32).solana.storage.ConfirmedBlock.ReturnData\x12\x18\n\x10return_data_none\x18\x0f \x01(\x08\x12#\n\x16\x63ompute_units_consumed\x18\x10 \x01(\x04H\x00\x88\x01\x01\x42\x19\n\x17_compute_units_consumed\"\x1f\n\x10TransactionError\x12\x0b\n\x03\x65rr\x18\x01 \x01(\x0c\"i\n\x11InnerInstructions\x12\r\n\x05index\x18\x01 \x01(\r\x12\x45\n\x0cinstructions\x18\x02 \x03(\x0b\x32/.solana.storage.ConfirmedBlock.InnerInstruction\"x\n\x10InnerInstruction\x12\x18\n\x10program_id_index\x18\x01 \x01(\r\x12\x10\n\x08\x61\x63\x63ounts\x18\x02 \x01(\x0c\x12\x0c\n\x04\x64\x61ta\x18\x03 \x01(\x0c\x12\x19\n\x0cstack_height\x18\x04 \x01(\rH\x00\x88\x01\x01\x42\x0f\n\r_stack_height\"O\n\x13\x43ompiledInstruction\x12\x18\n\x10program_id_index\x18\x01 \x01(\r\x12\x10\n\x08\x61\x63\x63ounts\x18\x02 \x01(\x0c\x12\x0c\n\x04\x64\x61ta\x18\x03 \x01(\x0c\"\x9d\x01\n\x0cTokenBalance\x12\x15\n\raccount_index\x18\x01 \x01(\r\x12\x0c\n\x04mint\x18\x02 \x01(\t\x12\x45\n\x0fui_token_amount\x18\x03 \x01(\x0b\x32,.solana.storage.ConfirmedBlock.UiTokenAmount\x12\r\n\x05owner\x18\x04 \x01(\t\x12\x12\n\nprogram_id\x18\x05 \x01(\t\"^\n\rUiTokenAmount\x12\x11\n\tui_amount\x18\x01 \x01(\x01\x12\x10\n\x08\x64\x65\x63imals\x18\x02 \x01(\r\x12\x0e\n\x06\x61mount\x18\x03 \x01(\t\x12\x18\n\x10ui_amount_string\x18\x04 \x01(\t\".\n\nReturnData\x12\x12\n\nprogram_id\x18\x01 \x01(\x0c\x12\x0c\n\x04\x64\x61ta\x18\x02 \x01(\x0c\"\x94\x01\n\x06Reward\x12\x0e\n\x06pubkey\x18\x01 \x01(\t\x12\x10\n\x08lamports\x18\x02 \x01(\x03\x12\x14\n\x0cpost_balance\x18\x03 \x01(\x04\x12>\n\x0breward_type\x18\x04 \x01(\x0e\x32).solana.storage.ConfirmedBlock.RewardType\x12\x12\n\ncommission\x18\x05 \x01(\t\"\x87\x01\n\x07Rewards\x12\x36\n\x07rewards\x18\x01 \x03(\x0b\x32%.solana.storage.ConfirmedBlock.Reward\x12\x44\n\x0enum_partitions\x18\x02 \x01(\x0b\x32,.solana.storage.ConfirmedBlock.NumPartitions\"\"\n\rUnixTimestamp\x12\x11\n\ttimestamp\x18\x01 \x01(\x03\"#\n\x0b\x42lockHeight\x12\x14\n\x0c\x62lock_height\x18\x01 \x01(\x04\"\'\n\rNumPartitions\x12\x16\n\x0enum_partitions\x18\x01 \x01(\x04*I\n\nRewardType\x12\x0f\n\x0bUnspecified\x10\x00\x12\x07\n\x03\x46\x65\x65\x10\x01\x12\x08\n\x04Rent\x10\x02\x12\x0b\n\x07Staking\x10\x03\x12\n\n\x06Voting\x10\x04\x42;Z9github.com/rpcpool/yellowstone-grpc/examples/golang/protob\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'solana_storage_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'Z9github.com/rpcpool/yellowstone-grpc/examples/golang/proto'
  _globals['_REWARDTYPE']._serialized_start=3042
  _globals['_REWARDTYPE']._serialized_end=3115
  _globals['_CONFIRMEDBLOCK']._serialized_start=56
  _globals['_CONFIRMEDBLOCK']._serialized_end=473
  _globals['_CONFIRMEDTRANSACTION']._serialized_start=476
  _globals['_CONFIRMEDTRANSACTION']._serialized_end=631
  _globals['_TRANSACTION']._serialized_start=633
  _globals['_TRANSACTION']._serialized_end=723
  _globals['_MESSAGE']._serialized_start=726
  _globals['_MESSAGE']._serialized_end=1027
  _globals['_MESSAGEHEADER']._serialized_start=1029
  _globals['_MESSAGEHEADER']._serialized_end=1155
  _globals['_MESSAGEADDRESSTABLELOOKUP']._serialized_start=1157
  _globals['_MESSAGEADDRESSTABLELOOKUP']._serialized_end=1257
  _globals['_TRANSACTIONSTATUSMETA']._serialized_start=1260
  _globals['_TRANSACTIONSTATUSMETA']._serialized_end=1990
  _globals['_TRANSACTIONERROR']._serialized_start=1992
  _globals['_TRANSACTIONERROR']._serialized_end=2023
  _globals['_INNERINSTRUCTIONS']._serialized_start=2025
  _globals['_INNERINSTRUCTIONS']._serialized_end=2130
  _globals['_INNERINSTRUCTION']._serialized_start=2132
  _globals['_INNERINSTRUCTION']._serialized_end=2252
  _globals['_COMPILEDINSTRUCTION']._serialized_start=2254
  _globals['_COMPILEDINSTRUCTION']._serialized_end=2333
  _globals['_TOKENBALANCE']._serialized_start=2336
  _globals['_TOKENBALANCE']._serialized_end=2493
  _globals['_UITOKENAMOUNT']._serialized_start=2495
  _globals['_UITOKENAMOUNT']._serialized_end=2589
  _globals['_RETURNDATA']._serialized_start=2591
  _globals['_RETURNDATA']._serialized_end=2637
  _globals['_REWARD']._serialized_start=2640
  _globals['_REWARD']._serialized_end=2788
  _globals['_REWARDS']._serialized_start=2791
  _globals['_REWARDS']._serialized_end=2926
  _globals['_UNIXTIMESTAMP']._serialized_start=2928
  _globals['_UNIXTIMESTAMP']._serialized_end=2962
  _globals['_BLOCKHEIGHT']._serialized_start=2964
  _globals['_BLOCKHEIGHT']._serialized_end=2999
  _globals['_NUMPARTITIONS']._serialized_start=3001
  _globals['_NUMPARTITIONS']._serialized_end=3040
# @@protoc_insertion_point(module_scope)
