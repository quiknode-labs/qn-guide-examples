import { BaseAIAgent } from "./agent";

async function startPolling() {
  try {
    const agent = new BaseAIAgent();
    await agent.initialize();
    console.log("Starting mentions polling mode...");
    await agent.pollMentions().catch(console.error);
  } catch (error) {
    console.error("Error in polling mode:", error);
  }
}

if (require.main === module) {
  startPolling();
}
