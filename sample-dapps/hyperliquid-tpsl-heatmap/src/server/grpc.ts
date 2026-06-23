import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const protoPath = path.join(rootDir, 'proto/orderbook.proto');

export function createGrpcClient(endpoint: string, token: string) {
  const packageDef = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const proto = grpc.loadPackageDefinition(packageDef) as any;

  const client = new proto.hyperliquid.OrderBookStreaming(endpoint, grpc.credentials.createSsl(), {
    'grpc.max_receive_message_length': 100 * 1024 * 1024,
  });

  const metadata = new grpc.Metadata();
  metadata.add('x-token', token);

  return { client, metadata };
}
