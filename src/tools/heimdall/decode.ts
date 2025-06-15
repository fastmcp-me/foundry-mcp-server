import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { executeCommand, FOUNDRY_PATHS } from "../../utils/command.js";
import { getHeimdallOutputDir, DEFAULT_RPC_URL, checkHeimdallOrError } from "./utils.js";

export function registerHeimdallDecodeTool(server: McpServer): void {
  server.tool(
    "heimdall_decode",
    "Decode raw calldata without requiring ABI using Heimdall",
    {
      target: z.string().describe("Transaction hash or string of bytes to decode"),
      rpcUrl: z.string().optional().describe(`EVM network RPC URL (default: ${DEFAULT_RPC_URL})`),
      openaiApiKey: z.string().optional().describe("OpenAI API key for explaining calldata"),
      explain: z.boolean().optional().describe("Explain the decoded calldata using OpenAI (default: false)"),
      useDefaults: z.boolean().optional().describe("Always select default values when prompted (default: false)"),
      truncateCalldata: z.boolean().optional().describe("Truncate nonstandard sized calldata (default: false)"),
      skipResolving: z.boolean().optional().describe("Skip resolving selectors and guess types (default: false)"),
      verbosity: z.enum(["quiet", "normal", "verbose"]).optional().describe("Output verbosity level (default: normal)"),
      outputDir: z.string().optional().describe("Not used (console output only)")
    },
    async ({ target, rpcUrl, openaiApiKey, explain, useDefaults, truncateCalldata, skipResolving, verbosity, outputDir }) => {
      const installError = await checkHeimdallOrError();
      if (installError) return installError;

      const finalOutputDir = getHeimdallOutputDir(outputDir);
      
      let command = `${FOUNDRY_PATHS.heimdallPath} decode "${target}"`;
      
      if (rpcUrl) {
        command += ` -r "${rpcUrl}"`;
      }
      
      if (openaiApiKey) {
        command += ` --openai-api-key "${openaiApiKey}"`;
      }
      
      if (explain) {
        command += " --explain";
      }
      
      if (useDefaults) {
        command += " -d";
      }
      
      if (truncateCalldata) {
        command += " --truncate-calldata";
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
      
      // Results will be printed to console
      const result = await executeCommand(command);
      
      if (!result.success) {
        return {
          content: [{ type: "text", text: `Heimdall decode failed: ${result.message}` }],
          isError: true
        };
      }

      const resultText = `Decoded calldata for ${target}:\n\n${result.message}`;

      return {
        content: [{ 
          type: "text", 
          text: resultText
        }]
      };
    }
  );
}