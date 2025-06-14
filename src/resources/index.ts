import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAnvilInfo } from "../utils/rpc.js";
import { executeCommand, FOUNDRY_PATHS } from "../utils/command.js";

export function registerAllResources(server: McpServer): void {
  registerAnvilStatusResource(server);
  registerContractSourceResource(server);
}

function registerAnvilStatusResource(server: McpServer): void {
  server.resource(
    "anvil_status",
    "anvil://status",
    async (uri) => {
      const info = await getAnvilInfo();
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(info, null, 2)
        }]
      };
    }
  );
}

function registerContractSourceResource(server: McpServer): void {
  server.resource(
    "contract_source",
    new ResourceTemplate("contract://{address}/source", { list: undefined }),
    async (uri, { address }) => {
      try {
        const command = `${FOUNDRY_PATHS.castPath} etherscan-source ${address}`;
        const { success, message } = await executeCommand(command);
        
        if (success) {
          return {
            contents: [{
              uri: uri.href,
              text: message
            }]
          };
        } else {
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify({ error: "Could not retrieve contract source", details: message })
            }]
          };
        }
      } catch (error) {
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({ error: "Failed to retrieve contract source" })
          }]
        };
      }
    }
  );
}