import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { WhatsAppClientWrapper } from '../whatsapp/client';
import { WhatsAppTools } from '../tools/whatsapp-tools';
import logger from '../utils/logger';
import type { WhatsAppClientConfig } from '../types/whatsapp';

export class WhatsAppMCPServer {
  private mcpServer: McpServer;
  private whatsappClient: WhatsAppClientWrapper;
  private tools: WhatsAppTools;
  private httpApp?: express.Application;
  private transports: Map<string, StreamableHTTPServerTransport> = new Map();

  constructor(config: { 
    serverName: string; 
    serverVersion: string; 
    whatsappConfig: WhatsAppClientConfig;
    transport?: 'stdio' | 'http';
    port?: number;
    host?: string;
  }) {
    this.mcpServer = new McpServer({
      name: config.serverName,
      version: config.serverVersion
    });

    this.whatsappClient = new WhatsAppClientWrapper(config.whatsappConfig);
    this.tools = new WhatsAppTools(this.whatsappClient);
    
    this.setupMCPTools();
    this.setupEventHandlers();
    
    // Setup HTTP server if using HTTP transport
    if (config.transport === 'http') {
      this.setupHTTPServer(config.port || 3000, config.host || 'localhost');
    }
  }

  private setupMCPTools(): void {
    this.mcpServer.registerTool(
      'send_message',
      {
        description: 'Send a WhatsApp message to a contact or group',
        inputSchema: {
          to: z.string().describe('The phone number or group ID to send message to (format: number@c.us or groupId@g.us)'),
          message: z.string().describe('The message content to send')
        }
      },
      async ({ to, message }) => {
        return await this.tools.sendMessage(to, message);
      }
    );

    this.mcpServer.registerTool(
      'get_contacts',
      {
        description: 'Get all WhatsApp contacts'
      },
      async () => {
        return await this.tools.getContacts();
      }
    );

    this.mcpServer.registerTool(
      'get_chats',
      {
        description: 'Get all WhatsApp chats and conversations'
      },
      async () => {
        return await this.tools.getChats();
      }
    );

    this.mcpServer.registerTool(
      'get_connection_status',
      {
        description: 'Get the current WhatsApp connection status'
      },
      async () => {
        return await this.tools.getConnectionStatus();
      }
    );

    this.mcpServer.registerTool(
      'get_chat_history',
      {
        description: 'Get message history for a specific WhatsApp chat or contact',
        inputSchema: {
          chatId: z.string().describe('The chat ID (phone number with @c.us or group ID with @g.us)'),
          limit: z.number().optional().describe('Maximum number of messages to retrieve (default: 50)'),
          includeMedia: z.boolean().optional().describe('Whether to download and include media URLs (default: false, WARNING: can be slow for media-heavy chats)')
        }
      },
      async ({ chatId, limit, includeMedia }) => {
        return await this.tools.getChatHistory(chatId, limit, includeMedia);
      }
    );

    this.mcpServer.registerTool(
      'search_chats',
      {
        description: 'Search for WhatsApp chats by name or phone number',
        inputSchema: {
          query: z.string().describe('Search query (name or phone number)')
        }
      },
      async ({ query }) => {
        return await this.tools.searchChats(query);
      }
    );

    this.mcpServer.registerTool(
      'get_qr_code',
      {
        description: 'Get WhatsApp authentication QR code for scanning'
      },
      async () => {
        return await this.tools.getQRCode();
      }
    );

    this.mcpServer.registerTool(
      'get_auth_status',
      {
        description: 'Get WhatsApp authentication status and connection state'
      },
      async () => {
        return await this.tools.getAuthStatus();
      }
    );

    this.mcpServer.registerTool(
      'disconnect_whatsapp',
      {
        description: 'Disconnect from WhatsApp completely (requires confirmation)',
        inputSchema: {
          confirmation: z.string().describe('Must be exactly "YES_DISCONNECT_WHATSAPP" to confirm disconnection')
        }
      },
      async ({ confirmation }) => {
        return await this.tools.disconnectWhatsApp(confirmation);
      }
    );

    this.mcpServer.registerTool(
      'logout_whatsapp',
      {
        description: 'Logout from WhatsApp but keep connection (requires confirmation)', 
        inputSchema: {
          confirmation: z.string().describe('Must be exactly "YES_LOGOUT_WHATSAPP" to confirm logout')
        }
      },
      async ({ confirmation }) => {
        return await this.tools.logoutWhatsApp(confirmation);
      }
    );

    this.mcpServer.registerTool(
      'reconnect_whatsapp',
      {
        description: 'Manually reconnect WhatsApp client (useful after disconnect)'
      },
      async () => {
        return await this.tools.reconnectWhatsApp();
      }
    );
  }

