import { BaseAIAgent } from "./agent";

async function startAutonomous() {
  try {
    const agent = new BaseAIAgent();
    await agent.initialize();
    console.log("Starting autonomous mode...");
    await agent.runAutonomousMode().catch(console.error);
  } catch (error) {
    console.error("Error in autonomous mode:", error);
  }
}

if (require.main === module) {
  startAutonomous();
}
