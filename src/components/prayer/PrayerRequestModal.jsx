import React, { useState, useEffect } from "react";
import { PrayerRequest } from "@/entities/PrayerRequest";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Heart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const requestTypes = [
  "רפואת הגוף והנפש",
  "זיווג הגון משורש השנה",
  "חופה וקידושין עוד השנה",
  "שלום בית",
  "פרנסה",
  "הריון / לידה",
  "שמירה / ילדים",
  "הצלחה / לימודים",
  "אחר"
];

const validityPeriods = [
  "שבוע",
  "40 ימים"
];

const calculateValidUntil = (validFor) => {
  const today = new Date();
  
  switch (validFor) {
    case "שבוע":
      today.setDate(today.getDate() + 7);
      break;
    case "40 ימים":
      today.setDate(today.getDate() + 40);
      break;
    default:
      today.setDate(today.getDate() + 7);
  }
  
  return today.toISOString().split('T')[0];
};

export default function PrayerRequestModal({ isOpen, onClose, currentUser, editingRequest }) {
  const [formData, setFormData] = useState({
    name_for_prayer: "",
    request_types: [],
    valid_for: "",
    context_note: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (isOpen) {
      if (editingRequest) {
        setFormData({
          name_for_prayer: editingRequest.name_for_prayer || "",
          request_types: editingRequest.request_types || [],
          valid_for: editingRequest.valid_for || "",
          context_note: editingRequest.context_note || ""
        });
      } else {
        setFormData({
          name_for_prayer: "",
          request_types: [],
          valid_for: "",
          context_note: ""
        });
      }
      setMessage({ type: "", text: "" });
    }
  }, [isOpen, editingRequest]);

  const handleTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      request_types: prev.request_types.includes(type)
        ? prev.request_types.filter(t => t !== type)
        : [...prev.request_types, type]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name_for_prayer.trim() || formData.request_types.length === 0 || !formData.valid_for) {
      setMessage({ type: "error", text: "אנא מלאי את כל השדות החובה" });
      return;
    }

    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const dataToSave = {
        ...formData,
        valid_until: calculateValidUntil(formData.valid_for),
        status: "פעיל",
        requester_id: currentUser.id,
        requester_name: currentUser.full_name || currentUser.email
      };

      if (editingRequest) {
        await PrayerRequest.update(editingRequest.id, dataToSave);
        setMessage({ type: "success", text: "הבקשה עודכנה בהצלחה! 💜" });
      } else {
        await PrayerRequest.create(dataToSave);
        setMessage({ type: "success", text: "הבקשה נוספה בהצלחה! תודה שהצטרפת 🙏" });
      }

      setTimeout(() => {
        onClose(true);
      }, 1500);
    } catch (error) {
      console.error("Error saving prayer request:", error);
      setMessage({ type: "error", text: "שגיאה בשמירת הבקשה. נסי שוב." });
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Heart className="w-5 h-5 text-purple-600" fill="currentColor" />
            {editingRequest ? "עריכת בקשת תפילה" : "הוספת בקשת תפילה"}
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
            <Label htmlFor="name_for_prayer" className="font-medium text-slate-700">
              שם לתפילה *
            </Label>
            <Input
              id="name_for_prayer"
              value={formData.name_for_prayer}
              onChange={(e) => setFormData(prev => ({...prev, name_for_prayer: e.target.value}))}
              placeholder='למשל: "שרה בת רחל" או "משה בן דוד"'
              className="bg-white border-slate-200 focus:border-purple-400 rounded-xl"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="font-medium text-slate-700">
              סוגי הבקשות * (ניתן לבחור מספר)
            </Label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
              {requestTypes.map(type => (
                <div key={type} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={type}
                    checked={formData.request_types.includes(type)}
                    onCheckedChange={() => handleTypeToggle(type)}
                    className="border-slate-300"
                  />
                  <label
                    htmlFor={type}
                    className="text-sm font-medium leading-none cursor-pointer select-none text-slate-700"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valid_for" className="font-medium text-slate-700">
              תוקף הבקשה *
            </Label>
            <Select
              value={formData.valid_for}
              onValueChange={(value) => setFormData(prev => ({...prev, valid_for: value}))}
              required
            >
              <SelectTrigger className="bg-white border-slate-200 rounded-xl">
                <SelectValue placeholder="בחרי תקופת תוקף" />
              </SelectTrigger>
              <SelectContent>
                {validityPeriods.map(period => (
                  <SelectItem key={period} value={period}>{period}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context_note" className="font-medium text-slate-700">
              כמה מילים עם הקשר (אופציונלי)
            </Label>
            <Textarea
              id="context_note"
              value={formData.context_note}
              onChange={(e) => setFormData(prev => ({...prev, context_note: e.target.value}))}
              placeholder="ניתן להוסיף הקשר או פרטים נוספים..."
              className="bg-white border-slate-200 focus:border-purple-400 rounded-xl min-h-[100px]"
              maxLength={300}
            />
            <p className="text-xs text-slate-500 text-left">{formData.context_note.length}/300</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              className="flex-1"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  שומרת...
                </div>
              ) : (
                <>{editingRequest ? "עדכני" : "הוסיפי"}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
