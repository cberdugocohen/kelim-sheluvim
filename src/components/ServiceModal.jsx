import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Recommendation } from "@/entities/Recommendation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  MapPin,
  User as UserIcon,
  Star,
  MessageSquare,
  Phone,
  Mail,
  Instagram,
  Globe
} from "lucide-react";
import { motion } from "framer-motion";
import ContactModal from "./ContactModal";
import toast from "react-hot-toast";

export default function ServiceModal({ isOpen, onClose, service, currentUser, recommendations = [], onRecommendationAdded = () => {} }) {
  const [newRecommendation, setNewRecommendation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactModal, setContactModal] = useState({ isOpen: false, recipientId: null, recipientName: "" });

  if (!service) return null;

  const { title, description, category, geographic_area, images, price, price_range } = service;

  const isValidId = (id) => id && /^[0-9a-fA-F]{24}$/.test(id);

  const handleSendMessage = async () => {
    if (!currentUser) {
      toast.success("עליך להתחבר כדי לשלוח הודעה");
      return;
    }

    if (currentUser.id === service.provider_id) {
      toast.success("לא ניתן לשלוח הודעה לעצמך");
      return;
    }

    const providerName = service.provider_name || "חברת קהילה";

    setContactModal({
      isOpen: true,
      recipientId: service.provider_id,
      recipientName: providerName
    });
  };

  const handleAddRecommendation = async (e) => {
    e.preventDefault();
    if (!newRecommendation.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      await Recommendation.create({
        service_id: service.id,
        content: newRecommendation,
        recommender_id: currentUser.id
      });
      setNewRecommendation("");
      if (onRecommendationAdded) {
        onRecommendationAdded();
      }
    } catch (error) {
      toast.error("שגיאה בהוספת המלצה");
    }
    setIsSubmitting(false);
  };
  
  const contactChannels = [
    { key: 'phone', label: 'טלפון', icon: Phone, value: service.student_data?.contact_info?.phone },
    { key: 'email', label: 'מייל', icon: Mail, value: service.student_data?.contact_info?.email },
    { key: 'website', label: 'אתר', icon: Globe, value: service.student_data?.contact_info?.website },
    { key: 'instagram', label: 'אינסטגרם', icon: Instagram, value: service.student_data?.contact_info?.instagram },
  ].filter(channel => channel.value);

  const displayPrice = price_range || price || null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-800 hidden">
                  {/* Title is moved to main content area as h2 */}
                </DialogTitle>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="absolute top-4 left-4 rounded-full">
                    <X className="h-5 w-5" />
                  </Button>
                </DialogClose>
              </DialogHeader>

              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-4">{title}</h2>
                <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">{description}</p>
              </div>

              {/* Image Gallery */}
              {images && images.length > 0 && (
                <div className="mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="rounded-xl overflow-hidden shadow-lg">
                        <img src={image} alt={`${title} ${index + 1}`} className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Details and Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-500" />
                    <span className="text-slate-700">{geographic_area}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5 text-slate-500" />
                    <span className="text-slate-700">{service.provider_name || "חברת קהילה"}</span>
                  </div>
                  {displayPrice && (
                    <div className="text-2xl font-bold text-purple-600">
                      {displayPrice === "התנדבות" ? "💝 " + displayPrice :
                       displayPrice === "בתשלום" ? "💼 " + displayPrice :
                       "₪" + displayPrice}
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                {contactChannels.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">דרכי קשר</h4>
                    <div className="space-y-2">
                      {contactChannels.map((channel) => (
                        <div key={channel.key} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                          <channel.icon className="w-4 h-4 text-slate-500" />
                          <a
                            href={
                              channel.key === 'phone' ? `tel:${channel.value}` :
                              channel.key === 'email' ? `mailto:${channel.value}` :
                              (String(channel.value).startsWith('http') ? channel.value : `https://${channel.value}`)
                            }
                            target={channel.key !== 'phone' && channel.key !== 'email' ? '_blank' : undefined}
                            rel="noopener noreferrer"
                            className="text-slate-700 text-sm hover:underline break-all"
                          >
                            {channel.value}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Service Areas/Categories */}
              {service.service_areas && service.service_areas.length > 0 && (
                <div className="mb-8">
                  <h4 className="font-semibold text-slate-800 mb-3">תחומי השירות</h4>
                  <div className="flex flex-wrap gap-2">
                    {service.service_areas.map((area, index) => (
                      <Badge key={index} className="bg-purple-100 text-purple-800 px-3 py-1">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations Section - only if not from student profile */}
              {!service.is_student_service && recommendations && (
                <div className="mb-8 border-t pt-8">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    המלצות ({recommendations.length})
                  </h4>

                  {recommendations.length > 0 && (
                    <div className="space-y-3 mb-6">
                      {recommendations.map((rec) => (
                        <div key={rec.id} className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                          <p className="text-slate-700 leading-relaxed">"{rec.content}"</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentUser && currentUser.id !== service.provider_id && (
                    <form onSubmit={handleAddRecommendation} className="space-y-3">
                      <Textarea
                        value={newRecommendation}
                        onChange={(e) => setNewRecommendation(e.target.value)}
                        placeholder="שתפי את ההמלצה שלך..."
                        maxLength={150}
                        className="bg-white border-slate-200 focus:border-purple-400 rounded-xl"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">{newRecommendation.length}/150</span>
                        <Button
                          type="submit"
                          disabled={!newRecommendation.trim() || isSubmitting}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        >
                          <Star className="w-4 h-4 ml-2" />
                          הוספת המלצה
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              <DialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-8 pt-6 border-t">
                  {isValidId(service.provider_id) && (
                      <Link to={createPageUrl(`UserProfile?userId=${service.provider_id}`)}>
                          <Button variant="outline" className="w-full sm:w-auto">
                              <UserIcon className="w-4 h-4 ml-2" />
                              צפייה בפרופיל המלא
                          </Button>
                      </Link>
                  )}
                  <Button
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={handleSendMessage}
                      disabled={!currentUser || currentUser.id === service.provider_id}
                  >
                      <MessageSquare className="w-4 h-4 ml-2" />
                      שליחת הודעה פרטית
                  </Button>
              </DialogFooter>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <ContactModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal({ isOpen: false, recipientId: null, recipientName: "" })}
        recipientId={contactModal.recipientId}
        recipientName={contactModal.recipientName}
        defaultSubject={`שאלה לגבי השירות: ${service.title}`}
        defaultContent={`שלום ${contactModal.recipientName},\n\nראיתי את השירות שלך "${service.title}" ואשמח לקבל פרטים נוספים.\n\nתודה!`}
      />
    </>
  );
}
