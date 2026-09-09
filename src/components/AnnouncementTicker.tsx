'use client';

import React, { useState, useEffect } from 'react';

const announcements = [
  '🛡️ مراجعات وتحليل ذكي: نكشف لك المميزات والعيوب بحيادية لمساعدتك على الاختيار.',
  '🚚 تنفيذ وشحن أمازون الرسمي: طلبك يصلك مباشرة عبر أسطول أمازون مصر الموثوق.',
  '💵 دفع عند الاستلام وإرجاع سهل: نفس سياسة الضمان والإرجاع المعتمدة رسمياً من أمازون.'
];

export default function AnnouncementTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-slate-900 text-white text-xs sm:text-sm h-8 sm:h-9 overflow-hidden flex items-center justify-center px-4 dir-rtl text-center z-50">
      <p 
        key={index}
        className="transition-opacity duration-500 ease-in-out font-medium truncate max-w-4xl"
      >
        {announcements[index]}
      </p>
    </div>
  );
}
