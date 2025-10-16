// File management service for MongoDB GridFS
export interface FileUploadResult {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  uploadDate: string;
}

export interface FileInfo {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  uploadDate: string;
  metadata?: any;
}

export interface FileListResponse {
  files: FileInfo[];
  total: number;
}

class FileService {
  private baseUrl = 'http://localhost:3030/api/files';

  async uploadFile(file: File): Promise<FileUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getFileList(limit: number = 50, skip: number = 0): Promise<FileInfo[]> {
    const response = await fetch(`${this.baseUrl}/list?limit=${limit}&skip=${skip}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.statusText}`);
    }

    return response.json();
  }

  async getFileCount(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/count`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file count: ${response.statusText}`);
    }

    const data = await response.json();
    return data.count;
  }

  async getFileInfo(fileId: string): Promise<FileInfo> {
    const response = await fetch(`${this.baseUrl}/${fileId}/info`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file info: ${response.statusText}`);
    }

    return response.json();
  }

  async downloadFile(fileId: string, filename: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${fileId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${fileId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}

export const fileService = new FileService();
