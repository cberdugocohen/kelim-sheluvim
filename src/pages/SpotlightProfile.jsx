import React, { useState, useEffect } from 'react';
import { useLocation, Link } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { User } from '@/entities/User';
import { Student } from '@/entities/Student';
import { SpotlightRequest } from '@/entities/SpotlightRequest';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, Sparkles, Star, Mic, Film, Camera, MapPin, User as UserIcon, Briefcase, Gift, MessageCircle
} from "lucide-react";
import { motion } from "framer-motion";
import OptimizedImage from "@/components/OptimizedImage";
import ContactModal from "@/components/ContactModal";
import { formatPhoneForWhatsApp } from '@/utils/apiRetry';

// Helper function to convert YouTube link to embed link
const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = null;
    if (url.includes("youtube.com/watch?v=")) {
        videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

// New component for animated content sections
const ContentSection = ({ title, icon: Icon, children, bgColor = "bg-purple-50" }) => (
  <motion.div
    className="space-y-4"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
  >
    <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
      <div className={`w-9 h-9 ${bgColor} rounded-lg flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-purple-600" />
      </div>
      <span>{title}</span>
    </h2>
    {children}
  </motion.div>
);

export default function SpotlightProfilePage() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const userId = queryParams.get('userId');
    
    const [user, setUser] = useState(null);
    const [student, setStudent] = useState(null);
    const [spotlightData, setSpotlightData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contactModal, setContactModal] = useState({ 
        isOpen: false, 
        recipientId: null, 
        recipientName: "", 
        defaultSubject: "", 
        defaultContent: "" 
    });

    // Scroll to the top when the component mounts
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Load user data, student data, and spotlight request data
    useEffect(() => {
        if (userId) {
            const loadData = async () => {
                setIsLoading(true);
                setError(null);
                
                try {
                    
                    // Load spotlight request first (most important)
                    let spotlightReqData = null;
                    try {
                        const spotlightRes = await SpotlightRequest.filter({ user_id: userId, status: 'selected' }, '-created_date', 1);
                        spotlightReqData = spotlightRes && spotlightRes.length > 0 ? spotlightRes[0] : null;
                    } catch (spotlightError) {
                        console.warn("⚠️ SpotlightProfile: Could not load spotlight request:", spotlightError);
                    }
                    
                    if (!spotlightReqData) {
                        setError("לא נמצאה בקשת כוכבת שבוע פעילה למשתמשת זו");
                        setIsLoading(false);
                        return;
                    }
                    
                    setSpotlightData(spotlightReqData);
                    
                    // Try to load Student profile
                    let studentProfile = null;
                    try {
                        const studentRes = await Student.filter({ user_id: userId });
                        studentProfile = studentRes && studentRes.length > 0 ? studentRes[0] : null;
                    } catch (studentError) {
                        console.warn("⚠️ SpotlightProfile: Could not load student profile:", studentError);
                    }
                    
                    setStudent(studentProfile);
                    
                    // Try to load User details (optional)
                    let userData = null;
                    try {
                        const usersData = await User.filter({ id: userId });
                        userData = usersData && usersData.length > 0 ? usersData[0] : null;
                    } catch (userError) {
                        console.warn("⚠️ SpotlightProfile: Could not load user details:", userError);
                    }
                    
                    // If we don't have user data, create fallback from student or spotlight
                    if (!userData) {
                        userData = {
                            id: userId,
                            full_name: studentProfile?.full_name || spotlightReqData.created_by?.split('@')[0] || 'חברת קהילה',
                            profile_image: studentProfile?.profile_image || null
                        };
                    }
                    
                    setUser(userData);
                    
                } catch (error) {
                    console.error("❌ SpotlightProfile: Error loading data:", error);
                    setError("שגיאה בטעינת הנתונים. אנא נסי שוב.");
                }
                
                setIsLoading(false);
            };
            loadData();
        } else {
            setError("לא סופק מזהה משתמש");
            setIsLoading(false);
        }
    }, [userId]);

    const handleContact = () => {
        if (user) {
            setContactModal({
                isOpen: true,
                recipientId: user.id,
                recipientName: user.full_name,
                defaultSubject: `השראה ממך, ${user.full_name}! 🌟`,
                defaultContent: `שלום ${user.full_name.split(' ')[0] || ''}! ✨\n\nראיתי אותך ככוכבת השבוע שלנו וממש התרגשתי! 💫\nהסיפור שלך נגע לי והייתי אוהבת להכיר אותך יותר...\n\nתודה על כל ההשראה שאת נותנת! 💜\n\nבאהבה,\n[השם שלך]` 
            });
        }
    };

    const handleWhatsAppClick = () => {
        if (!student?.contact_info?.phone) return;
        
        const formattedPhone = formatPhoneForWhatsApp(student.contact_info.phone);
        if (!formattedPhone) {
            console.warn("Could not format phone number for WhatsApp:", student.contact_info.phone);
            return;
        }
        
        const message = encodeURIComponent(`שלום ${user?.full_name || ''}! ראיתי אותך ככוכבת השבוע ב"כלים שלובים" וממש התרגשתי! 🌟 אשמח להכיר אותך יותר 💜`);
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="text-center">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 border-8 border-pink-200 border-t-pink-500 rounded-full mx-auto animate-spin-slow"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Star className="w-8 h-8 text-pink-500" fill="currentColor" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-pink-600 mb-3">🎭 מכינות את הבמה...</h2>
                        <p className="text-gray-600 text-lg">בעוד רגע תכירי את כוכבת השבוע המדהימה שלנו</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !user || !spotlightData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
                <Card className="max-w-lg mx-auto text-center p-8 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl">
                    <CardContent>
                        <div>
                            <Star className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-700 mb-4">🔍 {error || 'כוכבת השבוע לא נמצאה'}</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            {error || 'נראה שכוכבת השבוע עדיין לא נבחרה או שהקישור לא תקין. אבל אל תדאגי - בקרוב תהיה לנו כוכבת חדשה!'}
                        </p>
                        <Link to={createPageUrl("Home")}>
                            <Button size="lg" className="bg-pink-500 hover:bg-pink-600 px-8 transform hover:scale-105 transition-all duration-300">
                                <ArrowLeft className="w-5 h-5 ml-2" />
                                חזרה לדף הבית
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const embedUrl = getYoutubeEmbedUrl(spotlightData?.video_url);
    
    // צור מערך משולב של כל התמונות
    const allImages = [
        ...(spotlightData?.images || []),
        ...(student?.additional_images || [])
    ].filter((img, index, self) => img && self.indexOf(img) === index);

    // תמונת פרופיל
    const profileImage = student?.profile_image || user?.profile_image;

    return (
        <div className="bg-gradient-to-b from-purple-50 via-pink-50 to-white min-h-screen" dir="rtl">
            <div className="max-w-4xl mx-auto p-4 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                    <Link to={createPageUrl("Home")}>
                        <Button variant="ghost" className="text-gray-600 hover:text-purple-600">
                            <ArrowLeft className="h-5 w-5 ml-2" /> חזרה
                        </Button>
                    </Link>
                </div>

                <Card className="w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
                    <motion.div 
                        className="p-6 sm:p-10 space-y-12"
                        dir="rtl"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.2 }
                            }
                        }}
                    >
                        <motion.div 
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            className="flex flex-col md:flex-row items-center gap-8 text-center md:text-right"
                        >
                            <div className="flex-shrink-0">
                                <OptimizedImage 
                                    src={profileImage} 
                                    alt={user.full_name} 
                                    className="w-32 h-32 sm:w-48 sm:h-48 rounded-full object-cover shadow-lg border-4 border-white transform hover:scale-105 transition-transform duration-300" 
                                    fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=8b5cf6&color=fff&size=192`}
                                />
                            </div>
                            <div className="flex-1 text-right">
                                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 mb-2">
                                    {user.full_name}
                                </h1>
                                {spotlightData?.tagline && (
                                    <p className="text-xl text-gray-700 italic font-medium mb-4 text-right">"{spotlightData.tagline}"</p>
                                )}
                                
                                {student?.city && (
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 mb-4">
                                        <MapPin className="w-5 h-5" />
                                        <span className="text-lg">{student.city}</span>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                                    <Button 
                                        onClick={handleContact} 
                                        size="lg"
                                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6"
                                    >
                                        <Send className="w-5 h-5 ml-2" />
                                        שלחי הודעה באפליקציה
                                    </Button>

                                    {student?.contact_info?.phone && (
                                        <Button 
                                            onClick={handleWhatsAppClick}
                                            size="lg"
                                            className="bg-[#25D366] hover:bg-[#20BD5A] text-white px-6"
                                        >
                                            <MessageCircle className="w-5 h-5 ml-2" />
                                            שלחי בווטסאפ
                                        </Button>
                                    )}
                                    
                                    <Link to={createPageUrl(`UserProfile?userId=${user.id}`)}>
                                        <Button 
                                            size="lg"
                                            variant="outline"
                                            className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 px-6 w-full sm:w-auto"
                                        >
                                            <UserIcon className="w-5 h-5 ml-2" />
                                            לפרופיל המלא במאגר
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>

                        {/* פרטי קשר */}
                        {student?.contact_info && Object.keys(student.contact_info).some(key => student.contact_info[key]) && (
                            <ContentSection title="פרטי קשר" icon={Send} bgColor="bg-blue-50">
                                <Card className="bg-blue-50/50 border-blue-200 shadow-md">
                                    <CardContent className="p-4 sm:p-6" dir="rtl">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                                            {student.contact_info.phone && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                        <span className="text-green-600 text-sm">📞</span>
                                                    </div>
                                                    <a href={`tel:${student.contact_info.phone}`} className="text-gray-700 hover:text-green-600">
                                                        {student.contact_info.phone}
                                                    </a>
                                                </div>
                                            )}
                                            {student.contact_info.email && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-blue-600 text-sm">📧</span>
                                                    </div>
                                                    <a href={`mailto:${student.contact_info.email}`} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-blue-600 break-all">
                                                        {student.contact_info.email}
                                                    </a>
                                                </div>
                                            )}
                                            {student.contact_info.instagram && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                                                        <span className="text-pink-600 text-sm">📷</span>
                                                    </div>
                                                    <a href={`https://instagram.com/${student.contact_info.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-pink-600">
                                                        @{student.contact_info.instagram.replace('@', '')}
                                                    </a>
                                                </div>
                                            )}
                                            {student.contact_info.website && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                        <span className="text-purple-600 text-sm">🌐</span>
                                                    </div>
                                                    <a href={student.contact_info.website} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-purple-600">
                                                        אתר אינטרנט
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </ContentSection>
                        )}

                        {/* תחומי התמחות */}
                        {student?.service_areas && student.service_areas.length > 0 && (
                            <ContentSection title="תחומי התמחות" icon={Sparkles} bgColor="bg-purple-50">
                                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                    {student.service_areas.map((area, index) => (
                                        <span key={index} className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium">
                                            {area}
                                        </span>
                                    ))}
                                </div>
                            </ContentSection>
                        )}

                        {/* הסיפור האישי */}
                        {spotlightData?.personal_story && (
                            <ContentSection title="הסיפור האישי שלי - איך הלימוד עם הרב אריה נווה שליט״א השפיע עליי" icon={Mic} bgColor="bg-purple-50">
                                <div className="bg-purple-50/50 rounded-xl p-6 border border-purple-100 shadow-inner text-right">
                                    <p className="text-lg text-gray-700 leading-loose whitespace-pre-wrap">{spotlightData.personal_story}</p>
                                </div>
                            </ContentSection>
                        )}

                        {/* תיאור העסק */}
                        {spotlightData?.business_description && (
                            <ContentSection title="על העסק והשירותים שלי" icon={Briefcase} bgColor="bg-blue-50">
                                <Card className="bg-blue-50/50 border-blue-200 shadow-md">
                                    <CardContent className="p-4 sm:p-6" dir="rtl">
                                        <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap text-right">{spotlightData.business_description}</p>
                                    </CardContent>
                                </Card>
                            </ContentSection>
                        )}

                        {/* מה אני מציעה לקהילה */}
                        {spotlightData?.what_i_offer && (
                            <ContentSection title="מה אני מציעה לקהילה" icon={Gift} bgColor="bg-green-50">
                                <Card className="bg-green-50/50 border-green-200 shadow-md">
                                    <CardContent className="p-4 sm:p-6" dir="rtl">
                                        <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap text-right">{spotlightData.what_i_offer}</p>
                                    </CardContent>
                                </Card>
                            </ContentSection>
                        )}

                        {/* העדפת יצירת קשר */}
                        {spotlightData?.contact_preference && (
                            <ContentSection title="איך ליצור איתי קשר" icon={Send} bgColor="bg-pink-50">
                                <Card className="bg-pink-50/50 border-pink-200 shadow-md">
                                    <CardContent className="p-4 sm:p-6" dir="rtl">
                                        <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap text-right">{spotlightData.contact_preference}</p>
                                    </CardContent>
                                </Card>
                            </ContentSection>
                        )}

                        {/* גלריית תמונות */}
                        {allImages.length > 0 && (
                            <ContentSection title="גלריית תמונות" icon={Camera} bgColor="bg-amber-50">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {allImages.map((img, index) => (
                                        <div key={index} className="rounded-xl overflow-hidden shadow-lg aspect-square">
                                            <OptimizedImage 
                                                src={img} 
                                                alt={`${user.full_name} - תמונה ${index + 1}`} 
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer" 
                                                onClick={() => window.open(img, '_blank')}
                                                fallbackSrc={`https://ui-avatars.com/api/?name=Image&background=f59e0b&color=fff&size=400`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </ContentSection>
                        )}

                        {/* סרטון וידאו */}
                        {embedUrl && (
                             <ContentSection title="סרטון" icon={Film} bgColor="bg-red-50">
                                <div className="aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-white">
                                    <iframe
                                        src={embedUrl}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                    ></iframe>
                                </div>
                            </ContentSection>
                        )}

                        {/* אזור יצירת קשר תחתון */}
                        <motion.div 
                            className="text-center pt-12 border-t border-purple-100"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">רוצות להכיר יותר?</h2>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button 
                                    onClick={handleContact} 
                                    size="lg"
                                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                                >
                                    <Send className="w-5 h-5 ml-2" />
                                    שלחי הודעה ל{user.full_name.split(' ')[0]}
                                </Button>

                                {student?.contact_info?.phone && (
                                    <Button 
                                        onClick={handleWhatsAppClick}
                                        size="lg"
                                        className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                                    >
                                        <MessageCircle className="w-5 h-5 ml-2" />
                                        שלחי בווטסאפ
                                    </Button>
                                )}
                                
                                <Link to={createPageUrl(`UserProfile?userId=${user.id}`)}>
                                    <Button 
                                        size="lg"
                                        variant="outline"
                                        className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 w-full sm:w-auto"
                                    >
                                        <UserIcon className="w-5 h-5 ml-2" />
                                        לפרופיל המלא במאגר
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                </Card>

            </div>

            <ContactModal
                isOpen={contactModal.isOpen}
                onClose={() => setContactModal({ isOpen: false, recipientId: null, recipientName: "", defaultSubject: "", defaultContent: "" })}
                recipientId={contactModal.recipientId}
                recipientName={contactModal.recipientName}
                defaultSubject={contactModal.defaultSubject}
                defaultContent={contactModal.defaultContent}
            />
        </div>
    );
}
