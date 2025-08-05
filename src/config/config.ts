import dotenv from 'dotenv';
import type { WhatsAppClientConfig } from '../types/whatsapp.js';

dotenv.config();

export const config = {
  server: {
    name: process.env.MCP_SERVER_NAME || 'whatsapp-mcp',
    version: process.env.MCP_SERVER_VERSION || '1.0.0',
    transport: process.env.MCP_TRANSPORT || 'stdio', // 'stdio' or 'http'
    port: parseInt(process.env.MCP_PORT || '3000'),
    host: process.env.MCP_HOST || 'localhost'
  },
  whatsapp: {
    sessionName: process.env.WHATSAPP_SESSION_NAME || 'whatsapp-mcp-session',
    authTimeoutMs: parseInt(process.env.WHATSAPP_AUTH_TIMEOUT || '60000')
  } as WhatsAppClientConfig,
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};