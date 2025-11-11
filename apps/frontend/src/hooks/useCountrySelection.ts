import { useAppLocalStorage } from './storage';
import { useState } from 'react';
import { useCountries } from '../features/countries/api';

export const useCountrySelection = () => {
  const { data: countries = [] } = useCountries();
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
    flagOptions: countries,
    handleFlagClick,
    handleFlagToggle,
    closeFlagPopover,
  };
};
