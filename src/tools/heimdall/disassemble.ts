import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { executeCommand, FOUNDRY_PATHS } from "../../utils/command.js";
import { getHeimdallOutputDir, HEIMDALL_DEFAULT_OUTPUT_PATH, DEFAULT_RPC_URL, checkHeimdallOrError } from "./utils.js";

export function registerHeimdallDisassembleTool(server: McpServer): void {
  server.tool(
    "heimdall_disassemble",
    "Disassemble EVM bytecode into human-readable opcodes using Heimdall",
    {
      target: z.string().describe("Contract address, bytecode, file, or ENS name to disassemble"),
      rpcUrl: z.string().optional().describe(`EVM network RPC URL (default: ${DEFAULT_RPC_URL})`),
      decimalCounter: z.boolean().optional().describe("Use base-10 for the program counter (default: false)"),
      fileName: z.string().optional().describe("Name of the output file"),
      verbosity: z.enum(["quiet", "normal", "verbose"]).optional().describe("Output verbosity level (default: normal)"),
      outputDir: z.string().optional().describe(`Output directory (default: ${HEIMDALL_DEFAULT_OUTPUT_PATH})`)
    },
    async ({ target, rpcUrl, decimalCounter, fileName, verbosity, outputDir }) => {
      const installError = await checkHeimdallOrError();
      if (installError) return installError;

      const finalOutputDir = getHeimdallOutputDir(outputDir);
      
      let command = `${FOUNDRY_PATHS.heimdallPath} disassemble "${target}"`;
      
      if (rpcUrl) {
        command += ` -r "${rpcUrl}"`;
      }
      
      if (decimalCounter) {
        command += " --decimal-counter";
      }
      
      if (fileName) {
        command += ` -n "${fileName}"`;
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
          content: [{ type: "text", text: `Heimdall disassemble failed: ${result.message}` }],
          isError: true
        };
      }

      const resultText = `Disassembly for ${target} saved to: ${finalOutputDir}\n\n${result.message}`;

      return {
        content: [{ 
          type: "text", 
          text: resultText
        }]
      };
    }
  );
}