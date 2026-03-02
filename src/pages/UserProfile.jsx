import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { User } from '@/entities/User';
import { Student } from '@/entities/Student';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatPhoneForWhatsApp, formatUrl } from '@/utils/apiRetry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  User as UserIcon,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Star,
  LogIn,
  Edit,
  MessageCircle,
  ExternalLink,
  Image as ImageIcon,
  Briefcase // Added Briefcase icon
} from 'lucide-react';
import ContactModal from '../components/ContactModal';
import ServiceModal from '../components/ServiceModal';
import RecommendationForm from "../components/RecommendationForm"; // New import
import RecommendationsList from "../components/RecommendationsList"; // New import
import toast from "react-hot-toast";

const createPageUrl = (pageName) => {
  switch (pageName) {
    case "Profile":
      return "/profile/edit";
    default:
      return "/";
  }
};

export default function UserProfile() {
  const location = useLocation();
  const { currentUser } = useCurrentUser();
  const [studentProfile, setStudentProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Updated contactModal state structure to include defaultSubject and defaultContent
  const [contactModal, setContactModal] = useState({ isOpen: false, recipientId: null, recipientName: "", defaultSubject: "", defaultContent: "" });
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  // Renamed selectedService to serviceModal and updated its structure
  const [serviceModal, setServiceModal] = useState({ isOpen: false, service: null });
  // New state for recommendation modal
  const [recommendationModal, setRecommendationModal] = useState({
    isOpen: false,
    serviceId: null,
    serviceProviderId: null
  });

  async function loadProfileData() { // Made loadProfileData a stable function
    setIsLoading(true);
    setError(null);

    const urlParams = new URLSearchParams(location.search);
    const userId = urlParams.get('userId');


    if (!userId) {
      setError('לא נמצא מזהה משתמש');
      setIsLoading(false);
      return;
    }

    try {
      if (currentUser) {
        setIsOwnProfile(currentUser.id === userId);
      }
    } catch (e) {
      setIsOwnProfile(false);
    }

    try {
      const students = await Student.filter({ user_id: userId });
      
      if (students.length > 0) {
        if (students[0].services && students[0].services.length > 0) {
        }
      }

      if (students.length === 0) {
        console.warn("⚠️ No profile found for userId:", userId);
        setStudentProfile(null);
      } else {
        setStudentProfile(students[0]);
      }
    } catch (err) {
      console.error("❌ Error loading profile:", err);
      console.error("Error details:", err.message);
      setError(err.message || 'שגיאה בטעינת הפרופיל');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProfileData();
  }, [location.search]);

  const handleLoginRedirect = async () => {
    try {
      await User.login();
    } catch (error) {
      console.error("Login failed", error);
      toast.error("שגיאה בתהליך ההתחברות. נסי שוב.");
    }
  };

  const handleContactUser = () => {
    if (!currentUser) {
      toast.success('יש להתחבר כדי ליצור קשר');
      return;
    }

    setContactModal({
      isOpen: true,
      recipientId: studentProfile.user_id,
      recipientName: studentProfile.full_name || studentProfile.username || 'חברת קהילה',
      defaultSubject: "הודעה מפרופיל בקהילה",
      defaultContent: `שלום ${studentProfile.full_name || studentProfile.username || ''}! ראיתי את הפרופיל שלך ב"כלים שלובים" ואשמח ליצור קשר 😊` 
    });
  };

  const handleWhatsAppClick = (phone, name) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    if (!formattedPhone) return;
    
    const message = encodeURIComponent(`שלום ${name || ''}! ראיתי את הפרופיל שלך ב"כלים שלובים" ואשמח ליצור קשר 😊`);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  // New function to open recommendation modal
  const handleOpenRecommendation = (serviceId, providerId) => {
    if (!currentUser) {
      toast.success('יש להתחבר כדי להוסיף המלצה');
      return;
    }
    
    setRecommendationModal({
      isOpen: true,
      serviceId: serviceId,
      serviceProviderId: providerId
    });
  };

  // New function to handle recommendation success
  const handleRecommendationSuccess = () => {
    // Reload the page to show the new recommendation
    loadProfileData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">טוענים את הפרופיל...</h2>
          <p className="text-slate-500">מביאים את המידע העדכני ביותר</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6 flex items-center justify-center" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-4">שגיאה בטעינת הפרופיל</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} className="w-full bg-purple-600 hover:bg-purple-700">
                <RefreshCw className="w-4 h-4 ml-2" />
                נסי שוב
              </Button>
              <Button variant="outline" onClick={() => window.history.back()} className="w-full">
                חזור אחורה
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!studentProfile && isOwnProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6 flex items-center justify-center" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Edit className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">הפרופיל שלך עדיין ריק</h2>
            <p className="text-slate-600 mb-6">
              עדיין לא מילאת את הפרופיל שלך. בואי נעשה את זה יחד!
              זה לוקח רק דקה ויעזור לחברות הקהילה להכיר אותך.
            </p>
            <Link to={createPageUrl("Profile")}>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6">
                <Edit className="w-5 h-5 ml-2" />
                בואי נמלא את הפרופיל
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!studentProfile && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6 flex items-center justify-center" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <UserIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-4">פרופיל לא זמין</h2>
            <p className="text-slate-600 mb-6">
              המשתמשת עדיין לא השלימה את הפרופיל שלה
            </p>
            <Button variant="outline" onClick={() => window.history.back()} className="w-full">
              חזור אחורה
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(studentProfile.full_name || studentProfile.username || 'משתמש')}&background=8b5cf6&color=fff&size=400`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-4 sm:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto"> {/* Changed max-w-6xl to max-w-4xl */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="mb-8 bg-white/90 backdrop-blur-sm shadow-xl border-0">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-2xl border-4 border-white flex-shrink-0">
                  <img
                    src={studentProfile.profile_image || fallbackImage}
                    alt={studentProfile.full_name || studentProfile.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = fallbackImage;
                    }}
                  />
                </div>

                <div className="flex-1 text-center lg:text-right">
                  <h1 className="text-4xl font-black text-slate-800 mb-2">
                    {studentProfile.full_name || studentProfile.username || 'חברת קהילה'}
                  </h1>

                  {studentProfile.description && (
                    <p className="text-lg text-slate-600 leading-relaxed mb-6 max-w-2xl">
                      {studentProfile.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-6">
                    {studentProfile.city && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-5 h-5" />
                        <span>{studentProfile.city}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-500">
                      <UserIcon className="w-5 h-5" />
                      <span>חברת קהילה</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                    {currentUser && currentUser.id !== studentProfile.user_id && (
                      <Button
                        onClick={handleContactUser}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3"
                        size="lg"
                      >
                        <MessageSquare className="w-5 h-5 ml-2" />
                        שלחי הודעה באפליקציה
                      </Button>
                    )}

                    {studentProfile.contact_info?.phone && (
                      <Button
                        onClick={() => handleWhatsAppClick(
                          studentProfile.contact_info.phone,
                          studentProfile.full_name || studentProfile.username
                        )}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
                        size="lg"
                      >
                        <MessageCircle className="w-5 h-5 ml-2" />
                        שלחי הודעה בווטסאפ
                      </Button>
                    )}

                    {!currentUser && (
                      <Button onClick={handleLoginRedirect} className="bg-purple-600 hover:bg-purple-700">
                        <LogIn className="w-4 h-4 ml-2" />
                        התחברי כדי ליצור קשר
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {studentProfile && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {studentProfile.service_areas && studentProfile.service_areas.length > 0 && (
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Star className="w-5 h-5 text-purple-600" />
                      תחומי התמחות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {studentProfile.service_areas.map((area, index) => (
                        <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {studentProfile.contact_info && (
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      פרטי קשר
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {studentProfile.contact_info.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-slate-500" />
                          <span className="text-slate-700">{studentProfile.contact_info.phone}</span>
                        </div>
                      )}
                      {studentProfile.contact_info.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-slate-500" />
                          <span className="text-slate-700">{studentProfile.contact_info.email}</span>
                        </div>
                      )}
                      {studentProfile.contact_info.website && (
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-slate-500" />
                          <a 
                            href={formatUrl(studentProfile.contact_info.website)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-purple-600 hover:underline flex items-center gap-1"
                          >
                            {studentProfile.contact_info.website}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {studentProfile.contact_info.instagram && (
                        <div className="flex items-center gap-3">
                          <Instagram className="w-5 h-5 text-slate-500" />
                          <a 
                            href={`https://instagram.com/${studentProfile.contact_info.instagram}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-purple-600 hover:underline"
                          >
                            @{studentProfile.contact_info.instagram}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Services Section - Updated structure */}
          {studentProfile && studentProfile.services && studentProfile.services.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-purple-600" />
                    השירותים שלי
                  </h2>

                  <div className="space-y-6">
                    {studentProfile.services.map((service, index) => {
                      const serviceWithProvider = {
                        ...service,
                        provider_id: studentProfile.user_id,
                        provider_name: studentProfile.full_name || studentProfile.username,
                        provider_image: studentProfile.profile_image,
                        geographic_area: service.geographic_area || studentProfile.city || 'לא צוין'
                      };
                      
                      return (
                        <motion.div
                          key={service.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="bg-slate-50/50 border border-slate-200 hover:shadow-md transition-shadow">
                           <CardContent className="p-5">
                             <div className="flex flex-col md:flex-row gap-4">
                               {service.images && Array.isArray(service.images) && service.images.length > 0 && service.images[0] && (
                                 <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                                   <img
                                     src={service.images[0]}
                                     alt={service.title}
                                     className="w-full h-full object-cover"
                                     onError={(e) => {
                                       console.warn('Failed to load service image:', service.images[0]);
                                       e.target.style.display = 'none';
                                     }}
                                   />
                                 </div>
                               )}

                                <div className="flex-1 space-y-3">
                                  <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                                      <a 
                                        href="#" // Placeholder for service detail page link
                                        onClick={(e) => {e.preventDefault(); setServiceModal({ isOpen: true, service: serviceWithProvider });}}
                                        className="hover:underline"
                                      >
                                        {service.title}
                                      </a>
                                    </h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                      {service.description}
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    {service.category && (
                                      <Badge className="bg-purple-100 text-purple-800">
                                        {service.category}
                                      </Badge>
                                    )}
                                    {service.price_range && ( // Changed 'price' to 'price_range' to match studentProfile structure
                                      <Badge className="bg-green-100 text-green-800">
                                        {service.price_range}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* NEW: Add Recommendation Button */}
                                  {currentUser && currentUser.id !== studentProfile?.user_id && service.id && (
                                    <div className="pt-2">
                                      <Button
                                        onClick={() => handleOpenRecommendation(service.id, studentProfile?.user_id)}
                                        variant="outline"
                                        size="sm"
                                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                      >
                                        <Star className="w-4 h-4 ml-2" />
                                        המליצי על השירות
                                      </Button>
                                    </div>
                                  )}

                                  {/* NEW: Show Recommendations */}
                                  {service.id && (
                                    <div className="pt-4 border-t border-slate-200 mt-4">
                                      <RecommendationsList serviceId={service.id} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          )}
          
          {studentProfile && studentProfile.additional_images && studentProfile.additional_images.length > 0 && (
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg mb-8">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  גלריית תמונות ({studentProfile.additional_images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {studentProfile.additional_images.map((image, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                      <img
                        src={image}
                        alt={`תמונה ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${index + 1}&background=e5e7eb&color=6b7280&size=200`;
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!studentProfile.service_areas?.length && !studentProfile.additional_images?.length && !studentProfile.services?.length && (
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg text-center py-12">
              <CardContent>
                <UserIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-600 mb-2">פרופיל בסיסי</h3>
                <p className="text-slate-500">
                  המשתמשת עדיין לא יצרה פרופיל מקצועי מפורט
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Existing Modals - Updated props */}
      <ContactModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal({ isOpen: false, recipientId: null, recipientName: "", defaultSubject: "", defaultContent: "" })}
        recipientId={contactModal.recipientId}
        recipientName={contactModal.recipientName}
        defaultSubject={contactModal.defaultSubject}
        defaultContent={contactModal.defaultContent}
      />

      <ServiceModal
        isOpen={serviceModal.isOpen}
        onClose={() => setServiceModal({ isOpen: false, service: null })}
        service={serviceModal.service}
        currentUser={currentUser}
      />

      {/* NEW: Recommendation Modal */}
      <RecommendationForm
        isOpen={recommendationModal.isOpen}
        onClose={() => setRecommendationModal({ isOpen: false, serviceId: null, serviceProviderId: null })}
        serviceId={recommendationModal.serviceId}
        serviceProviderId={recommendationModal.serviceProviderId}
        currentUser={currentUser}
        onSuccess={handleRecommendationSuccess}
      />
    </div>
  );
}
