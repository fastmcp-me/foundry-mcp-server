import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";
import * as dotenv from "dotenv"
import { executeCommand, checkFoundryInstalled, FOUNDRY_PATHS } from "./utils/command.js";
import { registerAllCastTools } from "./tools/cast/index.js";
import { registerAllAnvilTools } from "./tools/anvil/index.js";
import { registerForgeScriptTool } from "./tools/forge/script.js";
import { registerConvertEthUnitsTool } from "./tools/utils/convert.js";
import { registerCreateSolidityFileTool } from "./tools/files/create.js";
import { registerAllResources } from "./resources/index.js";

dotenv.config();

const server = new McpServer({
  name: "Foundry MCP Server",
  version: "0.1.0"
}, {
  instructions: `
Foundry MCP Server - Comprehensive EVM-compatible blockchains (Ethereum, Optimism, etc.,) development toolkit integration

🔧 **Core Tools Available:**
- **Cast**: EVM RPC client for blockchain interaction (calls, transactions, balances, receipts, chain info)
- **Anvil**: Local reth test node management (start/stop/status)
- **Forge**: Smart contract development framework (script execution, project management)
- **File Management**: Solidity file creation and workspace operations
- **Utilities**: Unit conversion, address computation, contract analysis

📁 **Workspace:** Persistent development environment at ~/.mcp-foundry-workspace
🌐 **Networks:** Supports local (Anvil) and remote EVM chains with automatic RPC resolution
🔐 **Security:** Optional private key integration for transaction signing (development use)

**Quick Start:**
1. Ensure Foundry is installed (~/.foundry/bin/)
2. Set RPC_URL and PRIVATE_KEY environment variables (optional)
3. Use tools to deploy, test, and interact with smart contracts

**Resources:**
- anvil://status - Live Anvil node status and configuration
- contract://{address}/source - Contract source code from Etherscan
  `
});

 const FOUNDRY_WORKSPACE = path.join(os.homedir(), '.mcp-foundry-workspace');

 async function ensureWorkspaceInitialized() {
  try {
     await fs.mkdir(FOUNDRY_WORKSPACE, { recursive: true });
    
     const isForgeProject = await fs.access(path.join(FOUNDRY_WORKSPACE, 'foundry.toml'))
      .then(() => true)
      .catch(() => false);
    
    if (!isForgeProject) {
       await executeCommand(`cd ${FOUNDRY_WORKSPACE} && ${FOUNDRY_PATHS.forgePath} init --no-git`);
    }
    
    return FOUNDRY_WORKSPACE;
  } catch (error) {
    console.error("Error initializing workspace:", error);
    throw error;
  }
}

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