import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAnvilInfo } from "../../utils/rpc.js";

export function registerAnvilStatusTool(server: McpServer): void {
  server.tool(
    "anvil_status",
    "Check if Anvil is running and get its status",
    {},
    async () => {
      const anvilInfo = await getAnvilInfo();
      
      return {
        content: [{ 
          type: "text", 
          text: anvilInfo.running
            ? `Anvil is running on port ${anvilInfo.port}. RPC URL: ${anvilInfo.url}`
            : "Anvil is not currently running."
        }]
      };
    }
  );
}