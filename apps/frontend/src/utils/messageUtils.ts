import { type Message } from "@iagent/chat-types";

export const deduplicateMessages = (messages: Message[]): Message[] => {
  const seen = new Set<string>();
  return messages.filter((msg) => {
    if (seen.has(msg.id)) {
      return false;
    }
    seen.add(msg.id);
    return true;
  });
};

