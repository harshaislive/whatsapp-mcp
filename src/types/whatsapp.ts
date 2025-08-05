export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  isGroupMsg: boolean;
  groupId?: string;
  hasMedia: boolean;
  mediaType?: string;
  mediaUrl?: string;
  mediaData?: {
    mimetype: string;
    filename?: string;
    size: number;
  };
  author?: string;
  isForwarded?: boolean;
  mentionedIds?: string[];
}

export interface WhatsAppContact {
  id: string;
  name?: string;
  pushname?: string;
  isGroup: boolean;
  isMyContact: boolean;
  profilePicUrl?: string;
}

export interface WhatsAppGroup {
  id: string;
  name: string;
  description?: string;
  participants: string[];
  admins: string[];
  owner: string;
  createdAt: number;
}

export interface WhatsAppClientConfig {
  sessionName: string;
  puppeteerOptions?: any;
  authTimeoutMs?: number;
}

export interface ConnectionState {
  isConnected: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  qrCode?: string;
  qrCodeDataURL?: string;
  lastSeen?: number;
}