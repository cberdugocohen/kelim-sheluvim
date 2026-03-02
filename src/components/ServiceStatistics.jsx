import React, { useState, useEffect } from 'react';
import { Service } from '@/entities/Service';
import { Student } from '@/entities/Student';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Gift,
  Briefcase,
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { convertStudentContributionsToServices } from '@/utils/studentServices';

export default function ServiceStatistics() {
  const [allServices, setAllServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      
      // טעינת שירותים ופרופילים
      const [servicesRes, studentsRes] = await Promise.all([
        Service.filter({ is_approved: true }, "-created_date", 1000).catch(() => []),
        Student.list("-created_date", 1000).catch(() => [])
      ]);


      // המרת שירותים מפרופילים
      const studentServices = convertStudentContributionsToServices(studentsRes);
      const combinedServices = [...servicesRes, ...studentServices];

      setAllServices(combinedServices);
    } catch (err) {
      console.error("❌ Error loading statistics:", err);
      setError('שגיאה בטעינת הסטטיסטיקה. נסי שוב.');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">טוען סטטיסטיקה...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
          <Button onClick={loadData} className="mt-4">
            <RefreshCw className="w-4 h-4 ml-2" />
            נסי שוב
          </Button>
        </CardContent>
      </Card>
    );
  }

  // חישוב סטטיסטיקות
  const serviceTypes = {
    gift: allServices.filter(s => s.price === 'התנדבות').length,
    paid: allServices.filter(s => s.price !== 'התנדבות' && s.price !== 'בארטר').length,
    barter: allServices.filter(s => s.price === 'בארטר').length
  };

  const topCategories = {};
  allServices.forEach(service => {
    if (service.category) {
      topCategories[service.category] = (topCategories[service.category] || 0) + 1;
    }
  });
  
  const sortedCategories = Object.entries(topCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Top 10 categories

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-purple-600" />
                סטטיסטיקת השירותים
              </h2>
              <p className="text-slate-600 mt-1">סה"כ {allServices.length} שירותים פעילים</p>
            </div>
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 ml-2" />
              רענן
            </Button>
          </div>

          {/* Service Types Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
          >
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-2xl border border-pink-200 text-center">
              <div className="w-16 h-16 bg-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <p className="text-4xl font-bold text-pink-700 mb-2">{serviceTypes.gift}</p>
              <p className="text-sm text-pink-600 font-medium">שירותי מתנה</p>
              <p className="text-xs text-pink-500 mt-1">
                {((serviceTypes.gift / allServices.length) * 100).toFixed(1)}% מכלל השירותים
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <p className="text-4xl font-bold text-green-700 mb-2">{serviceTypes.paid}</p>
              <p className="text-sm text-green-600 font-medium">שירותים בתשלום</p>
              <p className="text-xs text-green-500 mt-1">
                {((serviceTypes.paid / allServices.length) * 100).toFixed(1)}% מכלל השירותים
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl border border-amber-200 text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <p className="text-4xl font-bold text-amber-700 mb-2">{serviceTypes.barter}</p>
              <p className="text-sm text-amber-600 font-medium">שירותי בארטר</p>
              <p className="text-xs text-amber-500 mt-1">
                {((serviceTypes.barter / allServices.length) * 100).toFixed(1)}% מכלל השירותים
              </p>
            </div>
          </motion.div>

          {/* Top Categories */}
          {sortedCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 p-6 rounded-2xl border border-slate-200"
            >
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                הקטגוריות הפופולריות ביותר (Top 10)
              </h3>
              <div className="space-y-3">
                {sortedCategories.map(([category, count], index) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-slate-300 text-slate-700' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-base font-medium text-slate-700">{category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-blue-600 border-blue-300">
                        {count} שירותים
                      </Badge>
                      <span className="text-sm text-slate-500">
                        {((count / allServices.length) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
