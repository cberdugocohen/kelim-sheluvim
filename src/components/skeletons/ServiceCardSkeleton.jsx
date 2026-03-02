import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function ServiceCardSkeleton() {
  return (
    <div className="animate-pulse">
      <Card className="glass-effect border-0 shadow-lg h-80">
        <div className="h-48 bg-slate-200 rounded-t-xl"></div>
        <CardContent className="p-6 space-y-3">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 rounded w-full"></div>
          <div className="h-3 bg-slate-200 rounded w-5/6"></div>
          <div className="flex justify-between items-center pt-2">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
