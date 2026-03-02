import React from 'react';
import { motion } from 'framer-motion';

const StatItemSkeleton = () => (
  <div className="text-center flex flex-col items-center space-y-4">
    <div className="w-20 h-20 bg-slate-200 rounded-3xl animate-pulse"></div>
    <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
    <div className="h-4 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
  </div>
);

export default function StatsSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-purple-100 max-w-4xl mx-auto"
    >
      <div className="h-8 w-1/2 bg-slate-200 rounded-lg animate-pulse mx-auto mb-8"></div>
      <div className="grid grid-cols-3 gap-8">
        <StatItemSkeleton />
        <StatItemSkeleton />
        <StatItemSkeleton />
      </div>
    </motion.div>
  );
}
