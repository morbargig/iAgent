import { useState, useEffect } from 'react';

interface UseAnimatedPlaceholderOptions {
  examples: string[];
  typingSpeed?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  isActive?: boolean;
}

export const useAnimatedPlaceholder = ({
  examples,
  typingSpeed = 100,
  pauseDuration = 2000,
  deletingSpeed = 50,
  isActive = true,
}: UseAnimatedPlaceholderOptions) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');

  useEffect(() => {
    if (!isActive || examples.length === 0) {
      setCurrentText('');
      setCurrentIndex(0);
      setPhase('typing');
      return;
    }

    setCurrentText('');
    setCurrentIndex(0);
    setPhase('typing');
  }, [examples, isActive]);

  useEffect(() => {
    if (!isActive || examples.length === 0) {
      return;
    }

    const currentExample = examples[currentIndex] || '';
    if (!currentExample) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      timeoutId = setTimeout(() => {
        setCurrentText((prevText) => {
          if (prevText.length < currentExample.length) {
            return currentExample.slice(0, prevText.length + 1);
          } else {
            setPhase('pausing');
            return prevText;
          }
        });
      }, typingSpeed);
    } else if (phase === 'pausing') {
      timeoutId = setTimeout(() => {
        setPhase('deleting');
      }, pauseDuration);
    } else if (phase === 'deleting') {
      timeoutId = setTimeout(() => {
        setCurrentText((prevText) => {
          if (prevText.length > 0) {
            return prevText.slice(0, -1);
          } else {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % examples.length);
            setPhase('typing');
            return prevText;
          }
        });
      }, deletingSpeed);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentIndex, phase, examples, isActive, typingSpeed, pauseDuration, deletingSpeed]);

  return currentText;
}; 