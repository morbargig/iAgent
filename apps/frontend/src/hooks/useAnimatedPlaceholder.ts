import { useState, useEffect, useRef } from 'react';

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
  
  const examplesRef = useRef(examples);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTextRef = useRef('');
  const phaseRef = useRef(phase);
  const currentIndexRef = useRef(currentIndex);
  const isActiveRef = useRef(isActive);
  
  examplesRef.current = examples;
  currentTextRef.current = currentText;
  phaseRef.current = phase;
  currentIndexRef.current = currentIndex;
  isActiveRef.current = isActive;

  useEffect(() => {
    if (!isActive || examples.length === 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setCurrentText('');
      setCurrentIndex(0);
      setPhase('typing');
      currentTextRef.current = '';
      phaseRef.current = 'typing';
      currentIndexRef.current = 0;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setCurrentText('');
    setCurrentIndex(0);
    setPhase('typing');
    currentTextRef.current = '';
    phaseRef.current = 'typing';
    currentIndexRef.current = 0;
  }, [examples.length, isActive]);

  useEffect(() => {
    if (!isActiveRef.current || examplesRef.current.length === 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const runAnimation = () => {
      if (!isActiveRef.current || examplesRef.current.length === 0) {
        return;
      }

      const example = examplesRef.current[currentIndexRef.current] || '';
      if (!example) return;

      const currentPhase = phaseRef.current;
      const currentLength = currentTextRef.current.length;

      if (currentPhase === 'typing') {
        if (currentLength < example.length) {
          const newText = example.slice(0, currentLength + 1);
          currentTextRef.current = newText;
          setCurrentText(newText);
          timeoutRef.current = setTimeout(runAnimation, typingSpeed);
        } else {
          phaseRef.current = 'pausing';
          setPhase('pausing');
          timeoutRef.current = setTimeout(runAnimation, pauseDuration);
        }
      } else if (currentPhase === 'pausing') {
        phaseRef.current = 'deleting';
        setPhase('deleting');
        timeoutRef.current = setTimeout(runAnimation, 0);
      } else if (currentPhase === 'deleting') {
        if (currentLength > 0) {
          const newText = currentTextRef.current.slice(0, -1);
          currentTextRef.current = newText;
          setCurrentText(newText);
          timeoutRef.current = setTimeout(runAnimation, deletingSpeed);
        } else {
          const nextIndex = (currentIndexRef.current + 1) % examplesRef.current.length;
          currentIndexRef.current = nextIndex;
          phaseRef.current = 'typing';
          currentTextRef.current = '';
          setCurrentIndex(nextIndex);
          setPhase('typing');
          timeoutRef.current = setTimeout(runAnimation, 0);
        }
      }
    };

    runAnimation();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isActive, examples.length, typingSpeed, pauseDuration, deletingSpeed]);

  return currentText;
};
