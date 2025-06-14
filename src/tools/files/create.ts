import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { executeCommand, FOUNDRY_PATHS } from "../../utils/command.js";

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

export function registerCreateSolidityFileTool(server: McpServer): void {
  server.tool(
    "create_solidity_file",
    "Create or update a Solidity file in the workspace",
    {
      filePath: z.string().describe("Path to the file (e.g., 'src/MyContract.sol' or 'script/Deploy.s.sol')"),
      content: z.string().describe("File content"),
      overwrite: z.boolean().optional().describe("Overwrite existing file (default: false)")
    },
    async ({ filePath, content, overwrite = false }) => {
      try {
        const workspace = await ensureWorkspaceInitialized();
        const fullFilePath = path.join(workspace, filePath);
        
        const fileExists = await fs.access(fullFilePath).then(() => true).catch(() => false);
        if (fileExists && !overwrite) {
          return {
            content: [{ 
              type: "text", 
              text: `File already exists at ${fullFilePath}. Use overwrite=true to replace it.` 
            }],
            isError: true
          };
        }
        
        await fs.mkdir(path.dirname(fullFilePath), { recursive: true });
        
        await fs.writeFile(fullFilePath, content);
        
        return {
          content: [{ 
            type: "text", 
            text: `File ${fileExists ? 'updated' : 'created'} successfully at ${fullFilePath}` 
          }]
        };
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error managing file: ${error instanceof Error ? error.message : String(error)}` 
          }],
          isError: true
        };
      }
    }
  );
}