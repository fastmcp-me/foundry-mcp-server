import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { executeCommand, FOUNDRY_PATHS } from "../../utils/command.js";
import { getHeimdallOutputDir, HEIMDALL_DEFAULT_OUTPUT_PATH, DEFAULT_RPC_URL, checkHeimdallOrError } from "./utils.js";

export function registerHeimdallInspectTool(server: McpServer): void {
  server.tool(
    "heimdall_inspect",
    "Detailed inspection of Ethereum transactions including calldata decoding, trace analysis, and log visualization using Heimdall",
    {
      target: z.string().describe("Transaction hash to inspect"),
      rpcUrl: z.string().optional().describe(`EVM network RPC URL (default: ${DEFAULT_RPC_URL})`),
      useDefaults: z.boolean().optional().describe("Always select default values when prompted (default: false)"),
      transposeApiKey: z.string().optional().describe("Optional Transpose.io API Key for resolving contract labels"),
      fileName: z.string().optional().describe("Name for the output files"),
      skipResolving: z.boolean().optional().describe("Skip resolving function selectors and contract labels (default: false)"),
      verbosity: z.enum(["quiet", "normal", "verbose"]).optional().describe("Output verbosity level (default: normal)"),
      outputDir: z.string().optional().describe(`Output directory (default: ${HEIMDALL_DEFAULT_OUTPUT_PATH})`)
    },
    async ({ target, rpcUrl, useDefaults, transposeApiKey, fileName, skipResolving, verbosity, outputDir }) => {
      const installError = await checkHeimdallOrError();
      if (installError) return installError;

      const finalOutputDir = getHeimdallOutputDir(outputDir);
      
      let command = `${FOUNDRY_PATHS.heimdallPath} inspect "${target}"`;
      
      if (rpcUrl) {
        command += ` -r "${rpcUrl}"`;
      }
      
      if (useDefaults) {
        command += " -d";
      }
      
      if (transposeApiKey) {
        command += ` -t "${transposeApiKey}"`;
      }
      
      if (fileName) {
        command += ` -n "${fileName}"`;
      }
      
      if (skipResolving) {
        command += " --skip-resolving";
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
          content: [{ type: "text", text: `Heimdall transaction inspection failed: ${result.message}` }],
          isError: true
        };
      }

      const resultText = `Transaction inspection for ${target} saved to: ${finalOutputDir}\n\n${result.message}`;

      return {
        content: [{ 
          type: "text", 
          text: resultText
        }]
      };
    }
  );
}