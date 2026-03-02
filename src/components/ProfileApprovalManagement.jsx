import React, { useState, useEffect } from "react";
import { ProfileApproval } from "@/entities/ProfileApproval";
import { Student } from "@/entities/Student";
import { Notification } from "@/entities/Notification";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Check, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfileApprovalManagement() {
  const [approvals, setApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      const pendingApprovals = await ProfileApproval.filter({ status: 'pending' }, '-created_date');
      setApprovals(pendingApprovals);
    } catch (error) {
      console.error("Error loading approvals:", error);
    }
    setIsLoading(false);
  };

  const handleApprove = async (approval) => {
    setProcessingId(approval.id);
    try {
      
      // 🚨 CRITICAL CHECK: Validate proposed_data is not empty
      if (!approval.proposed_data || Object.keys(approval.proposed_data).length === 0) {
        console.error("❌ CRITICAL ERROR: proposed_data is empty or missing!");
        toast.error('❌ שגיאה קריטית: אין נתונים מוצעים לאישור. אנא צרי קשר עם התמיכה.');
        setProcessingId(null);
        return;
      }
      
      
      if (approval.proposed_data?.services) {
        approval.proposed_data.services.forEach((service, index) => {
          if (service.images && service.images.length > 0) {
            service.images.forEach((img, i) => {
            });
          } else {
          }
        });
      }

      if (approval.type === 'new_profile') {

        // Check if profile already exists for this user
        const existingProfiles = await Student.filter({ user_id: approval.user_id });
        if (existingProfiles.length > 0) {
          await Student.update(existingProfiles[0].id, approval.proposed_data);
        } else {
          await Student.create(approval.proposed_data);
        }
      } else {
        
        const existingProfileRes = await Student.filter({ id: approval.student_profile_id });
        
        if (existingProfileRes && existingProfileRes.length > 0) {
          const existingProfile = existingProfileRes[0];
          
          if (existingProfile.services && existingProfile.services.length > 0) {
            existingProfile.services.forEach((service, index) => {
            });
          } else {
          }
          
          // CRITICAL FIX: Create update object WITHOUT id/user_id/created_date
          const updateData = { ...approval.proposed_data };
          
          // Remove fields that should not be updated
          delete updateData.id;
          delete updateData.user_id;
          delete updateData.created_date;
          
          // EXTRA SAFETY: Explicitly ensure services array is taken from proposed_data
          if (Object.prototype.hasOwnProperty.call(approval.proposed_data, 'services')) {
            updateData.services = approval.proposed_data.services;
          }
          
          if (updateData.services && updateData.services.length > 0) {
            updateData.services.forEach((service, index) => {
              if (service.images && service.images.length > 0) {
                service.images.forEach((img, i) => {
                });
              } else {
              }
            });
          } else {
          }
          
          
          await Student.update(approval.student_profile_id, updateData);
        } else {
          console.warn("⚠️ Existing profile not found, using proposed data only");
          await Student.update(approval.student_profile_id, approval.proposed_data);
        }
        
        const updatedProfile = await Student.filter({ id: approval.student_profile_id });
        if (updatedProfile && updatedProfile.length > 0) {
          const profile = updatedProfile[0];
          if (profile.services) {
            profile.services.forEach((s, i) => {
              if (s.images && s.images.length > 0) {
                s.images.forEach((img, idx) => {
                });
              } else {
              }
            });
          } else {
          }
        }
      }

      await ProfileApproval.update(approval.id, {
        status: 'approved',
        reviewed_by: 'admin',
        reviewed_at: new Date().toISOString()
      });

      await Notification.create({
        user_id: approval.user_id,
        title: '🎉 הפרופיל שלך אושר והופעל!',
        message: 'מזל טוב! הפרופיל המעודכן שלך כולל כל השירותים והתמונות כעת מוצג באתר. לחצי כאן כדי לצפות בפרופיל שלך. (אם אתם רואים פרופיל ריק - רעננו את הדף)',
        type: 'profile_updated',
        action_url: createPageUrl('Profile'),
        icon: '✅',
        priority: 'high'
      });

      loadApprovals();
    } catch (error) {
      console.error("========== APPROVAL FAILED ==========");
      console.error("Error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      toast.error('שגיאה באישור הפרופיל: ' + error.message);
    }
    setProcessingId(null);
  };

  const handleReject = async (approval) => {
    const feedback = prompt('אנא הזיני סיבה לדחיית הבקשה:');
    if (!feedback) return;

    setProcessingId(approval.id);
    try {
      await ProfileApproval.update(approval.id, {
        status: 'rejected',
        admin_feedback: feedback,
        reviewed_by: 'admin',
        reviewed_at: new Date().toISOString()
      });

      await Notification.create({
        user_id: approval.user_id,
        title: '❌ עדכון הפרופיל נדחה',
        message: `הבקשה שלך לעדכון הפרופיל נדחתה. סיבה: ${feedback}\n\nניתן לערוך את הפרטים ולשלוח שוב לאישור.`,
        type: 'system',
        action_url: createPageUrl('Profile'),
        icon: '❌',
        priority: 'high'
      });

      loadApprovals();
    } catch (error) {
      console.error("Error rejecting profile:", error);
      toast.error('שגיאה בדחיית הבקשה');
    }
    setProcessingId(null);
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען בקשות...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <UserCheck className="w-5 h-5" />
          ניהול בקשות לעדכון פרופיל ({approvals.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {approvals.length === 0 ? (
          <p className="text-center text-slate-500">אין בקשות ממתינות</p>
        ) : (
          approvals.map((approval) => (
            <div key={approval.id} className="border rounded-lg p-4 space-y-4" dir="rtl">
              <div className="flex justify-between items-start">
                <div className="text-right">
                  <h3 className="font-bold text-lg">
                    {approval.type === 'new_profile' ? 'פרופיל חדש' : 'עדכון פרופיל'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    משתמשת: {approval.proposed_data?.username || 'לא ידוע'}
                  </p>
                  <p className="text-sm text-slate-600">
                    נשלח: {new Date(approval.created_date).toLocaleDateString('he-IL')}
                  </p>
                </div>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  ממתין לאישור
                </Badge>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-slate-800 text-right">שינויים מבוקשים:</h4>
                
                {approval.proposed_data?.username && (
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-600">שם להצגה: </span>
                    <span className="text-slate-800">{approval.proposed_data.username}</span>
                  </div>
                )}

                {approval.proposed_data?.city && (
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-600">עיר: </span>
                    <span className="text-slate-800">{approval.proposed_data.city}</span>
                  </div>
                )}

                {approval.proposed_data?.description && (
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-600">תיאור: </span>
                    <p className="text-slate-800 mt-1">{approval.proposed_data.description}</p>
                  </div>
                )}

                {approval.proposed_data?.profile_image && (
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-600 block mb-2">תמונת פרופיל חדשה:</span>
                    <img 
                      src={approval.proposed_data.profile_image} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-lg object-cover border-2 border-purple-200"
                    />
                  </div>
                )}

                {approval.proposed_data?.additional_images && approval.proposed_data.additional_images.length > 0 && (
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-600 block mb-2">
                      תמונות נוספות ({approval.proposed_data.additional_images.length}):
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {approval.proposed_data.additional_images.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt={`Additional ${idx + 1}`} 
                          className="w-20 h-20 rounded-lg object-cover border"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {approval.proposed_data?.services && approval.proposed_data.services.length > 0 && (
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-600 block mb-2">
                      שירותים ({approval.proposed_data.services.length}):
                    </span>
                    <div className="space-y-3">
                      {approval.proposed_data.services.map((service, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border-2 border-purple-200">
                          <div className="mb-3">
                            <h5 className="font-bold text-lg text-slate-800 mb-2 text-right">{service.title}</h5>
                            
                            <div className="bg-slate-50 p-3 rounded-lg mb-3">
                              <p className="text-sm font-medium text-slate-600 mb-1 text-right">תיאור:</p>
                              <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-right">{service.description}</p>
                            </div>
                            
                            {service.images && service.images.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-slate-600 mb-2 text-right">
                                  תמונות ({service.images.length}):
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                  {service.images.map((img, imgIdx) => (
                                    <a 
                                      key={imgIdx}
                                      href={img}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group relative"
                                    >
                                      <img 
                                        src={img} 
                                        alt={`${service.title} ${imgIdx + 1}`} 
                                        className="w-24 h-24 rounded object-cover border-2 border-purple-300 hover:border-purple-500 transition-colors cursor-pointer"
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded transition-opacity flex items-center justify-center">
                                        <span className="text-white text-xs opacity-0 group-hover:opacity-100">🔍 הגדל</span>
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex gap-2 flex-wrap justify-end">
                              <Badge variant="outline" className="text-xs">
                                {service.type === 'gift' ? '💝 מתנה' : 
                                 service.type === 'paid' ? '💰 בתשלום' : 
                                 '🔄 חליפין'}
                              </Badge>
                              {service.category && (
                                <Badge variant="outline" className="text-xs bg-purple-50">
                                  📂 {service.category}
                                </Badge>
                              )}
                              {service.price_range && (
                                <Badge variant="outline" className="text-xs bg-green-50">
                                  💵 {service.price_range}
                                </Badge>
                              )}
                              {service.geographic_area && (
                                <Badge variant="outline" className="text-xs bg-blue-50">
                                  📍 {service.geographic_area}
                                </Badge>
                              )}
                              {service.images && service.images.length > 0 && (
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                  ✅ {service.images.length} תמונות
                                </Badge>
                              )}
                              {!service.images || service.images.length === 0 && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">
                                  ⚠️ אין תמונות
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {approval.proposed_data?.contact_info && (
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-600 block mb-1">פרטי קשר:</span>
                    <div className="text-sm text-slate-700 space-y-1">
                      {approval.proposed_data.contact_info.phone && (
                        <div>טלפון: {approval.proposed_data.contact_info.phone}</div>
                      )}
                      {approval.proposed_data.contact_info.email && (
                        <div>אימייל: {approval.proposed_data.contact_info.email}</div>
                      )}
                      {approval.proposed_data.contact_info.website && (
                        <div>אתר: {approval.proposed_data.contact_info.website}</div>
                      )}
                      {approval.proposed_data.contact_info.instagram && (
                        <div>אינסטגרם: @{approval.proposed_data.contact_info.instagram}</div>
                      )}
                    </div>
                  </div>
                )}

                {approval.changes_summary && (
                  <div className="text-sm text-slate-600 italic pt-2 border-t text-right">
                    {approval.changes_summary}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleApprove(approval)}
                  disabled={processingId === approval.id}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processingId === approval.id ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      מאשר...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 ml-2" />
                      אשר עדכון
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleReject(approval)}
                  disabled={processingId === approval.id}
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="w-4 h-4 ml-2" />
                  דחה
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
