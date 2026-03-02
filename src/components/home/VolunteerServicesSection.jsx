import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ServiceCard from "../ServiceCard";

export default function VolunteerServicesSection({ allServices, isLoading }) {
  const volunteerServices = allServices.filter(s => 
    s.price === 'התנדבות' || s.price?.includes('מתנה') || s.price?.toLowerCase().includes('gift')
  ).slice(0, 3);

  if (isLoading || volunteerServices.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-8 mb-20 bg-gradient-to-br from-pink-50 to-rose-50"
    >
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-rose-800 mb-3">
          💝 פינת ההתנדבות
        </h3>
        <p className="text-gray-700 text-lg">
          חברות קהילה שמציעות שירותים בהתנדבות מלאה מתוך נדיבות לב
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {volunteerServices.map(service => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
      
      <div className="text-center mt-6">
        <Link to={createPageUrl("CommunityHub")}>
          <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white">
            ראי את כל שירותי ההתנדבות
            <Heart className="w-4 h-4 mr-2" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
