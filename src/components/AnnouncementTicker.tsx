'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, Banknote } from 'lucide-react';

const announcements = [
  {
    text: 'مراجعات وتحليل ذكي: نكشف لك المميزات والعيوب بحيادية لمساعدتك على الاختيار.',
    icon: <ShieldCheck size={16} className="text-blue-400" />
  },
  {
    text: 'تنفيذ وشحن أمازون الرسمي: طلبك يصلك مباشرة عبر أسطول أمازون مصر الموثوق.',
    icon: <Truck size={16} className="text-red-400" />
  },
  {
    text: 'دفع عند الاستلام وإرجاع سهل: نفس سياسة الضمان والإرجاع المعتمدة رسمياً من أمازون.',
    icon: <Banknote size={16} className="text-green-400" />
  }
];

export default function AnnouncementTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-8 sm:h-9 py-1 px-4 bg-slate-900 text-white text-xs sm:text-sm flex items-center justify-center text-center overflow-hidden relative border-b border-slate-800">
      {announcements.map((ann, idx) => (
        <div
          key={idx}
          className={`absolute flex items-center justify-center gap-2 w-full transition-all duration-500 ease-in-out ${
            idx === currentIndex ? 'opacity-100 transform-none z-10' : 'opacity-0 translate-y-4 -z-10'
          }`}
        >
          {ann.icon}
          <span className="font-medium tracking-wide">{ann.text}</span>
        </div>
      ))}
    </div>
  );
}
