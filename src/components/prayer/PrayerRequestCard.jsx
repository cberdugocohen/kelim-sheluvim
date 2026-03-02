import React, { useState } from "react";
import { PrayerRequest } from "@/entities/PrayerRequest";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Heart,
  Calendar,
  User,
  Edit,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const requestTypeColors = {
  "רפואת הגוף והנפש": "bg-red-100 text-red-800 border-red-200",
  "זיווג הגון משורש השנה": "bg-pink-100 text-pink-800 border-pink-200",
  "חופה וקידושין עוד השנה": "bg-rose-100 text-rose-800 border-rose-200",
  "שלום בית": "bg-purple-100 text-purple-800 border-purple-200",
  "פרנסה": "bg-green-100 text-green-800 border-green-200",
  "הריון / לידה": "bg-blue-100 text-blue-800 border-blue-200",
  "שמירה / ילדים": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "הצלחה / לימודים": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "אחר": "bg-gray-100 text-gray-800 border-gray-200"
};

export default function PrayerRequestCard({ request, currentUser, onEdit, onDelete, onPrayerUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isOwner = currentUser && currentUser.id === request.requester_id;
  const isAdmin = currentUser && currentUser.role === 'admin';
  const canEdit = isOwner || isAdmin;

  const prayersFrom = request.prayers_from || [];
  const hasPrayed = currentUser && prayersFrom.includes(currentUser.id);
  const prayerCount = prayersFrom.length;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "d בMMMM yyyy", { locale: he });
    } catch {
      return dateString;
    }
  };

  const handlePrayerToggle = async () => {
    if (!currentUser || isUpdating) return;

    setIsUpdating(true);
    try {
      const newPrayersFrom = hasPrayed
        ? prayersFrom.filter(id => id !== currentUser.id)
        : [...prayersFrom, currentUser.id];

      await PrayerRequest.update(request.id, {
        prayers_from: newPrayersFrom
      });

      if (onPrayerUpdate) {
        onPrayerUpdate();
      }
    } catch (error) {
      console.error("Error updating prayer:", error);
    }
    setIsUpdating(false);
  };

  const requestTypes = Array.isArray(request.request_types) ? request.request_types : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-effect h-full hover:shadow-xl transition-all duration-300 border-2 border-white/50">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between mb-4 gap-2">
            <div className="flex flex-wrap gap-2 flex-1">
              {requestTypes.map((type, index) => (
                <Badge key={index} className={`${requestTypeColors[type] || requestTypeColors["אחר"]} border font-medium shadow-sm`}>
                  {type}
                </Badge>
              ))}
            </div>
            {canEdit && (
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(request)}
                  className="h-8 w-8 p-0 hover:bg-purple-100"
                >
                  <Edit className="w-4 h-4 text-purple-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(request.id)}
                  className="h-8 w-8 p-0 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex-grow space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <Heart className="w-6 h-6 text-white" fill="currentColor" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-800 leading-tight">
                  {request.name_for_prayer}
                </h3>
              </div>
            </div>

            {request.context_note && (
              <p className="text-sm text-slate-600 pr-15 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {request.context_note}
              </p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
            <button
              onClick={handlePrayerToggle}
              disabled={!currentUser || isUpdating}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                hasPrayed
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md hover:shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              } ${!currentUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Heart className={`w-5 h-5 ${hasPrayed ? 'fill-current' : ''}`} />
              <span>{hasPrayed ? 'התפללתי 💜' : 'לחצי כשהתפללת'}</span>
              {prayerCount > 0 && (
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {prayerCount}
                </Badge>
              )}
            </button>

            {request.valid_until && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                <span>תוקף עד: {formatDate(request.valid_until)}</span>
              </div>
            )}

            {request.requester_name && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <User className="w-4 h-4" />
                <span>נוספה על ידי: {request.requester_name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
