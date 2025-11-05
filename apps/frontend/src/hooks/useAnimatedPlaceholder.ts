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
      if (currentText.length < currentExample.length) {
        timeoutId = setTimeout(() => {
          setCurrentText(currentExample.slice(0, currentText.length + 1));
        }, typingSpeed);
      } else {
        timeoutId = setTimeout(() => {
          setPhase('pausing');
        }, pauseDuration);
      }
    } else if (phase === 'pausing') {
      timeoutId = setTimeout(() => {
        setPhase('deleting');
      }, pauseDuration);
    } else if (phase === 'deleting') {
      if (currentText.length > 0) {
        timeoutId = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1));
        }, deletingSpeed);
      } else {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % examples.length);
        setPhase('typing');
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentText, currentIndex, phase, examples, isActive, typingSpeed, pauseDuration, deletingSpeed]);

  return currentText;
}; 