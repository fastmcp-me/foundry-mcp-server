import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { checkFoundryInstalled, executeCommand, FOUNDRY_PATHS, FOUNDRY_NOT_INSTALLED_ERROR } from "../../utils/command.js";
import { resolveRpcUrl } from "../../utils/rpc.js";

export function registerCastCallTool(server: McpServer): void {
  server.tool(
    "cast_call",
    "Call a contract function (read-only)",
    {
      contractAddress: z.string().describe("Address of the contract"),
      functionSignature: z.string().describe("Function signature (e.g., 'balanceOf(address)')"),
      args: z.array(z.string()).optional().describe("Function arguments"),
      rpcUrl: z.string().optional().describe("JSON-RPC URL (default: http://localhost:8545)"),
      blockNumber: z.string().optional().describe("Block number (e.g., 'latest', 'earliest', or a number)"),
      from: z.string().optional().describe("Address to perform the call as")
    },
    async ({ contractAddress, functionSignature, args = [], rpcUrl, blockNumber, from }) => {
      const installed = await checkFoundryInstalled();
      if (!installed) {
        return {
          content: [{ type: "text", text: FOUNDRY_NOT_INSTALLED_ERROR }],
          isError: true
        };
      }

      const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
      let command = `${FOUNDRY_PATHS.castPath} call ${contractAddress} "${functionSignature}"`;
      
      if (args.length > 0) {
        command += " " + args.join(" ");
      }
      
      if (resolvedRpcUrl) {
        command += ` --rpc-url "${resolvedRpcUrl}"`;
      }
      
      if (blockNumber) {
        command += ` --block ${blockNumber}`;
      }
      
      if (from) {
        command += ` --from ${from}`;
      }
      
      const result = await executeCommand(command);
      
      let formattedOutput = result.message;
      if (result.success) {
        // Try to detect arrays and format them better
        if (formattedOutput.includes('\n') && !formattedOutput.includes('Error')) {
          formattedOutput = formattedOutput.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
        }
      }
      
      return {
        content: [{ 
          type: "text", 
          text: result.success 
            ? `Call to ${contractAddress}.${functionSignature.split('(')[0]} result:\n${formattedOutput}` 
            : `Call failed: ${result.message}` 
        }],
        isError: !result.success
      };
    }
  );
}