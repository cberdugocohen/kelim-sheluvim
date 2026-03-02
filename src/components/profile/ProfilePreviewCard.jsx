import React from 'react';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Gift, DollarSign, MapPin, ArrowUpDown } from 'lucide-react';
import OptimizedImage from '../OptimizedImage';

export default function ProfilePreviewCard({ 
    provider_id,
    provider_name,
    provider_image,
    description,
    city,
    service_areas,
    contribution_details
}) {
  const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(provider_name || 'User')}&background=8b5cf6&color=fff&size=128`;

  return (
    <motion.div 
      className="h-full"
      whileHover={{ y: -5, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={createPageUrl(`UserProfile?userId=${provider_id}`)} className="h-full block">
        <Card className="glass-effect hover:bg-white/80 transition-colors duration-300 h-full flex flex-col">
          <CardContent className="p-6 flex-grow flex flex-col text-center">
            <div className="mb-4">
              <OptimizedImage
                src={provider_image}
                alt={provider_name || 'חברת קהילה'}
                className="w-24 h-24 rounded-full mx-auto shadow-lg border-4 border-white"
                fallbackSrc={fallbackImage}
              />
            </div>
            
            <CardTitle className="text-xl font-bold text-slate-800">{provider_name || 'חברת קהילה'}</CardTitle>
            
            {city && (
              <div className="flex items-center justify-center gap-1 text-sm text-slate-500 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{city}</span>
              </div>
            )}

            {description && (
              <CardDescription className="mt-3 text-slate-600 line-clamp-3 flex-grow min-h-[60px]">
                {description}
              </CardDescription>
            )}

            <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-3">
              {service_areas && service_areas.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {service_areas.slice(0, 3).map((area, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        {area}
                      </Badge>
                    ))}
                  </div>
              )}
              
              {contribution_details && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {contribution_details.gift?.active && (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                      <Gift className="w-3 h-3 ml-1" />
                      נותנת מהלב
                    </Badge>
                  )}
                  {contribution_details.paid?.active && (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      <DollarSign className="w-3 h-3 ml-1" />
                      שירות בתשלום
                    </Badge>
                  )}
                  {contribution_details.barter?.active && (
                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                      <ArrowUpDown className="w-3 h-3 ml-1" />
                      פתוחה לחליפין
                    </Badge>
                  )}
                </div>
              )}
            </div>

          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
