import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen p-4 md:p-8 animate-pulse" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="h-10 w-48 bg-slate-200 rounded-lg mb-2"></div>
          <div className="h-5 w-64 bg-slate-200 rounded-lg"></div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white/80">
              <CardHeader>
                <div className="h-6 w-1/3 bg-slate-200 rounded"></div>
                <div className="h-4 w-1/2 bg-slate-200 rounded mt-2"></div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
                    <div className="h-10 bg-slate-200 rounded-lg"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
                    <div className="h-10 bg-slate-200 rounded-lg"></div>
                  </div>
                </div>
                <div className="space-y-2">
                   <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
                   <div className="h-24 w-full bg-slate-200 rounded-lg"></div>
                </div>
                 <div className="space-y-2">
                   <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
                   <div className="h-12 w-full bg-slate-200 rounded-lg"></div>
                </div>
                <div className="h-10 w-32 bg-slate-200 rounded-lg ml-auto"></div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <Card className="bg-white/80 h-96">
                <CardContent className="p-4 space-y-4">
                    <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto"></div>
                    <div className="h-6 w-1/2 bg-slate-200 rounded mx-auto"></div>
                    <div className="h-4 w-3/4 bg-slate-200 rounded mx-auto"></div>
                </CardContent>
            </Card>
             <Card className="bg-white/80 h-64">
                <CardContent className="p-4">
                    <div className="h-6 w-1/2 bg-slate-200 rounded mb-4"></div>
                    <div className="h-8 w-full bg-slate-200 rounded-lg mb-2"></div>
                    <div className="h-8 w-full bg-slate-200 rounded-lg mb-2"></div>
                    <div className="h-8 w-full bg-slate-200 rounded-lg"></div>
                </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mt-12">
            <Card className="bg-white/80 p-6">
                <CardHeader>
                    <div className="h-8 w-1/3 bg-slate-200 rounded"></div>
                </CardHeader>
                <CardContent>
                    <div className="h-20 w-full bg-slate-100 rounded-lg"></div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
