import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import OptimizedImage from '../OptimizedImage';
import { Heart } from 'lucide-react';

export default function GratitudePreviewCard({ gratitude, sender, recipient }) {
  if (!sender || !recipient) {
    return null; // Don't render if author data is missing
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.9 },
        visible: { opacity: 1, y: 0, scale: 1 },
      }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="h-full"
    >
      <Card className="glass-effect hover:bg-white/80 transition-colors duration-300 h-full flex flex-col">
        <CardContent className="p-6 flex-grow flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl(`UserProfile?userId=${sender.id}`)}>
              <OptimizedImage
                src={sender.profile_image}
                alt={sender.full_name}
                className="w-12 h-12 rounded-full shadow-md border-2 border-white"
                fallbackSrc={`https://ui-avatars.com/api/?name=${sender.full_name}&background=f472b6&color=fff&size=48`}
              />
            </Link>
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                <Link to={createPageUrl(`UserProfile?userId=${sender.id}`)} className="font-bold text-pink-600 hover:underline">
                  {sender.full_name}
                </Link>
                {' שלחה תודה ל-'}
                <Link to={createPageUrl(`UserProfile?userId=${recipient.id}`)} className="font-bold text-purple-600 hover:underline">
                  {recipient.full_name}
                </Link>
              </p>
            </div>
          </div>
          <blockquote className="text-center italic text-gray-800 text-lg my-4 p-4 bg-pink-50/50 border-r-4 border-pink-300 rounded-r-lg">
            "{gratitude.content}"
          </blockquote>
          <div className="flex justify-end items-center mt-4">
            <div className="flex items-center gap-2 text-pink-500">
              <Heart className="w-5 h-5 fill-current" />
              <span className="font-medium">{gratitude.heart_count || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
