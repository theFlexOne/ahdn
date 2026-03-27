import { useEffect, useState } from 'react';

export function useIsScrolledFromTop() {
  const [isScrolledFromTop, setIsScrolledFromTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledFromTop(window.scrollY > 150);
    };

    handleScroll(); // initialize on mount
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return isScrolledFromTop;
}
