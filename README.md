# MCP Server Node.js

A comprehensive Model Context Protocol (MCP) server implementation in Node.js with TypeScript, designed to work with Claude Desktop and LibreChat.

## Features

- **Tools**: Weather Information
- **Resources**: System Information
- **Prompts**: Code Review Templates
- **TypeScript**: Full type safety and modern JavaScript features
- **Logging**: Structured logging with configurable levels
- **Error Handling**: Comprehensive error handling and graceful shutdown

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start

# Development mode with hot reload
npm run dev
```

## Available Tools

### Weather

Get weather information for a location (mock data for demo).

```javascript
{
  "name": "weather",
  "arguments": {
    "location": "New York, NY"
  }
}
```

## Available Resources

### System Information

Access current system information and statistics.

- URI: `system://info`
- Returns: JSON with system details

## Available Prompts

### Code Review

Generate comprehensive code review prompts.

```javascript
{
  "name": "code_review",
  "arguments": {
    "code": "function hello() { console.log('Hello'); }",
    "language": "javascript"
  }
}
```

## Development

### Project Structure

```
src/
├── tools/          # MCP tools implementation
├── resources/      # MCP resources implementation
├── prompts/        # MCP prompts implementation
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── server.ts       # Main server class
└── index.ts        # Entry point
```

### Adding New Tools

1. Create a new file in `src/tools/`
2. Define the tool schema and handler
3. Export from `src/tools/index.ts`
4. Add to the server's tool list in `src/server.ts`

### Environment Variables

- `LOG_LEVEL`: Set logging level (debug, info, warn, error)

## Scripts

- `npm run build`: Build TypeScript to JavaScript
- `npm start`: Start the production server
- `npm run dev`: Start development server with hot reload
- `npm run clean`: Clean build directory
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint issues

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure the server has proper file system permissions
2. **Port Conflicts**: Check if the required ports are available
3. **Module Not Found**: Run `npm install` to install dependencies
4. **TypeScript Errors**: Run `npm run build` to check for compilation errors

### Debug Mode

Set `LOG_LEVEL=debug` to enable detailed logging:

```bash
LOG_LEVEL=debug npm start
```
