import React, { useState, useEffect } from "react";
import { Sun, Moon, Coffee } from "lucide-react";
import { motion } from "framer-motion";

export default function PersonalizedGreeting({ userName }) {
  const [greeting, setGreeting] = useState('');
  const [icon, setIcon] = useState(Sun);
  
  useEffect(() => {
    try {
      const hour = new Date().getHours();
      if (hour < 6) {
        setGreeting('לילה טוב');
        setIcon(Moon);
      } else if (hour < 12) {
        setGreeting('בוקר טוב');
        setIcon(Sun);
      } else if (hour < 18) {
        setGreeting('צהריים טובים');
        setIcon(Coffee);
      } else {
        setGreeting('ערב טוב');
        setIcon(Moon);
      }
    } catch (error) {
      console.error("Error in PersonalizedGreeting:", error);
      setGreeting('שלום');
      setIcon(Sun);
    }
  }, []);

  const IconComponent = icon;
  const displayName = userName || 'חברת קהילה';
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-center gap-3 mb-4"
    >
      <IconComponent className="w-6 h-6 text-yellow-500" />
      <span className="text-xl font-medium text-gray-700">
        {greeting}, {displayName}! 👋
      </span>
    </motion.div>
  );
}
