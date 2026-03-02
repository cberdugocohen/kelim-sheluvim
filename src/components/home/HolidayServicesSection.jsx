import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Gift, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ServiceCard from "../ServiceCard";

export default function HolidayServicesSection({ holidaySection, holidayServices }) {
  if (!holidaySection || !holidaySection.is_active || holidayServices.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <Card className="bg-gradient-to-br from-rose-50 via-purple-50 to-amber-50 shadow-2xl rounded-3xl border-2 border-rose-100 overflow-hidden">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-slate-800 mb-3">
              {holidaySection.title}
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
              {holidaySection.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {holidayServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to={createPageUrl(`CommunityHub?holiday=${encodeURIComponent(holidaySection.current_holiday)}`)}>
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg px-8 py-6 shadow-lg">
                <Gift className="w-5 h-5 ml-2" />
                ראי את כל השירותים ל{holidaySection.current_holiday}
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}
