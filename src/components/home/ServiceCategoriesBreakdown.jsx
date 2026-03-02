import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const categoryIcons = {
  'טיפוח ובריאות': '💆‍♀️',
  'שירותי בית': '🏠',
  'אומנות ויצירה': '🎨',
  'חינוך והוראה': '📚',
  'טיפול וייעוץ': '💬',
  'בגדים ותכשיטים': '👗',
  'עיסוי': '💆',
  'כושר': '🏋️‍♀️',
  'default': '✨'
};

export default function ServiceCategoriesBreakdown({ allServices, isLoading }) {
  const [categoryCounts, setCategoryCounts] = useState({});

  useEffect(() => {
    if (!isLoading && allServices.length > 0) {
      const counts = allServices.reduce((acc, service) => {
        const category = service.category || 'אחר';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});
      
      const sortedEntries = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
      
      setCategoryCounts(Object.fromEntries(sortedEntries));
    }
  }, [allServices, isLoading]);

  if (isLoading || Object.keys(categoryCounts).length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-8 mb-20"
    >
      <h3 className="text-3xl font-bold text-center mb-8 text-gray-800">
        קטגוריות השירותים בקהילה
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {Object.entries(categoryCounts).map(([category, count], index) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            className="text-center"
          >
            <div className="text-4xl mb-3">
              {categoryIcons[category] || categoryIcons.default}
            </div>
            <p className="text-2xl font-black gradient-text mb-1">{count}</p>
            <p className="text-gray-600 font-semibold text-sm">{category}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
