import * as path from "path";
import * as os from "os";
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