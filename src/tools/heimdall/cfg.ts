import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { executeCommand, FOUNDRY_PATHS } from "../../utils/command.js";
import { getHeimdallOutputDir, HEIMDALL_DEFAULT_OUTPUT_PATH, DEFAULT_RPC_URL, checkHeimdallOrError } from "./utils.js";

export function registerHeimdallCfgTool(server: McpServer): void {
  server.tool(
    "heimdall_cfg",
    "Generate visual control flow graph for EVM bytecode using Heimdall",
    {
      target: z.string().describe("Contract address, bytecode, file, or ENS name to analyze"),
      rpcUrl: z.string().optional().describe(`EVM network RPC URL (default: ${DEFAULT_RPC_URL})`),
      useDefaults: z.boolean().optional().describe("Always select default values when prompted (default: false)"),
      colorEdges: z.boolean().optional().describe("Color edges based on JUMPI condition for visualizing if statements (default: false)"),
      fileName: z.string().optional().describe("Name for the output file"),
      timeout: z.number().optional().describe("Timeout for symbolic execution in milliseconds"),
      verbosity: z.enum(["quiet", "normal", "verbose"]).optional().describe("Output verbosity level (default: normal)"),
      outputDir: z.string().optional().describe(`Output directory (default: ${HEIMDALL_DEFAULT_OUTPUT_PATH})`)
    },
    async ({ target, rpcUrl, useDefaults, colorEdges, fileName, timeout, verbosity, outputDir }) => {
      const installError = await checkHeimdallOrError();
      if (installError) return installError;

      const finalOutputDir = getHeimdallOutputDir(outputDir);
      
      let command = `${FOUNDRY_PATHS.heimdallPath} cfg "${target}"`;
      
      if (rpcUrl) {
        command += ` -r "${rpcUrl}"`;
      }
      
      if (useDefaults) {
        command += " -d";
      }
      
      if (colorEdges) {
        command += " -c";
      }
      
      if (fileName) {
        command += ` -n "${fileName}"`;
      }
      
      if (timeout) {
        command += ` -t ${timeout}`;
      }
      
      if (verbosity) {
        switch (verbosity) {
          case "quiet":
            command += " -q";
            break;
          case "verbose":
            command += " -v";
            break;
        }
      }
      
      command += ` -o "${finalOutputDir}"`;

      const result = await executeCommand(command);
      
      if (!result.success) {
        return {
          content: [{ type: "text", text: `Heimdall CFG generation failed: ${result.message}` }],
          isError: true
        };
      }

      const resultText = `Control flow graph for ${target} saved to: ${finalOutputDir}\n\n${result.message}`;

      return {
        content: [{ 
          type: "text", 
          text: resultText
        }]
      };
    }
  );
}