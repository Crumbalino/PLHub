'use client';

import { useState, useEffect } from 'react';
import ReadingProgress from '@/components/ReadingProgress';

export default function ReadingProgressWrapper() {
  const [readCount, setReadCount] = useState(0);

  // Daily reset logic
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem('tfh_read_date');
    const savedCount = localStorage.getItem('tfh_read_count');

    if (savedDate === today && savedCount) {
      setReadCount(parseInt(savedCount, 10));
    } else {
      setReadCount(0);
      localStorage.setItem('tfh_read_date', today);
      localStorage.setItem('tfh_read_count', '0');
    }
  }, []);

  return <ReadingProgress readCount={readCount} />;
}
