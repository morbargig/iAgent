// File Processing Service
// Handles file processing, text extraction, and metadata generation

import { DocumentMetadata, DocumentProcessingResult } from '../types/document.types';

export class FileProcessingService {
  // Extract text from different file types
  static async extractText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          let extractedText = '';
          
          switch (file.type) {
            case 'text/plain':
            case 'text/markdown':
            case 'text/csv':
              extractedText = content;
              break;
              
            case 'application/pdf':
              // For PDF, we'll simulate text extraction
              // In a real implementation, you'd use a PDF parsing library
              extractedText = this.simulatePdfTextExtraction(file.name);
              break;
              
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            case 'application/msword':
              // For Word documents, simulate text extraction
              extractedText = this.simulateWordTextExtraction(file.name);
              break;
              
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case 'application/vnd.ms-excel':
              // For Excel documents, simulate text extraction
              extractedText = this.simulateExcelTextExtraction(file.name);
              break;
              
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            case 'application/vnd.ms-powerpoint':
              // For PowerPoint documents, simulate text extraction
              extractedText = this.simulatePowerPointTextExtraction(file.name);
              break;
              
            default:
              extractedText = `Content from ${file.name}`;
          }
          
          resolve(extractedText);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      // Read as text for text files, as array buffer for others
      if (file.type.startsWith('text/')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  // Generate metadata for a file
  static async generateMetadata(file: File, extractedText?: string): Promise<DocumentMetadata> {
    const metadata: DocumentMetadata = {
      language: 'en',
      encoding: 'utf-8'
    };

    // Calculate word count
    if (extractedText) {
      metadata.wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
      metadata.extractedText = extractedText;
    }

    // Estimate pages based on file type and size
    metadata.pages = this.estimatePages(file, extractedText);

    // Generate summary
    if (extractedText) {
      metadata.summary = this.generateSummary(extractedText);
    }

    // Generate tags based on content
    if (extractedText) {
      metadata.tags = this.generateTags(file, extractedText);
    }

    return metadata;
  }

  // Process a file and return processing result
  static async processFile(file: File): Promise<DocumentProcessingResult> {
    try {
      // Extract text
      const extractedText = await this.extractText(file);
      
      // Generate metadata
      const metadata = await this.generateMetadata(file, extractedText);
      
      // Generate thumbnail URL (simulated)
      const thumbnailUrl = this.generateThumbnailUrl(file);
      
      return {
        documentId: `doc_${Date.now()}`,
        extractedText,
        summary: metadata.summary,
        metadata,
        thumbnailUrl
      };
    } catch (error) {
      throw new Error(`Failed to process file: ${error}`);
    }
  }

  // Simulate PDF text extraction
  private static simulatePdfTextExtraction(fileName: string): string {
    const mockTexts = {
      'Project Proposal.pdf': 'This is a comprehensive project proposal outlining the development of a new document management system. The proposal includes detailed technical specifications, timeline, and budget considerations.',
      'User Manual.pdf': 'Comprehensive user manual for the document management system covering installation, configuration, usage, and troubleshooting.',
      'Technical Report.pdf': 'Detailed technical report containing analysis, findings, and recommendations for the document management system implementation.'
    };
    
    return mockTexts[fileName as keyof typeof mockTexts] || `PDF content from ${fileName}`;
  }

  // Simulate Word text extraction
  private static simulateWordTextExtraction(fileName: string): string {
    const mockTexts = {
      'Meeting Notes.docx': 'Meeting notes from the weekly team standup. Key topics discussed: project timeline, resource allocation, and upcoming milestones.',
      'Project Plan.docx': 'Detailed project plan including phases, deliverables, and timeline for the document management system development.',
      'Requirements.docx': 'System requirements document outlining functional and non-functional requirements for the document management system.'
    };
    
    return mockTexts[fileName as keyof typeof mockTexts] || `Word document content from ${fileName}`;
  }

  // Simulate Excel text extraction
  private static simulateExcelTextExtraction(fileName: string): string {
    const mockTexts = {
      'Budget Analysis.xlsx': 'Budget analysis spreadsheet containing quarterly financial data, expense breakdowns, and revenue projections.',
      'Project Timeline.xlsx': 'Project timeline spreadsheet with milestones, deadlines, and resource allocation.',
      'Data Analysis.xlsx': 'Data analysis spreadsheet containing metrics, charts, and statistical analysis.'
    };
    
    return mockTexts[fileName as keyof typeof mockTexts] || `Excel spreadsheet content from ${fileName}`;
  }

  // Simulate PowerPoint text extraction
  private static simulatePowerPointTextExtraction(fileName: string): string {
    const mockTexts = {
      'Project Presentation.pptx': 'Project presentation slides covering overview, objectives, timeline, and next steps for the document management system.',
      'Team Meeting.pptx': 'Team meeting presentation slides with agenda, updates, and action items.',
      'Product Demo.pptx': 'Product demonstration slides showcasing features, benefits, and use cases of the document management system.'
    };
    
    return mockTexts[fileName as keyof typeof mockTexts] || `PowerPoint presentation content from ${fileName}`;
  }

  // Estimate number of pages
  private static estimatePages(file: File, extractedText?: string): number {
    if (extractedText) {
      // Rough estimation: 250 words per page
      const wordsPerPage = 250;
      const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
      return Math.max(1, Math.ceil(wordCount / wordsPerPage));
    }
    
    // Fallback estimation based on file size
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB < 0.1) return 1;
    if (sizeInMB < 0.5) return 2;
    if (sizeInMB < 1) return 3;
    if (sizeInMB < 2) return 5;
    if (sizeInMB < 5) return 10;
    return Math.ceil(sizeInMB * 2);
  }

