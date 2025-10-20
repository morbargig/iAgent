import React, { useState } from "react";
import {
  Box,
  Typography,
  Container,
  Tabs,
  Tab,
  Paper,
  Alert,
} from "@mui/material";
import { FileUpload } from "./FileUpload";
import { FileList } from "./FileList";
import { FileUploadResult } from "../services/fileService";
import { useTranslation } from "../contexts/TranslationContext";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`file-tabpanel-${index}`}
      aria-labelledby={`file-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const FileManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleUploadSuccess = (result: FileUploadResult) => {
    setUploadSuccess(
      t("files.management.messages.fileUploadedSuccess", {
        filename: result.filename,
      })
    );
    setUploadError(null);
    // Switch to files tab to show the uploaded file
    setTimeout(() => {
      setActiveTab(1);
    }, 2000);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadSuccess(null);
  };

  const handleFileDeleted = () => {
    setUploadSuccess(t("files.management.messages.fileDeletedSuccess"));
    setUploadError(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        {t("files.management.title")}
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        align="center"
        sx={{ mb: 4 }}
      >
        {t("files.management.subtitle")}
      </Typography>

      {uploadSuccess && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setUploadSuccess(null)}
        >
          {uploadSuccess}
        </Alert>
      )}

      {uploadError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setUploadError(null)}
        >
          {uploadError}
        </Alert>
      )}

      <Paper elevation={2}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="file management tabs"
          >
            <Tab
              label={t("files.management.tabs.uploadFiles")}
              id="file-tab-0"
              aria-controls="file-tabpanel-0"
            />
            <Tab
              label={t("files.management.tabs.manageFiles")}
              id="file-tab-1"
              aria-controls="file-tabpanel-1"
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <FileList onFileDeleted={handleFileDeleted} />
        </TabPanel>
      </Paper>

      <Box sx={{ mt: 4, p: 2, backgroundColor: "grey.50", borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t("files.management.about.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t("files.management.about.description")}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>{t("files.management.about.benefitsTitle")}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" component="div">
          <ul>
            <li>{t("files.management.about.benefits.largeFiles")}</li>
            <li>{t("files.management.about.benefits.streaming")}</li>
            <li>{t("files.management.about.benefits.metadata")}</li>
            <li>{t("files.management.about.benefits.atomicOperations")}</li>
            <li>{t("files.management.about.benefits.chunking")}</li>
          </ul>
        </Typography>
      </Box>
    </Container>
  );
};
