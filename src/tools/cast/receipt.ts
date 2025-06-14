import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { checkFoundryInstalled, executeCommand, FOUNDRY_PATHS, FOUNDRY_NOT_INSTALLED_ERROR } from "../../utils/command.js";
import { resolveRpcUrl } from "../../utils/rpc.js";

export function registerCastReceiptTool(server: McpServer): void {
  server.tool(
    "cast_receipt",
    "Get the transaction receipt",
    {
      txHash: z.string().describe("Transaction hash"),
      rpcUrl: z.string().optional().describe("JSON-RPC URL (default: http://localhost:8545)"),
      confirmations: z.number().optional().describe("Number of confirmations to wait for"),
      field: z.string().optional().describe("Specific field to extract (e.g., 'blockNumber', 'status')")
    },
    async ({ txHash, rpcUrl, confirmations, field }) => {
      const installed = await checkFoundryInstalled();
      if (!installed) {
        return {
          content: [{ type: "text", text: FOUNDRY_NOT_INSTALLED_ERROR }],
          isError: true
        };
      }

      const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
      let command = `${FOUNDRY_PATHS.castPath} receipt ${txHash}`;
      
      if (resolvedRpcUrl) {
        command += ` --rpc-url "${resolvedRpcUrl}"`;
      }
      
      if (confirmations) {
        command += ` --confirmations ${confirmations}`;
      }
      
      if (field) {
        command += ` ${field}`;
      }
      
      const result = await executeCommand(command);
      
      return {
        content: [{ 
          type: "text", 
          text: result.success 
            ? `Transaction receipt for ${txHash}${field ? ` (${field})` : ""}:\n${result.message}` 
            : `Failed to get receipt: ${result.message}` 
        }],
        isError: !result.success
      };
    }
  );
}