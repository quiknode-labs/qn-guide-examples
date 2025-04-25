import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools";
import { registerPrompts } from "./prompts";
import { registerResources } from "./resources";

async function main() {
  try {
    // Create the MCP server
    const server = new McpServer({
      name: "EVM MCP Server",
      version: "0.1.0",
      description: "A server for LLM agents to access EVM blockchain data",
    });

    // Register all tools, prompts, and resources
    registerTools(server);
    registerPrompts(server);
    registerResources(server);

    // Start the MCP server
    const transport = new StdioServerTransport();
    await server.connect(transport);

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});


