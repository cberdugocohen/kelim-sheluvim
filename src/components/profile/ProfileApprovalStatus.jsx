import React, { useState, useEffect } from 'react';
import { ProfileApproval } from '@/entities/ProfileApproval';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle, XCircle, Edit3, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ProfileApprovalStatus({ userId }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPendingRequests();
  }, [userId]);

  const loadPendingRequests = async () => {
    setIsLoading(true);
    try {
      const requests = await ProfileApproval.filter({ user_id: userId }, "-created_date");
      
      // סינון חכם: הצג רק את מה שרלוונטי למשתמשת
      const relevantRequests = requests.filter(req => {
        // תמיד הצג בקשות ממתינות או שדורשות שינויים
        if (req.status === 'pending' || req.status === 'needs_changes') {
          return true;
        }
        
        // בקשות שנדחו - הצג רק מ-7 הימים האחרונים
        if (req.status === 'rejected' && req.reviewed_at) {
          const reviewedDate = new Date(req.reviewed_at);
          const daysSinceReview = (Date.now() - reviewedDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceReview <= 7;
        }
        
        return false;
      });
      
      // הוסף רק את הבקשה האחרונה שאושרה (אם אין בקשות ממתינות/נדחות)
      const hasActiveRequests = relevantRequests.some(r => 
        r.status === 'pending' || r.status === 'needs_changes' || r.status === 'rejected'
      );
      
      if (!hasActiveRequests) {
        // אם אין בקשות פעילות, הצג את הבקשה האחרונה שאושרה מהשבועיים האחרונים
        const recentlyApproved = requests.find(req => {
          if (req.status === 'approved' && req.reviewed_at) {
            const reviewedDate = new Date(req.reviewed_at);
            const daysSinceReview = (Date.now() - reviewedDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceReview <= 14;
          }
          return false;
        });
        
        if (recentlyApproved) {
          relevantRequests.push(recentlyApproved);
        }
      }
      
      setPendingRequests(relevantRequests);
    } catch (error) {
      console.error("Error loading approval requests:", error);
    }
    setIsLoading(false);
  };

  const statusConfig = {
    pending: {
      label: "ממתין לאישור",
      icon: Clock,
      color: "bg-amber-100 text-amber-800 border-amber-200",
      alertColor: "bg-amber-50 border-amber-200",
      textColor: "text-amber-700",
      timelineStep: 1,
      timelineLabel: "נשלח לאישור"
    },
    approved: {
      label: "אושר ✓",
      icon: CheckCircle,
      color: "bg-green-100 text-green-800 border-green-200",
      alertColor: "bg-green-50 border-green-200",
      textColor: "text-green-700",
      timelineStep: 3,
      timelineLabel: "אושר והופעל"
    },
    rejected: {
      label: "נדחה",
      icon: XCircle,
      color: "bg-red-100 text-red-800 border-red-200",
      alertColor: "bg-red-50 border-red-200",
      textColor: "text-red-700",
      timelineStep: 3,
      timelineLabel: "נדחה"
    },
    needs_changes: {
      label: "דרושים שינויים",
      icon: Edit3,
      color: "bg-blue-100 text-blue-800 border-blue-200",
      alertColor: "bg-blue-50 border-blue-200",
      textColor: "text-blue-700",
      timelineStep: 2,
      timelineLabel: "בבדיקה"
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-effect">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto mb-2" />
          <p className="text-sm text-slate-600">בודקת סטטוס בקשות...</p>
        </CardContent>
      </Card>
    );
  }

  if (pendingRequests.length === 0) {
    return null; // אין בקשות - לא מציגים כלום
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <Card className="glass-effect border-2 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-purple-800 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              סטטוס הבקשות שלך
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((request) => {
              const config = statusConfig[request.status];
              const StatusIcon = config.icon;
              
              return (
                <Alert key={request.id} className={`${config.alertColor} border`}>
                  <StatusIcon className={`h-4 w-4 ${config.textColor}`} />
                  <AlertDescription>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {/* Timeline Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            {[1, 2, 3].map((step) => {
                              const isActive = step <= config.timelineStep;
                              const isCurrent = step === config.timelineStep;
                              return (
                                <div key={step} className="flex flex-col items-center flex-1">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    isCurrent 
                                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white ring-4 ring-purple-200' 
                                      : isActive 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-slate-200 text-slate-400'
                                  }`}>
                                    {isActive ? (
                                      step === 3 && request.status === 'approved' ? '✓' : step
                                    ) : step}
                                  </div>
                                  <span className={`text-xs mt-1 ${isCurrent ? 'font-bold' : ''} ${isActive ? config.textColor : 'text-slate-400'}`}>
                                    {step === 1 ? 'נשלח' : step === 2 ? 'בבדיקה' : request.status === 'approved' ? 'אושר' : request.status === 'rejected' ? 'נדחה' : 'סיום'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="relative h-1 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(config.timelineStep / 3) * 100}%` }}
                              transition={{ duration: 0.5 }}
                              className={`h-full ${
                                request.status === 'approved' 
                                  ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                  : request.status === 'rejected'
                                    ? 'bg-gradient-to-r from-red-400 to-red-600'
                                    : 'bg-gradient-to-r from-purple-400 to-pink-500'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={config.color}>
                            {config.label}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {format(new Date(request.created_date), 'PPP', { locale: he })}
                          </span>
                        </div>
                        
                        <p className={`text-sm font-medium ${config.textColor} mb-1`}>
                          {request.type === 'new_profile' ? 'פרופיל חדש' : 'עדכון פרופיל'}
                        </p>
                        
                        {request.changes_summary && (
                          <p className="text-sm text-slate-600 mb-2">
                            {request.changes_summary}
                          </p>
                        )}

                        {request.status === 'pending' && (
                          <div className="mt-3 p-3 bg-amber-100 rounded-lg border border-amber-200">
                            <p className="text-sm text-amber-800 font-medium">
                              ⏳ הבקשה שלך נמצאת בתור לאישור
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              הנתונים שלך שמורים ולא נמחקו! המנהלת תבדוק בקרוב.
                            </p>
                          </div>
                        )}

                        {request.status === 'approved' && (
                          <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-200">
                            <p className="text-sm text-green-800 font-medium">
                              ✅ השינויים שלך אושרו והופעלו!
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              הפרופיל שלך מופיע כעת בכל האתר
                            </p>
                          </div>
                        )}

                        {request.status === 'needs_changes' && request.admin_feedback && (
                          <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-blue-800 mb-1">💬 משוב מהמנהלת:</p>
                            <p className="text-sm text-blue-700">{request.admin_feedback}</p>
                          </div>
                        )}

                        {request.status === 'rejected' && request.admin_feedback && (
                          <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-200">
                            <p className="text-sm font-medium text-red-800 mb-1">❌ סיבת הדחייה:</p>
                            <p className="text-sm text-red-700">{request.admin_feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
