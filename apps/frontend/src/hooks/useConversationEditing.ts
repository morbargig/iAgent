import { useState, useCallback } from 'react';
import type { Conversation } from '@iagent/chat-types';

interface UseConversationEditingOptions {
  onRename: (id: string, newTitle: string) => void;
  getTitle: (conversation: Conversation) => string;
}

export const useConversationEditing = ({
  onRename,
  getTitle,
}: UseConversationEditingOptions) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  const startEdit = useCallback(
    (conversation: Conversation) => {
      setEditingId(conversation.id);
      setEditingTitle(getTitle(conversation));
    },
    [getTitle]
  );

  const saveEdit = useCallback(() => {
    if (editingId && editingTitle.trim()) {
      onRename(editingId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  }, [editingId, editingTitle, onRename]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingTitle('');
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        saveEdit();
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
    },
    [saveEdit, cancelEdit]
  );

  return {
    editingId,
    editingTitle,
    setEditingTitle,
    startEdit,
    saveEdit,
    cancelEdit,
    handleKeyPress,
  };
};

