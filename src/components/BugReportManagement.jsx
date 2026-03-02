import React, { useState, useEffect } from "react";
import { BugReport } from "@/entities/BugReport";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bug,
  Lightbulb,
  CheckCircle,
  XCircle,
  Clock,
  Heart,
  MessageSquare,
  Calendar,
  User as UserIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function BugReportManagement({ onUpdate }) {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const allReports = await BugReport.list("-created_date");
      
      // Enrich with user data
      const enrichedReports = await Promise.all(
        allReports.map(async (report) => {
          try {
            const users = await User.filter({ id: report.reporter_id });
            const user = users.length > 0 ? users[0] : null;
            return {
              ...report,
              reporter_name: user?.full_name || 'משתמש לא ידוע',
              reporter_email: user?.email || ''
            };
          } catch (error) {
            return {
              ...report,
              reporter_name: 'משתמש לא ידוע',
              reporter_email: ''
            };
          }
        })
      );
      
      setReports(enrichedReports);
    } catch (error) {
      console.error("Error loading bug reports:", error);
    }
    setIsLoading(false);
  };

  const handleStatusUpdate = async (reportId, status, response = "") => {
    setIsProcessing(true);
    try {
      const updateData = {
        status,
        admin_response: response,
        ...(status === 'resolved' && { resolved_date: new Date().toISOString() })
      };

      await BugReport.update(reportId, updateData);
      await loadReports();
      setSelectedReport(null);
      setAdminResponse("");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating bug report:", error);
    }
    setIsProcessing(false);
  };

  const handleLike = async (reportId) => {
    try {
      const currentUser = await User.me();
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      const isLiked = report.likes?.includes(currentUser.id);
      const newLikes = isLiked
        ? report.likes.filter(id => id !== currentUser.id)
        : [...(report.likes || []), currentUser.id];

      await BugReport.update(reportId, { likes: newLikes });
      await loadReports();
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === "all") return true;
    if (filter === "bugs") return report.type === "bug";
    if (filter === "features") return report.type === "feature_request";
    return report.status === filter;
  });

  const statusConfig = {
    pending: { label: "ממתין", color: "bg-amber-100 text-amber-800", icon: Clock },
    approved: { label: "אושר", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
    in_progress: { label: "בטיפול", color: "bg-purple-100 text-purple-800", icon: MessageSquare },
    resolved: { label: "נפתר", color: "bg-green-100 text-green-800", icon: CheckCircle },
    rejected: { label: "נדחה", color: "bg-red-100 text-red-800", icon: XCircle }
  };

  const priorityConfig = {
    low: { label: "נמוכה", color: "bg-slate-100 text-slate-800" },
    medium: { label: "בינונית", color: "bg-yellow-100 text-yellow-800" },
    high: { label: "גבוהה", color: "bg-orange-100 text-orange-800" },
    critical: { label: "קריטית", color: "bg-red-100 text-red-800" }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Bug className="w-7 h-7 text-red-500" />
            ניהול דיווחים ובקשות
          </h2>
          <p className="text-slate-600">טפלי בדיווחי באגים ובקשות לפיצ'רים חדשים</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["all", "bugs", "features", "pending", "approved", "in_progress", "resolved"].map(filterType => (
            <Button
              key={filterType}
              variant={filter === filterType ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filterType)}
              className={filter === filterType ? "bg-purple-600" : ""}
            >
              {filterType === "all" ? "הכל" :
               filterType === "bugs" ? "באגים" :
               filterType === "features" ? "פיצ'רים" :
               statusConfig[filterType]?.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {filteredReports.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bug className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">אין דיווחים</h3>
          <p className="text-slate-600">
            {filter === "pending" ? "אין דיווחים ממתינים לטיפול" : "אין דיווחים בסטטוס זה"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredReports.map((report, index) => {
              const statusCfg = statusConfig[report.status];
              const priorityCfg = priorityConfig[report.priority];
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white">
                            {report.type === 'bug' ? <Bug className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-lg text-slate-800">{report.title}</h4>
                              <Badge className={report.type === 'bug' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                                {report.type === 'bug' ? 'באג' : 'פיצ\'ר'}
                              </Badge>
                            </div>
                            <p className="text-slate-700 mb-3 leading-relaxed">{report.description}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                              <div className="flex items-center gap-1">
                                <UserIcon className="w-4 h-4" />
                                {report.reporter_name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(report.created_date), 'PPP', { locale: he })}
                              </div>
                            </div>
                            {report.admin_response && (
                              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                                <p className="text-blue-800 text-sm">
                                  <strong>תשובת מנהלת:</strong> {report.admin_response}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`${statusCfg.color} flex items-center gap-1`}>
                            <statusCfg.icon className="w-3 h-3" />
                            {statusCfg.label}
                          </Badge>
                          <Badge className={priorityCfg.color}>
                            {priorityCfg.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                            className="flex items-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            טפלי
                          </Button>
                          
                          {report.screenshot_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(report.screenshot_url, '_blank')}
                            >
                              צפי בתמונה
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(report.id)}
                            className="flex items-center gap-1 text-slate-500 hover:text-pink-500"
                          >
                            <Heart className="w-4 h-4" />
                            <span>{report.likes?.length || 0}</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Report Management Modal */}
      {selectedReport && (
        <Dialog open={true} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-red-600 flex items-center gap-2">
                {selectedReport.type === 'bug' ? <Bug className="w-6 h-6" /> : <Lightbulb className="w-6 h-6" />}
                טיפול ב{selectedReport.type === 'bug' ? 'באג' : 'בקשת פיצ\'ר'} - {selectedReport.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Report Details */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-bold text-slate-800 mb-3">פרטי הדיווח</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>מדווחת:</strong> {selectedReport.reporter_name} ({selectedReport.reporter_email})</div>
                  <div><strong>תאריך:</strong> {format(new Date(selectedReport.created_date), 'PPP', { locale: he })}</div>
                  <div><strong>סוג:</strong> {selectedReport.type === 'bug' ? 'באג' : 'בקשת פיצ\'ר'}</div>
                  <div><strong>עדיפות:</strong> {priorityConfig[selectedReport.priority]?.label}</div>
                  <div><strong>לייקים:</strong> {selectedReport.likes?.length || 0}</div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-xl p-4 border">
                <h4 className="font-bold text-slate-800 mb-3">תיאור הבעיה/הבקשה</h4>
                <p className="text-slate-700 leading-relaxed">{selectedReport.description}</p>
              </div>

              {/* Screenshot */}
              {selectedReport.screenshot_url && (
                <div className="bg-white rounded-xl p-4 border">
                  <h4 className="font-bold text-slate-800 mb-3">צילום מסך</h4>
                  <img
                    src={selectedReport.screenshot_url}
                    alt="צילום מסך של הבעיה"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}

              {/* Current Response */}
              {selectedReport.admin_response && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-bold text-blue-800 mb-3">התשובה הנוכחית</h4>
                  <p className="text-blue-700">{selectedReport.admin_response}</p>
                </div>
              )}

              {/* Admin Actions */}
              <div className="bg-slate-100 rounded-xl p-4">
                <h4 className="font-bold text-slate-800 mb-4">פעולות מנהלת</h4>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="admin-response">תשובה למשתמשת</Label>
                    <Textarea
                      id="admin-response"
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      className="mt-2"
                      placeholder="כתבי תשובה או עדכון לגבי הדיווח..."
                    />
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    {selectedReport.status === 'pending' && (
                      <Button
                        onClick={() => handleStatusUpdate(selectedReport.id, 'approved', adminResponse)}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        אשרי לטיפול
                      </Button>
                    )}

                    {(selectedReport.status === 'approved' || selectedReport.status === 'pending') && (
                      <Button
                        onClick={() => handleStatusUpdate(selectedReport.id, 'in_progress', adminResponse)}
                        disabled={isProcessing}
                        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        התחילי לטפל
                      </Button>
                    )}

                    {selectedReport.status === 'in_progress' && (
                      <Button
                        onClick={() => handleStatusUpdate(selectedReport.id, 'resolved', adminResponse)}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        סמני כנפתר
                      </Button>
                    )}

                    <Button
                      onClick={() => handleStatusUpdate(selectedReport.id, 'rejected', adminResponse)}
                      disabled={isProcessing}
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      דחי דיווח
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
