import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Student } from "@/entities/Student";
import { ProfileApproval } from "@/entities/ProfileApproval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  User as UserIcon,
  Save,
  Phone,
  AlertCircle,
  CheckCircle,
  Loader2,
  Camera,
  Briefcase,
  RefreshCw
} from "lucide-react";

import ErrorBoundary from "../components/ErrorBoundary";
import CityAutocomplete from "../components/CityAutocomplete";
import ImageUploader from "../components/profile/ImageUploader";
import ServicesManager from "../components/profile/ServicesManager";
import SpotlightRequestModal from "../components/SpotlightRequestModal";
import ProfileApprovalStatus from "../components/profile/ProfileApprovalStatus";
import { apiCallWithRetry } from "@/utils/apiRetry";

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSpotlightModalOpen, setIsSpotlightModalOpen] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    city: "",
    description: "",
    profile_image: "",
    services: [],
    contact_info: {
      phone: "",
      email: "",
      website: "",
      instagram: "",
      other: ""
    },
  });

  useEffect(() => {
    loadUserAndProfile();
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (!isLoading && currentUser) {
      const saveTimer = setTimeout(() => {
        try {
          localStorage.setItem('profile_draft', JSON.stringify(formData));
        } catch (error) {
          console.warn('Failed to save draft:', error);
        }
      }, 2000);
      
      return () => clearTimeout(saveTimer);
    }
  }, [formData, isLoading, currentUser]);

  // Track unsaved changes
  useEffect(() => {
    if (initialFormData && !isLoading) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, initialFormData, isLoading]);

  // Warning on page leave
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && !isSaving) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isSaving]);

  const loadUserAndProfile = async () => {
    setIsLoading(true);
    setNetworkError(false);

    try {
      if (!navigator.onLine) {
        throw new Error('אין חיבור לאינטרנט');
      }

      const user = await apiCallWithRetry(() => User.me());
      setCurrentUser(user);

      const students = await apiCallWithRetry(() => Student.filter({ user_id: user.id }));

      // ⚠️ Check for duplicate profiles and clean them automatically
      if (students.length > 1) {
        console.warn(`⚠️ Found ${students.length} duplicate profiles for user ${user.id}, cleaning...`);
        
        // Sort by most complete profile (most services + longest description)
        students.sort((a, b) => {
          const scoreA = (a.services?.length || 0) * 10 + (a.description?.length || 0);
          const scoreB = (b.services?.length || 0) * 10 + (b.description?.length || 0);
          return scoreB - scoreA;
        });

        const keepProfile = students[0];
        const deleteProfiles = students.slice(1);


        // Delete duplicates using correct syntax
        try {
          await Promise.all(deleteProfiles.map(p => 
            apiCallWithRetry(() => Student.delete(p.id))
          ));
          
          toast.success('🧹 פרופילים כפולים נוקו אוטומטית', {
            duration: 4000,
            icon: '✨',
          });
        } catch (err) {
          console.error('❌ Error deleting duplicates:', err);
          toast.error('שגיאה במחיקת פרופילים כפולים', { duration: 4000 });
        }
      }

      // Check for saved draft
      const savedDraft = localStorage.getItem('profile_draft');
      
      if (students.length > 0) {
        const profile = students[0];
        setStudentProfile(profile);

        const profileData = {
          username: profile.username || "",
          city: profile.city || "",
          description: profile.description || "",
          profile_image: profile.profile_image || "",
          services: profile.services || [],
          contact_info: profile.contact_info || {
            phone: "",
            email: "",
            website: "",
            instagram: "",
            other: ""
          },
        };

        // 🔥 CRITICAL FIX: If profile is approved and has content, ignore old drafts
        const profileHasContent = profile.username && profile.username.trim() !== '' &&
          (profile.description || profile.services?.length > 0);

        if (profileHasContent && savedDraft) {
          localStorage.removeItem('profile_draft');
          setFormData(profileData);
          setInitialFormData(profileData);
        } else if (savedDraft) {
          // Only restore draft if profile is empty/incomplete
          try {
            const draft = JSON.parse(savedDraft);
            const hasDraft = JSON.stringify(draft) !== JSON.stringify(profileData);

            if (hasDraft) {
              toast((t) => (
                <div className="text-right">
                  <p className="font-bold mb-2">נמצאה טיוטה שמורה</p>
                  <p className="text-sm mb-3">רוצה לשחזר את הטיוטה שנשמרה אוטומטית?</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setFormData(draft);
                        setInitialFormData(profileData);
                        toast.dismiss(t.id);
                        toast.success('הטיוטה שוחזרה בהצלחה');
                      }}
                    >
                      שחזרי טיוטה
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        localStorage.removeItem('profile_draft');
                        setFormData(profileData);
                        setInitialFormData(profileData);
                        toast.dismiss(t.id);
                      }}
                    >
                      התעלמי
                    </Button>
                  </div>
                </div>
              ), { duration: 10000 });
            } else {
              setFormData(profileData);
              setInitialFormData(profileData);
            }
          } catch (error) {
            console.warn('Failed to parse draft:', error);
            setFormData(profileData);
            setInitialFormData(profileData);
          }
        } else {
          setFormData(profileData);
          setInitialFormData(profileData);
        }
      } else {
        const newProfileData = {
          username: user.full_name || "",
          city: "",
          description: "",
          profile_image: "",
          services: [],
          contact_info: {
            phone: "",
            email: user.email || "",
            website: "",
            instagram: "",
            other: ""
          }
        };
        
        // Check draft for new profile
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            toast((t) => (
              <div className="text-right">
                <p className="font-bold mb-2">נמצאה טיוטה שמורה</p>
                <p className="text-sm mb-3">רוצה לשחזר את הטיוטה?</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setFormData(draft);
                      setInitialFormData(newProfileData);
                      toast.dismiss(t.id);
                    }}
                  >
                    שחזרי
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      localStorage.removeItem('profile_draft');
                      setFormData(newProfileData);
                      setInitialFormData(newProfileData);
                      toast.dismiss(t.id);
                    }}
                  >
                    התעלמי
                  </Button>
                </div>
              </div>
            ), { duration: 10000 });
          } catch (error) {
            setFormData(newProfileData);
            setInitialFormData(newProfileData);
          }
        } else {
          setFormData(newProfileData);
          setInitialFormData(newProfileData);
        }
      }
    } catch (error) {
      console.error("❌ Error loading profile:", error);

      if (error.message?.includes('אין חיבור לאינטרנט') ||
        error.message?.includes('Network Error')) {
        setNetworkError(true);
        setMessage({
          type: "error",
          text: "אין חיבור לאינטרנט. אנא בדקי את החיבור ונסי שוב."
        });
      } else {
        setMessage({ type: "error", text: "שגיאה בטעינת הפרופיל. נסי לרענן את הדף." });
      }
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    
    if (!formData.username.trim()) {
      toast.error("נא למלא שם להצגה");
      return;
    }
    
    // 🚨 NEW VALIDATION: For new profiles or significant updates, require description
    const hasSignificantChanges = !studentProfile || (
      formData.username !== studentProfile.username ||
      formData.city !== studentProfile.city ||
      formData.description !== studentProfile.description ||
      formData.profile_image !== studentProfile.profile_image ||
      JSON.stringify(formData.services) !== JSON.stringify(studentProfile.services || [])
    );
    
    if (hasSignificantChanges && !formData.description.trim()) {
      toast.error("נא למלא תיאור אישי לפני שליחת הפרופיל לאישור", {
        duration: 5000,
        icon: '📝',
      });
      return;
    }

    if (!navigator.onLine) {
      toast.error("אין חיבור לאינטרנט. לא ניתן לשמור כעת.");
      return;
    }

    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      
      const profileData = {
        user_id: currentUser.id,
        full_name: currentUser.full_name,
        profile_image: formData.profile_image,
        username: formData.username,
        city: formData.city,
        description: formData.description,
        services: formData.services,
        contact_info: formData.contact_info,
        ...(studentProfile?.contribution_details && {
          contribution_details: studentProfile.contribution_details
        }),
        ...(studentProfile?.service_areas && {
          service_areas: studentProfile.service_areas
        })
      };

      
      const onlyContactInfoChanged = studentProfile ? (
        formData.username === studentProfile.username &&
        formData.city === studentProfile.city &&
        formData.description === studentProfile.description &&
        formData.profile_image === studentProfile.profile_image &&
        JSON.stringify(formData.services) === JSON.stringify(studentProfile.services || []) &&
        JSON.stringify(formData.contact_info) !== JSON.stringify(studentProfile.contact_info || {})
      ) : false;
      

      const hasApprovalRequiredChanges = !studentProfile || (
        formData.username !== studentProfile.username ||
        formData.city !== studentProfile.city ||
        formData.description !== studentProfile.description ||
        formData.profile_image !== studentProfile.profile_image ||
        JSON.stringify(formData.services) !== JSON.stringify(studentProfile.services || [])
      );


      if (studentProfile && onlyContactInfoChanged && !hasApprovalRequiredChanges) {
        await apiCallWithRetry(() =>
          Student.update(studentProfile.id, { contact_info: formData.contact_info })
        );
        
        // ✅ Toast notification instead of reload
        toast.success('✅ פרטי הקשר עודכנו בהצלחה!', {
          duration: 4000,
          icon: '💜',
        });
        
        // Clear draft and reset unsaved changes
        localStorage.removeItem('profile_draft');
        setHasUnsavedChanges(false);
        
        // Refresh data in background without page reload
        await loadUserAndProfile();
      } else if (hasApprovalRequiredChanges || !studentProfile) {
        
        // 🔥 FIX: For NEW profiles, create the Student record first!
        let createdProfileId = studentProfile?.id;
        
        if (!studentProfile) {
          const newProfile = await apiCallWithRetry(() =>
            Student.create(profileData)
          );
          createdProfileId = newProfile.id;
        }
        
        await apiCallWithRetry(() =>
          ProfileApproval.create({
            user_id: currentUser.id,
            student_profile_id: createdProfileId,
            type: studentProfile ? "profile_update" : "new_profile",
            proposed_data: profileData,
            current_data: studentProfile || null,
            changes_summary: studentProfile
              ? "עדכון פרופיל (פרטים בסיסיים, תמונות ושירותים)"
              : "יצירת פרופיל חדש",
            status: "pending"
          })
        );

        // ✅ Multi-line toast notification with better UX
        toast.success(
          <div className="text-right">
            <div className="font-bold mb-1">🎉 הפרופיל נשלח לאישור בהצלחה!</div>
            <div className="text-sm">✨ המנהלת תאשר את הפרופיל שלך בהקדם</div>
            <div className="text-sm">💜 תקבלי התראה ברגע שהוא יאושר</div>
          </div>,
          {
            duration: 6000,
            style: {
              maxWidth: '500px',
            },
          }
        );
        
        // Clear draft and reset unsaved changes
        localStorage.removeItem('profile_draft');
        setHasUnsavedChanges(false);
        
        // Update initial form data to match current form data (no reload needed!)
        setInitialFormData(formData);
      } else {
        toast('ℹ️ אין שינויים לשמירה', {
          icon: '💡',
          duration: 3000,
        });
      }

    } catch (error) {
      console.error("❌ Error in handleSave:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      // ✅ Toast for errors
      if (error.message?.includes('Network Error') ||
        error.message?.includes('timeout')) {
        toast.error('❌ שגיאת רשת. אנא בדקי את החיבור לאינטרנט ונסי שוב.', {
          duration: 5000,
        });
      } else {
        toast.error(`❌ שגיאה בשמירת הפרופיל: ${error.message}`, {
          duration: 5000,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="animate-spin h-16 w-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">טוענים את הפרופיל שלך...</h2>
        </div>
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6 flex items-center justify-center" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-4">בעיה בחיבור לאינטרנט</h2>
            <p className="text-slate-600 mb-6">לא הצלחנו לטעון את הפרופיל. אנא בדקי את החיבור לאינטרנט.</p>
            <Button onClick={loadUserAndProfile} className="w-full bg-purple-600 hover:bg-purple-700">
              <RefreshCw className="w-4 h-4 ml-2" />
              נסי שוב
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-slate-800 mb-2">
              הפרופיל שלי ✨
            </h1>
            <p className="text-slate-600">
              כאן תוכלי לעדכן את הפרופיל שלך ואת השירותים שאת מציעה
            </p>
          </div>

          {message.text && (
            <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : message.type === 'info' ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
              {message.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : message.type === 'info' ? 'text-blue-800' : 'text-red-800'} style={{ whiteSpace: 'pre-line' }}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {currentUser && <ProfileApprovalStatus userId={currentUser.id} />}

          <Card className="mb-6 glass-effect border border-purple-200 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                  <span className="text-3xl">⭐</span>
                </div>
                <div className="flex-1 text-center sm:text-right">
                  <h3 className="text-xl font-bold text-purple-800 mb-1">
                    רוצה להיות כוכבת השבוע?
                  </h3>
                  <p className="text-slate-600 text-sm">
                    שתפי את הסיפור שלך והעסק המיוחד שלך עם כל הקהילה
                  </p>
                </div>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsSpotlightModalOpen(true);
                  }}
                  type="button"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md relative z-10"
                  size="lg"
                >
                  מלאי בקשה ⭐
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-purple-600" />
                מידע בסיסי
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username">שם להצגה *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="איך תרצי שיקראו לך?"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>עיר מגורים</Label>
                <CityAutocomplete
                  value={formData.city}
                  onChange={(city) => setFormData({ ...formData, city })}
                />
              </div>

              <div>
                <Label htmlFor="description">תיאור אישי (עד 300 תווים)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ספרי לנו קצת על עצמך, מה את עושה, מה מייחד אותך..."
                  className="mt-2 h-32"
                  maxLength={300}
                />
                <p className="text-xs text-slate-500 mt-1 text-left">{formData.description.length}/300</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-600" />
                תמונת פרופיל
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader
                filePath={formData.profile_image}
                onUpload={(url) => setFormData({ ...formData, profile_image: url })}
                multiple={false}
                maxFiles={1}
              />
            </CardContent>
          </Card>

          <Card className="mb-6 glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                השירותים שלי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>💡 חשוב:</strong> אחרי שתוסיפי או תערכי שירות, אל תשכחי ללחוץ על כפתור "שמרי" למטה בעמוד כדי לשלוח את השינויים לאישור!
                </AlertDescription>
              </Alert>
              <ServicesManager
                services={formData.services}
                onChange={(newServices) => {
                  setFormData(prev => ({ ...prev, services: newServices }));
                }}
                autoSave={false}
                currentUser={currentUser}
                studentProfile={studentProfile}
              />
            </CardContent>
          </Card>

          <Card className="mb-6 glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-purple-600" />
                פרטי קשר
                <Badge variant="outline" className="mr-2 text-green-600 border-green-300">
                  מתעדכנים מיד ללא אישור
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">טלפון</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.contact_info.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact_info: { ...formData.contact_info, phone: e.target.value }
                    })}
                    placeholder="050-1234567"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.contact_info.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact_info: { ...formData.contact_info, email: e.target.value }
                    })}
                    placeholder="example@email.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="website">אתר אינטרנט</Label>
                  <Input
                    id="website"
                    value={formData.contact_info.website}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact_info: { ...formData.contact_info, website: e.target.value }
                    })}
                    placeholder="www.example.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="instagram">אינסטגרם</Label>
                  <Input
                    id="instagram"
                    value={formData.contact_info.instagram}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact_info: { ...formData.contact_info, instagram: e.target.value }
                    })}
                    placeholder="username"
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {hasUnsavedChanges && !isSaving && (
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                יש לך שינויים שלא נשמרו. לחצי על "שמרי" כדי לשמור אותם.
              </AlertDescription>
            </Alert>
          )}

          {/* Sticky Save Button - קבוע בתחתית המסך */}
          <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-purple-200 p-4 shadow-lg z-50 mt-8">
            <div className="max-w-4xl mx-auto flex justify-center">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg w-full sm:w-auto shadow-xl"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    שומרת...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 ml-2" />
                    {hasUnsavedChanges ? 'שמרי שינויים' : 'שמרי מידע בסיסי ופרטי קשר'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

        <SpotlightRequestModal
          open={isSpotlightModalOpen}
          onClose={() => setIsSpotlightModalOpen(false)}
          currentUser={currentUser}
        />
      </div>
    </ErrorBoundary>
  );
}
