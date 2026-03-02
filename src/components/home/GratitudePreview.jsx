import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import GratitudePreviewCard from "../community/GratitudePreviewCard";

export default function GratitudePreview({ recentGratitudes, allAuthors, isContentLoading }) {
  return (
    <motion.section 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="mb-24"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
        <h2 className="text-4xl md:text-5xl font-black text-gray-800 flex items-center gap-4">
          <Heart className="w-10 h-10 text-pink-600" />
          קיר התודות
        </h2>
        <Link to={createPageUrl("CommunityCenter")}>
          <Button className="bg-pink-600 hover:bg-pink-700 text-lg px-8 py-6 rounded-2xl shadow-lg">
            לכל התודות
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Button>
        </Link>
      </div>

      {isContentLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/50 p-6 rounded-2xl h-48 animate-pulse"></div>
          ))}
        </div>
      ) : recentGratitudes.length > 0 ? (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentGratitudes.map((gratitude) => (
            <GratitudePreviewCard
              key={gratitude.id}
              gratitude={gratitude}
              sender={allAuthors[gratitude.sender_id]}
              recipient={allAuthors[gratitude.recipient_id]}
            />
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">עדיין לא נכתבו תודות... בואי תהיי הראשונה!</p>
        </div>
      )}
    </motion.section>
  );
}
