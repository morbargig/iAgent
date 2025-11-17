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

interface CreateSendMessageDataParams {
  content: string;
  dateFilter: DateFilter;
  selectedCountries: string[];
  enabledTools: Partial<Record<ToolId, boolean>>;
  filterId?: string | null;
  filterVersion?: number | null;
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
  filterId,
  filterVersion,
  attachments,
}: CreateSendMessageDataParams): SendMessageData => {
  return {
    content,
    dateFilter,
    selectedCountries,
    enabledTools: (Object.keys(enabledTools) as ToolId[]).filter(
      (toolId) => enabledTools[toolId]
    ),
    filterId,
    filterVersion,
    attachments,
  };
};
