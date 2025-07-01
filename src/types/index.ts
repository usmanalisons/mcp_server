import { z } from 'zod';

// Tool argument schemas
export const CalculatorArgsSchema = z.object({
  expression: z.string().describe('Mathematical expression to evaluate'),
});

export const FileOperationArgsSchema = z.object({
  operation: z.enum(['read', 'write', 'list']).describe('File operation to perform'),
  path: z.string().describe('File or directory path'),
  content: z.string().optional().describe('Content to write (for write operation)'),
});

export const WeatherArgsSchema = z.object({
  location: z.string().describe('Location to get weather for'),
});

// Type exports
export type CalculatorArgs = z.infer<typeof CalculatorArgsSchema>;
export type FileOperationArgs = z.infer<typeof FileOperationArgsSchema>;
export type WeatherArgs = z.infer<typeof WeatherArgsSchema>;

// Server configuration
export interface ServerConfig {
  name: string;
  version: string;
  description: string;
}