import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, User } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ServiceCard({ service, onClick, categoryColors }) {
  if (!service) {
    return null; 
  }

  const handleImgError = (e) => {
    e.target.style.display = 'none';
    e.target.parentElement.style.display = 'none';
  };
  
  // בניית תוכן הכרטיס
  const cardContent = (
    <Card className="glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full focus-within:ring-2 focus-within:ring-purple-400 focus-within:ring-offset-2">
      <CardContent className="p-0">
        {service.images?.[0] && (
          <div className="h-48 rounded-t-xl overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
            <img 
              src={service.images[0]} 
              alt={service.title}
              loading="lazy"
              decoding="async"
              onError={handleImgError}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">
              {service.title}
            </h3>
            <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed min-h-[40px]">
              {service.description}
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {service.category && (
                <Badge className="bg-gray-100 text-gray-800 text-xs px-3 py-1">
                  {service.category}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm text-slate-500">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 ml-1" />
                {service.geographic_area}
              </div>
              {service.provider_name && (
                <div className="flex items-center text-purple-600 font-medium">
                  <User className="w-4 h-4 ml-1" />
                  {service.provider_name}
                </div>
              )}
            </div>
            
            {service.price && (
              <div className="text-lg font-bold text-purple-600">
                {service.price === "התנדבות" ? "💝 " + service.price : 
                 service.price === "בתשלום" ? "💼 " + service.price :
                 "₪" + service.price}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // אם יש provider_id, עטפי את הכרטיס בקישור לפרופיל
  if (service.provider_id) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -5, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Link to={createPageUrl(`UserProfile?userId=${service.provider_id}`)} className="h-full block">
          {cardContent}
        </Link>
      </motion.div>
    );
  }
  
  // אם אין provider_id, הצג את הכרטיס ללא קישור (בלי hover effect מיוחד)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full cursor-default"
    >
      {cardContent}
    </motion.div>
  );
}
