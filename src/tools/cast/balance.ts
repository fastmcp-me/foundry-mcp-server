import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { checkFoundryInstalled, executeCommand, FOUNDRY_PATHS, FOUNDRY_NOT_INSTALLED_ERROR } from "../../utils/command.js";
import { resolveRpcUrl } from "../../utils/rpc.js";

export function registerCastBalanceTool(server: McpServer): void {
  server.tool(
    "cast_balance",
    "Check the ETH balance of an address",
    {
      address: z.string().describe("Ethereum address to check balance for"),
      rpcUrl: z.string().optional().describe("JSON-RPC URL (default: http://localhost:8545)"),
      blockNumber: z.string().optional().describe("Block number (e.g., 'latest', 'earliest', or a number)"),
      formatEther: z.boolean().optional().describe("Format the balance in Ether (default: wei)")
    },
    async ({ address, rpcUrl, blockNumber, formatEther = false }) => {
      const installed = await checkFoundryInstalled();
      if (!installed) {
        return {
          content: [{ type: "text", text: FOUNDRY_NOT_INSTALLED_ERROR }],
          isError: true
        };
      }

      const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
      let command = `${FOUNDRY_PATHS.castPath} balance ${address}`;
      
      if (resolvedRpcUrl) {
        command += ` --rpc-url "${resolvedRpcUrl}"`;
      }
      
      if (blockNumber) {
        command += ` --block ${blockNumber}`;
      }
      
      if (formatEther) {
        command += " --ether";
      }
      
      const result = await executeCommand(command);
      const unit = formatEther ? "ETH" : "wei";
      
      return {
        content: [{ 
          type: "text", 
          text: result.success 
            ? `Balance of ${address}: ${result.message.trim()} ${unit}` 
            : `Failed to get balance: ${result.message}` 
        }],
        isError: !result.success
      };
    }
  );
}