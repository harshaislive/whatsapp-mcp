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
- Requires QR code scan to reconnect

### logout_whatsapp
Logout from WhatsApp but keep connection active (requires confirmation).
- `confirmation`: Must be exactly `"YES_LOGOUT_WHATSAPP"` to confirm
- 🟡 **Note**: Keeps connection but removes authentication
- Generates new QR code automatically for re-authentication

## Media Support

The server supports downloading and accessing WhatsApp media (images, videos, audio, documents):

### How Media Works:
- **Detection**: All messages indicate if they contain media via `hasMedia` and `mediaType` fields
- **Download**: Use `includeMedia: true` in `get_chat_history` to download media as data URLs
- **Formats**: Returns media as base64-encoded data URLs (e.g., `data:image/jpeg;base64,/9j/4AAQ...`)
- **Metadata**: Includes mimetype, filename, and file size information

### Media Data URLs:
When `includeMedia: true` is used, messages with media will include:
```json
{
  "hasMedia": true,
  "mediaType": "image",
  "mediaUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "mediaData": {
    "mimetype": "image/jpeg",
    "filename": "IMG-20231201-WA0001.jpg",
    "size": 85432
  }
}
```

### Performance Notes:
- Media download can be slow for large files or many media messages
- Consider using `limit` parameter to reduce the number of messages when including media
- Data URLs can be directly used in HTML `<img>`, `<video>`, or `<audio>` tags

## Authentication

### Multiple Ways to Scan QR Code:

**1. Terminal (Traditional):**
- QR code displays in terminal when server starts
- Scan directly from your terminal

**2. Web Browser (New!):**
- **Web Page**: `http://localhost:3000/qr.html` - Interactive QR code page with auto-refresh
- **JSON API**: `http://localhost:3000/qr` - Get QR code as data URL
- **Direct Image**: `http://localhost:3000/qr.png` - View QR code as PNG image
- **Auth Status**: `http://localhost:3000/auth/status` - Check authentication status

**3. MCP Tools (For Cursor/Chat Apps):**
- Use `get_qr_code` tool to get QR code in chat
- Use `get_auth_status` tool to check if authentication is needed
- Perfect for cloud deployments where you can't access terminal

### Cloud Deployment Ready:
When deployed on cloud services, you can:
1. **Interactive Web Page**: `https://your-domain.com/qr.html` - Best option with auto-refresh
2. **Direct QR Image**: `https://your-domain.com/qr.png` - Simple QR code image
3. **MCP Tools**: Use in Cursor to get QR code directly in chat
4. **API Access**: Check auth status via HTTP endpoints

### 🌟 Best for Cloud: 
Visit `http://localhost:3000/qr.html` (or your cloud URL) for an interactive page that:
- Shows QR code when available
- Auto-refreshes when authenticated
- Works on mobile devices
- No terminal access needed!

The session will be saved for future use after first authentication.

## Session Management

### Two Ways to Manage WhatsApp Sessions:

**1. 🔴 Full Disconnect (`disconnect_whatsapp`)**:
```
Use: disconnect_whatsapp tool with confirmation: "YES_DISCONNECT_WHATSAPP"
```
- Completely logs out from WhatsApp
- Clears all session data
- Stops all WhatsApp functionality
- Requires server restart and new QR scan to reconnect

**2. 🟡 Logout Only (`logout_whatsapp`)**:
```
Use: logout_whatsapp tool with confirmation: "YES_LOGOUT_WHATSAPP"
```
- Logs out but keeps connection active
- Generates new QR code automatically
- Faster to re-authenticate
- No server restart needed

### Safety Features:
- **Confirmation Required**: Both tools require exact confirmation text
- **Clear Warnings**: Shows exactly what will happen before action
- **Status Checking**: Use `get_auth_status` to check current state
- **Graceful Handling**: Proper cleanup of sessions and connections

### Example Usage in Cursor:
```
1. First call (shows warning):
   disconnect_whatsapp with confirmation: "test"
   
2. Second call (actually disconnects):
   disconnect_whatsapp with confirmation: "YES_DISCONNECT_WHATSAPP"
```

## Configuration

Environment variables in `.env`:

### Transport Configuration
- `MCP_TRANSPORT`: `http` for remote access or `stdio` for local (default: http)
- `MCP_PORT`: HTTP server port (default: 3000)
- `MCP_HOST`: HTTP server host (default: localhost)

### WhatsApp Configuration
- `WHATSAPP_SESSION_NAME`: Session identifier (default: whatsapp-mcp-session)
- `WHATSAPP_AUTH_TIMEOUT`: Authentication timeout in ms (default: 60000)

### Server Configuration
- `MCP_SERVER_NAME`: MCP server name (default: whatsapp-mcp)
- `MCP_SERVER_VERSION`: Server version (default: 1.0.0)
- `LOG_LEVEL`: Logging level (default: info)

## Using with Cursor

For remote access in Cursor or other MCP clients, use the HTTP transport:

1. Start the server:
   ```bash
   MCP_TRANSPORT=http npm start
   ```

2. The server will be available at `http://localhost:3000/mcp`

3. Configure your MCP client to connect to this URL

## Using with Local MCP Clients

For local MCP clients that use stdio transport:

```json
{
  "mcpServers": {
    "whatsapp": {
      "command": "node",
      "args": ["path/to/whatsapp_mcp/dist/index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

## 🚀 Railway Deployment

### Quick Deploy to Railway:

1. **Fork this repository** to your GitHub account

2. **Connect to Railway:**
   - Go to [Railway.app](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Select your forked repository

3. **Railway will automatically:**
   - **Build Command**: `npm run railway:build`
   - **Start Command**: `npm run railway:start`
   - **Port**: Automatically detected (3000)

4. **Set Environment Variables in Railway:**
   ```
   MCP_TRANSPORT=http
   MCP_PORT=3000
   MCP_HOST=0.0.0.0
   WHATSAPP_SESSION_NAME=railway-whatsapp-session
   LOG_LEVEL=info
   ```

5. **Access your deployed server:**
   - QR Code: `https://your-app.railway.app/qr.html`
   - MCP Endpoint: `https://your-app.railway.app/mcp`

### Manual Railway Commands:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

## Important Notes

- This uses WhatsApp Web, which may have usage limitations
- Always comply with WhatsApp's Terms of Service
- Use responsibly and respect privacy
- WhatsApp does not officially support bots