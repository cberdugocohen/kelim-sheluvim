import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShoppingBag, Heart, Edit } from "lucide-react";
import { motion } from "framer-motion";

export default function QuickActions({ currentUser, showInstallPrompt, onInstallApp, holidaySection }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
    >
      <Link to={createPageUrl("CommunityHub")}>
        <div className="glass-card action-card rounded-3xl p-8 text-center h-full cursor-pointer">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-xl text-gray-800 mb-2">מאגר השירותים</h3>
          <p className="text-gray-600">גלי מה הקהילה מציעה</p>
        </div>
      </Link>

      <Link to={createPageUrl("PrayerRequests")}>
        <div className="glass-card action-card rounded-3xl p-8 text-center h-full cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Heart className="w-8 h-8 text-white" fill="currentColor" />
          </div>
          <h3 className="font-bold text-xl text-purple-800 mb-2">קיר בקשות תפילה</h3>
          <p className="text-purple-600">התפללי עם הקהילה 🙏</p>
        </div>
      </Link>

      <Link to={createPageUrl("Profile")}>
        <div className="glass-card action-card rounded-3xl p-8 text-center h-full cursor-pointer">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Edit className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-xl text-gray-800 mb-2">הפרופיל שלי</h3>
          <p className="text-gray-600">עדכני את הנוכחות שלך</p>
        </div>
      </Link>
    </motion.div>
  );
}
