import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-purple-600 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">העמוד שחיפשת לא נמצא</p>
        <Link to="/">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Home className="w-4 h-4 ml-2" />
            חזרה לדף הבית
          </Button>
        </Link>
      </div>
    </div>
  );
}
