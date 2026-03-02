import React, { useState, useEffect } from "react";
import { PesachGift } from "@/entities/PesachGift";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Gift,
  Plus,
  Loader2,
  X,
  Users,
  User,
  Infinity,
  Sparkles,
  Heart,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import EmptyState from "@/components/EmptyState";

// ─── helpers ───────────────────────────────────────────────────────────────

function spotsLeft(gift) {
  if (gift.max_recipients === 0) return Infinity;
  return gift.max_recipients - (gift.claimed_by_ids?.length ?? 0);
}

function hasCurrentUserClaimed(gift, userId) {
  return (gift.claimed_by_ids ?? []).includes(userId);
}

// ─── GiftCard ──────────────────────────────────────────────────────────────

function GiftCard({ gift, currentUser, onClaim, onUnclaim, onClose }) {
  const isMine = gift.offered_by_id === currentUser?.id;
  const claimed = currentUser ? hasCurrentUserClaimed(gift, currentUser.id) : false;
  const left = spotsLeft(gift);
  const isFull = left === 0;
  const isClosed = gift.status === 'closed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="relative overflow-hidden border border-amber-100 shadow-sm hover:shadow-md transition-shadow bg-white">
        {/* decorative ribbon */}
        {claimed && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-green-500 text-white text-xs gap-1">
              <CheckCircle2 className="w-3 h-3" /> בחרתי
            </Badge>
          </div>
        )}
        {(isClosed || (isFull && !claimed)) && !isMine && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="secondary" className="text-xs gap-1">
              <Lock className="w-3 h-3" /> {isClosed ? 'נסגרה' : 'נתפסה'}
            </Badge>
          </div>
        )}
        {isMine && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-purple-100 text-purple-700 text-xs">המתנה שלי</Badge>
          </div>
        )}

        <CardContent className="p-4 pt-5">
          {/* gift image or emoji placeholder */}
          <div className="w-full h-28 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mb-3 overflow-hidden">
            {gift.image_url ? (
              <img src={gift.image_url} alt={gift.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl" aria-hidden="true">🎁</span>
            )}
          </div>

          {/* title + description */}
          <h3 className="font-bold text-slate-800 text-base leading-tight mb-1 line-clamp-2">
            {gift.title}
          </h3>
          {gift.description && (
            <p className="text-slate-500 text-sm line-clamp-2 mb-3">{gift.description}</p>
          )}

          {/* offerer */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="w-7 h-7 border border-amber-200">
              <AvatarImage src={gift.offered_by_image} alt={gift.offered_by_name} />
              <AvatarFallback className="text-xs bg-amber-100 text-amber-700">
                {gift.offered_by_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-slate-500">
              מוצעת ע"י <span className="font-medium text-slate-700">{gift.offered_by_name}</span>
            </span>
          </div>

          {/* spots */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
            {gift.max_recipients === 0 ? (
              <><Infinity className="w-3.5 h-3.5 text-amber-500" /> ללא הגבלת נשים</>
            ) : (
              <><Users className="w-3.5 h-3.5 text-amber-500" />
                {gift.claimed_by_ids?.length ?? 0} / {gift.max_recipients} בחרו
              </>
            )}
          </div>

          {/* actions */}
          {!currentUser ? (
            <p className="text-xs text-center text-slate-400">התחברי כדי לבחור מתנה</p>
          ) : isMine ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-500 border-red-200 hover:bg-red-50"
              onClick={() => onClose(gift)}
              disabled={isClosed}
            >
              {isClosed ? 'נסגרה' : 'סגרי מתנה'}
            </Button>
          ) : claimed ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-slate-500"
              onClick={() => onUnclaim(gift)}
            >
              ביטול בחירה
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              disabled={isFull || isClosed}
              onClick={() => onClaim(gift)}
            >
              <Gift className="w-4 h-4 ml-1.5" />
              {isFull ? 'נתפסה' : isClosed ? 'נסגרה' : 'קחי מתנה'}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── OfferForm ─────────────────────────────────────────────────────────────

function OfferGiftModal({ isOpen, onClose, currentUser, onSaved }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [recipientMode, setRecipientMode] = useState('one'); // 'one' | 'multiple' | 'unlimited'
  const [recipientCount, setRecipientCount] = useState(2);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setTitle(''); setDescription(''); setImageUrl('');
    setRecipientMode('one'); setRecipientCount(2);
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('נא להזין שם למתנה'); return; }
    setIsSaving(true);
    try {
      const max = recipientMode === 'unlimited' ? 0
        : recipientMode === 'one' ? 1
        : recipientCount;

      await PesachGift.create({
        offered_by_id: currentUser.id,
        offered_by_name: currentUser.full_name,
        offered_by_image: currentUser.profile_image || currentUser.avatar_url || '',
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        max_recipients: max,
        claimed_by_ids: [],
        status: 'available',
      });
      toast.success('המתנה פורסמה! 🎁');
      onSaved();
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בפרסום המתנה');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-amber-700">
            🎁 הצעי מתנה לפסח
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="gift-title" className="font-medium">שם המתנה *</Label>
            <Input
              id="gift-title"
              placeholder="למשל: ספר בישול, סט כלים, בד..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="gift-desc" className="font-medium">תיאור (אופציונלי)</Label>
            <Textarea
              id="gift-desc"
              placeholder="פרטים נוספים על המתנה..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 resize-none"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="gift-image" className="font-medium">קישור לתמונה (אופציונלי)</Label>
            <Input
              id="gift-image"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1"
              dir="ltr"
            />
          </div>

          <div>
            <Label className="font-medium block mb-2">למי מיועדת המתנה?</Label>
            <div className="space-y-2">
              {[
                { value: 'one', label: 'לאישה אחת בלבד', icon: <User className="w-4 h-4" /> },
                { value: 'multiple', label: 'למספר נשים', icon: <Users className="w-4 h-4" /> },
                { value: 'unlimited', label: 'ללא הגבלה', icon: <Infinity className="w-4 h-4" /> },
              ].map(({ value, label, icon }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    recipientMode === value
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-slate-200 hover:border-amber-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="recipientMode"
                    value={value}
                    checked={recipientMode === value}
                    onChange={() => setRecipientMode(value)}
                    className="accent-amber-500"
                  />
                  <span className="text-amber-600">{icon}</span>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </label>
              ))}
            </div>

            {recipientMode === 'multiple' && (
              <div className="mt-3 flex items-center gap-3">
                <Label htmlFor="count" className="text-sm whitespace-nowrap">מספר נשים:</Label>
                <Input
                  id="count"
                  type="number"
                  min={2}
                  max={100}
                  value={recipientCount}
                  onChange={(e) => setRecipientCount(Math.max(2, parseInt(e.target.value) || 2))}
                  className="w-24"
                  dir="ltr"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            {isSaving
              ? <><Loader2 className="w-4 h-4 animate-spin ml-2" />מפרסמת...</>
              : <><Gift className="w-4 h-4 ml-2" />פרסמי מתנה</>
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function PesachGifts() {
  const { currentUser } = useCurrentUser();
  const [gifts, setGifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'mine'

  const loadGifts = async () => {
    try {
      const data = await PesachGift.list('-created_date');
      setGifts(data);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בטעינת המתנות');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadGifts(); }, []);

  const handleClaim = async (gift) => {
    if (!currentUser) { toast.error('נא להתחבר קודם'); return; }
    try {
      const newIds = [...(gift.claimed_by_ids ?? []), currentUser.id];
      const newStatus = gift.max_recipients > 0 && newIds.length >= gift.max_recipients
        ? 'closed' : 'available';
      await PesachGift.update(gift.id, { claimed_by_ids: newIds, status: newStatus });
      toast.success('בחרת במתנה! 🎉');
      loadGifts();
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בבחירת המתנה');
    }
  };

  const handleUnclaim = async (gift) => {
    try {
      const newIds = (gift.claimed_by_ids ?? []).filter(id => id !== currentUser.id);
      await PesachGift.update(gift.id, { claimed_by_ids: newIds, status: 'available' });
      toast.success('הבחירה בוטלה');
      loadGifts();
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בביטול הבחירה');
    }
  };

  const handleClose = async (gift) => {
    try {
      await PesachGift.update(gift.id, { status: 'closed' });
      toast.success('המתנה נסגרה');
      loadGifts();
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בסגירת המתנה');
    }
  };

  const displayed = activeTab === 'mine'
    ? gifts.filter(g => g.offered_by_id === currentUser?.id)
    : gifts;

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-b border-amber-100">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none text-[120px] leading-none overflow-hidden flex flex-wrap gap-4 p-4">
          {['🌸','🌿','🎁','✨','🌸','🌿','🎁'].map((e, i) => (
            <span key={i} aria-hidden="true">{e}</span>
          ))}
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-10 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg mb-4">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-amber-800 mb-2">
              מתנות לפסח 🌸
            </h1>
            <p className="text-amber-700/80 text-base max-w-lg mx-auto mb-6">
              שתפי מתנה עם הקהילה — כל אישה יכולה להציע מתנה ולבחור מה שמתאים לה
            </p>
            {currentUser && (
              <Button
                onClick={() => setIsOfferOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
              >
                <Plus className="w-4 h-4 ml-2" />
                הציעי מתנה
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 border-b border-amber-100 pb-3">
          {[
            { key: 'all', label: 'כל המתנות', icon: <Sparkles className="w-4 h-4" /> },
            ...(currentUser ? [{ key: 'mine', label: 'המתנות שלי', icon: <Heart className="w-4 h-4" /> }] : []),
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-amber-100 text-amber-800'
                  : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              {icon}{label}
              {key === 'all' && gifts.length > 0 && (
                <span className="bg-amber-200 text-amber-800 text-xs rounded-full px-1.5 py-0.5 mr-1">
                  {gifts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-amber-50 shimmer" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState
            type="default"
            title={activeTab === 'mine' ? 'עדיין לא הצעת מתנה' : 'אין מתנות עדיין'}
            subtitle={activeTab === 'mine' ? 'לחצי על "הציעי מתנה" כדי להתחיל' : 'היי הראשונה לפרסם מתנה לקהילה!'}
            action={currentUser && activeTab !== 'mine' && (
              <Button
                onClick={() => setIsOfferOpen(true)}
                className="mt-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              >
                <Gift className="w-4 h-4 ml-2" /> הציעי מתנה
              </Button>
            )}
          />
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayed.map((gift) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  currentUser={currentUser}
                  onClaim={handleClaim}
                  onUnclaim={handleUnclaim}
                  onClose={handleClose}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <OfferGiftModal
        isOpen={isOfferOpen}
        onClose={() => setIsOfferOpen(false)}
        currentUser={currentUser}
        onSaved={loadGifts}
      />
    </div>
  );
}
