import React, { useState, useEffect } from 'react';
import { Recommendation } from '@/entities/Recommendation';
import { Student } from '@/entities/Student';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, Quote, Loader2, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RecommendationsList({ serviceId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [recommenders, setRecommenders] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (serviceId) {
      loadRecommendations();
    }
  }, [serviceId]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      
      // Load recommendations
      const recs = await Recommendation.filter({ service_id: serviceId }, '-created_date');
      
      setRecommendations(recs);

      // Load recommender details
      if (recs.length > 0) {
        const recommenderIds = [...new Set(recs.map(r => r.recommender_id))];
        const recommendersData = {};

        for (const userId of recommenderIds) {
          try {
            const students = await Student.filter({ user_id: userId });
            if (students.length > 0) {
              recommendersData[userId] = {
                full_name: students[0].full_name || students[0].username || 'חברת קהילה',
                profile_image: students[0].profile_image
              };
            } else {
              recommendersData[userId] = {
                full_name: 'חברת קהילה',
                profile_image: null
              };
            }
          } catch (error) {
            console.warn(`Could not load recommender ${userId}:`, error);
            recommendersData[userId] = {
              full_name: 'חברת קהילה',
              profile_image: null
            };
          }
        }

        setRecommenders(recommendersData);
      }

    } catch (error) {
      console.error('❌ Error loading recommendations:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
        <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">עדיין אין המלצות על השירות הזה</p>
        <p className="text-slate-400 text-sm mt-1">היי הראשונה להמליץ! 💜</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
        <h3 className="text-lg font-bold text-slate-800">
          המלצות ({recommendations.length})
        </h3>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => {
          const recommender = recommenders[rec.recommender_id];
          
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={recommender?.profile_image} alt={recommender?.full_name} />
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {recommender?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-800 text-sm">
                          {recommender?.full_name || 'חברת קהילה'}
                        </p>
                        <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700 bg-yellow-50">
                          <Star className="w-3 h-3 ml-1" fill="currentColor" />
                          המליצה
                        </Badge>
                      </div>
                      
                      <div className="relative">
                        <Quote className="absolute -top-1 -right-1 w-4 h-4 text-purple-200" />
                        <p className="text-slate-600 text-sm leading-relaxed pr-4">
                          {rec.content}
                        </p>
                      </div>

                      {rec.created_date && (
                        <p className="text-xs text-slate-400 mt-2">
                          {new Date(rec.created_date).toLocaleDateString('he-IL')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
