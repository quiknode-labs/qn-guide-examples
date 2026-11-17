import { startMonitor } from "./monitor.js";
try {
  const monitor = await startMonitor({
    endpoint: process.env.QUICKNODE_ENDPOINT ?? "",
    coin: process.env.COIN ?? "xyz:NVDA",
  });
  process.once("SIGINT", () => monitor.stop());
  process.once("SIGTERM", () => monitor.stop());
} catch {
  console.error(
    "Monitor could not start. Check the HTTPS endpoint, HIP-3 market, network access, and Build+ streaming access."
  );
  process.exitCode = 1;
}
