import React, { useState } from 'react';
import { Service } from '@/entities/Service';
import { Student } from '@/entities/Student';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import toast from "react-hot-toast";

const CATEGORIES = [
  'טיפוח ובריאות',
  'שירותי בית',
  'אומנות ויצירה',
  'חינוך והוראה',
  'טיפול וייעוץ',
  'טיפול זוגי',
  'ייעוץ כלכלי',
  'וידאו',
  'בגדים ותכשיטים',
  'עיסוי',
  'מוצרי נוי',
  'כושר',
  'אחר'
];

export default function ServiceEditModal({ isOpen, onClose, service, onSuccess }) {
  const [formData, setFormData] = useState({
    title: service?.title || '',
    description: service?.description || '',
    category: service?.category || 'אחר', // Updated default to 'אחר' as 'כללי' is removed
    geographic_area: service?.geographic_area || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // New state for deletion
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // בדיקת סוג המקור של השירות
      if (service.source === 'service_entity') {
        // שירות ישיר מישות Service - עדכון פשוט
        await Service.update(service.id, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          geographic_area: formData.geographic_area
        });
      } 
      else if (service.source === 'profile_new' && service.student_profile) {
        // שירות מפרופיל חדש - עדכון המערך services בפרופיל הסטודנט
        const studentProfile = service.student_profile;
        const updatedServices = studentProfile.services.map(s => {
          if (s.id === service.id) {
            return {
              ...s,
              title: formData.title,
              description: formData.description,
              category: formData.category,
              geographic_area: formData.geographic_area
            };
          }
          return s;
        });

        await Student.update(studentProfile.id, {
          services: updatedServices
        });
      }
      else if (service.source === 'profile_old' && service.student_profile) {
        // שירות מפרופיל ישן - עדכון contribution_details
        const studentProfile = service.student_profile;
        const contributionDetails = { ...studentProfile.contribution_details };

        // קביעת סוג השירות (gift/paid/barter)
        let serviceType = null;
        if (service.price === 'התנדבות') serviceType = 'gift';
        else if (service.price === 'בארטר') serviceType = 'barter';
        else serviceType = 'paid';

        if (serviceType && contributionDetails[serviceType]) {
          // FIXED: עדכון גם הקטגוריה במבנה הישן!
          contributionDetails[serviceType] = {
            ...contributionDetails[serviceType],
            description: formData.title,
            details: formData.description,
            category: formData.category, // NEW: שמירת הקטגוריה במבנה הישן
            geographic_area: formData.geographic_area // NEW: שמירת האזור הגיאוגרפי
          };

          await Student.update(studentProfile.id, {
            contribution_details: contributionDetails
          });
        } else {
          throw new Error('לא ניתן לעדכן שירות זה - מבנה לא תקין');
        }
      }
      else {
        throw new Error('לא ניתן לעדכן שירות זה - מקור לא ידוע');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err) {
      console.error('❌ Error updating service:', err);
      setError(err.message || 'שגיאה בעדכון השירות');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!service) return;
    
    const confirmMessage = `🗑️ האם את בטוחה שברצונך למחוק את השירות "${service.title}"?\n\n⚠️ פעולה זו היא סופית ולא ניתנת לביטול!`;
    
    if (!confirm(confirmMessage)) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      
      // מחיקה לפי סוג המקור
      if (service.source === 'service_entity') {
        // מחיקת שירות ישיר מישות Service
        await Service.delete(service.id);
      } 
      else if (service.source === 'profile_new' && service.student_profile) {
        // מחיקת שירות מפרופיל חדש - הסרה מהמערך services
        const studentProfile = service.student_profile;
        const updatedServices = studentProfile.services.filter(s => s.id !== service.id);
        
        await Student.update(studentProfile.id, {
          services: updatedServices
        });
      }
      else if (service.source === 'profile_old' && service.student_profile) {
        // מחיקת שירות מפרופיל ישן - ביטול contribution_details
        const studentProfile = service.student_profile;
        const contributionDetails = { ...studentProfile.contribution_details };
        
        let serviceType = null;
        if (service.price === 'התנדבות') serviceType = 'gift';
        else if (service.price === 'בארטר') serviceType = 'barter';
        else serviceType = 'paid';
        
        if (serviceType && contributionDetails[serviceType]) {
          contributionDetails[serviceType] = {
            ...contributionDetails[serviceType],
            active: false
          };
          
          await Student.update(studentProfile.id, {
            contribution_details: contributionDetails
          });
        } else {
          throw new Error('לא ניתן למחוק שירות זה - מבנה לא תקין או סוג שירות לא ידוע');
        }
      } else {
        throw new Error('לא ניתן למחוק שירות זה - מקור לא ידוע');
      }
      
      toast.success('✅ השירות נמחק בהצלחה!');
      onSuccess();
      onClose();
      
    } catch (err) {
      console.error('❌ Error deleting service:', err);
      setError(err.message || 'שגיאה במחיקת השירות');
      toast.error(`❌ שגיאה במחיקת השירות: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };


  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            עריכת שירות
          </DialogTitle>
          <div className="text-sm text-slate-500">
            נותן שירות: {service.student_name || service.provider_name}
          </div>
        </DialogHeader>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              השירות עודכן בהצלחה! 🎉
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">כותרת השירות *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="לדוגמה: עיסוי שוודי מקצועי"
              required
              disabled={isSubmitting || success || isDeleting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור השירות *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="תארי את השירות שלך בפירוט..."
              className="min-h-[100px]"
              required
              disabled={isSubmitting || success || isDeleting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">קטגוריה *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              disabled={isSubmitting || success || isDeleting}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחרי קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="geographic_area">אזור גיאוגרפי</Label>
            <Input
              id="geographic_area"
              value={formData.geographic_area}
              onChange={(e) => setFormData({ ...formData, geographic_area: e.target.value })}
              placeholder="לדוגמה: ירושלים, תל אביב, בית שמש"
              disabled={isSubmitting || success || isDeleting}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>מקור השירות:</strong>{' '}
              {service.source === 'service_entity' ? 'שירות ישיר' :
               service.source === 'profile_new' ? 'פרופיל חדש' :
               'פרופיל ישן'}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              ✅ <strong>תוקן!</strong> עכשיו הקטגוריה מתעדכנת גם בשירותים מפרופילים ישנים!
            </p>
          </div>

          <DialogFooter className="gap-2 flex-row-reverse">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting || success || isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מוחק...
                </>
              ) : (
                <>
                  🗑️ מחקי שירות
                </>
              )}
            </Button>
            
            <div className="flex-1"></div>
            
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || success || isDeleting}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || success || isDeleting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4 ml-2" />
                  נשמר!
                </>
              ) : (
                'שמור שינויים'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
