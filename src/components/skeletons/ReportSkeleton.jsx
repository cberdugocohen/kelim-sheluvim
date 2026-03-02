import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function ReportSkeleton() {
    return (
        <Card className="animate-pulse">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                        <div className="flex-1 space-y-3">
                            <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                            <div className="space-y-2">
                                <div className="h-3 bg-slate-200 rounded w-full"></div>
                                <div className="h-3 bg-slate-200 rounded w-full"></div>
                                <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                            </div>
                            <div className="h-4 w-1/4 bg-slate-200 rounded-lg"></div>
                        </div>
                    </div>
                    <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="h-8 w-16 bg-slate-200 rounded"></div>
                    <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                </div>
            </CardContent>
        </Card>
    );
}
