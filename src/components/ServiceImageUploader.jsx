import React, { useState } from 'react';
import { UploadFile } from '@/integrations/Core';
import { Student } from '@/entities/Student';
import { Service } from '@/entities/Service'; // Added import for Service entity
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Upload, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiCallWithRetry } from '@/utils/apiRetry';

export default function ServiceImageUploader({ service, studentProfile, onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState(service.images || []);
  const [error, setError] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("גודל התמונה חייב להיות עד 5MB");
      return;
    }

    // New check: Limit to 3 images
    if (uploadedImages.length >= 3) {
      setError("ניתן להעלות עד 3 תמונות בלבד");
      return;
    }

    // New check: Network connectivity
    if (!navigator.onLine) {
      setError("אין חיבור לאינטרנט. לא ניתן להעלות תמונה כעת.");
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      const { file_url } = await apiCallWithRetry(() => 
        UploadFile({ file })
      );
      
      const newImages = [...uploadedImages, file_url];
      setUploadedImages(newImages);
      
    } catch (err) {
      console.error("❌ Error uploading image:", err);
      
      if (err.message?.includes('Network Error') || err.message?.includes('timeout') || err.message?.includes('Failed to fetch')) {
        setError("בעיה בחיבור לאינטרנט. נסי שוב.");
      } else {
        setError("שגיאה בהעלאת התמונה. נסי שוב.");
      }
    }
    setIsUploading(false);
  };

  const handleRemoveImage = (imageUrl) => {
    setUploadedImages(uploadedImages.filter(img => img !== imageUrl));
  };

  const handleSave = async () => {
    // New check: Network connectivity
    if (!navigator.onLine) {
      setError("אין חיבור לאינטרנט. לא ניתן לשמור כעת.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {

      // Handle NEW structure (student.services array)
      if (service.source === 'profile_new') {
        const updatedServices = studentProfile.services.map(s => 
          s.id === service.id ? { ...s, images: uploadedImages } : s
        );

        await apiCallWithRetry(() =>
          Student.update(studentProfile.id, {
            services: updatedServices
          })
        );
      }
      
      // Handle OLD structure (contribution_details)
      else if (service.source === 'profile_old') {
        // Determine which contribution type this is
        const { gift, paid, barter } = studentProfile.contribution_details || {};
        let serviceType = null;
        
        // Match by title or description, prioritizing exact match if possible
        if (gift && (gift.description === service.title || gift.details === service.description)) {
          serviceType = 'gift';
        } else if (paid && (paid.description === service.title || paid.details === service.description)) {
          serviceType = 'paid';
        } else if (barter && (barter.description === service.title || barter.details === service.description)) {
          serviceType = 'barter';
        }

        if (serviceType) {
          const updatedContributions = {
            ...studentProfile.contribution_details,
            [serviceType]: {
              ...studentProfile.contribution_details[serviceType],
              images: uploadedImages
            }
          };

          await apiCallWithRetry(() => 
            Student.update(studentProfile.id, {
              contribution_details: updatedContributions
            })
          );
        } else {
          throw new Error("לא הצלחתי לזהות את סוג השירות");
        }
      }
      
      // Handle Service entity (direct service entry)
      else if (service.source === 'service_entity') {
        await apiCallWithRetry(() =>
          Service.update(service.id, {
            images: uploadedImages
          })
        );
      }
      // Added a default case or error if source is unknown
      else {
        throw new Error("מקור שירות לא ידוע. לא ניתן לשמור תמונות.");
      }

      if (onSuccess) onSuccess();
      setIsOpen(false);
    } catch (err) {
      console.error("❌ Error saving images:", err);
      
      if (err.message?.includes('Network Error') || err.message?.includes('timeout') || err.message?.includes('Failed to fetch')) {
        setError("בעיה בחיבור לאינטרנט. נסי שוב.");
      } else {
        setError(`שגיאה בשמירת התמונות: ${err.message}`);
      }
    }
    setIsUploading(false);
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="text-purple-600 border-purple-300 hover:bg-purple-50"
      >
        <Upload className="w-4 h-4 ml-2" />
        העלאת תמונות ({uploadedImages.length}/3)
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              העלאת תמונות ל-{service.title}
            </DialogTitle>
            <p className="text-sm text-slate-600">
              עבור: {service.student_name || studentProfile.full_name || studentProfile.username}
            </p>
            <p className="text-xs text-purple-600">
              מקור: {service.source === 'profile_new' ? 'פרופיל חדש' : service.source === 'profile_old' ? 'פרופיל ישן' : service.source === 'service_entity' ? 'שירות ישיר' : 'לא ידוע'}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Display existing images */}
            {uploadedImages.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  תמונות קיימות ({uploadedImages.length}/3)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img}
                        alt={`תמונה ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => handleRemoveImage(img)}
                        className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload new image - only if less than 3 images */}
            {uploadedImages.length < 3 && (
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  הוסיפי תמונה חדשה
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer bg-purple-50/30 hover:bg-purple-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mb-2 text-purple-500" />
                        <p className="text-sm text-purple-600 font-medium">לחצי להעלאת תמונה</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG עד 5MB</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
            >
              ביטול
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUploading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                "שמירת שינויים"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
