#!/usr/bin/env node

import { WhatsAppMCPServer } from './server/mcp-server';
import { config } from './config/config';
import logger from './utils/logger';

async function main() {
  const transportMode = config.server.transport as 'stdio' | 'http';
  
  const server = new WhatsAppMCPServer({
    serverName: config.server.name,
    serverVersion: config.server.version,
    whatsappConfig: config.whatsapp,
    transport: transportMode,
    port: config.server.port,
    host: config.server.host
  });

  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  try {
    await server.start(transportMode, config.server.port, config.server.host);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});