import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Student } from "@/entities/Student";
import { Service } from "@/entities/Service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  X,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Gift // NEW: Import Gift icon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ServiceCard from "../components/ServiceCard";
import ServiceFilters, { getRegionForCity } from "../components/ServiceFilters";
import { convertStudentContributionsToServices } from "@/utils/studentServices";

const TABS = {
  SERVICES: 'services',
};

export default function CommunityHub() {
  const [activeTab, setActiveTab] = useState(TABS.SERVICES);
  const [students, setStudents] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ category: 'all', region: 'all' });
  const [serviceCategories, setServiceCategories] = useState([]);
  const [holidayFilter, setHolidayFilter] = useState(null); // NEW: Holiday filter state

  // NEW: Check for holiday parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const holidayParam = urlParams.get('holiday');
    if (holidayParam) {
      setHolidayFilter(decodeURIComponent(holidayParam));
    }
  }, []); // Run once on component mount

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!navigator.onLine) {
        throw new Error('אין חיבור לאינטרנט. אנא בדקי את החיבור ונסי שוב.');
      }

      // טעינת שירותים ופרופילים במקביל - מוגבל ל-200 לביצועים טובים יותר
      const [servicesRes, studentsRes] = await Promise.all([
        Service.filter({ is_approved: true }, "-created_date", 200).catch(err => {
          console.error("Error fetching services:", err);
          return [];
        }),
        Student.list("-created_date", 200).catch(err => {
          console.error("Error fetching students:", err);
          return [];
        })
      ]);

      setStudents(studentsRes);

      // המרת שירותים מפרופילים
      const studentServices = convertStudentContributionsToServices(studentsRes);
      
      // איחוד שני המקורות
      const combinedServices = [...servicesRes, ...studentServices];

      setAllServices(combinedServices);

      // איסוף קטגוריות ייחודיות
      const uniqueCategories = [...new Set(combinedServices.map(s => s.category).filter(Boolean))];
      setServiceCategories(uniqueCategories);

    } catch (err) {
      console.error("❌ Error loading community hub data:", err);
      setError(err.message || "שגיאה בטעינת הנתונים. נסו לרענן את הדף.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const combinedCategories = useMemo(() => {
    return Array.from(serviceCategories).sort();
  }, [serviceCategories]);

  const filteredServices = useMemo(() => {
    const filtered = allServices.filter(service => {
      if (!service) return false;

      // Holiday Filter (NEW) - has highest priority
      if (holidayFilter) {
        const isHolidayMatch = service.is_holiday_highlight && service.holiday_type === holidayFilter;
        if (!isHolidayMatch) return false;
      }

      // Search Term Filter
      const searchMatch = !searchTerm.trim() ? true : (
        service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.provider_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.geographic_area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Category Filter
      const categoryMatch = filters.category === 'all' ? true : service.category === filters.category;

      // Region Filter
      const serviceRegion = getRegionForCity(service.geographic_area || "");
      const regionMatch = filters.region === 'all' ? true : serviceRegion === filters.region;

      return searchMatch && categoryMatch && regionMatch;
    });

    return filtered;
  }, [allServices, searchTerm, filters, holidayFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({ category: 'all', region: 'all' });
    setHolidayFilter(null);
    // Remove holiday param from URL
    const url = new URL(window.location);
    url.searchParams.delete('holiday');
    window.history.pushState({}, '', url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6" dir="rtl">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="text-center mb-8">
            <div className="h-12 w-80 bg-purple-200 rounded-lg mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 w-96 bg-slate-200 rounded-lg mx-auto mb-6 animate-pulse"></div>
            <div className="h-14 w-full max-w-xl bg-white/80 rounded-2xl mx-auto mb-6 animate-pulse"></div>
          </div>
          
          {/* Services Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-md">
                <div className="h-48 bg-slate-200 rounded-lg mb-4 animate-pulse"></div>
                <div className="h-6 bg-slate-200 rounded mb-2 animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded mb-2 animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6 flex items-center justify-center" dir="rtl">
        <Card className="max-w-md w-full">
          <div className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-4">שגיאה בטעינת הנתונים</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={loadData} className="w-full bg-purple-600 hover:bg-purple-700">
              <Loader2 className="w-4 h-4 ml-2" />
              נסי שוב
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">
              {holidayFilter ? (
                <>
                  <span className="text-orange-600">שירותים ל{holidayFilter}</span> 🎉
                </>
              ) : (
                <>
                  <span className="text-purple-700">המאגר הקהילתי</span> ✨
                </>
              )}
            </h1>
            <p className="text-lg text-slate-600 mb-2 max-w-2xl mx-auto leading-relaxed">
              {holidayFilter 
                ? `כל השירותים והמוצרים המתאימים במיוחד ל${holidayFilter}` 
                : 'גלי את כל השירותים המדהימים שהקהילה שלנו מציעה'
              }
            </p>
            {/* Service counter */}
            <div className="flex justify-center items-center gap-2 text-sm text-slate-500">
              <span className="font-bold text-purple-600 text-lg">{allServices.length}</span>
              <span>שירותים זמינים</span>
              {filteredServices.length !== allServices.length && (
                <>
                  <span>•</span>
                  <span className="font-bold text-indigo-600">{filteredServices.length}</span>
                  <span>מוצגים כעת</span>
                </>
              )}
            </div>
            
            {/* NEW: Holiday filter indicator */}
            {holidayFilter && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full border border-orange-300"
              >
                <Gift className="w-4 h-4" />
                <span className="font-medium">מציג רק שירותי {holidayFilter}</span>
                <button 
                  onClick={handleClearFilters}
                  className="hover:bg-orange-200 rounded-full p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* Search */}
          <div className="relative max-w-xl mx-auto mb-6 mt-6">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="חפשי שירות, עיר או קטגוריה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-12 pl-4 py-4 text-lg bg-white/80 backdrop-blur-sm border-purple-200 focus:border-purple-400 rounded-2xl shadow-lg"
            />
          </div>

          {/* Filters */}
          <ServiceFilters
            filters={filters}
            setFilters={setFilters}
            categories={combinedCategories}
            activeItemCount={filteredServices.length}
            totalItemCount={allServices.length}
          />
        </div>

        {/* Content */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-700 mb-4">
              {holidayFilter 
                ? `לא נמצאו שירותים ל${holidayFilter}` 
                : 'לא נמצאו שירותים מתאימים'
              }
            </h3>
            <p className="text-slate-500 mb-8">
              {holidayFilter 
                ? 'נסי להסיר את סינון החג או לחפש מ something else אחר' 
                : 'נסי לשנות את הסינון או את מילות החיפוש'
              }
            </p>
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <X className="w-4 h-4 ml-2" />
              נקי סינונים
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="services-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
