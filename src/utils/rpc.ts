import * as fs from "fs/promises";
import * as path from "path";
import { promisify } from "util";
import { exec } from "child_process";
import { FOUNDRY_PATHS } from "./command.js";

const execAsync = promisify(exec);

export const DEFAULT_RPC_URL = process.env.RPC_URL || "http://localhost:8545";

export async function resolveRpcUrl(rpcUrl?: string): Promise<string> {
  if (!rpcUrl) {
    return DEFAULT_RPC_URL;
  }
  
  // Handle alias lookup in foundry config
  if (!rpcUrl.startsWith('http')) {
    try {
      // Try to find the RPC endpoint in foundry config
      const configPath = path.join(FOUNDRY_PATHS.homeDir, '.foundry', 'config.toml');
      const configExists = await fs.access(configPath).then(() => true).catch(() => false);
      
      if (configExists) {
        const configContent = await fs.readFile(configPath, 'utf8');
        const rpcMatch = new RegExp(`\\[rpc_endpoints\\][\\s\\S]*?${rpcUrl}\\s*=\\s*["']([^"']+)["']`).exec(configContent);
        
        if (rpcMatch && rpcMatch[1]) {
          return rpcMatch[1];
        }
      }
    } catch (error) {
      console.error("Error resolving RPC from config:", error);
    }
  }
  
  return rpcUrl;
}

export async function getAnvilInfo(): Promise<{running: boolean, port?: string, url?: string}> {
  try {
    const { stdout } = await execAsync('ps aux | grep anvil | grep -v grep');
    if (!stdout) {
      return { running: false };
    }
    
    const portMatch = stdout.match(/--port\s+(\d+)/);
    const port = portMatch ? portMatch[1] : '8545';
    
    return {
      running: true,
      port,
      url: `http://localhost:${port}`
    };
  } catch (error) {
    return { running: false };
  }
}