import type { Conversation } from "@iagent/chat-types";
import { getBaseApiUrl } from "../config/config";
import { convertMongoMessageToMessage } from "../utils/chunkConverter";

export interface ChatDocument {
  chatId: string;
  name: string;
  userId: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  archived: boolean;
}

export interface ChatMessageDocument {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  chatId: string;
  userId: string;
  metadata?: Record<string, unknown>;
  filterId?: string | null;
  filterVersion?: number | null;
}

export const chatService = {
  async saveChatToMongo(
    conversation: Conversation,
    authToken: string,
    userId: string
  ): Promise<void> {
    try {
      const baseUrl = getBaseApiUrl();
      console.log('🔍 Saving chat to MongoDB:', { baseUrl, chatId: conversation.id, userId });
      
      // Ensure chat exists (create if it doesn't)
      try {
        const chatResponse = await fetch(`${baseUrl}/api/chats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            chatId: conversation.id,
            name: conversation.title,
          }),
        });

        if (!chatResponse.ok) {
          const errorText = await chatResponse.text();
          console.warn(
            `Failed to create chat ${conversation.id}:`,
            chatResponse.status,
            errorText
          );
          // Continue anyway - chat might already exist
        }
      } catch (error) {
        // Chat might already exist, continue
        console.warn(`Error creating chat ${conversation.id}:`, error);
      }

      // Get existing messages to avoid duplicates
      let existingMessageIds: Set<string> = new Set();
      try {
        const existingMessagesResponse = await fetch(
          `${baseUrl}/api/chats/${conversation.id}/messages`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        if (existingMessagesResponse.ok) {
          const existingMessages: ChatMessageDocument[] = await existingMessagesResponse.json();
          existingMessageIds = new Set(existingMessages.map((msg) => msg.id));
        }
      } catch (error) {
        console.warn("Failed to fetch existing messages, will attempt to save all:", error);
      }

      // Save all messages (only non-streaming messages that don't already exist)
      const messagesToSave = conversation.messages.filter(
        (msg) => !msg.isStreaming && msg.content.trim().length > 0 && !existingMessageIds.has(msg.id)
      );

      let savedCount = 0;
      let skippedCount = 0;

      for (const message of messagesToSave) {
        try {
          const attachmentIds = message.attachments?.map((att) => att.id) || [];
          const metadata = {
            ...(message.metadata || {}),
            ...(attachmentIds.length > 0 && { attachmentIds }),
          };

          const response = await fetch(
            `${baseUrl}/api/chats/${conversation.id}/messages`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                id: message.id,
                role: message.role,
                content: message.content,
                timestamp: message.timestamp.toISOString(),
                metadata,
                filterId: message.filterId || null,
                filterVersion: message.filterVersion || null,
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            // If message already exists (409 or similar), skip it
            if (response.status === 409 || response.status === 400) {
              skippedCount++;
              console.log(`⏭️ Message ${message.id} already exists, skipping`);
            } else {
              console.error(
                `Failed to save message ${message.id}:`,
                response.status,
                response.statusText,
                errorText
              );
            }
          } else {
            savedCount++;
            console.log(`✅ Message ${message.id} saved successfully`);
          }
        } catch (error) {
          console.error(`Failed to save message ${message.id}:`, error);
        }
      }

      const totalMessages = conversation.messages.filter(
        (msg) => !msg.isStreaming && msg.content.trim().length > 0
      ).length;
      skippedCount += totalMessages - messagesToSave.length;

      console.log(
        `✅ Chat ${conversation.id} backup complete: ${savedCount} saved, ${skippedCount} skipped (${totalMessages} total)`
      );
    } catch (error) {
      console.error("❌ Failed to save chat to MongoDB:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      // Don't throw - allow the app to continue even if MongoDB save fails
    }
  },

  async updateChatName(
    chatId: string,
    name: string,
    authToken: string
  ): Promise<void> {
    try {
      const baseUrl = getBaseApiUrl();
      
      await fetch(`${baseUrl}/api/chats/${chatId}/name`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name }),
      });

      console.log(`✅ Chat ${chatId} name updated to "${name}"`);
    } catch (error) {
      console.error("Failed to update chat name:", error);
      throw error;
    }
  },

  async loadChatFromMongo(
    chatId: string,
    authToken: string
  ): Promise<Conversation | null> {
    try {
      const baseUrl = getBaseApiUrl();
      
      // Load chat metadata
      const chatResponse = await fetch(`${baseUrl}/api/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!chatResponse.ok) {
        if (chatResponse.status === 404) {
          return null;
        }
        throw new Error(`Failed to load chat: ${chatResponse.statusText}`);
      }

      const chat: ChatDocument = await chatResponse.json();

      // Load messages
      const messagesResponse = await fetch(
        `${baseUrl}/api/chats/${chatId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!messagesResponse.ok) {
        if (messagesResponse.status === 404) {
          // Chat doesn't exist, return null
          return null;
        }
        throw new Error(`Failed to load messages: ${messagesResponse.statusText}`);
      }

      const messages: ChatMessageDocument[] = await messagesResponse.json();

      return {
        id: chat.chatId,
        title: chat.name,
        messages: messages.map((msg) => convertMongoMessageToMessage({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          metadata: msg.metadata,
          filterId: msg.filterId,
          filterVersion: msg.filterVersion,
        })),
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.lastMessageAt),
        lastUpdated: new Date(chat.lastMessageAt),
      };
    } catch (error) {
      console.error("Failed to load chat from MongoDB:", error);
      return null;
    }
  },

  async listChats(authToken: string): Promise<ChatDocument[]> {
    try {
      const baseUrl = getBaseApiUrl();
      
      const response = await fetch(`${baseUrl}/api/chats`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to list chats:", error);
      return [];
    }
  },

  async deleteChat(chatId: string, authToken: string): Promise<void> {
    try {
      const baseUrl = getBaseApiUrl();
      
      await fetch(`${baseUrl}/api/chats/${chatId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log(`✅ Chat ${chatId} deleted from MongoDB`);
    } catch (error) {
      console.error("Failed to delete chat:", error);
      throw error;
    }
  },

  async deleteMessage(
    chatId: string,
    messageId: string,
    authToken: string
  ): Promise<void> {
    try {
      const baseUrl = getBaseApiUrl();
      
      const response = await fetch(
        `${baseUrl}/api/chats/${chatId}/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.statusText}`);
      }

      console.log(`✅ Message ${messageId} and subsequent messages deleted from MongoDB`);
    } catch (error) {
      console.error("Failed to delete message:", error);
      throw error;
    }
  },
};

