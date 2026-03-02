import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

// Cache for loaded images
const imageCache = new Map();

export default function OptimizedImage({ 
  src, 
  alt, 
  className = "", 
  fallbackSrc = null,
  loading = "lazy",
  quality = 85,
  ...props 
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(loading !== "lazy");
  const imgRef = useRef();
  const [optimizedSrc, setOptimizedSrc] = useState('');

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading !== "lazy" || shouldLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '100px', // Start loading 100px before the image enters viewport
        threshold: 0.1 
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [loading, shouldLoad]);

  // Image optimization and caching
  useEffect(() => {
    if (!shouldLoad || !src) return;

    // Check cache first
    if (imageCache.has(src)) {
      setOptimizedSrc(imageCache.get(src));
      setImageLoaded(true);
      return;
    }

    const getOptimizedSrc = (originalSrc) => {
      if (!originalSrc) return fallbackSrc || '/placeholder-avatar.png';
      
      // If it's already WebP or data URL, return as-is
      if (originalSrc.includes('.webp') || originalSrc.includes('data:')) {
        return originalSrc;
      }
      
      // For Supabase storage URLs, add optimization
      if (originalSrc.includes('supabase.co/storage')) {
        const separator = originalSrc.includes('?') ? '&' : '?';
        return `${originalSrc}${separator}format=webp&quality=${quality}&resize=800x800`;
      }
      
      return originalSrc;
    };

    const optimized = getOptimizedSrc(src);
    setOptimizedSrc(optimized);

    // Pre-load image to cache
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, optimized);
      setImageLoaded(true);
    };
    img.onerror = () => {
      setImageError(true);
      setImageLoaded(true);
    };
    img.src = optimized;
  }, [src, shouldLoad, fallbackSrc, quality]);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton with improved shimmer */}
      {!imageLoaded && !imageError && shouldLoad && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_1.2s_ease-in-out_infinite]" />
        </div>
      )}
      
      {/* Placeholder for lazy loading */}
      {!shouldLoad && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
            <span className="text-slate-400 text-xs">📷</span>
          </div>
        </div>
      )}
      
      {/* Actual image */}
      {shouldLoad && (
        <motion.img
          src={imageError ? (fallbackSrc || '/placeholder-avatar.png') : optimizedSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoaded ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full h-full object-cover"
          {...props}
        />
      )}
      
      {/* Enhanced error state */}
      {shouldLoad && imageError && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-purple-500 font-bold text-lg">👤</span>
            </div>
            <span className="text-xs text-purple-600 font-medium">תמונה לא זמינה</span>
          </div>
        </div>
      )}

      {/* Enhanced shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
