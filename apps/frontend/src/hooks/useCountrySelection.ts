import { useAppLocalStorage } from './storage';
import { useState } from 'react';

const flagOptions = [
  { code: 'PS', flag: '🇵🇸', nameKey: 'countries.palestine' },
  { code: 'LB', flag: '🇱🇧', nameKey: 'countries.lebanon' },
  { code: 'SA', flag: '🇸🇦', nameKey: 'countries.saudi_arabia' },
  { code: 'IQ', flag: '🇮🇶', nameKey: 'countries.iraq' },
  { code: 'SY', flag: '🇸🇾', nameKey: 'countries.syria' },
  { code: 'JO', flag: '🇯🇴', nameKey: 'countries.jordan' },
  { code: 'EG', flag: '🇪🇬', nameKey: 'countries.egypt' },
  { code: 'IL', flag: '🇮🇱', nameKey: 'countries.israel' },
];

export const useCountrySelection = () => {
  const [selectedFlags, setSelectedFlags] = useAppLocalStorage('selected-countries');
  const [flagAnchorEl, setFlagAnchorEl] = useState<HTMLElement | null>(null);
  const flagPopoverOpen = Boolean(flagAnchorEl);

  const handleFlagClick = (event: React.MouseEvent<HTMLElement>) => {
    if (flagPopoverOpen) {
      setFlagAnchorEl(null);
    } else {
      setFlagAnchorEl(event.currentTarget);
    }
  };

  const handleFlagToggle = (flagCode: string) => {
    setSelectedFlags((prev) =>
      prev.includes(flagCode)
        ? prev.filter((code) => code !== flagCode)
        : [...prev, flagCode]
    );
  };

  const closeFlagPopover = () => {
    setFlagAnchorEl(null);
  };

  return {
    selectedFlags,
    setSelectedFlags,
    flagAnchorEl,
    setFlagAnchorEl,
    flagPopoverOpen,
    flagOptions,
    handleFlagClick,
    handleFlagToggle,
    closeFlagPopover,
  };
};
