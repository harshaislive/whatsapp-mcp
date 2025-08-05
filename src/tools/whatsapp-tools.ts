import { WhatsAppClientWrapper } from '../whatsapp/client';
import logger from '../utils/logger';

export class WhatsAppTools {
  constructor(private whatsappClient: WhatsAppClientWrapper) {}

  async sendMessage(to: string, message: string): Promise<{ content: any[] }> {
    try {
      await this.whatsappClient.sendMessage(to, message);
      
      return {
        content: [{
          type: 'text',
          text: `Message sent successfully to ${to}`
        }]
      };
    } catch (error) {
      logger.error('Send message tool error:', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  async getContacts(): Promise<{ content: any[] }> {
    try {
      const contacts = await this.whatsappClient.getContacts();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(contacts, null, 2)
        }]
      };
    } catch (error) {
      logger.error('Get contacts tool error:', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to get contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  async getChats(): Promise<{ content: any[] }> {
    try {
      const chats = await this.whatsappClient.getChats();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(chats, null, 2)
        }]
      };
    } catch (error) {
      logger.error('Get chats tool error:', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to get chats: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  async getConnectionStatus(): Promise<{ content: any[] }> {
    try {
      const state = this.whatsappClient.getState();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(state, null, 2)
        }]
      };
    } catch (error) {
      logger.error('Get connection status tool error:', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to get connection status: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  async getChatHistory(chatId: string, limit?: number, includeMedia?: boolean): Promise<{ content: any[] }> {
    try {
      const messages = await this.whatsappClient.getChatHistory(chatId, limit, includeMedia || false);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            chatId,
            messageCount: messages.length,
            includeMedia: includeMedia || false,
            messages: messages.map(msg => ({
              id: msg.id,
              from: msg.from,
              body: msg.body,
              timestamp: new Date(msg.timestamp * 1000).toISOString(),
              isGroupMsg: msg.isGroupMsg,
              hasMedia: msg.hasMedia,
              mediaType: msg.mediaType,
              mediaUrl: msg.mediaUrl,
              mediaData: msg.mediaData,
              author: msg.author,
              isForwarded: msg.isForwarded
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      logger.error('Get chat history tool error:', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to get chat history: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  async searchChats(query: string): Promise<{ content: any[] }> {
    try {
      const chats = await this.whatsappClient.searchChats(query);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query,
            resultCount: chats.length,
            chats
          }, null, 2)
        }]
      };
    } catch (error) {
      logger.error('Search chats tool error:', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to search chats: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  async getQRCode(): Promise<{ content: any[] }> {
    try {
      const state = this.whatsappClient.getState();
      
      if (state.isAuthenticated) {
        return {
          content: [{
            type: 'text',
            text: 'WhatsApp is already authenticated. No QR code needed.'
          }]
        };
      }
      
      if (!state.qrCodeDataURL) {
        return {
          content: [{
            type: 'text',
            text: 'QR code not yet generated. Please wait for WhatsApp to initialize.\n\nYou can also check: http://localhost:3000/qr'
          }]
        };
      }
      
      return {
        content: [{
          type: 'text',
          text: `QR Code for WhatsApp Authentication:\n\n${state.qrCodeDataURL}\n\nYou can also access it at:\n- JSON: http://localhost:3000/qr\n- Image: http://localhost:3000/qr.png\n\nScan this QR code with your WhatsApp mobile app to authenticate.`
        }]
      };
    } catch (error) {
      logger.error('Get QR code tool error:', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to get QR code: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  async getAuthStatus(): Promise<{ content: any[] }> {
    try {
      const state = this.whatsappClient.getState();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            isConnected: state.isConnected,
            isReady: state.isReady,
            isAuthenticated: state.isAuthenticated,
            qrAvailable: !!state.qrCode,
            message: state.isAuthenticated 
              ? 'WhatsApp is authenticated and ready'
              : state.qrCode 
                ? 'QR code available - scan to authenticate'
                : 'Initializing WhatsApp client...'
          }, null, 2)
        }]
      };
    } catch (error) {
      logger.error('Get auth status tool error:', error);
      return {
        content: [{
          type: 'text',
          text: `Failed to get auth status: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  async disconnectWhatsApp(confirmation: string): Promise<{ content: any[] }> {
    try {
      // Check if confirmation matches required text
      const requiredConfirmation = "YES_DISCONNECT_WHATSAPP";
      
      if (confirmation !== requiredConfirmation) {
        return {
          content: [{
            type: 'text',
            text: `⚠️ CONFIRMATION REQUIRED\n\nTo disconnect WhatsApp, you must provide the exact confirmation text.\n\n🔴 WARNING: This will:\n- Log out from WhatsApp Web\n- Clear your session data\n- Require QR code scan to reconnect\n- Stop all WhatsApp functionality\n\nIf you're sure you want to disconnect, call this tool again with:\nconfirmation: "${requiredConfirmation}"\n\n(Copy and paste exactly as shown above)`
          }]
        };
      }

      const state = this.whatsappClient.getState();
      
      if (!state.isConnected && !state.isReady) {
        return {
          content: [{
            type: 'text',
            text: 'WhatsApp is not connected. Nothing to disconnect.'
          }]
        };
      }

      logger.info('User confirmed WhatsApp disconnection');
      await this.whatsappClient.disconnect();
      
      return {
        content: [{
          type: 'text',
          text: '✅ WhatsApp has been successfully disconnected.\n\n📝 Summary:\n- Session cleared\n- Authentication removed\n- Connection terminated\n\n🔄 To reconnect:\n1. Restart the server or wait for auto-reconnect\n2. Use get_qr_code tool to get new QR code\n3. Scan QR code with WhatsApp mobile app'
          }]
        };
    } catch (error) {
      logger.error('Disconnect WhatsApp tool error:', error);
      return {
        content: [{
          type: 'text',
          text: `❌ Failed to disconnect WhatsApp: ${error instanceof Error ? error.message : 'Unknown error'}\n\nThe connection may still be active. Check status with get_auth_status tool.`
        }]
      };
    }
  }

  async logoutWhatsApp(confirmation: string): Promise<{ content: any[] }> {
    try {
      // Check if confirmation matches required text
      const requiredConfirmation = "YES_LOGOUT_WHATSAPP";
      
      if (confirmation !== requiredConfirmation) {
        return {
          content: [{
            type: 'text',
            text: `⚠️ CONFIRMATION REQUIRED\n\nTo logout from WhatsApp (keeps connection but removes authentication), you must provide the exact confirmation text.\n\n🟡 WARNING: This will:\n- Log out from WhatsApp Web\n- Keep the connection active\n- Require QR code scan to re-authenticate\n- Generate a new QR code automatically\n\nIf you're sure you want to logout, call this tool again with:\nconfirmation: "${requiredConfirmation}"\n\n(Copy and paste exactly as shown above)`
          }]
        };
      }

      const state = this.whatsappClient.getState();
      
      if (!state.isAuthenticated) {
        return {
          content: [{
            type: 'text',
            text: 'WhatsApp is not authenticated. Nothing to logout from.'
          }]
        };
      }

      logger.info('User confirmed WhatsApp logout');
      await this.whatsappClient.logout();
      
      return {
        content: [{
          type: 'text',
          text: '✅ WhatsApp logout successful.\n\n📝 Summary:\n- Authentication removed\n- Connection still active\n- New QR code will be generated\n\n🔄 To re-authenticate:\n1. Use get_qr_code tool to get new QR code\n2. Scan QR code with WhatsApp mobile app'
        }]
      };
    } catch (error) {
      logger.error('Logout WhatsApp tool error:', error);
      return {
        content: [{
          type: 'text',
          text: `❌ Failed to logout from WhatsApp: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  async reconnectWhatsApp(): Promise<{ content: any[] }> {
    try {
      const state = this.whatsappClient.getState();
      
      if (state.isReady && state.isAuthenticated) {
        return {
          content: [{
            type: 'text',
            text: '✅ WhatsApp is already connected and authenticated. No reconnection needed.\n\n📊 Current Status:\n- Connected: ✅\n- Ready: ✅\n- Authenticated: ✅'
          }]
        };
      }

      if (state.isConnected) {
        return {
          content: [{
            type: 'text',
            text: '🔄 WhatsApp is connected but not authenticated.\n\n💡 Use get_qr_code tool to get QR code for authentication instead of reconnecting.'
          }]
        };
      }

      logger.info('User initiated manual WhatsApp reconnection');
      await this.whatsappClient.reconnect();
      
      return {
        content: [{
          type: 'text',
          text: '🔄 WhatsApp reconnection initiated successfully!\n\n📝 What happens next:\n1. New WhatsApp client will initialize\n2. QR code will be generated (check with get_qr_code)\n3. Scan QR code with your mobile app\n4. Connection will be established\n\n⏱️ This may take a few seconds. Use get_auth_status to monitor progress.'
        }]
      };
    } catch (error) {
      logger.error('Reconnect WhatsApp tool error:', error);
      return {
        content: [{
          type: 'text',
          text: `❌ Failed to reconnect WhatsApp: ${error instanceof Error ? error.message : 'Unknown error'}\n\n💡 Reconnection may still be in progress. Check get_auth_status in a few seconds.`
        }]
      };
    }
  }
}