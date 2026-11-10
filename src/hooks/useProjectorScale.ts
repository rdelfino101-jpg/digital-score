import { useState, useEffect, RefObject } from 'react';

export function useProjectorScale(containerRef: RefObject<HTMLElement | null>) {
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const updateScale = () => {
      let width = window.innerWidth;
      let height = window.innerHeight;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          width = rect.width;
          height = rect.height;
        }
      }

      // 1920x1080 target resolution (16:9)
      const scaleX = width / 1920;
      const scaleY = height / 1080;
      const computedScale = Math.min(scaleX, scaleY);
      setScale(Math.max(computedScale, 0.05));
    };

    updateScale();

    // Listen to resize on window and container
    window.addEventListener('resize', updateScale);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => {
        updateScale();
      });
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateScale);
      if (observer) observer.disconnect();
    };
  }, [containerRef]);

  return scale;
}
