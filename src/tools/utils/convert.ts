import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { checkFoundryInstalled, executeCommand, FOUNDRY_PATHS, FOUNDRY_NOT_INSTALLED_ERROR } from "../../utils/command.js";

export function registerConvertEthUnitsTool(server: McpServer): void {
  server.tool(
    "convert_eth_units",
    "Convert between Ethereum units (wei, gwei, ether)",
    {
      value: z.string().describe("Value to convert"),
      fromUnit: z.enum(["wei", "gwei", "ether"]).describe("Source unit"),
      toUnit: z.enum(["wei", "gwei", "ether"]).describe("Target unit")
    },
    async ({ value, fromUnit, toUnit }) => {
      const installed = await checkFoundryInstalled();
      if (!installed) {
        return {
          content: [{ type: "text", text: FOUNDRY_NOT_INSTALLED_ERROR }],
          isError: true
        };
      }

      const command = `${FOUNDRY_PATHS.castPath} to-unit ${value}${fromUnit} ${toUnit}`;
      const result = await executeCommand(command);
      
      return {
        content: [{ 
          type: "text", 
          text: result.success 
            ? `${value} ${fromUnit} = ${result.message.trim()} ${toUnit}` 
            : `Conversion failed: ${result.message}` 
        }],
        isError: !result.success
      };
    }
  );
}