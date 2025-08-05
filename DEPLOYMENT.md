# 🚀 Deployment Guide

## Railway Deployment (Recommended)

### Option 1: One-Click Deploy
1. Click the Railway button in README
2. Set environment variables
3. Deploy automatically

### Option 2: Manual Deploy
1. Fork this repo to your GitHub
2. Connect to Railway.app
3. Select your forked repo
4. Set these environment variables:
   ```
   MCP_TRANSPORT=http
   MCP_PORT=3000
   MCP_HOST=0.0.0.0
   WHATSAPP_SESSION_NAME=railway-whatsapp
   LOG_LEVEL=info
   ```

## Railway Commands

Railway will automatically use:
- **Build**: `npm run railway:build`
- **Start**: `npm run railway:start`

## After Deployment

1. **Get your URL**: `https://your-app.railway.app`
2. **Access QR Code**: `https://your-app.railway.app/qr.html`
3. **MCP Endpoint**: `https://your-app.railway.app/mcp`
4. **Scan QR code** with WhatsApp mobile app
5. **Start using** MCP tools in Cursor or other clients

## Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev:http

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_TRANSPORT` | `http` | Transport mode (`http` or `stdio`) |
| `MCP_PORT` | `3000` | HTTP server port |
| `MCP_HOST` | `localhost` | HTTP server host (`0.0.0.0` for Railway) |
| `WHATSAPP_SESSION_NAME` | `whatsapp-mcp-session` | WhatsApp session identifier |
| `LOG_LEVEL` | `info` | Logging level |

## Troubleshooting

- **QR Code not showing**: Check logs, wait for initialization
- **Port issues**: Ensure `MCP_HOST=0.0.0.0` on Railway
- **Session issues**: Use disconnect/reconnect tools
- **Memory issues**: Use Railway Pro for better performance