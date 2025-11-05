import { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import { useAppLocalStorage, useMemoStorage } from './storage';
import type { DateRangeSettings } from '../types/storage.types';

const timeRangeOptions = [
  { value: 'minutes', labelKey: 'dateRange.minutes' },
  { value: 'hours', labelKey: 'dateRange.hours' },
  { value: 'days', labelKey: 'dateRange.days' },
  { value: 'weeks', labelKey: 'dateRange.weeks' },
  { value: 'months', labelKey: 'dateRange.months' },
  { value: 'years', labelKey: 'dateRange.years' },
];

interface UseDateRangeProps {
  t: (key: string) => string;
}

export const useDateRange = ({ t }: UseDateRangeProps) => {
  const [dateRangeSettings, setDateRangeSettings] = useAppLocalStorage('date-range-settings');
  const [dateAnchorEl, setDateAnchorEl] = useState<HTMLElement | null>(null);
  const datePopoverOpen = Boolean(dateAnchorEl);

  const dateRangeTab = dateRangeSettings.activeTab;
  const rangeAmount = dateRangeSettings.customRange.amount;
  const rangeType = dateRangeSettings.customRange.type;
  const [rangeTypeOpen, setRangeTypeOpen] = useState(false);

  const dateRange = useMemoStorage(
    () => [
      dateRangeSettings.datePicker.startDate
        ? parseISO(dateRangeSettings.datePicker.startDate)
        : null,
      dateRangeSettings.datePicker.endDate
        ? parseISO(dateRangeSettings.datePicker.endDate)
        : null,
    ] as [Date | null, Date | null],
    [dateRangeSettings.datePicker.startDate, dateRangeSettings.datePicker.endDate]
  );

  const [tempDateRange, setTempDateRange] = useState<[Date | null, Date | null]>([
    dateRangeSettings.datePicker.startDate
      ? parseISO(dateRangeSettings.datePicker.startDate)
      : null,
    dateRangeSettings.datePicker.endDate
      ? parseISO(dateRangeSettings.datePicker.endDate)
      : null,
  ]);

  const committedTab = dateRangeSettings.committedTab;

  useEffect(() => {
    const startDateString = dateRange[0]?.toISOString();
    const endDateString = dateRange[1]?.toISOString();

    setDateRangeSettings((prev) => ({
      ...prev,
      datePicker: {
        startDate: startDateString || null,
        endDate: endDateString || null,
      },
    }));
  }, [dateRange, setDateRangeSettings]);

  const setDateRangeTab = (tab: number) => {
    setDateRangeSettings((prev) => ({
      ...prev,
      activeTab: tab,
    }));
  };

  const setRangeAmount = (amount: number) => {
    setDateRangeSettings((prev) => ({
      ...prev,
      customRange: {
        ...prev.customRange,
        amount,
      },
    }));
  };

  const setRangeType = (type: DateRangeSettings['customRange']['type']) => {
    setDateRangeSettings((prev) => ({
      ...prev,
      customRange: {
        ...prev.customRange,
        type,
      },
    }));
  };

  const setDateRange = (range: [Date | null, Date | null]) => {
    const startDateString = range[0]?.toISOString() || null;
    const endDateString = range[1]?.toISOString() || null;

    setDateRangeSettings((prev) => ({
      ...prev,
      datePicker: {
        startDate: startDateString,
        endDate: endDateString,
      },
    }));
  };

  const setCommittedTab = (tab: number) => {
    setDateRangeSettings((prev) => ({
      ...prev,
      committedTab: tab,
    }));
  };

  const handleDateClick = (event: React.MouseEvent<HTMLElement>) => {
    if (datePopoverOpen) {
      setDateAnchorEl(null);
    } else {
      setTempDateRange(dateRange);
      setDateAnchorEl(event.currentTarget);
    }
  };

  const handleDateRangeApply = () => {
    if (dateRangeTab === 1) {
      setDateRange(tempDateRange);
    }
    setCommittedTab(dateRangeTab);
    setDateAnchorEl(null);
  };

  const getDateRangeButtonText = () => {
    if (committedTab === 1 && dateRange[0] && dateRange[1]) {
      const start =
        dateRange[0].toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
        }) +
        ' ' +
        dateRange[0].toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      const end =
        dateRange[1].toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
        }) +
        ' ' +
        dateRange[1].toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      return `${start} - ${end}`;
    } else {
      return `${rangeAmount} ${t(`dateRange.${rangeType}`)} ${t('dateRange.ago')}`;
    }
  };

  const handleDateRangeReset = () => {
    const today = new Date();
    const oneMonthAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate()
    );

    setDateRangeSettings({
      activeTab: 0,
      committedTab: 0,
      customRange: {
        amount: 1,
        type: 'months',
      },
      datePicker: {
        startDate: oneMonthAgo.toISOString(),
        endDate: today.toISOString(),
      },
    });

    setTempDateRange([null, null]);
    setRangeTypeOpen(false);
  };

  const closeDatePopover = () => {
    setDateAnchorEl(null);
    setRangeTypeOpen(false);
  };

  return {
    dateRangeTab,
    setDateRangeTab,
    rangeAmount,
    setRangeAmount,
    rangeType,
    setRangeType,
    rangeTypeOpen,
    setRangeTypeOpen,
    dateRange,
    setDateRange,
    tempDateRange,
    setTempDateRange,
    committedTab,
    setCommittedTab,
    dateAnchorEl,
    setDateAnchorEl,
    datePopoverOpen,
    timeRangeOptions,
    handleDateClick,
    handleDateRangeApply,
    getDateRangeButtonText,
    handleDateRangeReset,
    closeDatePopover,
  };
};
