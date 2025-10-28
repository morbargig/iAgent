# File Upload System Integration

## Overview

This document describes the integrated file upload system that combines:
- Quick file upload functionality
- Document management dialog for browsing and selecting existing files
- MongoDB GridFS storage with local (Docker) and remote options
- Environment-configurable file size and count limitations
- Enhanced SHA-256 deduplication that respects file names

## Architecture

### Backend Components

#### 1. File Controller (`apps/backend/src/app/controllers/file.controller.ts`)

**Standalone File Endpoints:**
- `POST /api/files/upload` - Upload a single file
- `GET /api/files/list` - List all uploaded files (with pagination)
- `GET /api/files/count` - Get total file count
- `GET /api/files/:id` - Download a file by ID
- `GET /api/files/:id/info` - Get file metadata
- `DELETE /api/files/:id` - Delete a file

**Chat-Attached File Endpoints:**
- `POST /api/files/chat/:chatId/upload` - Upload multiple files to a chat
- `GET /api/files/chat/:chatId` - Get all files for a specific chat

#### 2. File Service (`apps/backend/src/app/services/file.service.ts`)

**Features:**
- GridFS storage for MongoDB
- File validation against environment limits
- Enhanced SHA-256 deduplication:
  - Only deduplicates if BOTH content hash AND filename match
  - Same content + different filename = keeps both files
- Chat and user association support
- Multiple file upload support

#### 3. Environment Configuration

All environment files support:

```typescript
{
  demoMode: boolean,  // Use local MongoDB when true
  mongodb: {
    uriLocal: string,  // Local MongoDB URI (Docker)
    uri: string,       // Remote MongoDB URI
    activeUri: string  // Computed based on demoMode
  },
  fileUpload: {
    maxFileSize: number,     // Default: 5MB
    maxTotalSize: number,    // Default: 50MB
    maxFileCount: number,    // Default: 8 files
    acceptedTypes: string[]  // Default: [] (all types)
  }
}
```

### Frontend Components

#### 1. InputArea Dropdown Menu

**Features:**
- Unified attachment button with badge showing file count
- Dropdown menu with two options:
  1. **Quick Upload** - Opens file picker for immediate upload
  2. **Document Manager** - Opens dialog to browse and select existing files

**File Validation:**
- Checks file count against `FILE_UPLOAD_CONFIG.MAX_FILE_COUNT`
- Validates individual file size against `FILE_UPLOAD_CONFIG.MAX_FILE_SIZE`
- Validates total size against `FILE_UPLOAD_CONFIG.MAX_TOTAL_SIZE`

#### 2. Document Management Dialog

**Features:**
- Two tabs: Upload and Manage
- Upload tab: Drag & drop file upload interface
- Manage tab: Browse and select from existing files
- Selection mode for choosing multiple files
- Pagination support

#### 3. Configuration Files

**File Upload Config** (`apps/frontend/src/config/fileUpload.ts`):
```typescript
FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,      // 5MB per file
  MAX_TOTAL_SIZE: 50 * 1024 * 1024,    // 50MB total
  MAX_FILE_COUNT: 8,                    // Max 8 files
  ACCEPTED_FILE_TYPES: [],              // All types accepted
  FILE_TYPE_CATEGORIES: { ... }         // Icon display categories
}
```

**API Config** (`apps/frontend/src/config/config.ts`):
```typescript
API_CONFIG = {
  BASE_URL: 'http://localhost:3030/api',
  ENDPOINTS: { files: '/files', chats: '/chats', auth: '/auth' }
}
```

## MongoDB Setup

### Docker Setup (Local Development)

1. **Start MongoDB with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Set environment variable:**
   ```bash
   export DEMO_MODE=true
   export MONGODB_URI_LOCAL=mongodb://localhost:27017
   ```

3. **Verify connection:**
   - Backend will log: `🚀 Connecting to MongoDB (LOCAL)...`
   - Files are stored in GridFS bucket 'fs'

### Remote MongoDB (Production)

1. **Set environment variables:**
   ```bash
   export DEMO_MODE=false
   export MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/
   export DB_NAME=filesdb
   ```

2. **Backend will connect to remote MongoDB:**
   - Backend will log: `🚀 Connecting to MongoDB (REMOTE)...`

## Environment Variables

### Required Variables

