import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function UserNotRegisteredError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center p-8 max-w-md">
        <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">המשתמשת לא רשומה</h1>
        <p className="text-gray-600 mb-6">
          נראה שהחשבון שלך לא רשום במערכת. אנא פני למנהלת הקהילה.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          נסי שוב
        </Button>
      </div>
    </div>
  );
}
