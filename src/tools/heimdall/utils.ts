import * as path from "path";
import * as os from "os";
import * as fs from "fs/promises";
import { checkHeimdallInstalled, HEIMDALL_NOT_INSTALLED_ERROR } from "../../utils/command.js";

export const HEIMDALL_DEFAULT_OUTPUT_PATH = "~/.mcp-foundry-workspace/heimdall-output/";
export const DEFAULT_RPC_URL = "http://localhost:8545";

export async function checkHeimdallOrError() {
  const heimdallInstalled = await checkHeimdallInstalled();
  if (!heimdallInstalled) {
    return {
      content: [{ type: "text" as const, text: HEIMDALL_NOT_INSTALLED_ERROR }],
      isError: true
    };
  }
  return null;
}

export function getHeimdallOutputDir(customDir?: string): string {
  if (customDir) {
    return customDir;
  }
  
  // Default to ~/.mcp-foundry-workspace/heimdall-output
  const homeDir = os.homedir();
  const workspaceDir = path.join(homeDir, '.mcp-foundry-workspace');
  return path.join(workspaceDir, 'heimdall-output');
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
  }
}

export async function readOutputFiles(outputDir: string, fileName?: string): Promise<string> {
  try {
    const files = await fs.readdir(outputDir);
    let targetFiles = files;
    
    if (fileName) {
      targetFiles = files.filter(file => file.includes(fileName));
    }
    
    if (targetFiles.length === 0) {
      return "No output files found in the directory.";
    }
    
    let content = "";
    for (const file of targetFiles) {
      const filePath = path.join(outputDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        content += `\n=== ${file} ===\n${fileContent}\n`;
      }
    }
    
    return content || "Output files are empty.";
  } catch (error) {
    return `Error reading output files: ${error instanceof Error ? error.message : String(error)}`;
  }
}