  private setupEventHandlers(): void {
    this.whatsappClient.on('qr', (qr) => {
      logger.info('QR code generated for authentication');
    });

    this.whatsappClient.on('ready', () => {
      logger.info('WhatsApp client is ready, MCP server can now handle requests');
    });

    this.whatsappClient.on('disconnected', (reason) => {
      logger.warn(`WhatsApp disconnected: ${reason}`);
    });

    this.whatsappClient.on('message', (message) => {
      logger.debug(`Received message from ${message.from}: ${message.body.substring(0, 50)}...`);
    });
  }

  async start(transportMode: 'stdio' | 'http' = 'stdio', port?: number, host?: string): Promise<void> {
    try {
      logger.info(`Starting WhatsApp MCP Server with ${transportMode} transport...`);
      
      await this.whatsappClient.initialize();
      
      if (transportMode === 'stdio') {
        await this.startStdioTransport();
      } else {
        await this.startHTTPTransport(port || 3000, host || 'localhost');
      }
      
      logger.info('WhatsApp MCP Server started successfully');
    } catch (error) {
      logger.error('Failed to start WhatsApp MCP Server:', error);
      throw error;
    }
  }

  private async startStdioTransport(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
    logger.info('MCP Server connected via stdio transport');
  }

  private setupHTTPServer(port: number, host: string): void {
    this.httpApp = express();
    this.httpApp.use(express.json());
    
    // Configure CORS for remote access
    this.httpApp.use(cors({
      origin: '*', // Allow all origins for development - restrict in production
      exposedHeaders: ['Mcp-Session-Id'],
      methods: ['GET', 'POST', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Mcp-Session-Id', 'Last-Event-Id']
    }));

    // MCP POST endpoint for JSON-RPC requests
    this.httpApp.post('/mcp', this.handleMCPRequest.bind(this));
    
    // MCP GET endpoint for SSE streams
    this.httpApp.get('/mcp', this.handleMCPStream.bind(this));
    
    // MCP DELETE endpoint for session termination
    this.httpApp.delete('/mcp', this.handleMCPDelete.bind(this));
    
    // QR Code endpoints for authentication
    this.httpApp.get('/qr', this.handleQRCode.bind(this));
    this.httpApp.get('/qr.png', this.handleQRCodeImage.bind(this));
    this.httpApp.get('/qr.html', this.handleQRCodePage.bind(this));
    this.httpApp.get('/auth/status', this.handleAuthStatus.bind(this));
  }

  private async startHTTPTransport(port: number, host: string): Promise<void> {
    if (!this.httpApp) {
      throw new Error('HTTP server not configured. Call setupHTTPServer first.');
    }

    return new Promise((resolve, reject) => {
      this.httpApp!.listen(port, host, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          logger.info(`MCP Server listening on http://${host}:${port}/mcp`);
          resolve();
        }
      });
    });
  }

  private async handleMCPRequest(req: express.Request, res: express.Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string;
    
    try {
      let transport: StreamableHTTPServerTransport;
      
      if (sessionId && this.transports.has(sessionId)) {
        // Reuse existing transport
        transport = this.transports.get(sessionId)!;
        logger.debug(`Reusing transport for session: ${sessionId}`);
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        const eventStore = new InMemoryEventStore();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          eventStore, // Enable resumability
          onsessioninitialized: (newSessionId: string) => {
            logger.info(`Session initialized with ID: ${newSessionId}`);
            this.transports.set(newSessionId, transport);
          }
        });
        
        // Set up cleanup handler
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && this.transports.has(sid)) {
            logger.info(`Transport closed for session ${sid}`);
            this.transports.delete(sid);
          }
        };
        
        // Connect to MCP server
        await this.mcpServer.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        // Invalid request
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided or not an initialization request'
          },
          id: null
        });
        return;
      }
      
      // Handle request with existing transport
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logger.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: null
        });
      }
    }
  }

  private async handleMCPStream(req: express.Request, res: express.Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string;
    
    if (!sessionId || !this.transports.has(sessionId)) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    
    const lastEventId = req.headers['last-event-id'] as string;
    if (lastEventId) {
      logger.info(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
    } else {
      logger.info(`Establishing SSE stream for session ${sessionId}`);
    }
    
    const transport = this.transports.get(sessionId)!;
    await transport.handleRequest(req, res);
  }

  private async handleMCPDelete(req: express.Request, res: express.Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string;
    
    if (!sessionId || !this.transports.has(sessionId)) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    
    logger.info(`Received session termination request for session ${sessionId}`);
    
    try {
      const transport = this.transports.get(sessionId)!;
      await transport.handleRequest(req, res);
    } catch (error) {
      logger.error('Error handling session termination:', error);
      if (!res.headersSent) {
        res.status(500).send('Error processing session termination');
      }
    }
  }

  private async handleQRCode(req: express.Request, res: express.Response): Promise<void> {
    try {
      const state = this.whatsappClient.getState();
      
      if (state.isAuthenticated) {
        res.json({
          authenticated: true,
          message: 'WhatsApp is already authenticated'
        });
        return;
      }
      
      if (!state.qrCodeDataURL) {
        res.json({
          authenticated: false,
          qrAvailable: false,
          message: 'QR code not yet generated. Please wait for WhatsApp to initialize.'
        });
        return;
      }
      
      res.json({
        authenticated: false,
        qrAvailable: true,
        qrCodeDataURL: state.qrCodeDataURL,
        message: 'Scan this QR code with your WhatsApp mobile app'
      });
    } catch (error) {
      logger.error('Error handling QR code request:', error);
      res.status(500).json({ error: 'Failed to get QR code' });
    }
  }

  private async handleQRCodeImage(req: express.Request, res: express.Response): Promise<void> {
    try {
      const state = this.whatsappClient.getState();
      
      if (state.isAuthenticated) {
        res.status(200).send('WhatsApp is already authenticated');
        return;
      }
      
      if (!state.qrCodeDataURL) {
        res.status(404).send('QR code not available yet');
        return;
      }
      
      // Extract base64 data from data URL
      const base64Data = state.qrCodeDataURL.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', imageBuffer.length);
      res.send(imageBuffer);
    } catch (error) {
      logger.error('Error serving QR code image:', error);
      res.status(500).send('Failed to serve QR code image');
    }
  }

  private async handleQRCodePage(req: express.Request, res: express.Response): Promise<void> {
    try {
      const state = this.whatsappClient.getState();
      
      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp MCP - QR Code Authentication</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .qr-code { margin: 20px 0; }
        .status { padding: 15px; border-radius: 5px; margin: 20px 0; }
        .authenticated { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .pending { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 10px; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 WhatsApp MCP Authentication</h1>
        
        ${state.isAuthenticated ? `
            <div class="status authenticated">
                ✅ WhatsApp is already authenticated and ready!
            </div>
        ` : state.qrCodeDataURL ? `
            <div class="status pending">
                📱 Scan this QR code with your WhatsApp mobile app
            </div>
            <div class="qr-code">
                <img src="${state.qrCodeDataURL}" alt="WhatsApp QR Code" style="max-width: 100%; height: auto;">
            </div>
            <p><small>The QR code will refresh automatically when a new one is generated.</small></p>
        ` : `
            <div class="status error">
                ⏳ QR code not yet generated. Please wait for WhatsApp to initialize...
            </div>
        `}
        
        <div style="margin-top: 30px;">
            <button onclick="window.location.reload()">🔄 Refresh</button>
            <button onclick="checkStatus()">📊 Check Status</button>
        </div>
        
        <div style="margin-top: 20px; font-size: 12px; color: #666;">
            <p>WhatsApp MCP Server</p>
            <p>Access via: <code>http://localhost:3000/mcp</code></p>
        </div>
    </div>

    <script>
        function checkStatus() {
            fetch('/auth/status')
                .then(r => r.json())
                .then(data => {
                    alert('Status: ' + (data.isAuthenticated ? 'Authenticated ✅' : 'Waiting for QR scan 📱'));
                    if (data.isAuthenticated) {
                        window.location.reload();
                    }
                })
                .catch(e => alert('Error checking status'));
        }
        
        // Auto-refresh every 10 seconds if not authenticated
        ${!state.isAuthenticated ? `
        setInterval(() => {
            fetch('/auth/status')
                .then(r => r.json())
                .then(data => {
                    if (data.isAuthenticated) {
                        window.location.reload();
                    }
                });
        }, 10000);
        ` : ''}
    </script>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      logger.error('Error serving QR code page:', error);
      res.status(500).send('Failed to load QR code page');
    }
  }

  private async handleAuthStatus(req: express.Request, res: express.Response): Promise<void> {
    try {
      const state = this.whatsappClient.getState();
      
      res.json({
        isConnected: state.isConnected,
        isReady: state.isReady,
        isAuthenticated: state.isAuthenticated,
        qrAvailable: !!state.qrCode,
        lastSeen: state.lastSeen
      });
    } catch (error) {
      logger.error('Error getting auth status:', error);
      res.status(500).json({ error: 'Failed to get authentication status' });
    }
  }

  async stop(): Promise<void> {
    try {
      logger.info('Stopping WhatsApp MCP Server...');
      
      // Close all HTTP transports
      for (const [sessionId, transport] of this.transports) {
        try {
          logger.info(`Closing transport for session ${sessionId}`);
          await transport.close();
        } catch (error) {
          logger.error(`Error closing transport for session ${sessionId}:`, error);
        }
      }
      this.transports.clear();
      
      await this.whatsappClient.destroy();
      logger.info('WhatsApp MCP Server stopped');
    } catch (error) {
      logger.error('Error stopping server:', error);
      throw error;
    }
  }
}