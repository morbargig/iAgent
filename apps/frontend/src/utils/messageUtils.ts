import type { DateFilter, SendMessageData } from '../components/InputArea/InputArea';
import type { ToolConfiguration } from '../components/ToolSettingsDialog';
import type { ToolId } from './toolUtils';

interface CreateDateFilterParams {
  committedTab: number;
  rangeAmount: number;
  rangeType: string;
  dateRange: [Date | null, Date | null];
}

export const createDateFilter = ({
  committedTab,
  rangeAmount,
  rangeType,
  dateRange,
}: CreateDateFilterParams): DateFilter => {
  return {
    type: committedTab === 1 ? "picker" : "custom",
    customRange:
      committedTab === 0
        ? {
            amount: rangeAmount,
            type: rangeType,
          }
        : undefined,
    dateRange:
      committedTab === 1 ? dateRange : undefined,
  };
};

interface CreateFilterSnapshotParams {
  filterId?: string;
  name?: string;
  committedTab: number;
  rangeAmount: number;
  rangeType: string;
  dateRange: [Date | null, Date | null];
  selectedCountries: string[];
  enabledTools: Partial<Record<ToolId, boolean>>;
  toolConfigurations: Partial<Record<ToolId, ToolConfiguration>>;
  isActive: boolean;
}

export const createFilterSnapshot = ({
  filterId,
  name,
  committedTab,
  rangeAmount,
  rangeType,
  dateRange,
  selectedCountries,
  enabledTools,
  toolConfigurations,
  isActive,
}: CreateFilterSnapshotParams) => {
  const snapshotDateFilter =
    committedTab === 1
      ? {
          type: "picker" as const,
          dateRange: {
            start: dateRange[0]?.toISOString(),
            end: dateRange[1]?.toISOString(),
          },
        }
      : {
          type: "custom" as const,
          customRange: {
            amount: rangeAmount,
            type: rangeType,
          },
        };

  return {
    filterId,
    name: name || `Filter ${new Date().toLocaleDateString()}`,
    config: {
      dateFilter: snapshotDateFilter,
      selectedCountries,
      enabledTools: (Object.keys(enabledTools) as ToolId[]).filter(
        (toolId) => enabledTools[toolId]
      ),
      toolConfigurations,
    },
    isActive,
    createdAt: new Date().toISOString(),
  };
};

interface CreateSendMessageDataParams {
  content: string;
  dateFilter: DateFilter;
  selectedCountries: string[];
  enabledTools: Partial<Record<ToolId, boolean>>;
  filterSnapshot: ReturnType<typeof createFilterSnapshot>;
  attachments?: Array<{
    id: string;
    filename: string;
    size: number;
    mimetype: string;
    uploadDate: string;
  }>;
}

export const createSendMessageData = ({
  content,
  dateFilter,
  selectedCountries,
  enabledTools,
  filterSnapshot,
  attachments,
}: CreateSendMessageDataParams): SendMessageData => {
  return {
    content,
    dateFilter,
    selectedCountries,
    enabledTools: (Object.keys(enabledTools) as ToolId[]).filter(
      (toolId) => enabledTools[toolId]
    ),
    filterSnapshot,
    attachments,
  };
};
