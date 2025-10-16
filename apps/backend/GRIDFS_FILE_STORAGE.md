# MongoDB Atlas GridFS File Storage

## Overview
The backend now supports file upload and storage using MongoDB Atlas GridFS, which is perfect for storing files larger than 16MB and provides efficient file streaming capabilities.

## Configuration

### MongoDB Connection
- **URI**: `mongodb+srv://appuser:VruPdc3d4pKYEUwO@cluster0.giuoosh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
- **Database**: `filesdb`
- **GridFS Bucket**: `fs` (default)
- **Collections**: `fs.files` and `fs.chunks`

### Environment Variables
The MongoDB configuration is loaded from environment variables:
- `MONGODB_URI`: MongoDB connection string
- `DB_NAME`: Database name (default: `filesdb`)

## API Endpoints

### File Upload
**POST** `/api/files/upload`
- **Content-Type**: `multipart/form-data`
- **Body**: Form field `file` containing the file to upload
- **Response**: File metadata including ID, filename, size, mimetype, and upload date

**Example:**
```bash
curl -X POST -F "file=@document.pdf" http://localhost:3001/api/files/upload
```

**Response:**
```json
{
  "id": "68ec00bd467530b2a932b2ae",
  "filename": "document.pdf",
  "size": 1024000,
  "mimetype": "application/pdf",
  "uploadDate": "2025-10-12T19:25:50.761Z"
}
```

### File Download
**GET** `/api/files/:id`
- **Parameters**: `id` - File ID returned from upload
- **Response**: File content with appropriate headers

**Example:**
```bash
curl -O http://localhost:3001/api/files/68ec00bd467530b2a932b2ae
```

### File Information
**GET** `/api/files/:id/info`
- **Parameters**: `id` - File ID
- **Response**: File metadata without downloading the file

**Example:**
```bash
curl http://localhost:3001/api/files/68ec00bd467530b2a932b2ae/info
```

### File List
**GET** `/api/files/list`
- **Query Parameters**:
  - `limit` (optional): Number of files to return (default: 50, max: 100)
  - `skip` (optional): Number of files to skip (default: 0)
- **Response**: Array of file metadata

**Example:**
```bash
curl "http://localhost:3001/api/files/list?limit=10&skip=0"
```

### File Count
**GET** `/api/files/count`
- **Response**: Total number of uploaded files

**Example:**
```bash
curl http://localhost:3001/api/files/count
```

### File Deletion
**DELETE** `/api/files/:id`
- **Parameters**: `id` - File ID
- **Response**: Success message

**Example:**
```bash
curl -X DELETE http://localhost:3001/api/files/68ec00bd467530b2a932b2ae
```

## Features

### GridFS Benefits
- **Large File Support**: Files larger than 16MB are automatically chunked
- **Efficient Streaming**: Files are streamed directly from MongoDB without loading into memory
- **Metadata Storage**: File metadata is stored separately from content
- **Atomic Operations**: File operations are atomic and consistent

### File Metadata
Each uploaded file includes:
- **ID**: Unique MongoDB ObjectId
- **Filename**: Original filename
- **Size**: File size in bytes
- **Mimetype**: MIME type of the file
- **Upload Date**: When the file was uploaded
- **Metadata**: Additional metadata including original name and size

### Error Handling
- **400 Bad Request**: No file provided for upload
- **404 Not Found**: File ID not found for download/info/delete operations
- **File Size Limits**: Handled by GridFS (no artificial limits)
- **Connection Errors**: Proper error handling for MongoDB connection issues

## MongoDB Atlas M0 Compatibility

This implementation is fully compatible with MongoDB Atlas M0 (free tier):
- **Storage**: 512MB total storage
- **Connections**: Up to 100 concurrent connections
- **Collections**: Unlimited collections
- **GridFS**: Fully supported

## Swagger Documentation

All file endpoints are documented in Swagger UI:
- **URL**: `http://localhost:3001/docs`
- **Tag**: "Files"
- **Interactive Testing**: Upload and test files directly from the Swagger UI

## Usage Examples

### Upload Multiple Files
```bash
# Upload a PDF
curl -X POST -F "file=@document.pdf" http://localhost:3001/api/files/upload

# Upload an image
curl -X POST -F "file=@image.jpg" http://localhost:3001/api/files/upload

# Upload a text file
curl -X POST -F "file=@data.txt" http://localhost:3001/api/files/upload
```

### List and Download Files
```bash
# Get file list
curl http://localhost:3001/api/files/list

# Download specific file
curl -O http://localhost:3001/api/files/[FILE_ID]

# Get file info
curl http://localhost:3001/api/files/[FILE_ID]/info
```

### File Management
```bash
# Get total file count
curl http://localhost:3001/api/files/count

# Delete a file
curl -X DELETE http://localhost:3001/api/files/[FILE_ID]
```

## Security Considerations

- **File Validation**: Consider adding file type validation
- **Size Limits**: Implement application-level size limits if needed
- **Authentication**: Add authentication middleware for production use
- **Access Control**: Implement user-based file access control
- **Virus Scanning**: Consider adding virus scanning for uploaded files

## Performance Tips

- **Streaming**: Files are streamed directly from MongoDB for optimal memory usage
- **Chunking**: Large files are automatically chunked by GridFS
- **Indexing**: MongoDB automatically indexes file metadata for fast queries
- **Caching**: Consider implementing Redis caching for frequently accessed files
