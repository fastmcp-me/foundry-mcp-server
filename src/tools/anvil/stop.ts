import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { promisify } from "util";
import { exec } from "child_process";
import * as os from "os";
import { getAnvilInfo } from "../../utils/rpc.js";

const execAsync = promisify(exec);

export function registerAnvilStopTool(server: McpServer): void {
  server.tool(
    "anvil_stop",
    "Stop a running Anvil instance",
    {},
    async () => {
      const anvilInfo = await getAnvilInfo();
      if (!anvilInfo.running) {
        return {
          content: [{ 
            type: "text", 
            text: "No Anvil instance is currently running."
          }],
          isError: true
        };
      }

      try {
        // Kill the anvil process
        if (os.platform() === 'win32') {
          await execAsync('taskkill /F /IM anvil.exe');
        } else {
          await execAsync('pkill -f anvil');
        }
        
        // Check if it was stopped successfully
        await new Promise(resolve => setTimeout(resolve, 500));
        const newAnvilInfo = await getAnvilInfo();
        
        if (!newAnvilInfo.running) {
          return {
            content: [{ 
              type: "text", 
              text: "Anvil has been stopped successfully."
            }]
          };
        } else {
          return {
            content: [{ 
              type: "text", 
              text: "Failed to stop Anvil. It may still be running."
            }],
            isError: true
          };
        }
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error stopping Anvil: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );
}