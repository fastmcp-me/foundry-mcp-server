import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { checkFoundryInstalled, executeCommand, FOUNDRY_PATHS, FOUNDRY_NOT_INSTALLED_ERROR } from "../../utils/command.js";
import { resolveRpcUrl } from "../../utils/rpc.js";

export function registerCastChainTool(server: McpServer): void {
  server.tool(
    "cast_chain",
    "Get information about the current chain",
    {
      rpcUrl: z.string().optional().describe("JSON-RPC URL (default: http://localhost:8545)"),
      returnId: z.boolean().optional().describe("Return the chain ID instead of the name (default: false)")
    },
    async ({ rpcUrl, returnId = false }) => {
      const installed = await checkFoundryInstalled();
      if (!installed) {
        return {
          content: [{ type: "text", text: FOUNDRY_NOT_INSTALLED_ERROR }],
          isError: true
        };
      }

      const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
      const command = returnId 
        ? `${FOUNDRY_PATHS.castPath} chain-id --rpc-url "${resolvedRpcUrl}"` 
        : `${FOUNDRY_PATHS.castPath} chain --rpc-url "${resolvedRpcUrl}"`;
      
      const result = await executeCommand(command);
      
      return {
        content: [{ 
          type: "text", 
          text: result.success 
            ? `Chain ${returnId ? "ID" : "name"}: ${result.message.trim()}` 
            : `Failed to get chain information: ${result.message}` 
        }],
        isError: !result.success
      };
    }
  );
}