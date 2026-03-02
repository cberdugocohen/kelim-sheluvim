import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, AlertCircle, CheckCircle, Image as ImageIcon, Gift } from 'lucide-react';
import ImageUploader from './ImageUploader';

const SERVICE_CATEGORIES = [
  "טיפוח ובריאות",
  "שירותי בית",
  "אומנות ויצירה",
  "חינוך והוראה",
  "טיפול וייעוץ",
  "טיפול זוגי",
  "ייעוץ כלכלי",
  "וידאו",
  "בגדים ותכשיטים",
  "עיסוי",
  "מוצרי נוי",
  "כושר",
  "אחר"
];

const HOLIDAY_OPTIONS = [
  "ראש השנה",
  "יום כיפור",
  "סוכות",
  "חנוכה",
  'ט"ו בשבט',
  "פורים",
  "פסח",
  "יום העצמאות",
  'ל"ג בעומר',
  "שבועות",
  "שלושת השבועות",
  "תשעה באב",
  "כללי"
];

export default function ServiceFormModal({ isOpen, onClose, onSave, service, onDelete }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'gift',
    price_range: '',
    category: SERVICE_CATEGORIES[0],
    images: [],
    is_active: true,
    is_holiday_highlight: false,
    holiday_type: 'כללי'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (service) {
      
      const validCategory = service.category && SERVICE_CATEGORIES.includes(service.category) 
        ? service.category 
        : SERVICE_CATEGORIES[0];
      
      setFormData({
        title: service.title || '',
        description: service.description || '',
        type: service.type || 'gift',
        price_range: service.price_range || '',
        category: validCategory,
        images: service.images || [],
        is_active: service.is_active !== undefined ? service.is_active : true,
        is_holiday_highlight: service.is_holiday_highlight || false,
        holiday_type: service.holiday_type || 'כללי'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'gift',
        price_range: '',
        category: SERVICE_CATEGORIES[0],
        images: [],
        is_active: true,
        is_holiday_highlight: false,
        holiday_type: 'כללי'
      });
    }
    setMessage({ type: '', text: '' });
    setIsSaving(false);
  }, [service, isOpen]);

  const handleDelete = () => {
    if (!service) return;
    
    if (confirm('🗑️ האם את בטוחה שברצונך למחוק את השירות הזה?\n\nהמחיקה היא סופית ולא ניתן לשחזר את השירות.')) {
      if (onDelete) {
        onDelete(service.id);
        onClose();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    
    setMessage({ type: '', text: '' });

    if (!formData.title || !formData.title.trim()) {
      console.error("❌ Validation failed: Missing title");
      setMessage({ type: 'error', text: 'נא למלא שם שירות' });
      return;
    }

    if (!formData.description || !formData.description.trim()) {
      console.error("❌ Validation failed: Missing description");
      setMessage({ type: 'error', text: 'נא למלא תיאור' });
      return;
    }

    if (!formData.category || !SERVICE_CATEGORIES.includes(formData.category)) {
      console.error("❌ Validation failed: Invalid or missing category");
      console.error("Category value is:", formData.category);
      console.error("Valid categories:", SERVICE_CATEGORIES);
      setMessage({ type: 'error', text: 'נא לבחור קטגוריה תקינה. רענני את הדף אם הבעיה נמשכת.' });
      return;
    }

    if (formData.is_holiday_highlight && !formData.holiday_type) {
      console.error("❌ Validation failed: Holiday highlight checked but no holiday type");
      setMessage({ type: 'error', text: 'נא לבחור את החג המתאים' });
      return;
    }

    setIsSaving(true);
    
    try {
      onSave(formData);
    } catch (error) {
      console.error("❌ Error in onSave:", error);
      setMessage({ type: 'error', text: 'שגיאה בשמירת השירות' });
      setIsSaving(false);
      return;
    }
    
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 500);
  };

  const handleImagesChange = (newImages) => {
    
    setFormData(prev => ({
      ...prev,
      images: Array.isArray(newImages) ? newImages : (newImages ? [newImages] : [])
    }));
  };

  const handleCategoryChange = (value) => {
    
    if (SERVICE_CATEGORIES.includes(value)) {
      setFormData({ ...formData, category: value });
    } else {
      console.error("❌ Attempted to set invalid category:", value);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800 text-right">
            {service ? 'עריכת שירות' : 'הוספת שירות חדש'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
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

          <div>
            <Label htmlFor="title" className="text-right block mb-2">שם השירות *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="לדוגמה: ליווי טלפוני, ייעוץ עסקי, הדרכת מחשבים..."
              className="text-right"
              dir="rtl"
              required
              maxLength={80}
            />
            <p className="text-xs text-slate-500 mt-1 text-left">{formData.title.length}/80</p>
          </div>

          <div>
            <Label htmlFor="description" className="text-right block mb-2">תיאור השירות * (עד 300 תווים)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="תארי בפירוט מה השירות כולל, למי הוא מתאים, מה מיוחד בו..."
              className="h-32 text-right"
              dir="rtl"
              maxLength={300}
              required
            />
            <p className="text-xs text-slate-500 mt-1 text-left">{formData.description.length}/300</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">סוג השירות *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue>
                    {formData.type === 'gift' && '💝 מתנה / התנדבות'}
                    {formData.type === 'paid' && '💰 בתשלום'}
                    {formData.type === 'barter' && '🔄 חליפין / ברטר'}
                    {!formData.type && 'בחרי סוג'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="gift">💝 מתנה / התנדבות</SelectItem>
                  <SelectItem value="paid">💰 בתשלום</SelectItem>
                  <SelectItem value="barter">🔄 חליפין / ברטר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category" className="text-right block mb-2">קטגוריה *</Label>
              <Select
                value={formData.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="בחרי קטגוריה">
                    {formData.category || "בחרי קטגוריה"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                נבחר: <span className="font-semibold">{formData.category || 'לא נבחר'}</span>
              </p>
            </div>
          </div>

          {formData.type === 'paid' && (
            <div>
              <Label htmlFor="price_range">טווח מחירים (אופציונלי)</Label>
              <Input
                id="price_range"
                value={formData.price_range}
                onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                placeholder="למשל: 100-200 ₪ לשעה, 50 ₪ ליחידה..."
                className="mt-2"
              />
            </div>
          )}

          <div>
            <Label className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              תמונות השירות (עד 3 תמונות)
            </Label>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-3">
              <p className="text-sm text-purple-800 font-medium mb-2">💡 טיפ חשוב:</p>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• העלי עד 3 תמונות איכותיות שמציגות את השירות שלך</li>
                <li>• תמונות עוזרות לקהילה להבין מה את מציעה</li>
                <li>• שירותים עם תמונות מקבלים יותר תשומת לב ופניות</li>
              </ul>
            </div>
            <ImageUploader
              filePath={formData.images}
              onUpload={handleImagesChange}
              multiple={true}
              maxFiles={3}
            />
            {formData.images && formData.images.length > 0 && (
              <p className="text-sm text-green-600 mt-2 font-medium">
                ✓ {formData.images.length} תמונות נבחרו
              </p>
            )}
          </div>

          {/* 🎉 HOLIDAY SECTION - VERSION 2.0 - NOW WITH BETTER VISIBILITY! */}
          <div className="border-2 border-amber-400 rounded-xl p-6 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-amber-900 text-lg">
                  🎉 הוספה למאגר החגים המיוחד!
                </h3>
                <p className="text-sm text-amber-800">
                  האם השירות מתאים במיוחד לאחד החגים? סמני כאן!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4 p-4 bg-white rounded-lg border-2 border-amber-300 hover:border-amber-400 transition-colors cursor-pointer">
              <input
                type="checkbox"
                id="is_holiday_highlight"
                checked={formData.is_holiday_highlight}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  is_holiday_highlight: e.target.checked 
                })}
                className="w-6 h-6 text-amber-600 rounded border-amber-400 focus:ring-amber-500"
              />
              <Label htmlFor="is_holiday_highlight" className="cursor-pointer font-bold text-amber-900 text-base">
                ✨ כן! השירות שלי מתאים במיוחד לחגים
              </Label>
            </div>

            {formData.is_holiday_highlight && (
              <div className="bg-white rounded-lg p-4 border-2 border-amber-300 shadow-inner">
                <Label htmlFor="holiday_type" className="mb-3 block font-bold text-amber-900">
                  🎊 באיזה חג השירות הזה מתאים במיוחד? *
                </Label>
                <Select
                  value={formData.holiday_type}
                  onValueChange={(value) => setFormData({ ...formData, holiday_type: value })}
                >
                  <SelectTrigger className="border-2 border-amber-300 focus:border-amber-500 text-base">
                    <SelectValue placeholder="בחרי חג..." />
                  </SelectTrigger>
                  <SelectContent>
                    {HOLIDAY_OPTIONS.map(holiday => (
                      <SelectItem key={holiday} value={holiday} className="text-base">
                        {holiday}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    💡 <strong>מה זה אומר?</strong> השירות שלך יופיע באזור המיוחד של החג הזה בדף הבית ובמאגר השירותים, וייצור לך יותר חשיפה!
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-purple-600"
            />
            <Label htmlFor="is_active" className="cursor-pointer text-sm">
              השירות פעיל ומוצג באתר
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            {service && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                🗑️ מחקי שירות
              </Button>
            )}
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
              disabled={isSaving}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  שמור שירות
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
