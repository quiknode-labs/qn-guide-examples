import { startMonitor } from "./monitor.js";
try {
  const monitor = await startMonitor(
    {
      endpoint: process.env.QUICKNODE_ENDPOINT ?? "",
      coin: process.env.COIN ?? "xyz:NVDA",
    },
    (event) => {
      if (event.type === "configuration_error") process.exitCode = 1;
      console.log(JSON.stringify(event));
    }
  );
  process.once("SIGINT", () => monitor.stop());
  process.once("SIGTERM", () => monitor.stop());
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown startup error.";
  console.error("Monitor could not start.", message);
  process.exitCode = 1;
}
