import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { checkFoundryInstalled, executeCommand, FOUNDRY_PATHS, FOUNDRY_NOT_INSTALLED_ERROR } from "../../utils/command.js";
import { resolveRpcUrl } from "../../utils/rpc.js";

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

export function registerForgeScriptTool(server: McpServer): void {
  server.tool(
    "forge_script",
    "Run a Forge script from the workspace",
    {
      scriptPath: z.string().describe("Path to the script file (e.g., 'script/Deploy.s.sol')"),
      sig: z.string().optional().describe("Function signature to call (default: 'run()')"),
      rpcUrl: z.string().optional().describe("JSON-RPC URL (default: http://localhost:8545)"),
      broadcast: z.boolean().optional().describe("Broadcast the transactions"),
      verify: z.boolean().optional().describe("Verify the contract on Etherscan (needs API key)")
    },
    async ({ scriptPath, sig = "run()", rpcUrl, broadcast = false, verify = false }) => {
      const installed = await checkFoundryInstalled();
      if (!installed) {
        return {
          content: [{ type: "text", text: FOUNDRY_NOT_INSTALLED_ERROR }],
          isError: true
        };
      }

      try {
        const workspace = await ensureWorkspaceInitialized();
        
        // Check if script exists
        const scriptFullPath = path.join(workspace, scriptPath);
        const scriptExists = await fs.access(scriptFullPath).then(() => true).catch(() => false);
        if (!scriptExists) {
          return {
            content: [{ 
              type: "text", 
              text: `Script does not exist at ${scriptFullPath}` 
            }],
            isError: true
          };
        }

        const resolvedRpcUrl = await resolveRpcUrl(rpcUrl);
        let command = `cd ${workspace} && ${FOUNDRY_PATHS.forgePath} script ${scriptPath} --sig "${sig}"`;
        
        if (resolvedRpcUrl) {
          command += ` --rpc-url "${resolvedRpcUrl}"`;
        }
        
        if (broadcast) {
          command += ` --broadcast`;
        }
        
        if (verify) {
          command += ` --verify`;
        }
        
        const result = await executeCommand(command);
        
        return {
          content: [{ 
            type: "text", 
            text: result.success 
              ? `Script executed successfully:\n${result.message}` 
              : `Script execution failed: ${result.message}` 
          }],
          isError: !result.success
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error executing script: ${error instanceof Error ? error.message : String(error)}` 
          }],
          isError: true
        };
      }
    }
  );
}