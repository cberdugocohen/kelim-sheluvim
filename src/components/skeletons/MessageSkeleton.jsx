import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function MessageSkeleton() {
  return (
    <Card className="bg-white rounded-2xl shadow-md animate-pulse">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-slate-200 rounded-full flex-shrink-0"></div>
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-3 bg-slate-200 rounded w-1/4"></div>
            </div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-200 rounded w-full"></div>
              <div className="h-3 bg-slate-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
