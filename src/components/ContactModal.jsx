import React, { useState } from "react";
import { PrivateMessage } from "@/entities/PrivateMessage";
import { Notification } from "@/entities/Notification"; 
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils"; 
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
import { Send, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";

export default function ContactModal({ 
  isOpen, 
  onClose, 
  recipientId, 
  recipientName, 
  relatedPostId = null,
  defaultSubject = "",
  defaultContent = ""
}) {
  const [formData, setFormData] = useState({
    subject: defaultSubject,
    content: defaultContent
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        subject: defaultSubject,
        content: defaultContent
      });
      setMessage({ type: "", text: "" });
    }
  }, [isOpen, defaultSubject, defaultContent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.content.trim()) {
      setMessage({ type: "error", text: "אנא מלאי את כל השדות" });
      return;
    }

    if (!recipientId) {
      setMessage({ type: "error", text: "שגיאה: לא נמצא מזהה נמען" });
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUser = await User.me();
      
      const newMessage = await PrivateMessage.create({
        sender_id: currentUser.id,
        recipient_id: recipientId,
        subject: formData.subject,
        content: formData.content,
        related_post_id: relatedPostId,
        is_read: false
      });


      // יצירת התראה עבור המקבלת
      await Notification.create({
          user_id: recipientId,
          title: `הודעה חדשה מ${currentUser.full_name}`,
          message: `קיבלת הודעה חדשה בנושא: "${formData.subject}"`,
          type: 'message',
          action_url: createPageUrl('MyMessages'),
          related_entity_id: newMessage.id,
          icon: 'ud83dudc8c' // 💌
      });

      setMessage({ type: "success", text: "ההודעה נשלחה בהצלחה!" });
      setTimeout(() => {
        setFormData({ subject: "", content: "" });
        setMessage({ type: "", text: "" });
        onClose();
      }, 2000);
    } catch (error) {
      const errorId = `MESSAGE_${Date.now()}`;
      console.error(`[${errorId}] Error sending message:`, error);
      
      let errorMessage = `שגיאה בשליחת ההודעה. קוד שגיאה: ${errorId}`;
      if (error.message) {
        errorMessage += `. פרטים: ${error.message}`;
      }
      
      setMessage({ type: "error", text: errorMessage });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            שליחת הודעה ל{recipientName}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="subject" className="font-medium text-slate-700">
              נושא ההודעה *
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({...prev, subject: e.target.value}))}
              className="bg-white border-slate-200 focus:border-purple-400 rounded-xl h-12"
              required
              placeholder="על מה ההודעה?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="font-medium text-slate-700">
              תוכן ההודעה *
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({...prev, content: e.target.value}))}
              className="bg-white border-slate-200 focus:border-purple-400 rounded-xl min-h-[120px]"
              required
              maxLength={500}
              placeholder="כתבי כאן את הודעתך..."
            />
            <p className="text-xs text-slate-500 text-left">{formData.content.length}/500</p>
          </div>

          <div className="flex gap-3 pt-4">
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
              disabled={isSubmitting}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  שולחת...
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  שלחי הודעה
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
