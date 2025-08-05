import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import QRCode from 'qrcode';
import { EventEmitter } from 'events';
import logger from '../utils/logger';
import type { 
  WhatsAppClientConfig, 
  ConnectionState, 
  WhatsAppMessage,
  WhatsAppContact,
  WhatsAppGroup 
} from '../types/whatsapp';

export class WhatsAppClientWrapper extends EventEmitter {
  private client: any;
  private config: WhatsAppClientConfig;
  private state: ConnectionState;
  private reconnectTimeout?: NodeJS.Timeout;
  private isDestroyed: boolean = false;

  constructor(config: WhatsAppClientConfig) {
    super();
    this.config = config;
    this.state = {
      isConnected: false,
      isReady: false,
      isAuthenticated: false
    };

    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: config.sessionName }),
      puppeteer: config.puppeteerOptions || {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('qr', async (qr: string) => {
      logger.info('QR Code received, scan it with your phone');
      qrcode.generate(qr, { small: true });
      
      try {
        // Generate QR code as data URL for web access
        const qrDataURL = await QRCode.toDataURL(qr, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        this.state.qrCode = qr;
        this.state.qrCodeDataURL = qrDataURL;
        this.emit('qr', qr, qrDataURL);
        
        logger.info('QR Code is available at: /qr endpoint');
      } catch (error) {
        logger.error('Failed to generate QR code data URL:', error);
        this.state.qrCode = qr;
        this.emit('qr', qr);
      }
    });

    this.client.on('ready', () => {
      logger.info('WhatsApp client is ready');
      this.state.isReady = true;
      this.state.isAuthenticated = true;
      this.state.qrCode = undefined;
      this.state.qrCodeDataURL = undefined;
      this.emit('ready');
    });

    this.client.on('authenticated', () => {
      logger.info('WhatsApp client authenticated');
      this.state.isAuthenticated = true;
      this.emit('authenticated');
    });

    this.client.on('auth_failure', (msg: string) => {
      logger.error('Authentication failed:', msg);
      this.state.isAuthenticated = false;
      this.emit('auth_failure', msg);
    });

    this.client.on('disconnected', (reason: string) => {
      logger.warn('WhatsApp client disconnected:', reason);
      this.state.isConnected = false;
      this.state.isReady = false;
      this.emit('disconnected', reason);
      
      // Auto-reconnect after manual disconnect (but not during destroy)
      if (reason === 'Manual disconnect' && !this.isDestroyed) {
        logger.info('Scheduling auto-reconnection in 3 seconds...');
        this.scheduleReconnection();
      }
    });

    this.client.on('message', (msg: any) => {
      const whatsappMsg: WhatsAppMessage = {
        id: msg.id._serialized,
        from: msg.from,
        to: msg.to || '',
        body: msg.body,
        timestamp: msg.timestamp,
        isGroupMsg: msg.from.includes('@g.us'),
        groupId: msg.from.includes('@g.us') ? msg.from : undefined,
        hasMedia: msg.hasMedia,
        mediaType: msg.type
      };
      
      this.emit('message', whatsappMsg);
    });
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing WhatsApp client...');
      this.isDestroyed = false;
      await this.client.initialize();
      this.state.isConnected = true;
    } catch (error) {
      logger.error('Failed to initialize WhatsApp client:', error);
      throw error;
    }
  }

  private scheduleReconnection(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(async () => {
      if (!this.isDestroyed) {
        await this.reconnect();
      }
    }, 3000);
  }

  async reconnect(): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('Client is destroyed - cannot reconnect');
    }

    try {
      logger.info('Attempting to reconnect WhatsApp client...');
      
      // Clear any existing timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = undefined;
      }
      
      // Create new client instance
      this.client = new Client({
        authStrategy: new LocalAuth({ clientId: this.config.sessionName }),
        puppeteer: this.config.puppeteerOptions || {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });
      
      // Reset state
      this.state = {
        isConnected: false,
        isReady: false,
        isAuthenticated: false
      };
      
      // Setup event handlers for new client
      this.setupEventHandlers();
      
      // Initialize new client
      await this.initialize();
      
      logger.info('WhatsApp client reconnected successfully');
      this.emit('reconnected');
    } catch (error) {
      logger.error('Failed to reconnect WhatsApp client:', error);
      
      // Retry reconnection after delay
      if (!this.isDestroyed) {
        logger.info('Retrying reconnection in 10 seconds...');
        this.reconnectTimeout = setTimeout(() => this.reconnect(), 10000);
      }
      throw error;
    }
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.state.isReady) {
      throw new Error('Client is not ready');
    }

    try {
      await this.client.sendMessage(to, message);
      logger.info(`Message sent to ${to}`);
    } catch (error) {
      logger.error(`Failed to send message to ${to}:`, error);
      throw error;
    }
  }

  async getContacts(): Promise<WhatsAppContact[]> {
    if (!this.state.isReady) {
      throw new Error('Client is not ready');
    }

    try {
      const contacts = await this.client.getContacts();
      return contacts.map((contact: any) => ({
        id: contact.id._serialized,
        name: contact.name,
        pushname: contact.pushname,
        isGroup: contact.isGroup,
        isMyContact: contact.isMyContact,
        profilePicUrl: undefined // Will need to call getProfilePicUrl() separately if needed
      }));
    } catch (error) {
      logger.error('Failed to get contacts:', error);
      throw error;
    }
  }

  async getChats(): Promise<any[]> {
    if (!this.state.isReady) {
      throw new Error('Client is not ready');
    }

    try {
      const chats = await this.client.getChats();
      return chats.map((chat: any) => ({
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        lastMessage: chat.lastMessage
      }));
    } catch (error) {
      logger.error('Failed to get chats:', error);
      throw error;
    }
  }

  async getChatHistory(chatId: string, limit?: number, includeMedia: boolean = false): Promise<WhatsAppMessage[]> {
    if (!this.state.isReady) {
      throw new Error('Client is not ready');
    }

    try {
      const chat = await this.client.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit: limit || 50 });
      
      const processedMessages = [];
      
      for (const msg of messages) {
        let mediaUrl = undefined;
        let mediaData = undefined;
        
        if (msg.hasMedia && includeMedia) {
          try {
            const media = await msg.downloadMedia();
            if (media) {
              // Create a data URL for the media
              mediaUrl = `data:${media.mimetype};base64,${media.data}`;
              mediaData = {
                mimetype: media.mimetype,
                filename: media.filename,
                size: media.data.length
              };
            }
          } catch (mediaError) {
            logger.warn(`Failed to download media for message ${msg.id._serialized}:`, mediaError);
          }
        }
        
        processedMessages.push({
          id: msg.id._serialized,
          from: msg.from,
          to: msg.to || '',
          body: msg.body,
          timestamp: msg.timestamp,
          isGroupMsg: msg.from.includes('@g.us'),
          groupId: msg.from.includes('@g.us') ? msg.from : undefined,
          hasMedia: msg.hasMedia,
          mediaType: msg.type,
          mediaUrl,
          mediaData,
          author: msg.author || msg.from,
          isForwarded: msg.isForwarded,
          mentionedIds: msg.mentionedIds || []
        });
      }
      
      return processedMessages;
    } catch (error) {
      logger.error(`Failed to get chat history for ${chatId}:`, error);
      throw error;
    }
  }

  async getMediaFromMessage(messageId: string): Promise<{ mediaUrl?: string; mediaData?: any }> {
    if (!this.state.isReady) {
      throw new Error('Client is not ready');
    }

    try {
      // This is a simplified approach - in practice, you'd need to find the message first
      // by searching through chats or maintaining a message cache
      throw new Error('Direct message media retrieval not implemented - use getChatHistory with includeMedia=true');
    } catch (error) {
      logger.error(`Failed to get media for message ${messageId}:`, error);
      throw error;
    }
  }

  async searchChats(query: string): Promise<any[]> {
    if (!this.state.isReady) {
      throw new Error('Client is not ready');
    }

    try {
      const chats = await this.client.getChats();
      return chats
        .filter((chat: any) => 
          chat.name?.toLowerCase().includes(query.toLowerCase()) ||
          chat.id._serialized.includes(query)
        )
        .map((chat: any) => ({
          id: chat.id._serialized,
          name: chat.name,
          isGroup: chat.isGroup,
          unreadCount: chat.unreadCount,
          lastMessage: chat.lastMessage
        }));
    } catch (error) {
      logger.error('Failed to search chats:', error);
      throw error;
    }
  }

  getState(): ConnectionState {
    return { ...this.state };
  }

  async logout(): Promise<void> {
    if (!this.state.isReady) {
      throw new Error('Client is not ready - cannot logout');
    }

    try {
      logger.info('Logging out of WhatsApp...');
      await this.client.logout();
      
      // Update state
      this.state.isAuthenticated = false;
      this.state.isReady = false;
      this.state.qrCode = undefined;
      this.state.qrCodeDataURL = undefined;
      
      logger.info('Successfully logged out of WhatsApp');
      this.emit('logout');
    } catch (error) {
      logger.error('Error during logout:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.state.isConnected && !this.state.isReady) {
      throw new Error('Client is not connected - nothing to disconnect');
    }

    try {
      logger.info('Disconnecting WhatsApp client...');
      
      // First try logout if authenticated
      if (this.state.isAuthenticated) {
        await this.logout();
      }
      
      // Then destroy the connection
      await this.client.destroy();
      
      // Reset all state
      this.state.isConnected = false;
      this.state.isReady = false;
      this.state.isAuthenticated = false;
      this.state.qrCode = undefined;
      this.state.qrCodeDataURL = undefined;
      
      logger.info('WhatsApp client disconnected successfully');
      this.emit('disconnected', 'Manual disconnect');
    } catch (error) {
      logger.error('Error during disconnect:', error);
      throw error;
    }
  }

  async destroy(): Promise<void> {
    try {
      this.isDestroyed = true;
      
      // Clear any pending reconnection
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = undefined;
      }
      
      await this.client.destroy();
      this.state.isConnected = false;
      this.state.isReady = false;
      logger.info('WhatsApp client destroyed');
    } catch (error) {
      logger.error('Error destroying client:', error);
      throw error;
    }
  }
}