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
  let bboAttempt = 0;
  let tpslAttempt = 0;

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

  const connectBbo = () => {
    const { client, metadata } = createGrpcClient(config.endpoint!, config.token!);
    const stream = client.StreamBboBook({ coins: config.coins }, metadata);
    let reconnectScheduled = false;

    stream.on('data', (update: BboBookUpdate) => {
      store.applyBbo(update);
      bboAttempt = 0;
      streamState.bbo = true;
      streamState.issue = '';
      publish();
    });

    const reconnect = (err?: grpc.ServiceError) => {
      if (reconnectScheduled) return;
      reconnectScheduled = true;
      streamState.bbo = false;
      scheduleReconnect('BBO', err, connectBbo, bboAttempt, streamState, publish);
      bboAttempt += 1;
    };

    stream.on('error', reconnect);
    stream.on('end', () => reconnect());
  };

  const connectTpsl = () => {
    const { client, metadata } = createGrpcClient(config.endpoint!, config.token!);
    const stream = client.StreamTpslUpdates({ coins: config.coins }, metadata);
    let reconnectScheduled = false;

    stream.on('data', (update: TpslUpdatesUpdate) => {
      store.applyTpslUpdate(update);
      tpslAttempt = 0;
      streamState.tpsl = true;
      if (update.snapshot) streamState.snapshot = true;
      streamState.issue = '';
      publish();
    });

    const reconnect = (err?: grpc.ServiceError) => {
      if (reconnectScheduled) return;
      reconnectScheduled = true;
      streamState.tpsl = false;
      streamState.snapshot = false;
      store.clearTpslState();
      scheduleReconnect('TP/SL', err, connectTpsl, tpslAttempt, streamState, publish);
      tpslAttempt += 1;
    };

    stream.on('error', reconnect);
    stream.on('end', () => reconnect());
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
