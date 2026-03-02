import React, { useState, useEffect, useCallback } from "react";
import { createPageUrl } from "@/utils";
import { useQueryClient } from '@tanstack/react-query';
import { CommunityPost } from "@/entities/CommunityPost";
import { Notification } from "@/entities/Notification";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, RefreshCw, AlertCircle as AlertCircleIcon, AlertTriangle, LogIn } from "lucide-react";
import { motion } from "framer-motion";

import ContactModal from "../components/ContactModal";
import SpotlightSkeleton from '../components/skeletons/SpotlightSkeleton';
import LoginModal from "../components/LoginModal";

import PersonalizedGreeting from "../components/home/PersonalizedGreeting";
import QuickActions from "../components/home/QuickActions";
import AnimatedStats from "../components/home/AnimatedStats";
import ServiceCategoriesBreakdown from "../components/home/ServiceCategoriesBreakdown";
import FeaturedServicesCarousel from "../components/home/FeaturedServicesCarousel";
import VolunteerServicesSection from "../components/home/VolunteerServicesSection";
import SpotlightPreview from "../components/home/SpotlightPreview";
import CommunityPostsPreview from "../components/home/CommunityPostsPreview";
import GratitudePreview from "../components/home/GratitudePreview";
import HolidayServicesSection from "../components/home/HolidayServicesSection";
import CTASection from "../components/home/CTASection";
import { useHomeShell, useHomeContent } from "../hooks/queries/useHomeData";