```bash
# Backend
PORT=3030
DEMO_MODE=true  # or false for remote MongoDB
MONGODB_URI_LOCAL=mongodb://localhost:27017
MONGODB_URI=mongodb+srv://...  # Your remote MongoDB URI
DB_NAME=filesdb

# Optional - File Upload Limits (uses defaults if not set)
MAX_FILE_SIZE=5242880        # 5MB in bytes
MAX_TOTAL_SIZE=52428800      # 50MB in bytes
MAX_FILE_COUNT=8
ACCEPTED_FILE_TYPES=         # Empty = all types

# Frontend
REACT_APP_API_URL=http://localhost:3030/api
```

## File Upload Flow

### Quick Upload Flow

1. User clicks attachment button → dropdown opens
2. User selects "Quick Upload"
3. Hidden file input opens
4. User selects file(s)
5. Frontend validates:
   - File count < MAX_FILE_COUNT
   - Each file size < MAX_FILE_SIZE
   - Total size < MAX_TOTAL_SIZE
6. Files uploaded to backend
7. Backend validates and stores in GridFS
8. Files appear in InputArea file preview
9. Files sent with message

### Document Manager Flow

1. User clicks attachment button → dropdown opens
2. User selects "Document Manager"
3. Dialog opens with two tabs:
   - **Upload Tab**: Drag & drop new files
   - **Manage Tab**: Browse existing files
4. User selects file(s) from existing documents
5. Selected files added to InputArea
6. Files sent with message

## File Deduplication

The system uses enhanced SHA-256 deduplication:

```typescript
// Check for exact duplicate (same content hash AND filename)
const existing = await gridFSBucket.find({ 
  'metadata.hash': hash,
  'filename': file.originalname  // Must match filename too!
});
```

**Behavior:**
- Same content + same filename = Returns existing file (deduplication)
- Same content + different filename = Creates new file (no deduplication)

**Rationale:** Users may intentionally rename files with the same content for different purposes.

## API Ports

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3030

## Translation Keys

The system supports three languages (English, Arabic, Hebrew):

```typescript
files: {
  quickUpload: 'Quick Upload',
  documentManager: 'Document Manager',
  attachFiles: 'Attach Files',
  documentManagement: 'Document Management',
  upload: 'Upload',
  manage: 'Manage',
  selectFiles: 'Select Files',
  // ... more keys
}
```

## Shared Types

File-related types in `libs/shared-types/src/lib/shared-types.ts`:

```typescript
export interface FileMetadata {
  fileId: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  chatId?: string;
  userId?: string;
}

export interface ChatMessageAttachment {
  fileId: string;
  metadata: FileMetadata;
}

export interface FileUploadConfig {
  maxFileSize: number;
  maxTotalSize: number;
  maxFileCount: number;
  acceptedTypes: string[];
}
```

## Testing

### Test Scenarios

1. **Quick Upload**
   - Select single file
   - Select multiple files
   - Exceed file count limit
   - Exceed file size limit
   - Exceed total size limit

2. **Document Manager**
   - Upload new files
   - Browse existing files
   - Select files for attachment
   - Search and filter files

3. **MongoDB Connections**
   - Test with `DEMO_MODE=true` (local Docker)
   - Test with `DEMO_MODE=false` (remote MongoDB)
   - Test fallback when MongoDB unavailable

4. **File Deduplication**
   - Upload same file twice → deduplicates
   - Upload same content with different filename → keeps both

## Troubleshooting

### MongoDB Connection Issues

**Problem:** Cannot connect to local MongoDB
```
Solution:
1. Check Docker is running: docker ps
2. Check MongoDB container: docker-compose ps
3. Verify MONGODB_URI_LOCAL is correct
4. Check DEMO_MODE=true
```

**Problem:** Cannot connect to remote MongoDB
```
Solution:
1. Verify MONGODB_URI is correct
2. Check network connectivity
3. Verify credentials
4. Check DEMO_MODE=false
```

### File Upload Issues

**Problem:** Files not uploading
```
Solution:
1. Check file size against MAX_FILE_SIZE
2. Check total file count against MAX_FILE_COUNT
3. Check browser console for errors
4. Verify backend is running on port 3030
```

**Problem:** Duplicate files created
```
Solution:
This is expected if:
- Same content but different filenames
- This is intentional behavior to respect user's file naming
```

## Future Enhancements

- [ ] Image preview thumbnails
- [ ] File type icons
- [ ] Progress bars for uploads
- [ ] Drag & drop support in InputArea
- [ ] File compression for large files
- [ ] Cloud storage integration (S3, Azure Blob)
- [ ] File sharing between users
- [ ] File expiration and cleanup

## Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify environment variables are set correctly
3. Test MongoDB connection separately
4. Review API endpoint responses in browser DevTools

