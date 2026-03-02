import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Service } from "@/entities/Service";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Recommendation } from "@/entities/Recommendation"; // Corrected import syntax
import { Student } from "@/entities/Student";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";


import {
  Plus,
  Search,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ServiceCard from "../components/ServiceCard";
import ServiceFilters, { getRegionForCity } from "../components/ServiceFilters";
import ServiceModal from "../components/ServiceModal";
import ContactModal from "@/components/ContactModal"; // Added ContactModal import
import ServiceCardSkeleton from "../components/skeletons/ServiceCardSkeleton";
import Pagination, { usePagination } from "../components/Pagination";
import EmptyState from "../components/EmptyState";

function PaginatedServiceGrid({ filteredServices, isLoading, handleServiceClick, categoryColors, perPage }) {
  const { page, setPage, pageItems, totalPages } = usePagination(filteredServices, perPage);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {Array(8).fill(0).map((_, i) => (
          <ServiceCardSkeleton key={i} />
        ))}
      </motion.div>
    );
  }

  if (filteredServices.length === 0) return <EmptyState type="search" />;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <AnimatePresence>
          {pageItems.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onClick={() => handleServiceClick(service)}
              categoryColors={categoryColors}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p) => {
          setPage(p);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="mt-8 mb-4"
      />
    </>
  );
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedService, setSelectedService] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useCurrentUser();
  const [holidayFilterActive, setHolidayFilterActive] = useState(false);
  const [contactModal, setContactModal] = useState({ isOpen: false, recipientId: null, recipientName: "", serviceId: null, defaultSubject: "", defaultContent: "" }); // הוספנו מצב למודל קשר
  const navigate = useNavigate();
  const location = useLocation();

  const GEOGRAPHIC_AREAS = ["צפון", "מרכז", "דרום", "ירושלים"];
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('holiday') === 'true') {
      setHolidayFilterActive(true);
    }
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
    loadData();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, selectedCategory, selectedArea, holidayFilterActive]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('serviceId');
    if (serviceId && services.length > 0) {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        handleServiceClick(service);
      }
    }
  }, [services]);

  const loadData = async () => {
    try {
      const [servicesData, studentsData] = await Promise.all([
        Service.filter({ is_approved: true }, "-created_date"),
        Student.list("-created_date")
      ]);

      const demoPatterns = [/^demo/i, /^test/i, /^sample/i, /^example/i, /^דוגמא/i, /^מבחן/i];
      
      const realStudentsData = studentsData.filter(student => 
        !demoPatterns.some(pattern => pattern.test(student.username || ''))
      );
      
      const realServicesData = servicesData.filter(service => 
        !demoPatterns.some(pattern => pattern.test(service.title || ''))
      );

      const userIds = [
          ...realStudentsData.map(s => s.user_id),
          ...realServicesData.map(s => s.provider_id)
      ].filter(id => id && /^[0-9a-fA-F]{24}$/.test(id));

      let usersMap = {};
      if (userIds.length > 0) {
          const uniqueUserIds = [...new Set(userIds)];
          const users = await User.filter({ id: { "$in": uniqueUserIds } }).catch(() => []);
          usersMap = users.reduce((acc, user) => {
              acc[user.id] = user;
              return acc;
          }, {});
      }

      const studentsByUserId = realStudentsData.reduce((acc, student) => {
        if (student.user_id) acc[student.user_id] = student;
        return acc;
      }, {});

      const studentServices = realStudentsData
        .filter(student => (
          (student.contribution_details?.gift?.active || student.contribution_details?.paid?.active) ||
          student.show_on_map || student.description || (student.service_areas && student.service_areas.length > 0)
        ))
        .map(student => {
          const studentUser = usersMap[student.user_id];
          const title = student.contribution_details?.gift?.description || student.contribution_details?.paid?.description || studentUser?.full_name || student.username;
          let price = "";
          if (student.contribution_details?.paid?.active) price = "בתשלום";
          else if (student.contribution_details?.gift?.active) price = "התנדבות";

          return {
            id: `student_${student.id}`,
            title: title,
            description: student.description || "",
            service_areas: student.service_areas || [],
            geographic_area: student.city || "כל הארץ",
            price: price,
            images: studentUser?.profile_image ? [studentUser.profile_image] : [],
            is_approved: true,
            provider_id: student.user_id,
            provider_name: studentUser?.full_name || student.username || "חברת קהילה",
            is_holiday_highlight: student.is_holiday_highlight || false,
            holiday_type: student.holiday_type || "",
            is_student_service: true,
            student_data: student, // Pass full student data
            created_date: student.created_date,
            phone: student.contact_info?.phone || ""
          };
        });

      const enrichedServicesData = realServicesData.map(service => {
        const providerStudentProfile = studentsByUserId[service.provider_id];
        return {
            ...service,
            service_areas: (service.service_areas && service.service_areas.length > 0) ? service.service_areas : (service.category ? [service.category] : []),
            provider_name: usersMap[service.provider_id]?.full_name || 'חברת קהילה',
            phone: providerStudentProfile?.contact_info?.phone || "",
            student_data: providerStudentProfile || null, // Pass full student data
        };
      });

      const allServices = [...enrichedServicesData, ...studentServices].sort((a,b) => new Date(b.created_date) - new Date(a.created_date));
      setServices(allServices);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const filterServices = () => {
    let filtered = services;

    if (holidayFilterActive) {
      filtered = filtered.filter(service => service.is_holiday_highlight);
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(lowercasedTerm) ||
        service.description.toLowerCase().includes(lowercasedTerm) ||
        (service.service_areas || []).some(area => area.toLowerCase().includes(lowercasedTerm)) ||
        (service.student_data?.tags || []).some(tag => tag.toLowerCase().includes(lowercasedTerm))
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(service => (service.service_areas || []).includes(selectedCategory));
    }

    if (selectedArea !== "all") {
      filtered = filtered.filter(service => {
        const serviceArea = service.geographic_area;
        
        // אם השירות מסומן "כל הארץ", הוא מופיע בכל חיפוש
        if (serviceArea === "כל הארץ") {
          return true;
        }
        
        // חיפוש ישיר - אם השם של האזור תואם בדיוק
        if (serviceArea === selectedArea) {
          return true;
        }
        
        // חיפוש חלקי - אם שם האזור כולל את הטקסט שחיפשנו
        if (serviceArea && serviceArea.toLowerCase().includes(selectedArea.toLowerCase())) {
          return true;
        }
        
        // המרה לאזורים גיאוגרפיים
        if (GEOGRAPHIC_AREAS.includes(selectedArea)) {
          const serviceRegion = getRegionForCity(serviceArea);
          return serviceRegion === selectedArea;
        }
        
        // חיפוש הפוך - אם מה שחיפשנו כולל את שם האזור של השירות
        if (selectedArea.toLowerCase().includes(serviceArea.toLowerCase())) {
          return true;
        }
        
        return false;
      });
    }

    setFilteredServices(filtered);
  };

  const handleClearHolidayFilter = () => {
    setHolidayFilterActive(false);
    navigate(location.pathname, { replace: true });
  }

  const handleServiceClick = async (service) => {
    setSelectedService(service);
    try {
      if (!service.is_student_service) {
        const serviceRecommendations = await Recommendation.filter({ service_id: service.id });
        setRecommendations(serviceRecommendations);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
      setRecommendations([]);
    }
  };

  const categoryColors = {
    "טיפול": "bg-green-100 text-green-800",
    "ייעוץ": "bg-indigo-100 text-indigo-800",
    "הוראה": "bg-purple-100 text-purple-800",
    "מכירה": "bg-orange-100 text-orange-800",
    "שירותי בית": "bg-pink-100 text-pink-800",
    "טכנולוגיה": "bg-cyan-100 text-cyan-800",
    "אומנות": "bg-amber-100 text-amber-800",
    "בריאות": "bg-emerald-100 text-emerald-800",
    "כושר": "bg-red-100 text-red-800",
    "אחר": "bg-gray-100 text-gray-800"
  };

  // חשיפת פונקציה גלובלית לפתיחת מודל הקשר
  useEffect(() => {
    window.openContactModal = (recipientId, recipientName, relatedPostId, defaultSubject, defaultContent) => {
      setContactModal({
        isOpen: true,
        recipientId,
        recipientName,
        serviceId: relatedPostId, // Use relatedPostId from parameters
        defaultSubject: defaultSubject || "",
        defaultContent: defaultContent || ""
      });
    };
    
    return () => {
      delete window.openContactModal;
    };
  }, []); // Changed dependency from selectedService to empty array because serviceId is passed as relatedPostId

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              {holidayFilterActive ? "שירותים מיוחדים לחג" : "מאגר שירותים קהילתי"}
            </h1>
            <p className="text-slate-600 text-lg">
              {holidayFilterActive ? "גלי שירותים מיוחדים וחגיגיים שהקהילה מציעה" : "כאן תמצאי נשים שעושות מהלב – וגם את מוזמנת להוסיף את שלך."}
            </p>
          </div>

          {currentUser && (
            <Link to={createPageUrl("Profile")}>
              <Button className="bg-violet-500 hover:bg-violet-600 text-white px-6 py-3 shadow-lg">
                <Plus className="w-5 h-5 ml-2" />
                צרפי את השירות שלך
              </Button>
            </Link>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-6">
              <ServiceFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedArea={selectedArea}
                onAreaChange={setSelectedArea}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 text-slate-600 my-6"
        >
          <Eye className="w-5 h-5" />
          <span>מציג {filteredServices.length} מתוך {services.length} שירותים</span>
        </motion.div>

        <PaginatedServiceGrid
          filteredServices={filteredServices}
          isLoading={isLoading}
          handleServiceClick={handleServiceClick}
          categoryColors={categoryColors}
          perPage={ITEMS_PER_PAGE}
        />

        {!isLoading && filteredServices.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-700 mb-2">לא נמצאו שירותים</h3>
            <p className="text-slate-500 mb-6">נסי לשנות את קריטריוני החיפוש שלך</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedArea("all");
                setHolidayFilterActive(false);
                navigate(location.pathname, { replace: true });
              }}
            >
              איפוס פילטרים
            </Button>
          </motion.div>
        )}

        <ServiceModal
          service={selectedService}
          recommendations={recommendations}
          currentUser={currentUser}
          onClose={() => setSelectedService(null)}
          onRecommendationAdded={loadData}
        />

        {/* Contact Modal */}
        <ContactModal
          isOpen={contactModal.isOpen}
          onClose={() => setContactModal({ isOpen: false, recipientId: null, recipientName: "", serviceId: null, defaultSubject: "", defaultContent: "" })}
          recipientId={contactModal.recipientId}
          recipientName={contactModal.recipientName}
          relatedPostId={contactModal.serviceId}
          defaultSubject={contactModal.defaultSubject || `שאלה לגבי השירות`}
          defaultContent={contactModal.defaultContent || `שלום,\n\nראיתי את השירות שלך ואשמח לקבל פרטים נוספים.\n\nתודה!`}
        />
      </div>
    </div>
  );
}
