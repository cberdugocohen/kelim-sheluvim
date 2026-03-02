import React, { useState, useEffect } from "react";
import { SpotlightRequest } from "@/entities/SpotlightRequest";
import { Student } from "@/entities/Student";
import { UploadFile } from "@/integrations/Core";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Star,
  Crown,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User as UserIcon,
  MessageSquare,
  Pencil,
  AlertCircle,
  RefreshCw,
  Loader2,
  X,
  Edit,
  Save,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import { he } from "date-fns/locale";
import { apiCallWithRetry } from '@/utils/apiRetry';
import toast from "react-hot-toast";



export default function SpotlightManagement({ onUpdate }) {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null); // Used for expanding details in the list
  const [spotlightToSelect, setSpotlightToSelect] = useState(null); // Used for the "Select Spotlight" dialog
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [adminFeedback, setAdminFeedback] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // Changed from 'filter' to 'statusFilter'
  const [currentSpotlight, setCurrentSpotlight] = useState(null);
  const [networkError, setNetworkError] = useState(null);
  
  // State for editing spotlight
  const [isEditingSpotlight, setIsEditingSpotlight] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setNetworkError(null);
    
    try {
      await loadCurrentSpotlight();
      await loadRequests();
    } catch (error) {
      console.error("Error loading spotlight data:", error);
      if (error.message?.includes('Network Error')) {
        setNetworkError('בעיה בחיבור לאינטרנט. אנא בדקי את החיבור ונסי שוב.');
      } else {
        setNetworkError('שגיאה בטעינת הנתונים. נסי שוב.');
      }
    }
    
    setIsLoading(false);
  };

  const loadCurrentSpotlight = async () => {
    try {
      const selectedSpotlights = await apiCallWithRetry(() => 
        SpotlightRequest.filter({ status: 'selected' }, "-created_date", 1)
      );
      
      if (selectedSpotlights.length > 0) {
        setCurrentSpotlight(selectedSpotlights[0]);
      } else {
        setCurrentSpotlight(null);
      }
    } catch (error) {
      console.error("Error loading current spotlight:", error);
      throw error;
    }
  };

  const loadRequests = async () => {
    try {
      const allRequests = await apiCallWithRetry(() => 
        SpotlightRequest.list("-created_date", 100)
      );
      setRequests(allRequests);
    } catch (error) {
      console.error("Error loading requests:", error);
      throw error;
    }
  };

  const handleEditSpotlight = (spotlight) => {
    setEditFormData({
      personal_story: spotlight.personal_story || '',
      business_description: spotlight.business_description || '',
      what_i_offer: spotlight.what_i_offer || '',
      tagline: spotlight.tagline || '',
      images: spotlight.images || [],
      video_url: spotlight.video_url || '',
      contact_preference: spotlight.contact_preference || ''
    });
    setSelectedRequest(spotlight); // Still store for context in dialog, not for expansion
    setIsEditingSpotlight(true);
  };

  // This is the updated handleImageUpload for a single file, used in the edit dialog
  const handleImageUpload = async (file) => {
    if (!file) return;

    if ((editFormData.images?.length || 0) >= 5) {
      toast.success(`ניתן להעלות עד 5 תמונות. כרגע יש ${editFormData.images?.length || 0} תמונות.`);
      return;
    }

    setIsUploadingImage(true);
    try {
      const { file_url } = await apiCallWithRetry(() => UploadFile({ file }));
      setEditFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), file_url]
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("שגיאה בהעלאת התמונה");
    }
    setIsUploadingImage(false);
  };

  const removeImage = (indexToRemove) => {
    setEditFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSaveEdit = async () => {
    if (!selectedRequest) return; // selectedRequest here is the original request object for context
    
    setIsProcessing(true);
    try {
      await apiCallWithRetry(() => 
        SpotlightRequest.update(selectedRequest.id, editFormData)
      );
      
      // אם זו הכוכבת הנוכחית או שהסטטוס היה 'נבחר' בעבר, גם עדכן את תמונת הפרופיל של Student
      if (selectedRequest.status === 'selected' && editFormData.images && editFormData.images.length > 0) {
        try {
          const students = await apiCallWithRetry(() => Student.filter({ user_id: selectedRequest.user_id }));
          if (students.length > 0) {
            await apiCallWithRetry(() => Student.update(students[0].id, {
              profile_image: editFormData.images[0] // השתמש בתמונה הראשונה כתמונת פרופיל
            }));
          }
        } catch (error) {
          console.warn("⚠️ Could not update student profile image:", error);
        }
      }
      
      await loadCurrentSpotlight();
      await loadRequests();
      setIsEditingSpotlight(false);
      setSelectedRequest(null); // Clear selected request after saving
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error saving spotlight edit:", error);
      toast.error("שגיאה בשמירת העריכה");
    }
    setIsProcessing(false);
  };

  const handleRemoveCurrentSpotlight = async () => {
    if (!currentSpotlight) return;
    if (!confirm("האם את בטוחה שברצונך להסיר את הכוכבת הנוכחית?")) return;

    setIsProcessing(true);
    try {
      await apiCallWithRetry(() => 
        SpotlightRequest.update(currentSpotlight.id, { status: 'archived' })
      );
      await loadCurrentSpotlight();
      await loadRequests();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error removing spotlight:", error);
      toast.error("שגיאה בהסרת כוכבת השבוע");
    }
    setIsProcessing(false);
  };

  const handleStatusUpdate = async (requestId, newStatus, feedback = "") => {
    setIsProcessing(true);
    try {
      const updateData = { status: newStatus };
      
      if (newStatus === 'selected') {
        if (!selectedWeek) {
          toast.success("אנא בחרי שבוע לכוכבת");
          setIsProcessing(false);
          return;
        }
        updateData.selected_week = selectedWeek;
        
        // Archive current spotlight if exists
        if (currentSpotlight) {
          await apiCallWithRetry(() => 
            SpotlightRequest.update(currentSpotlight.id, { status: 'archived' })
          );
        }
        
        // עדכן את תמונת הפרופיל של Student עם התמונה הראשונה מהבקשה
        const requestToSelect = requests.find(r => r.id === requestId);
        if (requestToSelect && requestToSelect.images && requestToSelect.images.length > 0) {
          try {
            const students = await apiCallWithRetry(() => Student.filter({ user_id: requestToSelect.user_id }));
            if (students.length > 0) {
              await apiCallWithRetry(() => Student.update(students[0].id, {
                profile_image: requestToSelect.images[0]
              }));
            }
          } catch (error) {
            console.warn("⚠️ Could not update student profile image:", error);
          }
        }
      }
      
      if (feedback) {
        updateData.admin_feedback = feedback;
      }
      
      await apiCallWithRetry(() => 
        SpotlightRequest.update(requestId, updateData)
      );
      
      await loadCurrentSpotlight();
      await loadRequests();
      setSpotlightToSelect(null); // Clear selected spotlight for dialog
      setSelectedRequest(null); // Clear any expanded view
      setSelectedWeek("");
      setAdminFeedback("");
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating request status:", error);
      toast.error("שגיאה בעדכון הסטטוס");
    }
    setIsProcessing(false);
  };

  const filteredRequests = requests.filter(request => {
    if (statusFilter === "all") return true;
    return request.status === statusFilter;
  });

  // Updated statusConfig to use 'badgeClass' as in the outline
  const statusConfig = {
    pending: { label: "ממתין", badgeClass: "bg-amber-100 text-amber-800", icon: Clock },
    selected: { label: "נבחר", badgeClass: "bg-purple-100 text-purple-800", icon: Star },
    archived: { label: "בארכיון", badgeClass: "bg-slate-100 text-slate-800", icon: UserIcon },
    needs_updates: { label: "דרושים עדכונים", badgeClass: "bg-blue-100 text-blue-800", icon: MessageSquare }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (networkError) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">שגיאה בטעינה</h3>
          <p className="text-slate-600 mb-6">{networkError}</p>
          <Button onClick={loadData} className="bg-purple-600 hover:bg-purple-700">
            <RefreshCw className="w-4 h-4 ml-2" />
            נסי שוב
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Crown className="w-7 h-7 text-yellow-500" />
            ניהול כוכבת השבוע
          </h2>
          <p className="text-slate-600">נהלי את הכוכבת הנוכחית ובחרי כוכבות עתידיות</p>
        </div>
      </motion.div>

      {/* Current Spotlight Section */}
      <Card className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-200">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            כוכבת השבוע הנוכחית
          </h3>
          
          {currentSpotlight ? (
            <div className="bg-white/70 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-slate-800 mb-2">
                    {currentSpotlight.tagline || 'ללא כותרת'}
                  </h4>
                  <p className="text-slate-600 mb-4 line-clamp-3">
                    {currentSpotlight.personal_story}
                  </p>
                  {currentSpotlight.selected_week && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Calendar className="w-3 h-3 ml-1" />
                      {format(new Date(currentSpotlight.selected_week), 'PPP', { locale: he })}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSpotlight(currentSpotlight)}
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveCurrentSpotlight}
                    disabled={isProcessing}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/70 rounded-xl p-8 text-center text-slate-600">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p>אין כוכבת שבוע נוכחית</p>
              <p className="text-sm">בחרי מועמדת מהרשימה למטה</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <h3 className="text-xl font-bold text-slate-800">בקשות לכוכבת השבוע</h3>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="סנן לפי סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הבקשות ({requests.length})</SelectItem>
                {Object.entries(statusConfig).map(([status, config]) => {
                  const count = requests.filter(r => r.status === status).length;
                  return (
                    <SelectItem key={status} value={status}>
                      {config.label} ({count})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">אין בקשות להצגה בסטטוס זה</p>
              </div>
            ) : (
              filteredRequests.map((request) => {
                const config = statusConfig[request.status] || statusConfig.pending;
                return (
                  <Card key={request.id} className="bg-white hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-slate-800">
                            {request.tagline || 'ללא כותרת'}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {format(new Date(request.created_date), 'PPP', { locale: he })}
                          </p>
                        </div>
                        <Badge className={config.badgeClass}>
                          <config.icon className="w-3 h-3 ml-1" />
                          {config.label}
                        </Badge>
                      </div>

                      <p className="text-slate-600 mb-4 line-clamp-2">
                        {request.personal_story || 'אין סיפור אישי'}
                      </p>

                      {/* תמונות - הצגה משופרת */}
                      {request.images && request.images.length > 0 && (
                        <div className="flex gap-2 mb-4 flex-wrap">
                          {request.images.map((img, idx) => (
                            <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border-2 border-slate-200">
                              <img 
                                src={img} 
                                alt={`תמונה ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=Image&background=e2e8f0&color=64748b&size=64`;
                                  e.target.alt = "תמונה שבורה";
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          // Toggle selectedRequest for expanding details
                          onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                        >
                          {selectedRequest?.id === request.id ? 'סגור פרטים' : 'פרטים נוספים'}
                        </Button>

                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSpotlightToSelect(request); // Set request to be selected
                                setSelectedWeek(format(addDays(new Date(), 7), 'yyyy-MM-dd')); // Suggest next week
                              }}
                            >
                              <CheckCircle className="w-4 h-4 ml-1" />
                              אשר
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-600 border-orange-300"
                              onClick={() => {
                                // This action doesn't open the main selection dialog, but implies a prompt later
                                setSelectedRequest(request); // Expand to show feedback option
                                setAdminFeedback(""); // Clear previous feedback
                              }}
                            >
                              בקש עדכונים
                            </Button>
                          </>
                        )}

                        {request.status === 'needs_updates' && (
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => {
                                setSpotlightToSelect(request); // Set request to be selected
                                setSelectedWeek(format(addDays(new Date(), 7), 'yyyy-MM-dd')); // Suggest next week
                            }}
                          >
                            החזר לבחירה
                          </Button>
                        )}
                        
                        {/* Always show edit for any status, if it's not the current spotlight being edited */}
                        {!(isEditingSpotlight && selectedRequest?.id === request.id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditSpotlight(request)} // Pass full request object
                          >
                            <Edit className="w-4 h-4 ml-1" />
                            ערוך
                          </Button>
                        )}
                        {/* FIXED: Now navigates to SpotlightProfile instead of UserProfile */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = createPageUrl(`SpotlightProfile?userId=${request.user_id}`);
                            window.open(url, '_blank');
                          }}
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          תצוגה מקדימה
                        </Button>
                      </div>

                      {/* הצגת פרטים מלאים - EXPANDED VIEW */}
                      <AnimatePresence>
                      {selectedRequest?.id === request.id && !isEditingSpotlight && ( // Ensure it's the selected request and not editing
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-6 pt-6 border-t space-y-4"
                        >
                          {request.personal_story && (
                            <div>
                              <h5 className="font-bold text-slate-700 mb-2">הסיפור האישי:</h5>
                              <p className="text-slate-600 whitespace-pre-wrap">{request.personal_story}</p>
                            </div>
                          )}

                          {request.business_description && (
                            <div>
                              <h5 className="font-bold text-slate-700 mb-2">על העסק:</h5>
                              <p className="text-slate-600 whitespace-pre-wrap">{request.business_description}</p>
                            </div>
                          )}

                          {request.what_i_offer && (
                            <div>
                              <h5 className="font-bold text-slate-700 mb-2">מה אני מציעה:</h5>
                              <p className="text-slate-600 whitespace-pre-wrap">{request.what_i_offer}</p>
                            </div>
                          )}

                          {request.contact_preference && (
                            <div>
                              <h5 className="font-bold text-slate-700 mb-2">העדפת קשר:</h5>
                              <p className="text-slate-600">{request.contact_preference}</p>
                            </div>
                          )}

                          {request.video_url && (
                            <div>
                              <h5 className="font-bold text-slate-700 mb-2">קישור לסרטון:</h5>
                              <a href={request.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                {request.video_url}
                              </a>
                            </div>
                          )}
                           {request.admin_feedback && (
                            <Alert className="bg-slate-50 border-slate-200">
                                <AlertCircle className="h-4 w-4 text-slate-600" />
                                <AlertDescription>
                                    <p className="font-semibold text-slate-800 mb-1">משוב מהמנהלת:</p>
                                    <p className="text-slate-700">{request.admin_feedback}</p>
                                </AlertDescription>
                            </Alert>
                           )}

                          {/* Conditional buttons for status update within expanded view */}
                          {request.status === 'pending' && (
                            <div className="space-y-3 pt-4 border-t">
                              <Label htmlFor={`select-week-${request.id}`}>בחר שבוע להצגה:</Label>
                              <Input
                                id={`select-week-${request.id}`}
                                type="date"
                                value={selectedWeek}
                                onChange={(e) => setSelectedWeek(e.target.value)}
                                min={format(new Date(), 'yyyy-MM-dd')}
                                className="max-w-xs"
                              />
                              
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleStatusUpdate(request.id, 'selected')}
                                  disabled={!selectedWeek || isProcessing}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Star className="w-4 h-4 ml-1" />}
                                  בחר ככוכבת השבוע
                                </Button>

                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    const feedback = prompt("אנא הכניסי משוב עבור 'דרושים עדכונים':");
                                    if (feedback) {
                                      handleStatusUpdate(request.id, 'needs_updates', feedback);
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                >
                                  <MessageSquare className="w-4 h-4 ml-1"/>
                                  בקש עדכונים
                                </Button>
                              </div>
                            </div>
                          )}

                          {request.status === 'needs_updates' && (
                            <div className="space-y-3 pt-4 border-t">
                              <Label htmlFor={`select-week-needs-updates-${request.id}`}>בחר שבוע להצגה:</Label>
                              <Input
                                id={`select-week-needs-updates-${request.id}`}
                                type="date"
                                value={selectedWeek}
                                onChange={(e) => setSelectedWeek(e.target.value)}
                                min={format(new Date(), 'yyyy-MM-dd')}
                                className="max-w-xs"
                              />
                              
                              <Button
                                onClick={() => handleStatusUpdate(request.id, 'selected')}
                                disabled={!selectedWeek || isProcessing}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <CheckCircle className="w-4 h-4 ml-1" />}
                                החזר לבחירה ואשר
                              </Button>
                            </div>
                          )}
                          {/* If status is selected or archived, offer to move to archived for selected */}
                          {(request.status === 'selected' || request.status === 'archived') && (request.id !== currentSpotlight?.id) && (
                            <div className="pt-4 border-t">
                              <Button
                                onClick={() => handleStatusUpdate(request.id, 'archived')}
                                variant="outline"
                                size="sm"
                                disabled={isProcessing}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 ml-1" />
                                העבר לארכיון
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Select Spotlight Dialog */}
      <Dialog open={spotlightToSelect !== null} onOpenChange={() => { setSpotlightToSelect(null); setSelectedWeek(""); }}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>בחירת כוכבת השבוע</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>שבוע התצוגה</Label>
              <Input
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleStatusUpdate(spotlightToSelect?.id, 'selected')}
                disabled={!selectedWeek || isProcessing}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 ml-1" />}
                אשרי כוכבת
              </Button>
              <Button
                onClick={() => { setSpotlightToSelect(null); setSelectedWeek(""); }}
                variant="outline"
                className="flex-1"
              >
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Spotlight Dialog */}
      <Dialog open={isEditingSpotlight && selectedRequest !== null} onOpenChange={() => setIsEditingSpotlight(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת פרטי כוכבת השבוע</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="tagline">משפט קצר / כותרת (עד 50 תווים)</Label>
              <Input
                id="tagline"
                value={editFormData.tagline || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, tagline: e.target.value }))}
                placeholder="משפט קצר שמתאר את העסק או השירות"
                maxLength={50}
              />
              <p className="text-xs text-slate-500 mt-1 text-left">{editFormData.tagline?.length || 0}/50</p>
            </div>

            <div>
              <Label htmlFor="personal_story">הסיפור האישי (עד 800 תווים)</Label>
              <Textarea
                id="personal_story"
                value={editFormData.personal_story || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, personal_story: e.target.value }))}
                placeholder="הסיפור האישי - איך הלימוד השפיע עליך"
                className="min-h-[120px]"
                maxLength={800}
              />
              <p className="text-xs text-slate-500 mt-1 text-left">{editFormData.personal_story?.length || 0}/800</p>
            </div>

            <div>
              <Label htmlFor="business_description">תיאור העסק (עד 600 תווים)</Label>
              <Textarea
                id="business_description"
                value={editFormData.business_description || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, business_description: e.target.value }))}
                placeholder="תיאור העסק והשירותים שאת מציעה"
                className="min-h-[100px]"
                maxLength={600}
              />
              <p className="text-xs text-slate-500 mt-1 text-left">{editFormData.business_description?.length || 0}/600</p>
            </div>

            <div>
              <Label htmlFor="what_i_offer">מה את מציעה לקהילה (עד 400 תווים)</Label>
              <Textarea
                id="what_i_offer"
                value={editFormData.what_i_offer || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, what_i_offer: e.target.value }))}
                placeholder="מה בדיוק את מציעה לקהילה"
                className="min-h-[80px]"
                maxLength={400}
              />
              <p className="text-xs text-slate-500 mt-1 text-left">{editFormData.what_i_offer?.length || 0}/400</p>
            </div>

            <div>
              <Label htmlFor="video_url">קישור לסרטון (YouTube)</Label>
              <Input
                id="video_url"
                value={editFormData.video_url || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, video_url: e.target.value }))}
                placeholder="https://youtube.com/..."
                type="url"
              />
            </div>

            <div>
              <Label>תמונות (עד 5)</Label>
              <div className="space-y-3">
                {editFormData.images && editFormData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {editFormData.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img 
                          src={img} 
                          alt={`תמונה ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=Image&background=e2e8f0&color=64748b&size=128`;
                            e.target.alt = "תמונה שבורה";
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity p-0 h-6 w-6"
                          onClick={() => removeImage(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {(!editFormData.images || editFormData.images.length < 5) && (
                  <div>
                    <input
                      type="file"
                      id="spotlight-images-edit"
                      accept="image/*"
                      multiple={false}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageUpload(e.target.files[0]);
                          e.target.value = null; // Clear input value so same file can be selected again
                        }
                      }}
                      disabled={isUploadingImage}
                    />
                    <label htmlFor="spotlight-images-edit">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={isUploadingImage}
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            מעלה תמונה...
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 ml-2" />
                            העלי תמונה ({editFormData.images?.length || 0}/5)
                          </>
                        )}
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="contact_preference">איך ליצור קשר</Label>
              <Input
                id="contact_preference"
                value={editFormData.contact_preference || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, contact_preference: e.target.value }))}
                placeholder="טלפון / וואטסאפ / אימייל"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingSpotlight(false)} disabled={isProcessing || isUploadingImage}>
              ביטול
            </Button>
            <Button onClick={handleSaveEdit} disabled={isProcessing || isUploadingImage} className="bg-purple-600 hover:bg-purple-700">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
              שמרי שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
