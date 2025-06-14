import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { checkFoundryInstalled, executeCommand, FOUNDRY_PATHS, FOUNDRY_NOT_INSTALLED_ERROR } from "../../utils/command.js";
import { resolveRpcUrl } from "../../utils/rpc.js";

export function registerCastSendTool(server: McpServer): void {
  server.tool(
    "cast_send",
    "Send a transaction to a contract function",
    {
      contractAddress: z.string().describe("Address of the contract"),
      functionSignature: z.string().describe("Function signature (e.g., 'transfer(address,uint256)')"),
      args: z.array(z.string()).optional().describe("Function arguments"),
      from: z.string().optional().describe("Sender address or private key"),
      value: z.string().optional().describe("Ether value to send with the transaction (in wei)"),
      rpcUrl: z.string().optional().describe("JSON-RPC URL (default: http://localhost:8545)"),
      gasLimit: z.string().optional().describe("Gas limit for the transaction"),
      gasPrice: z.string().optional().describe("Gas price for the transaction (in wei)"),
      confirmations: z.number().optional().describe("Number of confirmations to wait for")
    },
    async ({ contractAddress, functionSignature, args = [], from, value, rpcUrl, gasLimit, gasPrice, confirmations }) => {
      const installed = await checkFoundryInstalled();
      if (!installed) {
        return {
          content: [{ type: "text", text: FOUNDRY_NOT_INSTALLED_ERROR }],
          isError: true
        };
      }

      const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
      const privateKey = process.env.PRIVATE_KEY;
      let command = `${FOUNDRY_PATHS.castPath} send ${contractAddress} "${functionSignature}" --private-key ${[privateKey]}`;
      
      if (args.length > 0) {
        command += " " + args.join(" ");
      }
      
      if (from) {
        command += ` --from ${from}`;
      }
      
      if (value) {
        command += ` --value ${value}`;
      }
      
      if (resolvedRpcUrl) {
        command += ` --rpc-url "${resolvedRpcUrl}"`;
      }
      
      if (gasLimit) {
        command += ` --gas-limit ${gasLimit}`;
      }
      
      if (gasPrice) {
        command += ` --gas-price ${gasPrice}`;
      }
      
      if (confirmations) {
        command += ` --confirmations ${confirmations}`;
      }
      
      const result = await executeCommand(command);
      
      return {
        content: [{ 
          type: "text", 
          text: result.success 
            ? `Transaction sent successfully:\n${result.message}` 
            : `Transaction failed: ${result.message}` 
        }],
        isError: !result.success
      };
    }
  );
}