  // Generate summary from text
  private static generateSummary(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= 2) return text;
    
    // Take first sentence as summary
    return sentences[0].trim() + '.';
  }

  // Generate tags based on content
  private static generateTags(file: File, text: string): string[] {
    const tags: string[] = [];
    
    // File type tags
    if (file.type.includes('pdf')) tags.push('pdf');
    if (file.type.includes('word')) tags.push('word');
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) tags.push('excel');
    if (file.type.includes('powerpoint') || file.type.includes('presentation')) tags.push('presentation');
    if (file.type.includes('text')) tags.push('text');
    
    // Content-based tags
    const lowerText = text.toLowerCase();
    if (lowerText.includes('meeting') || lowerText.includes('agenda')) tags.push('meeting');
    if (lowerText.includes('proposal') || lowerText.includes('proposal')) tags.push('proposal');
    if (lowerText.includes('budget') || lowerText.includes('financial')) tags.push('budget');
    if (lowerText.includes('technical') || lowerText.includes('specification')) tags.push('technical');
    if (lowerText.includes('manual') || lowerText.includes('guide')) tags.push('manual');
    if (lowerText.includes('report') || lowerText.includes('analysis')) tags.push('report');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  // Generate thumbnail URL
  private static generateThumbnailUrl(file: File): string {
    // In a real implementation, you'd generate actual thumbnails
    return `/api/thumbnails/${file.name.replace(/\.[^/.]+$/, '')}.png`;
  }

  // Validate file type
  static isValidFileType(file: File): boolean {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/markdown',
      'application/rtf',
      'text/csv'
    ];
    
    return validTypes.includes(file.type);
  }

  // Get file type icon
  static getFileTypeIcon(mimeType: string): string {
    const iconMap: Record<string, string> = {
      'application/pdf': '📄',
      'application/msword': '📝',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
      'application/vnd.ms-excel': '📊',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
      'application/vnd.ms-powerpoint': '📊',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📊',
      'text/plain': '📄',
      'text/markdown': '📄',
      'application/rtf': '📄',
      'text/csv': '📊'
    };
    
    return iconMap[mimeType] || '📄';
  }
}
