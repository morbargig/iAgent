import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { ChatService } from './chat.service';
import { Chat, ChatDocument, ChatMessage, ChatMessageDocument, ChatFilter, ChatFilterDocument } from '../schemas/chat.schema';

describe('ChatService', () => {
  let service: ChatService;
  let chatModel: Model<ChatDocument>;
  let messageModel: Model<ChatMessageDocument>;
  let filterModel: Model<ChatFilterDocument>;

  const MockChatModel = jest.fn().mockImplementation((data) => {
    return {
      ...mockChat,
      ...data,
      save: jest.fn().mockResolvedValue({ ...mockChat, ...data }),
    };
  });

  const createMockQuery = (result: any) => ({
    exec: jest.fn().mockResolvedValue(result),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  });

  const mockChatModel = {
    findOne: jest.fn().mockReturnValue(createMockQuery(null)),
    findOneAndUpdate: jest.fn().mockReturnValue(createMockQuery(null)),
    findOneAndDelete: jest.fn().mockReturnValue(createMockQuery(null)),
    find: jest.fn().mockReturnValue(createMockQuery([])),
    deleteMany: jest.fn().mockReturnValue(createMockQuery({ deletedCount: 0 })),
    countDocuments: jest.fn().mockReturnValue(createMockQuery(0)),
    updateMany: jest.fn().mockReturnValue(createMockQuery({ modifiedCount: 0 })),
  };

  const MockMessageModel = jest.fn().mockImplementation((data) => {
    return {
      ...mockMessage,
      ...data,
      save: jest.fn().mockResolvedValue({ ...mockMessage, ...data }),
    };
  });

  const mockMessageModel = {
    findOne: jest.fn().mockReturnValue(createMockQuery(null)),
    find: jest.fn().mockReturnValue(createMockQuery([])),
    deleteMany: jest.fn().mockReturnValue(createMockQuery({ deletedCount: 0 })),
    countDocuments: jest.fn().mockReturnValue(createMockQuery(0)),
  };

  const MockFilterModel = jest.fn().mockImplementation((data) => {
    return {
      ...mockFilter,
      ...data,
      save: jest.fn().mockResolvedValue({ ...mockFilter, ...data }),
    };
  });

  const mockFilterModel = {
    findOne: jest.fn().mockReturnValue(createMockQuery(null)),
    find: jest.fn().mockReturnValue(createMockQuery([])),
    findOneAndUpdate: jest.fn().mockReturnValue(createMockQuery(null)),
    findOneAndDelete: jest.fn().mockReturnValue(createMockQuery(null)),
    updateMany: jest.fn().mockReturnValue(createMockQuery({ modifiedCount: 0 })),
    deleteMany: jest.fn().mockReturnValue(createMockQuery({ deletedCount: 0 })),
  };

  const mockChat = {
    chatId: 'test-chat-id',
    userId: 'test-user-id',
    name: 'Test Chat',
    createdAt: new Date(),
    lastMessageAt: new Date(),
    messageCount: 0,
    archived: false,
    tags: [],
    settings: {},
    activeFilterId: null,
    associatedFilters: [],
    currentFilterConfig: null,
    save: jest.fn().mockResolvedValue(true),
  };

  const mockMessage = {
    id: 'test-message-id',
    chatId: 'test-chat-id',
    userId: 'test-user-id',
    role: 'user' as const,
    content: 'Test message',
    timestamp: new Date(),
    metadata: {},
    filterId: null,
    filterSnapshot: null,
    save: jest.fn().mockResolvedValue(true),
  };

  const mockFilter = {
    filterId: 'test-filter-id',
    name: 'Test Filter',
    userId: 'test-user-id',
    chatId: 'test-chat-id',
    filterConfig: { dateFilter: { type: 'custom' } },
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getModelToken(Chat.name),
          useValue: Object.assign(MockChatModel, mockChatModel),
        },
        {
          provide: getModelToken(ChatMessage.name),
          useValue: Object.assign(MockMessageModel, mockMessageModel),
        },
        {
          provide: getModelToken(ChatFilter.name),
          useValue: Object.assign(MockFilterModel, mockFilterModel),
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    chatModel = module.get<Model<ChatDocument>>(getModelToken(Chat.name));
    messageModel = module.get<Model<ChatMessageDocument>>(getModelToken(ChatMessage.name));
    filterModel = module.get<Model<ChatFilterDocument>>(getModelToken(ChatFilter.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Chat Management', () => {
    describe('createChat', () => {
      it('should create a new chat', async () => {
        const input = {
          userId: 'test-user-id',
          chatId: 'test-chat-id',
          name: 'New Chat',
        };

        mockChatModel.findOne.mockReturnValue(createMockQuery(null));
        const createdChat = { ...mockChat, name: 'New Chat' };
        MockChatModel.mockReturnValueOnce({
          ...createdChat,
          save: jest.fn().mockResolvedValue(createdChat),
        });

        const result = await service.createChat(input);

        expect(mockChatModel.findOne).toHaveBeenCalledWith({ chatId: input.chatId, userId: input.userId });
        expect(MockChatModel).toHaveBeenCalledWith(expect.objectContaining({
          chatId: input.chatId,
          userId: input.userId,
          name: input.name,
        }));
        expect(result.name).toBe('New Chat');
      });

      it('should return existing chat if it already exists', async () => {
        const input = {
          userId: 'test-user-id',
          chatId: 'test-chat-id',
          name: 'Existing Chat',
        };

        mockChatModel.findOne.mockReturnValue(createMockQuery(mockChat));

        const result = await service.createChat(input);

        expect(mockChatModel.findOne).toHaveBeenCalledWith({ chatId: input.chatId, userId: input.userId });
        expect(result).toEqual(mockChat);
        expect(MockChatModel).not.toHaveBeenCalled();
      });

      it('should generate chatId if not provided', async () => {
        const input = {
          userId: 'test-user-id',
          name: 'New Chat',
        };

        mockChatModel.findOne.mockReturnValue(createMockQuery(null));

        await service.createChat(input);

        expect(mockChatModel.findOne).toHaveBeenCalled();
        expect(MockChatModel).toHaveBeenCalled();
      });

      it('should use default name if not provided', async () => {
        const input = {
          userId: 'test-user-id',
          chatId: 'test-chat-id',
        };

        mockChatModel.findOne.mockReturnValue(createMockQuery(null));

        await service.createChat(input);

        expect(MockChatModel).toHaveBeenCalled();
        const callArgs = MockChatModel.mock.calls[0][0];
        expect(callArgs.name).toBe('New Chat');
      });
    });

    describe('getChat', () => {
      it('should return a chat by id', async () => {
        mockChatModel.findOne.mockReturnValue(createMockQuery(mockChat));

        const result = await service.getChat('test-chat-id', 'test-user-id');

        expect(mockChatModel.findOne).toHaveBeenCalledWith({ chatId: 'test-chat-id', userId: 'test-user-id' });
        expect(result).toEqual(mockChat);
      });

      it('should throw NotFoundException if chat does not exist', async () => {
        mockChatModel.findOne.mockReturnValue(createMockQuery(null));

        await expect(service.getChat('non-existent-id', 'test-user-id')).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateChatName', () => {
      it('should update chat name', async () => {
        const updatedChat = { ...mockChat, name: 'Updated Name' };
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(updatedChat));

        const result = await service.updateChatName('test-chat-id', 'test-user-id', 'Updated Name');

        expect(mockChatModel.findOneAndUpdate).toHaveBeenCalledWith(
          { chatId: 'test-chat-id', userId: 'test-user-id' },
          { name: 'Updated Name', updatedAt: expect.any(Date) },
          { new: true }
        );
        expect(result).toEqual(updatedChat);
      });

      it('should throw BadRequestException if name is empty', async () => {
        await expect(service.updateChatName('test-chat-id', 'test-user-id', '   ')).rejects.toThrow(BadRequestException);
      });

      it('should throw NotFoundException if chat does not exist', async () => {
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(null));

        await expect(service.updateChatName('non-existent-id', 'test-user-id', 'New Name')).rejects.toThrow(NotFoundException);
      });
    });

    describe('listChats', () => {
      it('should return all chats for a user', async () => {
        const chats = [mockChat, { ...mockChat, chatId: 'chat-2' }];
        mockChatModel.find.mockReturnValue(createMockQuery(chats));

        const result = await service.listChats('test-user-id');

        expect(mockChatModel.find).toHaveBeenCalledWith({ userId: 'test-user-id' });
        expect(result).toEqual(chats);
      });
    });

    describe('deleteChat', () => {
      it('should delete a chat and associated messages and filters', async () => {
        mockChatModel.findOneAndDelete.mockReturnValue(createMockQuery(mockChat));
        mockMessageModel.deleteMany.mockReturnValue(createMockQuery({ deletedCount: 5 }));
        mockFilterModel.deleteMany.mockReturnValue(createMockQuery({ deletedCount: 2 }));

        await service.deleteChat('test-chat-id', 'test-user-id');

        expect(mockChatModel.findOneAndDelete).toHaveBeenCalledWith({ chatId: 'test-chat-id', userId: 'test-user-id' });
        expect(mockMessageModel.deleteMany).toHaveBeenCalledWith({ chatId: 'test-chat-id', userId: 'test-user-id' });
        expect(mockFilterModel.deleteMany).toHaveBeenCalledWith({ chatId: 'test-chat-id', userId: 'test-user-id' });
      });

      it('should throw NotFoundException if chat does not exist', async () => {
        mockChatModel.findOneAndDelete.mockReturnValue(createMockQuery(null));

        await expect(service.deleteChat('non-existent-id', 'test-user-id')).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Message Management', () => {
    describe('addMessage', () => {
      it('should add a new message', async () => {
        const messageDto = {
          id: 'test-message-id',
          chatId: 'test-chat-id',
          userId: 'test-user-id',
          role: 'user' as const,
          content: 'Test message',
        };

        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(mockChat));
        mockMessageModel.findOne.mockReturnValue(createMockQuery(null));
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(mockChat));

        const result = await service.addMessage(messageDto);

        expect(mockMessageModel.findOne).toHaveBeenCalledWith({
          id: messageDto.id,
          chatId: messageDto.chatId,
          userId: messageDto.userId,
        });
        expect(result).toEqual(mockMessage);
      });

      it('should skip duplicate messages', async () => {
        const messageDto = {
          id: 'existing-message-id',
          chatId: 'test-chat-id',
          userId: 'test-user-id',
          role: 'user' as const,
          content: 'Test message',
        };

        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(mockChat));
        mockMessageModel.findOne.mockReturnValue(createMockQuery(mockMessage));
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(mockChat));

        const result = await service.addMessage(messageDto);

        expect(mockMessageModel.findOne).toHaveBeenCalled();
        expect(MockMessageModel).not.toHaveBeenCalled();
        expect(result).toEqual(mockMessage);
      });

      it('should create chat if it does not exist', async () => {
        const messageDto = {
          id: 'test-message-id',
          chatId: 'new-chat-id',
          userId: 'test-user-id',
          role: 'user' as const,
          content: 'Test message',
        };

        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(mockChat));
        mockMessageModel.findOne.mockReturnValue(createMockQuery(null));

        await service.addMessage(messageDto);

        expect(mockChatModel.findOneAndUpdate).toHaveBeenCalledWith(
          { chatId: messageDto.chatId, userId: messageDto.userId },
          expect.any(Object),
          { upsert: true, new: true }
        );
      });

      it('should apply active filter if message has no filter', async () => {
        const messageDto = {
          id: 'test-message-id',
          chatId: 'test-chat-id',
          userId: 'test-user-id',
          role: 'user' as const,
          content: 'Test message',
        };

        const chatWithFilter = { ...mockChat, activeFilterId: 'active-filter-id' };
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(chatWithFilter));
        mockMessageModel.findOne.mockReturnValue(createMockQuery(null));
        mockFilterModel.findOne.mockReturnValue(createMockQuery(mockFilter));

        await service.addMessage(messageDto);

        expect(mockFilterModel.findOne).toHaveBeenCalledWith({
          filterId: 'active-filter-id',
          userId: 'test-user-id',
        });
      });
    });

    describe('getChatMessages', () => {
      it('should return all messages for a chat', async () => {
        const messages = [mockMessage, { ...mockMessage, id: 'msg-2' }];
        mockChatModel.findOne.mockReturnValue(createMockQuery(mockChat));
        mockMessageModel.find.mockReturnValue(createMockQuery(messages));

        const result = await service.getChatMessages('test-chat-id', 'test-user-id');

        expect(mockChatModel.findOne).toHaveBeenCalledWith({ chatId: 'test-chat-id', userId: 'test-user-id' });
        expect(mockMessageModel.find).toHaveBeenCalledWith({ chatId: 'test-chat-id', userId: 'test-user-id' });
        expect(result).toEqual(messages);
      });

      it('should return empty array if chat does not exist', async () => {
        mockChatModel.findOne.mockReturnValue(createMockQuery(null));

        const result = await service.getChatMessages('non-existent-id', 'test-user-id');

        expect(result).toEqual([]);
        expect(mockChatModel.findOne).toHaveBeenCalledWith({ chatId: 'non-existent-id', userId: 'test-user-id' });
      });
    });

    describe('deleteMessagesFrom', () => {
      it('should delete messages from a specific point', async () => {
        const targetMessage = { ...mockMessage, timestamp: new Date('2024-01-15') };
        const latestMessage = { ...mockMessage, id: 'latest-msg', timestamp: new Date('2024-01-10') };

        mockChatModel.findOne.mockReturnValue(createMockQuery(mockChat));
        mockMessageModel.findOne
          .mockReturnValueOnce(createMockQuery(targetMessage))
          .mockReturnValueOnce(createMockQuery(latestMessage));
        mockMessageModel.deleteMany.mockReturnValue(createMockQuery({ deletedCount: 3 }));
        mockMessageModel.countDocuments.mockReturnValue(createMockQuery(5));
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(mockChat));

        await service.deleteMessagesFrom('test-chat-id', 'test-user-id', 'test-message-id');

        expect(mockMessageModel.deleteMany).toHaveBeenCalledWith({
          chatId: 'test-chat-id',
          userId: 'test-user-id',
          timestamp: { $gte: targetMessage.timestamp },
        });
      });
    });
  });

  describe('Filter Management', () => {
    describe('createFilter', () => {
      it('should create a new filter', async () => {
        const filterDto = {
          filterId: 'test-filter-id',
          name: 'Test Filter',
          userId: 'test-user-id',
          chatId: 'test-chat-id',
          filterConfig: { dateFilter: { type: 'custom' } },
        };

        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(mockChat));

        const result = await service.createFilter(filterDto);

        expect(MockFilterModel).toHaveBeenCalledWith(filterDto);
        expect(mockChatModel.findOneAndUpdate).toHaveBeenCalledWith(
          { chatId: filterDto.chatId, userId: filterDto.userId },
          { $addToSet: { associatedFilters: filterDto.filterId } }
        );
        expect(result).toEqual(mockFilter);
      });
    });

    describe('getFiltersForChat', () => {
      it('should return all filters for a chat', async () => {
        const filters = [mockFilter, { ...mockFilter, filterId: 'filter-2' }];
        mockFilterModel.find.mockReturnValue(createMockQuery(filters));

        const result = await service.getFiltersForChat('test-chat-id', 'test-user-id');

        expect(mockFilterModel.find).toHaveBeenCalledWith({ chatId: 'test-chat-id', userId: 'test-user-id' });
        expect(result).toEqual(filters);
      });
    });

    describe('updateFilter', () => {
      it('should update a filter', async () => {
        const updatedFilter = { ...mockFilter, name: 'Updated Filter' };
        const updateData = { name: 'Updated Filter' };

        mockFilterModel.findOneAndUpdate.mockReturnValue(createMockQuery(updatedFilter));

        const result = await service.updateFilter('test-filter-id', 'test-user-id', updateData);

        expect(mockFilterModel.findOneAndUpdate).toHaveBeenCalledWith(
          { filterId: 'test-filter-id', userId: 'test-user-id' },
          { ...updateData, updatedAt: expect.any(Date) },
          { new: true }
        );
        expect(result).toEqual(updatedFilter);
      });

      it('should throw NotFoundException if filter does not exist', async () => {
        mockFilterModel.findOneAndUpdate.mockReturnValue(createMockQuery(null));

        await expect(service.updateFilter('non-existent-id', 'test-user-id', { name: 'New Name' })).rejects.toThrow(NotFoundException);
      });
    });

    describe('setActiveFilter', () => {
      it('should set a filter as active', async () => {
        const activeFilter = { ...mockFilter, isActive: true };
        const updatedChat = { ...mockChat, activeFilterId: 'test-filter-id', currentFilterConfig: mockFilter.filterConfig };

        mockFilterModel.updateMany.mockReturnValue(createMockQuery({ modifiedCount: 1 }));
        mockFilterModel.findOneAndUpdate.mockReturnValue(createMockQuery(activeFilter));
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(updatedChat));

        const result = await service.setActiveFilter('test-chat-id', 'test-user-id', 'test-filter-id');

        expect(mockFilterModel.updateMany).toHaveBeenCalledWith(
          { chatId: 'test-chat-id', userId: 'test-user-id' },
          { isActive: false }
        );
        expect(mockFilterModel.findOneAndUpdate).toHaveBeenCalledWith(
          { filterId: 'test-filter-id', userId: 'test-user-id', chatId: 'test-chat-id' },
          { isActive: true },
          { new: true }
        );
        expect(mockChatModel.findOneAndUpdate).toHaveBeenCalledWith(
          { chatId: 'test-chat-id', userId: 'test-user-id' },
          { activeFilterId: 'test-filter-id', currentFilterConfig: mockFilter.filterConfig },
          { new: true }
        );
        expect(result).toEqual(updatedChat);
      });

      it('should deactivate all filters when setting to null', async () => {
        const updatedChat = { ...mockChat, activeFilterId: null, currentFilterConfig: null };

        mockFilterModel.updateMany.mockReturnValue(createMockQuery({ modifiedCount: 2 }));
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(updatedChat));

        const result = await service.setActiveFilter('test-chat-id', 'test-user-id', null);

        expect(mockFilterModel.updateMany).toHaveBeenCalledWith(
          { chatId: 'test-chat-id', userId: 'test-user-id' },
          { isActive: false }
        );
        expect(mockChatModel.findOneAndUpdate).toHaveBeenCalledWith(
          { chatId: 'test-chat-id', userId: 'test-user-id' },
          { activeFilterId: null, currentFilterConfig: null },
          { new: true }
        );
        expect(result).toEqual(updatedChat);
      });

      it('should throw NotFoundException if filter does not exist', async () => {
        mockFilterModel.updateMany.mockReturnValue(createMockQuery({ modifiedCount: 1 }));
        mockFilterModel.findOneAndUpdate.mockReturnValue(createMockQuery(null));

        await expect(service.setActiveFilter('test-chat-id', 'test-user-id', 'non-existent-id')).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException if chat does not exist', async () => {
        mockFilterModel.updateMany.mockReturnValue(createMockQuery({ modifiedCount: 1 }));
        mockFilterModel.findOneAndUpdate.mockReturnValue(createMockQuery(mockFilter));
        mockChatModel.findOneAndUpdate.mockReturnValue(createMockQuery(null));

        await expect(service.setActiveFilter('non-existent-chat-id', 'test-user-id', 'test-filter-id')).rejects.toThrow(NotFoundException);
      });
    });

    describe('deleteFilter', () => {
      it('should delete a filter', async () => {
        mockFilterModel.findOneAndDelete.mockReturnValue(createMockQuery(mockFilter));
        mockChatModel.updateMany.mockReturnValue(createMockQuery({ modifiedCount: 1 }));

        await service.deleteFilter('test-filter-id', 'test-user-id');

        expect(mockFilterModel.findOneAndDelete).toHaveBeenCalledWith({
          filterId: 'test-filter-id',
          userId: 'test-user-id',
        });
        expect(mockChatModel.updateMany).toHaveBeenCalledWith(
          { userId: 'test-user-id' },
          { $pull: { associatedFilters: 'test-filter-id' } }
        );
        expect(mockChatModel.updateMany).toHaveBeenCalledWith(
          { userId: 'test-user-id', activeFilterId: 'test-filter-id' },
          { $unset: { activeFilterId: 1 }, $set: { currentFilterConfig: null } }
        );
      });

      it('should throw NotFoundException if filter does not exist', async () => {
        mockFilterModel.findOneAndDelete.mockReturnValue(createMockQuery(null));

        await expect(service.deleteFilter('non-existent-id', 'test-user-id')).rejects.toThrow(NotFoundException);
      });
    });
  });
});

