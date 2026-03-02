import React from "react";
import { Users, ShoppingBasket, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function AnimatedStats({ stats, isLoading = false }) {
  const statItems = [
    { 
      icon: Users, 
      label: 'נשים בקהילה', 
      value: isLoading ? '...' : (stats.users || '139'), 
      color: 'from-purple-500 to-indigo-600'
    },
    { 
      icon: ShoppingBasket, 
      label: 'שירותים זמינים', 
      value: isLoading ? '...' : (stats.services || '0'), 
      color: 'from-blue-500 to-cyan-600'
    },
    { 
      icon: Heart, 
      label: 'הודעות ותודות', 
      value: isLoading ? '...' : ((stats.posts + stats.gratitudes) || '0'), 
      color: 'from-pink-500 to-rose-600'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-20"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {statItems.map((item, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="glass-card rounded-3xl p-8 text-center"
          >
            <div className={`w-20 h-20 bg-gradient-to-br ${item.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl`}>
              <item.icon className="w-10 h-10 text-white" />
            </div>
            <p className={`text-5xl font-black gradient-text mb-3 ${isLoading ? 'animate-pulse' : ''}`}>
              {item.value}
            </p>
            <p className="text-gray-600 font-semibold text-lg">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
