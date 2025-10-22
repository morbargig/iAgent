// Main component export
export { DocumentManager } from "./DocumentManager";

// Sub-component exports
export { DocumentCard } from "./DocumentCard";
export { DocumentToolbar } from "./DocumentToolbar";
export { DocumentList } from "./DocumentList";
export { DocumentDialogs } from "./DocumentDialogs";
export { BulkActionsToolbar } from "./BulkActionsToolbar";

// Custom hook exports
export { useDocumentManager } from "./hooks/useDocumentManager";
export { useDocumentActions } from "./hooks/useDocumentActions";
export { useDocumentSelection } from "./hooks/useDocumentSelection";
export { useDocumentUI } from "./hooks/useDocumentUI";
export type { ViewMode } from "./hooks/useDocumentUI";
