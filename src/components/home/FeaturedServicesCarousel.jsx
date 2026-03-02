import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ServiceCard from "../ServiceCard";

export default function FeaturedServicesCarousel({ services, isLoading }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (services.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % Math.min(services.length, 6));
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [services]);

  if (isLoading || services.length === 0) return null;

  const displayServices = services.slice(0, 6);
  const visibleServices = [
    displayServices[currentIndex],
    displayServices[(currentIndex + 1) % displayServices.length],
    displayServices[(currentIndex + 2) % displayServices.length]
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-24"
    >
      <h2 className="text-4xl md:text-5xl font-black text-gray-800 text-center mb-12">
        ✨ שירותים מהקהילה
      </h2>
      
      <div className="relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatePresence mode="wait">
            {visibleServices.map((service, index) => (
              <motion.div
                key={service?.id || index}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {service && <ServiceCard service={service} />}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="flex justify-center gap-2 mt-8">
          {displayServices.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-purple-600 w-8' 
                  : 'bg-purple-200 hover:bg-purple-400'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
