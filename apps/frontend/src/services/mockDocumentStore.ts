// Mock Document Store
// In-memory mock data store for development and testing

import { DocumentFile, DocumentMetadata } from '../types/document.types';

// Mock document data
const mockDocuments: DocumentFile[] = [
  {
    id: 'doc-1',
    name: 'Project Proposal.pdf',
    originalName: 'Project Proposal.pdf',
    size: 2048576, // 2MB
    type: 'application/pdf',
    mimeType: 'application/pdf',
    uploadedAt: new Date('2024-01-15T10:30:00Z'),
    userId: 'demo-user',
    status: 'ready',
    url: '/api/documents/doc-1/download',
    metadata: {
      pages: 15,
      wordCount: 2500,
      language: 'en',
      extractedText: 'This is a comprehensive project proposal outlining the development of a new document management system. The proposal includes detailed technical specifications, timeline, and budget considerations.',
      summary: 'Project proposal for document management system development',
      tags: ['project', 'proposal', 'development']
    }
  },
  {
    id: 'doc-2',
    name: 'Meeting Notes.docx',
    originalName: 'Meeting Notes.docx',
    size: 512000, // 512KB
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    uploadedAt: new Date('2024-01-14T14:20:00Z'),
    userId: 'demo-user',
    status: 'ready',
    url: '/api/documents/doc-2/download',
    metadata: {
      pages: 3,
      wordCount: 800,
      language: 'en',
      extractedText: 'Meeting notes from the weekly team standup. Key topics discussed: project timeline, resource allocation, and upcoming milestones.',
      summary: 'Weekly team standup meeting notes',
      tags: ['meeting', 'notes', 'team']
    }
  },
  {
    id: 'doc-3',
    name: 'Budget Analysis.xlsx',
    originalName: 'Budget Analysis.xlsx',
    size: 1024000, // 1MB
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedAt: new Date('2024-01-13T09:15:00Z'),
    userId: 'demo-user',
    status: 'ready',
    url: '/api/documents/doc-3/download',
    metadata: {
      pages: 1,
      wordCount: 150,
      language: 'en',
      extractedText: 'Budget analysis spreadsheet containing quarterly financial data, expense breakdowns, and revenue projections.',
      summary: 'Quarterly budget analysis and financial projections',
      tags: ['budget', 'finance', 'analysis']
    }
  },
  {
    id: 'doc-4',
    name: 'Technical Specifications.txt',
    originalName: 'Technical Specifications.txt',
    size: 256000, // 256KB
    type: 'text/plain',
    mimeType: 'text/plain',
    uploadedAt: new Date('2024-01-12T16:45:00Z'),
    userId: 'demo-user',
    status: 'ready',
    url: '/api/documents/doc-4/download',
    metadata: {
      pages: 1,
      wordCount: 1200,
      language: 'en',
      extractedText: 'Detailed technical specifications for the document management system including API endpoints, database schema, and security requirements.',
      summary: 'Technical specifications for document management system',
      tags: ['technical', 'specifications', 'api']
    }
  },
  {
    id: 'doc-5',
    name: 'User Manual.pdf',
    originalName: 'User Manual.pdf',
    size: 5120000, // 5MB
    type: 'application/pdf',
    mimeType: 'application/pdf',
    uploadedAt: new Date('2024-01-11T11:30:00Z'),
    userId: 'demo-user',
    status: 'ready',
    url: '/api/documents/doc-5/download',
    metadata: {
      pages: 25,
      wordCount: 5000,
      language: 'en',
      extractedText: 'Comprehensive user manual for the document management system covering installation, configuration, usage, and troubleshooting.',
      summary: 'Complete user manual for document management system',
      tags: ['manual', 'user', 'documentation']
    }
  }
];

// Mock user data
const mockUsers = {
  'demo-user': {
    id: 'demo-user',
    name: 'Demo User',
    email: 'demo@example.com'
  }
};

export class MockDocumentStore {
  private documents: DocumentFile[] = [...mockDocuments];
  private nextId = 6;

  // Get all documents
  getDocuments(): DocumentFile[] {
    return [...this.documents];
  }

  // Get document by ID
  getDocumentById(id: string): DocumentFile | undefined {
    return this.documents.find(doc => doc.id === id);
  }

  // Add new document
  addDocument(document: Omit<DocumentFile, 'id'>): DocumentFile {
    const newDocument: DocumentFile = {
      ...document,
      id: `doc-${this.nextId++}`,
      uploadedAt: new Date()
    };
    this.documents.unshift(newDocument);
    return newDocument;
  }

  // Update document
  updateDocument(id: string, updates: Partial<DocumentFile>): DocumentFile | null {
    const index = this.documents.findIndex(doc => doc.id === id);
    if (index === -1) return null;
    
    this.documents[index] = { ...this.documents[index], ...updates };
    return this.documents[index];
  }

  // Delete document
  deleteDocument(id: string): boolean {
    const index = this.documents.findIndex(doc => doc.id === id);
    if (index === -1) return false;
    
    this.documents.splice(index, 1);
    return true;
  }

  // Search documents
  searchDocuments(query: string, filters?: any): DocumentFile[] {
    let results = [...this.documents];
    
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm) ||
        doc.metadata?.extractedText?.toLowerCase().includes(searchTerm) ||
        doc.metadata?.summary?.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters?.type) {
      results = results.filter(doc => doc.type === filters.type);
    }
    
    if (filters?.status && filters.status.length > 0) {
      results = results.filter(doc => filters.status.includes(doc.status));
    }
    
    if (filters?.dateRange) {
      results = results.filter(doc => {
        const docDate = new Date(doc.uploadedAt);
        return docDate >= filters.dateRange.start && docDate <= filters.dateRange.end;
      });
    }
    
    return results;
  }

  // Get paginated documents
  getPaginatedDocuments(page = 1, limit = 10, query?: string, filters?: any): {
    documents: DocumentFile[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  } {
    const allResults = query || filters ? this.searchDocuments(query || '', filters) : this.documents;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      documents: allResults.slice(startIndex, endIndex),
      total: allResults.length,
      page,
      limit,
      hasMore: endIndex < allResults.length
    };
  }

  // Get user documents
  getUserDocuments(userId: string): DocumentFile[] {
    return this.documents.filter(doc => doc.userId === userId);
  }

  // Get document statistics
  getDocumentStats(): {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalSize: number;
  } {
    const stats = {
      total: this.documents.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      totalSize: 0
    };
    
    this.documents.forEach(doc => {
      stats.byType[doc.type] = (stats.byType[doc.type] || 0) + 1;
      stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;
      stats.totalSize += doc.size;
    });
    
    return stats;
  }

  // Reset to initial state
  reset(): void {
    this.documents = [...mockDocuments];
    this.nextId = 6;
  }
}

// Export singleton instance
export const mockDocumentStore = new MockDocumentStore();
