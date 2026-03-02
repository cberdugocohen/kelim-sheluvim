import React, { useState } from "react";
import { SpotlightRequest } from "@/entities/SpotlightRequest";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle, AlertCircle, Video, Upload, X, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SpotlightRequestModal({ open, onClose, currentUser }) {
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
  const [message, setMessage] = useState({ type: "", text: "" });

  React.useEffect(() => {
    if (open) {
      setFormData({
        personal_story: "",
        business_description: "",
        what_i_offer: "",
        tagline: "",
        images: [],
        video_url: "",
        contact_preference: ""
      });
      setMessage({ type: "", text: "" });
    }
  }, [open, currentUser]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage({ type: "", text: "" });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (formData.images.length + files.length > 5) {
      setMessage({ type: "error", text: `ניתן להעלות עד 5 תמונות. כרגע יש ${formData.images.length} תמונות.` });
      return;
    }

    setIsUploading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const uploadPromises = files.map(file => UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const newImageUrls = results.map(result => result.file_url);
      
      setFormData(prev => ({ 
        ...prev, 
        images: [...prev.images, ...newImageUrls].slice(0, 5)
      }));
      
      setMessage({ type: "success", text: `✅ ${newImageUrls.length} תמונות הועלו בהצלחה!` });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error uploading images:", error);
      setMessage({ type: "error", text: "שגיאה בהעלאת התמונות. נסי שוב." });
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
      setMessage({ type: "error", text: "אנא מלאי את השדות הנדרשים (סיפור אישי ומשפט קצר)" });
      return;
    }

    setIsSubmitting(true);
    try {
      const user = currentUser || await User.me();
      
      await SpotlightRequest.create({
        user_id: user.id,
        personal_story: formData.personal_story,
        business_description: formData.business_description,
        what_i_offer: formData.what_i_offer,
        tagline: formData.tagline,
        images: formData.images,
        video_url: formData.video_url,
        contact_preference: formData.contact_preference,
        status: 'pending'
      });

      setMessage({ type: "success", text: "הבקשה נשלחה בהצלחה! 🌟" });
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error submitting spotlight request:", error);
      setMessage({ type: "error", text: "שגיאה בשליחת הבקשה. אנא נסי שוב." });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-purple-800 text-center">
            ✨ בקשה להיות כוכבת השבוע ✨
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {message.text && (
            <Alert className={`${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              {message.type === 'success' ? 
                <CheckCircle className="h-4 w-4 text-green-600" /> : 
                <AlertCircle className="h-4 w-4 text-red-600" />
              }
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Tagline */}
          <div className="space-y-2">
            <Label htmlFor="tagline" className="font-medium text-slate-700">
              משפט קצר לתצוגה *
            </Label>
            <Input
              id="tagline"
              value={formData.tagline}
              onChange={(e) => handleInputChange('tagline', e.target.value)}
              maxLength={50}
              required
              className="bg-white border-slate-200 focus:border-purple-400 rounded-xl h-12"
              placeholder='לדוגמה: "מלמדת נשים לפרוח" או "מביאה אור לבתים"'
            />
            <p className="text-xs text-slate-500 text-left">{formData.tagline.length}/50</p>
          </div>

          {/* Personal Story */}
          <div className="space-y-2">
            <Label htmlFor="personal_story" className="font-medium text-slate-700">
              הסיפור האישי שלך *
            </Label>
            <p className="text-sm text-slate-500 mb-2">
              איך הלימוד עם הרב אריה נווה שליט"א השפיע על החיים שלך ועל העבודה שלך?
            </p>
            <Textarea
              id="personal_story"
              value={formData.personal_story}
              onChange={(e) => handleInputChange('personal_story', e.target.value)}
              maxLength={800}
              required
              className="bg-white border-slate-200 focus:border-purple-400 rounded-xl min-h-[150px]"
              placeholder="ספרי על המסע שלך, איך התחלת, מה למדת, איך זה שינה אותך..."
            />
            <p className="text-xs text-slate-500 text-left">{formData.personal_story.length}/800</p>
          </div>

          {/* Business Description */}
          <div className="space-y-2">
            <Label htmlFor="business_description" className="font-medium text-slate-700">
              תיאור העסק/השירות שלך
            </Label>
            <Textarea
              id="business_description"
              value={formData.business_description}
              onChange={(e) => handleInputChange('business_description', e.target.value)}
              maxLength={600}
              className="bg-white border-slate-200 focus:border-purple-400 rounded-xl min-h-[100px]"
              placeholder="מה את עושה? איך זה עובד? מה המוצרים או השירותים שלך?"
            />
            <p className="text-xs text-slate-500 text-left">{formData.business_description.length}/600</p>
          </div>

          {/* What I Offer */}
          <div className="space-y-2">
            <Label htmlFor="what_i_offer" className="font-medium text-slate-700">
              מה את מציעה לקהילה?
            </Label>
            <Textarea
              id="what_i_offer"
              value={formData.what_i_offer}
              onChange={(e) => handleInputChange('what_i_offer', e.target.value)}
              maxLength={400}
              className="bg-white border-slate-200 focus:border-purple-400 rounded-xl min-h-[100px]"
              placeholder="מה הקהילה יכולה לקבל ממך? איך אפשר ליצור אליך קשר?"
            />
            <p className="text-xs text-slate-500 text-left">{formData.what_i_offer.length}/400</p>
          </div>

          {/* Images Upload - ENHANCED */}
          <div className="space-y-4 p-4 bg-purple-50/50 rounded-xl border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <Label className="font-medium text-slate-700 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                תמונות (עד 5 תמונות)
              </Label>
              <Badge variant="outline" className="text-purple-700">
                {formData.images.length}/5
              </Badge>
            </div>
            
            <p className="text-sm text-slate-600">
              תמונות של העבודה שלך, המוצרים שלך, או תמונות אישיות שמראות מי את ומה את עושה
            </p>
            
            <label className="flex items-center justify-center gap-3 cursor-pointer bg-white hover:bg-purple-50 px-6 py-4 rounded-xl transition-all w-full border-2 border-dashed border-purple-300 hover:border-purple-400">
              <Camera className="w-6 h-6 text-purple-600" />
              <span className="font-medium text-purple-700 text-lg">
                {isUploading ? "מעלה תמונות..." : formData.images.length === 0 ? "לחצי להוספת תמונות 📸" : "הוסיפי עוד תמונות"}
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
            
            <AnimatePresence>
              {formData.images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4"
                >
                  {formData.images.map((imageUrl, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group"
                    >
                      <img 
                        src={imageUrl} 
                        alt={`תמונה ${index + 1}`} 
                        className="w-full h-32 object-cover rounded-xl shadow-md border-2 border-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded-md text-xs">
                        תמונה {index + 1}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Video URL */}
          <div className="space-y-2">
            <Label htmlFor="video_url" className="font-medium text-slate-700 flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-600" />
              קישור לוידאו (אופציונלי)
            </Label>
            <p className="text-sm text-slate-500">
              וידאו שלך מדברת על העבודה שלך או על הדרך שלך - מיוטיוב, אינסטגרם, או כל פלטפורמה אחרת
            </p>
            <Input
              id="video_url"
              value={formData.video_url}
              onChange={(e) => handleInputChange('video_url', e.target.value)}
              className="bg-white border-slate-200 focus:border-purple-400 rounded-xl h-12"
              placeholder="הדביקי כאן קישור לוידאו"
            />
          </div>

          {/* Contact Preference */}
          <div className="space-y-2">
            <Label htmlFor="contact_preference" className="font-medium text-slate-700">
              איך מעדיפה שיצרו אליך קשר?
            </Label>
            <Input
              id="contact_preference"
              value={formData.contact_preference}
              onChange={(e) => handleInputChange('contact_preference', e.target.value)}
              className="bg-white border-slate-200 focus:border-purple-400 rounded-xl h-12"
              placeholder="לדוגמה: וואטסאפ, מייל, דרך האתר שלי..."
            />
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
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
                  שלחי בקשה 🌟
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
