import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as dotenv from "dotenv"
import { checkFoundryInstalled } from "./utils/command.js";
import { registerAllCastTools } from "./tools/cast/index.js";
import { registerAllAnvilTools } from "./tools/anvil/index.js";
import { registerForgeScriptTool } from "./tools/forge/script.js";
import { registerConvertEthUnitsTool } from "./tools/utils/convert.js";
import { registerCreateSolidityFileTool } from "./tools/files/create.js";
import { registerAllHeimdallTools } from "./tools/heimdall/index.js";
import { registerAllResources } from "./resources/index.js";

dotenv.config();

const server = new McpServer({
  name: "Foundry MCP Server",
  version: "0.1.0"
}, {
  instructions: `
Foundry MCP Server - Comprehensive EVM-compatible blockchains (Ethereum, Optimism, etc.,) development toolkit integration

Core Tools Available:
Cast: EVM RPC client for blockchain interaction (calls, transactions, balances, receipts, chain info)
Anvil: Local reth test node management (start/stop/status)
Forge: Smart contract development framework (script execution, project management)
Heimdall: Advanced EVM bytecode analysis toolkit (disassemble, decode, decompile, CFG, dump, inspect)
File Management: Solidity file creation and workspace operations
Utilities: Unit conversion, address computation, contract analysis

Workspace: Persistent development environment at ~/.mcp-foundry-workspace
Networks: Supports local (Anvil) and remote EVM chains with automatic RPC resolution
Security: Optional private key integration for transaction signing (development use)

Quick Start
1. Ensure Foundry is installed (~/.foundry/bin/)
2. Install Heimdall for bytecode analysis: curl -L http://get.heimdall.rs | bash && bifrost
3. Set RPC_URL and PRIVATE_KEY environment variables (optional)
4. Use tools to deploy, test, and interact with smart contracts
Resources
- anvil://status - Live Anvil node status and configuration
- contract://{address}/source - Contract source code from Etherscan
  `
});

// Register all resources
registerAllResources(server);

// Register all cast tools
registerAllCastTools(server);

// Register anvil tools
registerAllAnvilTools(server);

// Register forge tools
registerForgeScriptTool(server);

// Register utility tools
registerConvertEthUnitsTool(server);

// Register file management tools
registerCreateSolidityFileTool(server);

// Register Heimdall tools
registerAllHeimdallTools(server);

async function startServer() {
  const foundryInstalled = await checkFoundryInstalled();
  if (!foundryInstalled) {
    console.error("Error: Foundry is not installed");
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Foundry MCP Server started on stdio");
}

startServer().catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1);
});