export default function Home() {
  const queryClient = useQueryClient();

  // React Query: shell data (user, spotlight, holiday)
  const { 
    data: shell, 
    isLoading: isShellLoading, 
    error: shellError 
  } = useHomeShell();

  const currentUser = shell?.currentUser ?? null;
  const spotlightUser = shell?.spotlightUser ?? null;
  const holidaySection = shell?.holidaySection ?? null;

  // React Query: content data (posts, gratitudes, services, stats)
  const { 
    data: content, 
    isLoading: isContentLoading, 
    error: contentError 
  } = useHomeContent(holidaySection);

  const recentPosts = content?.recentPosts ?? [];
  const recentGratitudes = content?.recentGratitudes ?? [];
  const allAuthors = content?.allAuthors ?? {};
  const allServices = content?.allServices ?? [];
  const holidayServices = content?.holidayServices ?? [];
  const stats = content?.stats ?? { services: 0, users: 139, posts: 0, gratitudes: 0 };

  // Local UI state only
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [contactModal, setContactModal] = useState({ isOpen: false, recipientId: null, recipientName: "", postId: null });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  // Optimistic likes: local override for post likes
  const [likesOverride, setLikesOverride] = useState({});

  // PWA install prompt
  useEffect(() => {
    try {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = isStandalone || window.navigator.standalone;

      if (!isInstalled) {
        setShowInstallPrompt(true);
      }

      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallPrompt(true);
      };

      if (!isInstalled) {
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    } catch (error) {
      console.error('❌ Error in install prompt setup:', error);
    }
  }, []);

  const handleInstallApp = useCallback(async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setShowInstallPrompt(false);
        setDeferredPrompt(null);
      } catch (error) {
        console.error("❌ Error showing install prompt:", error);
        setIsInstallDialogOpen(true);
      }
    } else {
      setIsInstallDialogOpen(true);
    }
  }, [deferredPrompt]);

  const handleContactAuthor = useCallback((post) => {
    if (!post?.author_id) return;
    const author = allAuthors[post.author_id];
    setContactModal({
      isOpen: true,
      recipientId: post.author_id,
      recipientName: author?.full_name || 'חברת קהילה',
      postId: post.id,
    });
  }, [allAuthors]);

  // Merge optimistic likes into posts
  const postsWithLikes = recentPosts.map((post) =>
    likesOverride[post.id] ? { ...post, likes: likesOverride[post.id] } : post
  );

  const handleLikePost = useCallback(async (postId) => {
    if (!currentUser || !postId) return;
    const post = recentPosts.find((p) => p.id === postId);
    if (!post) return;

    const currentLikes = likesOverride[postId] || post.likes || [];
    const isLiked = currentLikes.includes(currentUser.id);
    const newLikes = isLiked
      ? currentLikes.filter((id) => id !== currentUser.id)
      : [...currentLikes, currentUser.id];

    // Optimistic update
    setLikesOverride((prev) => ({ ...prev, [postId]: newLikes }));

    try {
      await CommunityPost.update(postId, { likes: newLikes });

      if (!isLiked && post.author_id && post.author_id !== currentUser.id) {
        await Notification.create({
          user_id: post.author_id,
          title: `${currentUser.full_name || 'משתמשת'} אהב/ה את הפוסט שלך`,
          message: `הפוסט "${post.content?.substring(0, 30) || 'ללא כותרת'}..." קיבל לייק חדש!`,
          type: 'post_liked',
          action_url: createPageUrl('CommunityCenter'),
          related_entity_id: postId,
          icon: '❤️',
        });
      }
    } catch (error) {
      console.error("❌ Home: Failed to update like:", error);
      // Revert optimistic update
      setLikesOverride((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }
  }, [currentUser, recentPosts, likesOverride]);

  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['home'] });
  }, [queryClient]);

  // Error states
  const criticalError = shellError?.message || null;
  const networkError = (!navigator.onLine && (isShellLoading || isContentLoading))
    ? "אין חיבור לאינטרנט. בדקי את החיבור ורענני את הדף."
    : null;

  if (criticalError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-4">שגיאה טכנית</h2>
            <p className="text-slate-600 mb-6">{criticalError}</p>
            <Button onClick={handleRetry} className="w-full bg-purple-600 hover:bg-purple-700">
              <RefreshCw className="w-4 h-4 ml-2" />
              נסי שוב
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isShellLoading) {
    return (
      <div className="relative p-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <section className="text-center py-12">
            <div className="h-8 w-48 bg-slate-200/80 rounded-lg animate-pulse mx-auto mb-4"></div>
            <div className="w-20 h-20 bg-slate-200/80 rounded-full animate-pulse mx-auto mb-8"></div>
            <div className="h-12 w-3/4 bg-slate-200/80 rounded-lg animate-pulse mx-auto mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/50 p-6 rounded-2xl shadow-lg h-48 animate-pulse"></div>
              ))}
            </div>
          </section>
          <SpotlightSkeleton />
        </div>
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <AlertCircleIcon className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">בעיה בחיבור</h2>
        <p className="text-slate-600 mb-4 max-w-md">{networkError}</p>
        <Button onClick={handleRetry} className="bg-purple-600 hover:bg-purple-700">
          <RefreshCw className="w-4 h-4 ml-2" />
          נסי שוב
        </Button>
      </div>
    );
  }

  return (
    <div className="fade-in relative min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 mb-16"
        >
          {currentUser ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
              <PersonalizedGreeting userName={currentUser.full_name?.split(' ')[0]} />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 mx-auto max-w-lg"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-purple-100 flex items-center justify-between gap-4">
                <div className="text-right">
                  <p className="font-bold text-slate-800">הצטרפי לקהילה! 💜</p>
                  <p className="text-sm text-slate-500">התחברי כדי לפרסם שירותים, לשלוח הודעות ועוד</p>
                </div>
                <Button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap px-6"
                >
                  <LogIn className="w-4 h-4 ml-2" />
                  התחברי
                </Button>
              </div>
              <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
            </motion.div>
          )}
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="inline-block p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl mb-8">
              <Sparkles className="w-16 h-16 text-purple-600" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="block mb-3">ברוכה הבאה ל</span>
              <span className="gradient-text">כֵּלִים שְׁלוּבִים</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
              הקהילה שלך לשיתוף שירותים, כישורים ותודה 💜
            </p>
          </motion.div>

          <QuickActions 
            currentUser={currentUser} 
            showInstallPrompt={showInstallPrompt} 
            onInstallApp={handleInstallApp}
            holidaySection={holidaySection}
          />
        </motion.section>

        <AnimatedStats stats={stats} isLoading={isContentLoading} />
        <ServiceCategoriesBreakdown allServices={allServices} isLoading={isContentLoading} />
        <FeaturedServicesCarousel services={allServices.slice(0, 9)} isLoading={isContentLoading} />
        <VolunteerServicesSection allServices={allServices} isLoading={isContentLoading} />

        {!isContentLoading && (
          <HolidayServicesSection holidaySection={holidaySection} holidayServices={holidayServices} />
        )}

        <SpotlightPreview spotlightUser={spotlightUser} />

        <CommunityPostsPreview
          recentPosts={postsWithLikes}
          allAuthors={allAuthors}
          currentUser={currentUser}
          isContentLoading={isContentLoading}
          onLikePost={handleLikePost}
          onContactAuthor={handleContactAuthor}
        />

        <GratitudePreview
          recentGratitudes={recentGratitudes}
          allAuthors={allAuthors}
          isContentLoading={isContentLoading}
        />

        <CTASection />
      </div>

      <ContactModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal({ isOpen: false, recipientId: null, recipientName: "", postId: null })}
        recipientId={contactModal.recipientId}
        recipientName={contactModal.recipientName}
        relatedPostId={contactModal.postId}
        defaultSubject="תגובה להודעתך בלוח הקהילה"
      />
    </div>
  );
}
