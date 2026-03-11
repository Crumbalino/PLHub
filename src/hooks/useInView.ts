import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook to detect when an element enters the viewport using IntersectionObserver.
 * Useful for scroll-triggered animations and lazy loading.
 */
export function useInView(options: UseInViewOptions = {}) {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = false } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setHasTriggered(true);

          // Disconnect if triggerOnce is true
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          // Allow resetting if not triggerOnce
          setIsInView(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return {
    ref,
    isInView,
    hasTriggered,
  };
}
