import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCastCallTool } from "./call.js";
import { registerCastSendTool } from "./send.js";
import { registerCastBalanceTool } from "./balance.js";
import { registerCastReceiptTool } from "./receipt.js";
import { registerCastChainTool } from "./chain.js";

export function registerAllCastTools(server: McpServer): void {
  registerCastCallTool(server);
  registerCastSendTool(server);
  registerCastBalanceTool(server);
  registerCastReceiptTool(server);
  registerCastChainTool(server);
}