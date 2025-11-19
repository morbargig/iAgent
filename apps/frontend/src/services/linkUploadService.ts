import { DocumentFile, DocumentUploadResponse } from "../types/document.types";
import { DocumentService } from "./documentService";

export const validateUrl = async (
  url: string,
  type: "website" | "youtube"
): Promise<boolean> => {
  try {
    const urlObj = new URL(url);

    if (type === "youtube") {
      const youtubeRegex =
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      return youtubeRegex.test(url);
    } else {
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    }
  } catch {
    return false;
  }
};

export const uploadFromUrl = async (
  url: string,
  type: "website" | "youtube",
  documentService: DocumentService
): Promise<DocumentFile> => {
  const filename = type === "youtube" ? `youtube-link.txt` : `website-link.txt`;
  const content = url;
  const blob = new Blob([content], { type: "text/plain" });
  const file = new File([blob], filename, { type: "text/plain" });

  const response = await documentService.uploadFile(file, {});

  if (!response.success || !response.document) {
    throw new Error(response.error || "Failed to upload link");
  }

  return response.document;
};

