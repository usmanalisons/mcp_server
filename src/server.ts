import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import cors from 'cors';
import {
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  GetPromptRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { Logger } from './utils/index.js';
import { ServerConfig } from './types/index.js';
import {
  weatherTool,
  handleWeather,
} from './tools/index.js';
import { systemInfoResource, getSystemInfo } from './resources/index.js';
import { codeReviewPrompt, generateCodeReviewPrompt } from './prompts/index.js';

export class MCPServer {
  private server: Server;
  private logger: Logger;
  private config: ServerConfig;
  private httpServer?: any;
  private port?: number;

  constructor(config: ServerConfig, port?: number) {
    this.config = config;
    this.port = port;
    this.logger = Logger.getInstance();
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Listing available tools');
      return {
        tools: [weatherTool],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      this.logger.info(`Tool called: ${name}`, args);

      try {
        switch (name) {
          case 'weather':
            return {
              content: [{ type: 'text', text: await handleWeather(args as any) }],
            };
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error(`Tool execution error: ${name}`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.logger.debug('Listing available resources');
      return {
        resources: [systemInfoResource],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      this.logger.info(`Resource requested: ${uri}`);

      try {
        switch (uri) {
          case 'system://info':
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: await getSystemInfo(),
                },
              ],
            };
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
      } catch (error) {
        this.logger.error(`Resource read error: ${uri}`, error);
        throw error;
      }
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      this.logger.debug('Listing available prompts');
      return {
        prompts: [codeReviewPrompt],
      };
    });

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      this.logger.info(`Prompt requested: ${name}`, args);

      try {
        switch (name) {
          case 'code_review':
            const code = args?.code as string;
            const language = args?.language as string | undefined;
            
            if (!code) {
              throw new Error('Code parameter is required');
            }

            return {
              description: 'Code review prompt',
              messages: [
                {
                  role: 'user',
                  content: {
                    type: 'text',
                    text: generateCodeReviewPrompt(code, language),
                  },
                },
              ],
            };
          default:
            throw new Error(`Unknown prompt: ${name}`);
        }
      } catch (error) {
        this.logger.error(`Prompt generation error: ${name}`, error);
        throw error;
      }
    });
  }

  async start(): Promise<void> {
    if (this.port) {
      await this.startHttpServer();
    } else {
      await this.startStdioServer();
    }
  }

  private async startStdioServer(): Promise<void> {
    const transport = new StdioServerTransport();
    this.logger.info(`Starting ${this.config.name} v${this.config.version} (stdio)`);
    
    await this.server.connect(transport);
    this.logger.info('MCP Server connected and ready (stdio)');
  }

  private async startHttpServer(): Promise<void> {
    const app = express();
    
    // Enable CORS for all origins
    app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header', 'Cache-Control'],
      credentials: true
    }));

    app.use(express.json());
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', server: this.config.name, version: this.config.version });
    });

    // SSE endpoint for MCP communication
    app.get('/sse', async (req, res) => {
      this.logger.info('SSE connection established', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        authorization: req.get('Authorization') ? 'Present' : 'Not present',
        customHeaders: Object.keys(req.headers).filter(h => h.startsWith('x-')),
        allHeaders: req.headers
      });
      
      // Log specific headers that LibreChat might send
      const importantHeaders = ['authorization', 'x-api-key', 'x-user-id', 'x-session-id'];
      importantHeaders.forEach(header => {
        const value = req.get(header);
        if (value) {
          this.logger.info(`Header ${header}: ${value.substring(0, 20)}...`);
        }
      });
      
      const transport = new SSEServerTransport('/sse', res);
      await this.server.connect(transport);
    });

    // POST endpoint for direct MCP requests
    app.post('/mcp', async (req, res) => {
      this.logger.info('MCP request received', {
        method: req.body?.method,
        id: req.body?.id,
        headers: req.headers
      });
      
      try {
        const { jsonrpc, method, params, id } = req.body;
        
        if (jsonrpc !== '2.0') {
          return res.json({
            jsonrpc: '2.0',
            id: id || 1,
            error: { code: -32600, message: 'Invalid Request' }
          });
        }

        let result;
        switch (method) {
          case 'ping':
            result = {};
            break;
            
          case 'notifications/initialized':
          case 'notifications/cancelled':
          case 'notifications/progress':
          case 'notifications/message':
            // Handle notifications - these don't need responses
            this.logger.info(`Notification received: ${method}`, params);
            return res.status(204).send();
            
          case 'initialize':
            result = {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                resources: {},
                prompts: {}
              },
              serverInfo: {
                name: this.config.name,
                version: this.config.version
              }
            };
            break;
            
          case 'tools/list':
            result = {
              tools: [weatherTool]
            };
            break;
            
          case 'tools/call':
            const toolResult = await this.handleToolCall(params);
            result = toolResult;
            break;
            
          case 'resources/list':
            result = {
              resources: [systemInfoResource]
            };
            break;
            
          case 'prompts/list':
            result = {
              prompts: [codeReviewPrompt]
            };
            break;
            
          default:
            return res.json({
              jsonrpc: '2.0',
              id: id || 1,
              error: { code: -32601, message: 'Method not found' }
            });
        }
        
        res.json({
          jsonrpc: '2.0',
          id: id || 1,
          result
        });
        
      } catch (error) {
        this.logger.error('MCP request error:', error);
        res.json({
          jsonrpc: '2.0',
          id: req.body?.id || null,
          error: { 
            code: -32603, 
            message: 'Internal error',
            data: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    });

    this.httpServer = app.listen(this.port, () => {
      this.logger.info(`Starting ${this.config.name} v${this.config.version} on port ${this.port}`);
      this.logger.info(`Health check: http://localhost:${this.port}/health`);
      this.logger.info(`SSE endpoint: http://localhost:${this.port}/sse`);
      this.logger.info('MCP Server ready for HTTP connections');
    });
  }

  private async handleToolCall(params: any): Promise<any> {
    const { name, arguments: args } = params;
    
    try {
      switch (name) {
        case 'weather':
          return {
            content: [{ type: 'text', text: await handleWeather(args) }]
          };
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping MCP Server');
    
    if (this.httpServer) {
      this.httpServer.close();
    }
    
    await this.server.close();
  }
}