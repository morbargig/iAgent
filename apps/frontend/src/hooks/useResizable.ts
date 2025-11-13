import { useState, useCallback, useEffect } from 'react';

interface UseResizableOptions {
  initialWidth: number;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange?: (width: number) => void;
  isRTL?: boolean;
}

const DEFAULT_MIN_WIDTH = 200;
const DEFAULT_MAX_WIDTH = 400;

export const useResizable = ({
  initialWidth,
  minWidth = DEFAULT_MIN_WIDTH,
  maxWidth = DEFAULT_MAX_WIDTH,
  onWidthChange,
  isRTL = false,
}: UseResizableOptions) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      // For RTL: sidebar is on the right, calculate width from right edge
      // For LTR: sidebar is on the left, calculate width from left edge
      const newWidth = isRTL 
        ? window.innerWidth - e.clientX 
        : e.clientX;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
        onWidthChange?.(newWidth);
      }
    },
    [isResizing, minWidth, maxWidth, onWidthChange, isRTL]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
    return undefined;
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return {
    width,
    setWidth,
    isResizing,
    handleMouseDown,
  };
};

