import * as grpc from '@grpc/grpc-js';
import { BboBookUpdate, TpslUpdatesUpdate } from '../shared/types';
import { AppConfig } from './config';
import { ClusterStore } from './cluster-store';
import { createGrpcClient } from './grpc';

type Broadcast = (status: string) => void;

export function startLiveStreams(config: AppConfig, store: ClusterStore, broadcast: Broadcast): void {
  if (!config.endpoint || !config.token) {
    broadcast('Missing QUICKNODE_GRPC_ENDPOINT or QUICKNODE_GRPC_TOKEN');
    return;
  }

  const streamState = {
    bbo: false,
    tpsl: false,
    snapshot: false,
    issue: '',
  };

  const publish = () => {
    if (streamState.issue) {
      broadcast(streamState.issue);
      return;
    }
    if (streamState.bbo && streamState.tpsl) {
      broadcast(streamState.snapshot ? 'Live BBO + TP/SL connected' : 'Live BBO + TP/SL connected, loading snapshot');
      return;
    }
    if (streamState.bbo) broadcast('Live BBO connected, waiting for TP/SL');
    else if (streamState.tpsl) broadcast('Live TP/SL connected, waiting for BBO');
    else broadcast('Connecting to Quicknode gRPC streams');
  };

  const connectBbo = (attempt = 0) => {
    const { client, metadata } = createGrpcClient(config.endpoint!, config.token!);
    const stream = client.StreamBboBook({ coins: config.coins }, metadata);

    stream.on('data', (update: BboBookUpdate) => {
      store.applyBbo(update);
      streamState.bbo = true;
      streamState.issue = '';
      publish();
    });

    stream.on('error', (err: grpc.ServiceError) => {
      streamState.bbo = false;
      scheduleReconnect('BBO', err, () => connectBbo(attempt + 1), attempt, streamState, publish);
    });

    stream.on('end', () => {
      streamState.bbo = false;
      scheduleReconnect('BBO', undefined, () => connectBbo(attempt + 1), attempt, streamState, publish);
    });
  };

  const connectTpsl = (attempt = 0) => {
    const { client, metadata } = createGrpcClient(config.endpoint!, config.token!);
    const stream = client.StreamTpslUpdates({ coins: config.coins }, metadata);

    stream.on('data', (update: TpslUpdatesUpdate) => {
      store.applyTpslUpdate(update);
      streamState.tpsl = true;
      if (update.snapshot) streamState.snapshot = true;
      streamState.issue = '';
      publish();
    });

    stream.on('error', (err: grpc.ServiceError) => {
      streamState.tpsl = false;
      streamState.snapshot = false;
      scheduleReconnect('TP/SL', err, () => connectTpsl(attempt + 1), attempt, streamState, publish);
    });

    stream.on('end', () => {
      streamState.tpsl = false;
      streamState.snapshot = false;
      scheduleReconnect('TP/SL', undefined, () => connectTpsl(attempt + 1), attempt, streamState, publish);
    });
  };

  connectBbo();
  connectTpsl();
}

function scheduleReconnect(
  label: string,
  err: grpc.ServiceError | undefined,
  reconnect: () => void,
  attempt: number,
  streamState: { issue: string },
  publish: () => void
) {
  const delay = Math.min(30_000, 2_000 * 2 ** Math.min(attempt, 4));
  const detail = err ? `${label} stream error: ${err.message}` : `${label} stream ended`;
  streamState.issue = `${detail}. Reconnecting in ${Math.round(delay / 1000)}s`;
  publish();
  setTimeout(reconnect, delay);
}
