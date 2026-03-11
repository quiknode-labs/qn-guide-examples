export type StreamStatus = "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

export interface SSEMessage<T = unknown> {
  event: string;
  data: T;
}
