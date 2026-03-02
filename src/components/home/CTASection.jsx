import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, Plus, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }}
      className="relative my-24"
    >
      <div className="hero-gradient rounded-[3rem] shadow-2xl p-12 md:p-20 text-center text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        
        <div className="relative z-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-xl"
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            מוכנה להצטרף לקהילה?
          </h2>
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-medium opacity-95">
            הגיע הזמן להראות לקהילה מה את יודעת לעשות הכי טוב! 🌟
          </p>
          
          <Link 
            to={createPageUrl("Profile")} 
            className="inline-block relative z-50"
            style={{ pointerEvents: 'auto' }}
          >
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-white hover:scale-110 transition-all duration-300 text-xl px-12 py-8 rounded-2xl shadow-2xl font-black"
            >
              <Plus className="w-6 h-6 ml-3" />
              בואי נתחיל!
              <Zap className="w-6 h-6 mr-3" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
