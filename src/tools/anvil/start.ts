import { z } from "zod";
import { exec } from "child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { checkFoundryInstalled, FOUNDRY_PATHS, FOUNDRY_NOT_INSTALLED_ERROR } from "../../utils/command.js";
import { getAnvilInfo } from "../../utils/rpc.js";

export function registerAnvilStartTool(server: McpServer): void {
  server.tool(
    "anvil_start",
    "Start a new Anvil instance (local Ethereum node)",
    {
      port: z.number().optional().describe("Port to listen on (default: 8545)"),
      blockTime: z.number().optional().describe("Block time in seconds (default: 0 - mine on demand)"),
      forkUrl: z.string().optional().describe("URL of the JSON-RPC endpoint to fork from"),
      forkBlockNumber: z.number().optional().describe("Block number to fork from"),
      accounts: z.number().optional().describe("Number of accounts to generate (default: 10)"),
      mnemonic: z.string().optional().describe("BIP39 mnemonic phrase to generate accounts from"),
      silent: z.boolean().optional().describe("Suppress anvil output (default: false)")
    },
    async ({ port = 8545, blockTime, forkUrl, forkBlockNumber, accounts, mnemonic, silent = false }) => {
      const installed = await checkFoundryInstalled();
      if (!installed) {
        return {
          content: [{ type: "text", text: FOUNDRY_NOT_INSTALLED_ERROR }],
          isError: true
        };
      }

      // Check if anvil is already running
      const anvilInfo = await getAnvilInfo();
      if (anvilInfo.running) {
        return {
          content: [{ 
            type: "text", 
            text: `Anvil is already running on port ${anvilInfo.port}.`
          }],
          isError: true
        };
      }

      let command = `${FOUNDRY_PATHS.anvilPath} --port ${port}`;
      
      if (blockTime !== undefined) {
        command += ` --block-time ${blockTime}`;
      }
      
      if (forkUrl) {
        command += ` --fork-url "${forkUrl}"`;
        
        if (forkBlockNumber !== undefined) {
          command += ` --fork-block-number ${forkBlockNumber}`;
        }
      }
      
      if (accounts !== undefined) {
        command += ` --accounts ${accounts}`;
      }
      
      if (mnemonic) {
        command += ` --mnemonic "${mnemonic}"`;
      }
      
      try {
        // Start anvil in the background
        const child = exec(command, (error, stdout, stderr) => {
          if (error && !silent) {
            console.error(`Anvil error: ${error.message}`);
          }
          if (stderr && !silent) {
            console.error(`Anvil stderr: ${stderr}`);
          }
          if (stdout && !silent) {
            console.log(`Anvil stdout: ${stdout}`);
          }
        });
        
        // Give it a moment to start
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if it started successfully
        const newAnvilInfo = await getAnvilInfo();
        if (newAnvilInfo.running) {
          return {
            content: [{ 
              type: "text", 
              text: `Anvil started successfully on port ${port}. ` +
                    `RPC URL: http://localhost:${port}\n` +
                    `Process ID: ${child.pid}`
            }]
          };
        } else {
          return {
            content: [{ 
              type: "text", 
              text: `Failed to start Anvil. Check system logs for details.`
            }],
            isError: true
          };
        }
      } catch (error) {
        return {
          content: [{ 
            type: "text", 
            text: `Error starting Anvil: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );
}