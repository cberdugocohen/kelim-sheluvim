import React from 'react';
import { motion } from 'framer-motion';

export default function SpotlightSkeleton() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-slate-200 rounded-full animate-pulse mx-auto mb-4"></div>
        <div className="h-10 w-3/4 bg-slate-200 rounded-lg animate-pulse mx-auto"></div>
      </div>
      
      <div className="bg-gradient-to-r from-yellow-50 via-pink-50 to-purple-50 rounded-3xl p-8 shadow-xl border-2 border-white">
        <div className="flex flex-col lg:flex-row items-center gap-8 text-center lg:text-right">
          <div className="w-40 h-40 md:w-48 md:h-48 bg-slate-200 rounded-full animate-pulse flex-shrink-0"></div>
          <div className="space-y-4 flex-1 w-full">
            <div className="h-10 w-1/2 bg-slate-200 rounded-lg animate-pulse mx-auto lg:mx-0"></div>
            <div className="h-6 w-3/4 bg-slate-200 rounded-lg animate-pulse mx-auto lg:mx-0"></div>
            <div className="h-12 w-80 bg-slate-200 rounded-full animate-pulse mx-auto lg:mx-0"></div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
