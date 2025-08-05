# WhatsApp MCP Server

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/whatsapp-mcp)

A Model Context Protocol (MCP) server that provides WhatsApp integration through whatsapp-web.js. Supports both local (stdio) and remote (HTTP) transports for maximum flexibility.

## ⭐ Key Features

- 🌐 **Remote HTTP Access** - Perfect for cloud deployment
- 📱 **Web-based QR Authentication** - No terminal access needed  
- 💬 **Complete WhatsApp Integration** - Send/receive messages, manage contacts
- 📊 **Chat History with Media** - Download and access all media types
- 🔒 **Session Management** - Safe disconnect/reconnect with confirmation
- 🚀 **Auto-Reconnection** - Resilient connection handling
- 📋 **Rich MCP Tools** - 10+ tools for WhatsApp automation

## Features

- 📱 Send WhatsApp messages to contacts and groups
- 📋 Get contacts and chat conversations
- 🔄 Real-time message handling
- 🔐 QR code authentication with session persistence
- 🌐 Remote HTTP access for tools like Cursor
- 📝 Comprehensive logging and error handling

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

## Usage

### For Remote Access (HTTP) - Recommended for Cursor
```bash
# Development
npm run dev:http

# Production
npm run build
npm run start:http
```

Access the server at: `http://localhost:3000/mcp`

### For Local Access (stdio)
```bash
# Development
npm run dev:stdio

# Production  
npm run build
npm run start:stdio
```

## MCP Tools

### send_message
Send a message to a WhatsApp contact or group.
- `to`: Phone number (format: number@c.us) or group ID (format: groupId@g.us)
- `message`: Message content

### get_contacts
Retrieve all WhatsApp contacts.

### get_chats
Get all WhatsApp chats and conversations.

### get_chat_history
Get message history for a specific WhatsApp chat or contact.
- `chatId`: The chat ID (phone number with @c.us or group ID with @g.us)
- `limit`: Maximum number of messages to retrieve (optional, default: 50)
- `includeMedia`: Whether to download and include media as data URLs (optional, default: false)
  - ⚠️ **Warning**: Setting this to `true` can be slow for media-heavy chats as it downloads all media files

### search_chats
Search for WhatsApp chats by name or phone number.
- `query`: Search query (name or phone number)

### get_connection_status
Check the current WhatsApp connection status.

### get_qr_code
Get WhatsApp authentication QR code for scanning.
- Returns QR code as data URL that can be displayed in browsers/chat apps

### get_auth_status
Get WhatsApp authentication status and connection state.
- Shows if authentication is needed or if WhatsApp is ready

### disconnect_whatsapp
Safely disconnect from WhatsApp completely (requires confirmation).
- `confirmation`: Must be exactly `"YES_DISCONNECT_WHATSAPP"` to confirm
- ⚠️ **Warning**: This will log out, clear session data, and stop all functionality

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0

# WhatsApp Configuration
WHATSAPP_SESSION_DIR=.wwebjs_auth
WHATSAPP_CACHE_DIR=.wwebjs_cache
# Logging
LOG_LEVEL=info
# CORS (for HTTP transport)
CORS_ORIGIN=*
```

## Development

### Project Structure
```
whatsapp-mcp/
├── src/
│   ├── config/          # Configuration files
│   ├── server/          # MCP server implementation
│   ├── tools/           # WhatsApp MCP tools
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── whatsapp/        # WhatsApp client implementation
│   └── index.ts         # Main entry point
├── dist/                # Compiled JavaScript
├── .wwebjs_auth/        # WhatsApp session data
├── .wwebjs_cache/       # WhatsApp cache data
└── package.json
```

### Building
```bash
npm run build
```

### Development with Hot Reload
```bash
npm run dev:http    # HTTP transport
npm run dev:stdio   # stdio transport
```

## Deployment

### Railway Deployment

This project includes Railway deployment configuration:

- `railway.json` - Railway-specific configuration
- `Procfile` - Process definition for Railway

To deploy:

1. Connect your GitHub repository to Railway
2. Railway will automatically detect the configuration
3. Deploy with one click

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Set environment variables in your deployment platform

## API Endpoints (HTTP Transport)

When using HTTP transport, the following endpoints are available:

- `GET /health` - Health check
- `GET /qr` - Get QR code for WhatsApp authentication
- `GET /qr.png` - Get QR code as PNG image
- `POST /mcp` - MCP protocol endpoint

## Troubleshooting

### Common Issues

1. **QR Code Not Appearing**:
   - Check if WhatsApp Web is already authenticated
   - Restart the server and try again

2. **Connection Issues**:
   - Ensure your internet connection is stable
   - Check if WhatsApp Web is accessible

3. **Session Persistence**:
   - Sessions are stored in `.wwebjs_auth/` directory
   - Delete this directory to start fresh

4. **Port Conflicts**:
   - Change the PORT environment variable
   - Ensure the port is not used by other services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - WhatsApp Web API
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
- [Railway](https://railway.app/) - Deployment platform