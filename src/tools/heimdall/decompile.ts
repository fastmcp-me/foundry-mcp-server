import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { executeCommand, FOUNDRY_PATHS } from "../../utils/command.js";
import { getHeimdallOutputDir, HEIMDALL_DEFAULT_OUTPUT_PATH, DEFAULT_RPC_URL, checkHeimdallOrError, ensureDirectoryExists, readOutputFiles } from "./utils.js";

export function registerHeimdallDecompileTool(server: McpServer): void {
  server.tool(
    "heimdall_decompile",
    "Decompile EVM bytecode to Solidity source code and ABI using Heimdall",
    {
      target: z.string().describe("Contract address, bytecode, file, or ENS name to decompile"),
      rpcUrl: z.string().optional().describe(`EVM network RPC URL (default: ${DEFAULT_RPC_URL})`),
      useDefaults: z.boolean().optional().describe("Always select default values when prompted (default: false)"),
      skipResolving: z.boolean().optional().describe("Skip resolving function selectors (default: false)"),
      includeSol: z.boolean().optional().describe("Include Solidity source code in output (beta) (default: false)"),
      includeYul: z.boolean().optional().describe("Include Yul source code in output (beta) (default: false)"),
      fileName: z.string().optional().describe("Name for the output file"),
      timeout: z.number().optional().describe("Timeout for each function's symbolic execution in milliseconds"),
      verbosity: z.enum(["quiet", "normal", "verbose"]).optional().describe("Output verbosity level (default: normal)"),
      outputDir: z.string().optional().describe(`Output directory (default: ${HEIMDALL_DEFAULT_OUTPUT_PATH})`)
    },
    async ({ target, rpcUrl, useDefaults, skipResolving, includeSol, includeYul, fileName, timeout, verbosity, outputDir }) => {
      const installError = await checkHeimdallOrError();
      if (installError) return installError;

      const finalOutputDir = getHeimdallOutputDir(outputDir);
      
      await ensureDirectoryExists(finalOutputDir);
      
      let command = `${FOUNDRY_PATHS.heimdallPath} decompile "${target}"`;
      
      if (rpcUrl) {
        command += ` -r "${rpcUrl}"`;
      }
      
      if (useDefaults) {
        command += " -d";
      }
      
      if (skipResolving) {
        command += " --skip-resolving";
      }
      
      if (includeSol) {
        command += " --include-sol";
      }
      
      if (includeYul) {
        command += " --include-yul";
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
          content: [{ type: "text", text: `Heimdall decompile failed: ${result.message}` }],
          isError: true
        };
      }

      const fileContents = await readOutputFiles(finalOutputDir, fileName);
      const resultText = `Decompiled contract ${target}:\nOutput directory: ${finalOutputDir}\n\n${fileContents}`;

      return {
        content: [{ 
          type: "text", 
          text: resultText
        }]
      };
    }
  );
}