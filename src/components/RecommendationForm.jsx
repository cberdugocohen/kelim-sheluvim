import React, { useState } from 'react';
import { Recommendation } from '@/entities/Recommendation';
import { Notification } from '@/entities/Notification';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, CheckCircle, AlertCircle, Star } from 'lucide-react';

export default function RecommendationForm({ isOpen, onClose, serviceId, serviceProviderId, currentUser, onSuccess }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setMessage({ type: 'error', text: 'נא לכתוב המלצה' });
      return;
    }

    if (content.length > 150) {
      setMessage({ type: 'error', text: 'ההמלצה ארוכה מדי (מקסימום 150 תווים)' });
      return;
    }

    if (!currentUser) {
      setMessage({ type: 'error', text: 'יש להתחבר כדי להוסיף המלצה' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // Create the recommendation
      await Recommendation.create({
        service_id: serviceId,
        content: content.trim(),
        recommender_id: currentUser.id
      });

      // Send notification to service provider
      if (serviceProviderId && serviceProviderId !== currentUser.id) {
        await Notification.create({
          user_id: serviceProviderId,
          title: '⭐ קיבלת המלצה חדשה!',
          message: `${currentUser.full_name || 'משתמשת'} המליצה על השירות שלך: "${content.substring(0, 50)}..."`,
          type: 'system',
          icon: '⭐',
          related_entity_id: serviceId
        });
      }

      setMessage({ type: 'success', text: '✅ ההמלצה נשמרה בהצלחה!' });
      
      setTimeout(() => {
        setContent('');
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);

    } catch (error) {
      console.error('❌ Error creating recommendation:', error);
      setMessage({ 
        type: 'error', 
        text: 'שגיאה בשמירת ההמלצה. אנא נסי שוב.' 
      });
    }
    
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContent('');
      setMessage({ type: '', text: '' });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" fill="currentColor" />
            כתבי המלצה על השירות
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {message.text && (
            <Alert className={`${message.type === 'success' ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
              {message.type === 'success' ? 
                <CheckCircle className="h-4 w-4 text-green-600" /> : 
                <AlertCircle className="h-4 w-4 text-red-600" />
              }
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800 leading-relaxed">
              💜 <strong>ההמלצות שלך חשובות!</strong><br/>
              שתפי את החוויה שלך עם השירות ועזרי לחברות אחרות לקבל החלטה נכונה.
            </p>
          </div>

          <div>
            <Label htmlFor="content" className="text-base font-semibold text-slate-700 mb-2 block">
              ההמלצה שלי (עד 150 תווים) *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="לדוגמה: השירות היה מצוין! מקצועית, קשובה ותוצאות מעולות. ממליצה בחום!"
              className="min-h-[120px] text-base resize-none"
              maxLength={150}
              disabled={isSubmitting}
              required
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-500">
                {content.length}/150 תווים
              </p>
              {content.length > 130 && content.length < 150 && (
                <p className="text-xs text-orange-600">
                  עוד {150 - content.length} תווים
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שומרת...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  הוסיפי המלצה
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
