import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Pagination,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  FilePresent as FileIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { fileService, FileInfo } from "../services/fileService";
import { useTranslation } from "../contexts/TranslationContext";

interface FileListProps {
  onFileDeleted?: () => void;
}

export const FileList: React.FC<FileListProps> = ({ onFileDeleted }) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { t } = useTranslation();

  const filesPerPage = 10;

  const loadFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const skip = (page - 1) * filesPerPage;
      const [filesData, count] = await Promise.all([
        fileService.getFileList(filesPerPage, skip),
        fileService.getFileCount(),
      ]);

      setFiles(filesData);
      setTotalCount(count);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("files.management.list.errors.failedToLoad")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [page]);

  const handleDownload = async (file: FileInfo) => {
    try {
      await fileService.downloadFile(file.id, file.filename);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("files.management.list.errors.downloadFailed")
      );
    }
  };

  const handleDeleteClick = (fileId: string) => {
    setFileToDelete(fileId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    setDeleting(true);
    try {
      await fileService.deleteFile(fileToDelete);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
      await loadFiles();
      onFileDeleted?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("files.management.list.errors.deleteFailed")
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleRefresh = () => {
    loadFiles();
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith("image/")) return "🖼️";
    if (mimetype.startsWith("video/")) return "🎥";
    if (mimetype.startsWith("audio/")) return "🎵";
    if (mimetype.includes("pdf")) return "📄";
    if (mimetype.includes("text")) return "📝";
    if (mimetype.includes("zip") || mimetype.includes("rar")) return "📦";
    return "📁";
  };

  const totalPages = Math.ceil(totalCount / filesPerPage);

  if (loading && files.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">
          {t("files.management.list.title", { count: totalCount })}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          {t("files.management.list.refresh")}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {files.length === 0 ? (
        <Box textAlign="center" py={4}>
          <FileIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {t("files.management.list.emptyState.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("files.management.list.emptyState.subtitle")}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t("files.management.list.table.file")}</TableCell>
                  <TableCell>{t("files.management.list.table.size")}</TableCell>
                  <TableCell>{t("files.management.list.table.type")}</TableCell>
                  <TableCell>
                    {t("files.management.list.table.uploadDate")}
                  </TableCell>
                  <TableCell align="center">
                    {t("files.management.list.table.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          {getFileIcon(file.mimetype)}
                        </Typography>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ maxWidth: 200 }}
                        >
                          {file.filename}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {fileService.formatFileSize(file.size)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={file.mimetype}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {fileService.formatDate(file.uploadDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip
                          title={t("files.management.list.tooltips.preview")}
                        >
                          <IconButton
                            size="small"
                            onClick={() => fileService.previewFile(file.id)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip
                          title={t("files.management.list.tooltips.download")}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(file)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip
                          title={t("files.management.list.tooltips.fileInfo")}
                        >
                          <IconButton
                            size="small"
                            onClick={() => setSelectedFile(file)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip
                          title={t("files.management.list.tooltips.delete")}
                        >
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(file.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* File Info Dialog */}
      <Dialog
        open={!!selectedFile}
        onClose={() => setSelectedFile(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t("files.management.list.fileInfoDialog.title")}
        </DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>
                  {t("files.management.list.fileInfoDialog.filename")}
                </strong>{" "}
                {selectedFile.filename}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>
                  {t("files.management.list.fileInfoDialog.size")}
                </strong>{" "}
                {fileService.formatFileSize(selectedFile.size)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>
                  {t("files.management.list.fileInfoDialog.type")}
                </strong>{" "}
                {selectedFile.mimetype}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>
                  {t("files.management.list.fileInfoDialog.uploadDate")}
                </strong>{" "}
                {fileService.formatDate(selectedFile.uploadDate)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>
                  {t("files.management.list.fileInfoDialog.fileId")}
                </strong>{" "}
                {selectedFile.id}
              </Typography>
              {selectedFile.metadata && (
                <Box mt={2}>
                  <Typography variant="body1" gutterBottom>
                    <strong>
                      {t("files.management.list.fileInfoDialog.metadata")}
                    </strong>
                  </Typography>
                  <pre
                    style={{
                      fontSize: "12px",
                      backgroundColor: "#f5f5f5",
                      padding: "8px",
                      borderRadius: "4px",
                    }}
                  >
                    {JSON.stringify(selectedFile.metadata, null, 2)}
                  </pre>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedFile(null)}>
            {t("files.management.list.fileInfoDialog.close")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          {t("files.management.list.deleteDialog.title")}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t("files.management.list.deleteDialog.confirmMessage")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            {t("files.management.list.deleteDialog.cancel")}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleting}
          >
            {deleting
              ? t("files.management.list.deleteDialog.deleting")
              : t("files.management.list.deleteDialog.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
