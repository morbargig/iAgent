// File URL Service
// Handles URL generation for files, downloads, and previews

export class FileUrlService {
  private static baseUrl = '/api/files';

  // Generate download URL for a document
  static getDownloadUrl(documentId: string): string {
    return `${this.baseUrl}/${documentId}/download`;
  }

  // Generate preview URL for a document
  static getPreviewUrl(documentId: string): string {
    return `${this.baseUrl}/${documentId}/preview`;
  }

  // Generate thumbnail URL for a document
  static getThumbnailUrl(documentId: string): string {
    return `${this.baseUrl}/${documentId}/thumbnail`;
  }

  // Generate blob URL for a file
  static createBlobUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  // Revoke blob URL to free memory
  static revokeBlobUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  // Create download link for a blob
  static createDownloadLink(blob: Blob, filename: string): string {
    const url = URL.createObjectURL(blob);
    return url;
  }

  // Trigger file download
  static downloadFile(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Download blob as file
  static downloadBlob(blob: Blob, filename: string): void {
    const url = this.createBlobUrl(blob);
    this.downloadFile(url, filename);
    // Clean up after a delay
    setTimeout(() => this.revokeBlobUrl(url), 1000);
  }

  // Get file extension from filename
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  // Get MIME type from file extension
  static getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'rtf': 'application/rtf',
      'csv': 'text/csv'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  // Validate file URL
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Get file size from URL (for mock purposes)
  static getFileSizeFromUrl(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      fetch(url, { method: 'HEAD' })
        .then(response => {
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            resolve(parseInt(contentLength, 10));
          } else {
            resolve(0);
          }
        })
        .catch(reject);
    });
  }

  // Create temporary file URL for preview
  static createTempPreviewUrl(content: string, mimeType = 'text/html'): string {
    const blob = new Blob([content], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  // Generate unique filename
  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = this.getFileExtension(originalName);
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    
    return `${nameWithoutExt}_${timestamp}_${random}.${extension}`;
  }

  // Sanitize filename for safe storage
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  // Get file type category
  static getFileTypeCategory(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'presentation';
    if (mimeType.startsWith('text/')) return 'text';
    return 'other';
  }

  // Check if file type is previewable
  static isPreviewable(mimeType: string): boolean {
    const previewableTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/rtf'
    ];
    
    return previewableTypes.includes(mimeType);
  }

  // Get appropriate icon for file type
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
