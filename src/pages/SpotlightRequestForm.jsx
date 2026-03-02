import React, { useState, useEffect } from "react";
import { SpotlightRequest } from "@/entities/SpotlightRequest";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CheckCircle, AlertCircle, Video, Upload, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SpotlightRequestForm() {
  const { currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const [existingRequest, setExistingRequest] = useState(null);
  const [formData, setFormData] = useState({
    personal_story: "",
    business_description: "",
    what_i_offer: "",
    tagline: "",
    images: [],
    video_url: "",
    contact_preference: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!isLoadingUser && currentUser) {
      loadExistingRequest(currentUser);
    } else if (!isLoadingUser) {
      setIsLoading(false);
    }
  }, [currentUser, isLoadingUser]);

  const loadExistingRequest = async (user) => {
    setIsLoading(true);
    try {
      const requests = await SpotlightRequest.filter({ user_id: user.id }, '-created_date', 1);
      if (requests.length > 0) {
        const request = requests[0];
        setExistingRequest(request);
        setFormData({
          personal_story: request.personal_story || "",
          business_description: request.business_description || "",
          what_i_offer: request.what_i_offer || "",
          tagline: request.tagline || "",
          images: request.images || [],
          video_url: request.video_url || "",
          contact_preference: request.contact_preference || ""
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage({ type: "", text: "" });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const newImageUrls = results.map(result => result.file_url);
      
      setFormData(prev => ({ 
        ...prev, 
        images: [...prev.images, ...newImageUrls].slice(0, 5)
      }));
      
      setMessage({ type: "success", text: "התמונות הועלו בהצלחה!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "שגיאה בהעלאת התמונות" });
    }
    setIsUploading(false);
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.personal_story.trim() || !formData.tagline.trim()) {
      setMessage({ type: "error", text: "אנא מלאי את השדות הנדרשים" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (existingRequest) {
        await SpotlightRequest.update(existingRequest.id, {
          ...formData,
          status: existingRequest.status === 'needs_updates' ? 'pending' : existingRequest.status
        });
        setMessage({ type: "success", text: "הבקשה עודכנה בהצלחה! 🌟" });
      } else {
        await SpotlightRequest.create({
          user_id: currentUser.id,
          ...formData,
          status: 'pending'
        });
        setMessage({ type: "success", text: "הבקשה נשלחה בהצלחה! 🌟" });
      }
      
      setTimeout(() => {
        window.location.href = createPageUrl('Profile');
      }, 2000);
    } catch (error) {
      console.error("Error submitting spotlight request:", error);
      setMessage({ type: "error", text: "שגיאה בשליחת הבקשה. אנא נסי שוב." });
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה לפרופיל
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="glass-effect mb-8">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-purple-800">
                {existingRequest ? 'עריכת' : ''} בקשה להיות כוכבת השבוע
              </CardTitle>
              <p className="text-slate-600 mt-2">
                שתפי את הסיפור המיוחד שלך עם הקהילה
              </p>
            </CardHeader>
          </Card>

          {message.text && (
            <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              {message.type === 'success' ? 
                <CheckCircle className="h-4 w-4 text-green-600" /> : 
                <AlertCircle className="h-4 w-4 text-red-600" />
              }
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="glass-effect">
              <CardContent className="p-6 space-y-6">
                {/* Tagline */}
                <div>
                  <Label htmlFor="tagline" className="font-medium text-slate-700">
                    משפט קצר לתצוגה *
                  </Label>
                  <Input
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    maxLength={50}
                    required
                    className="mt-2"
                    placeholder='לדוגמה: "מלמדת נשים לפרוח" או "מביאה אור לבתים"'
                  />
                  <p className="text-xs text-slate-500 mt-1 text-left">{formData.tagline.length}/50</p>
                </div>

                {/* Personal Story */}
                <div>
                  <Label htmlFor="personal_story" className="font-medium text-slate-700">
                    הסיפור האישי שלך *
                  </Label>
                  <p className="text-sm text-slate-500 mt-1 mb-2">
                    איך הלימוד עם הרב אריה נווה שליט"א השפיע על החיים שלך ועל העבודה שלך?
                  </p>
                  <Textarea
                    id="personal_story"
                    value={formData.personal_story}
                    onChange={(e) => handleInputChange('personal_story', e.target.value)}
                    maxLength={800}
                    required
                    className="mt-2 min-h-[150px]"
                    placeholder="ספרי על המסע שלך, איך התחלת, מה למדת, איך זה שינה אותך..."
                  />
                  <p className="text-xs text-slate-500 mt-1 text-left">{formData.personal_story.length}/800</p>
                </div>

                {/* Business Description */}
                <div>
                  <Label htmlFor="business_description" className="font-medium text-slate-700">
                    תיאור העסק/השירות שלך
                  </Label>
                  <Textarea
                    id="business_description"
                    value={formData.business_description}
                    onChange={(e) => handleInputChange('business_description', e.target.value)}
                    maxLength={600}
                    className="mt-2 min-h-[100px]"
                    placeholder="מה את עושה? איך זה עובד? מה המוצרים או השירותים שלך?"
                  />
                  <p className="text-xs text-slate-500 mt-1 text-left">{formData.business_description.length}/600</p>
                </div>

                {/* What I Offer */}
                <div>
                  <Label htmlFor="what_i_offer" className="font-medium text-slate-700">
                    מה את מציעה לקהילה?
                  </Label>
                  <Textarea
                    id="what_i_offer"
                    value={formData.what_i_offer}
                    onChange={(e) => handleInputChange('what_i_offer', e.target.value)}
                    maxLength={400}
                    className="mt-2 min-h-[100px]"
                    placeholder="מה הקהילה יכולה לקבל ממך? איך אפשר ליצור אליך קשר?"
                  />
                  <p className="text-xs text-slate-500 mt-1 text-left">{formData.what_i_offer.length}/400</p>
                </div>

                {/* Images */}
                <div>
                  <Label className="font-medium text-slate-700">תמונות (עד 5 תמונות)</Label>
                  <p className="text-sm text-slate-500 mt-1 mb-3">תמונות של העבודה שלך, המוצרים שלך, או תמונות אישיות</p>
                  
                  <label className="flex items-center gap-2 cursor-pointer bg-purple-50 hover:bg-purple-100 px-4 py-3 rounded-xl transition-colors w-fit border border-purple-200">
                    <Camera className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-700">
                      {isUploading ? "מעלה תמונות..." : "הוספת תמונות"}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handleImageUpload} 
                      className="hidden"
                      disabled={isUploading || formData.images.length >= 5}
                    />
                  </label>
                  
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                      {formData.images.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={imageUrl} 
                            alt={`תמונה ${index + 1}`} 
                            className="w-full h-32 object-cover rounded-xl shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video URL */}
                <div>
                  <Label htmlFor="video_url" className="font-medium text-slate-700 flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-600" />
                    קישור לוידאו (אופציונלי)
                  </Label>
                  <p className="text-sm text-slate-500 mt-1 mb-2">
                    וידאו שלך מדברת על העבודה שלך או על הדרך שלך - מיוטיוב, אינסטגרם, או כל פלטפורמה אחרת
                  </p>
                  <Input
                    id="video_url"
                    value={formData.video_url}
                    onChange={(e) => handleInputChange('video_url', e.target.value)}
                    className="mt-2"
                    placeholder="הדביקי כאן קישור לוידאו"
                  />
                </div>

                {/* Contact Preference */}
                <div>
                  <Label htmlFor="contact_preference" className="font-medium text-slate-700">
                    איך מעדיפה שיצרו אליך קשר?
                  </Label>
                  <Input
                    id="contact_preference"
                    value={formData.contact_preference}
                    onChange={(e) => handleInputChange('contact_preference', e.target.value)}
                    className="mt-2"
                    placeholder="לדוגמה: וואטסאפ, מייל, דרך האתר שלי..."
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Link to={createPageUrl('Profile')} className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                >
                  ביטול
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    שולחת בקשה...
                  </div>
                ) : (
                  <>
                    <Upload className="w-4 h-4 ml-2" />
                    {existingRequest ? 'עדכני בקשה' : 'שלחי בקשה'} 🌟
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
