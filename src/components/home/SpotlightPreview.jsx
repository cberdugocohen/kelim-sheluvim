import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Crown, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OptimizedImage from "../OptimizedImage";

export default function SpotlightPreview({ spotlightUser }) {
  if (!spotlightUser) return null;

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="text-center mb-8">
        <Crown className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
        <h2 className="text-2xl sm:text-3xl font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-red-500">
            ✨ כוכבת השבוע שלנו ✨
          </span>
        </h2>
      </div>
      
      <Link to={createPageUrl(`SpotlightProfile?userId=${spotlightUser.user_id}`)}>
        <Card className="bg-gradient-to-r from-yellow-50 via-pink-50 to-purple-50 rounded-3xl shadow-xl border-2 border-white hover:shadow-2xl transition-all" dir="rtl">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right">
              <div className="w-32 h-32 rounded-full shadow-2xl border-4 border-white overflow-hidden">
                <OptimizedImage
                  src={spotlightUser.profile_image}
                  alt={spotlightUser.full_name}
                  className="w-full h-full object-cover"
                  fallbackSrc={`https://ui-avatars.com/api/?name=${spotlightUser.full_name}&background=eab308&color=fff&size=144`}
                />
              </div>
              <div className="space-y-4 flex-1">
                <h3 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                  {spotlightUser.full_name}
                </h3>
                {spotlightUser.tagline && (
                  <p className="text-xl text-gray-700 italic font-medium mb-4 text-right">"{spotlightUser.tagline}"</p>
                )}
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                  היכנסי להכיר את הסיפור המלא
                  <ArrowLeft className="w-5 h-5 mr-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.section>
  );
}
