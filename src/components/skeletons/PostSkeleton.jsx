import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";

export default function PostSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Card className="bg-white shadow-lg h-full rounded-2xl border border-pink-100 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-slate-200 rounded-full animate-pulse flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 bg-slate-200 rounded-lg animate-pulse"></div>
              <div className="h-4 w-1/2 bg-slate-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="h-4 w-full bg-slate-200 rounded-lg animate-pulse"></div>
            <div className="h-4 w-5/6 bg-slate-200 rounded-lg animate-pulse"></div>
          </div>

          <div className="flex justify-center">
            <div className="h-10 w-32 bg-slate-200 rounded-full animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
