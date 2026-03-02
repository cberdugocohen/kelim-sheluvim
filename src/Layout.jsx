import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ErrorBoundary from "./components/ErrorBoundary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Home,
  Users,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Sparkles,
  Calendar,
  AlertTriangle,
  LogIn,
  Shield,
  Heart,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CollapsibleDisclaimer from "./components/CollapsibleDisclaimer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";
import LoginModal from "./components/LoginModal";
import BottomNav from "./components/BottomNav";
import BackToTop from "./components/BackToTop";
import PageTransition from "./components/PageTransition";
import { AnimatePresence } from "framer-motion";

const navigationItems = [
  { title: "דף הבית", url: createPageUrl("Home"), icon: Home },
  { title: "מאגר השירותים", url: createPageUrl("CommunityHub"), icon: Users },
  { title: "מרכז הקהילה", url: createPageUrl("CommunityCenter"), icon: MessageSquare },
  { title: "קיר בקשות תפילה", url: createPageUrl("PrayerRequests"), icon: Heart },
  { title: "לוח אירועים", url: createPageUrl("Events"), icon: Calendar },
  { title: "מתנות לפסח 🌸", url: createPageUrl("PesachGifts"), icon: Gift },
  { title: "מרכז התראות", url: createPageUrl("MyMessages"), icon: Bell, requiresAuth: true },
  { title: "הפרופיל שלי", url: createPageUrl("Profile"), icon: User, requiresAuth: true },
  { title: "ניהול מערכת", url: createPageUrl("Admin"), icon: Shield, adminOnly: true },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { currentUser, isLoading, refresh, logout } = useCurrentUser();
  const [layoutError, setLayoutError] = React.useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    document.title = "כְּלִים שְׁלוּבִים";
  }, []);

  useEffect(() => {
    // Re-check authentication when the user returns to the app
    const handleRefresh = () => refresh();
    window.addEventListener('focus', handleRefresh);
    window.addEventListener('online', handleRefresh);

    return () => {
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('online', handleRefresh);
    };
  }, [refresh]);

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  if (layoutError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center p-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-4">שגיאה בטעינת הממשק</h2>
          <p className="text-gray-600 mb-6">{layoutError}</p>
          <Button onClick={() => window.location.reload()} className="bg-purple-600 hover:bg-purple-700">
            רענני את הדף
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div
          className="min-h-screen flex w-full"
          dir="rtl"
        style={{
          background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 30%, #ede9fe 60%, #e0e7ff 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center'
        }}
      >
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-[100] focus:bg-purple-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
          דלגי לתוכן הראשי
        </a>

        <Sidebar className="border-l border-[var(--color-primary)]/10 bg-white/50 backdrop-blur-lg z-50" aria-label="תפריט ניווט ראשי">
          <SidebarHeader className="border-b border-[var(--color-primary)]/10 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-highlight)] rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-[var(--color-primary)] text-xl">כְּלִים שְׁלוּבִים</h2>
                <p className="text-xs text-[var(--color-soft-text)]">קהילה של לב ותודעה</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => {
                    if (item.requiresAuth && !currentUser && !isLoading) {
                      return null; // Don't show protected routes if not logged in
                    }
                    
                    // Check if item is admin only (hide only after auth is resolved)
                    if (item.adminOnly && !isLoading && (!currentUser || currentUser.role !== 'admin')) {
                      return null; // Don't show admin routes if not admin
                    }
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-all duration-300 rounded-xl mb-2 h-12 ${
                            location.pathname === item.url ? 'bg-[var(--color-secondary)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-dark-text)]'
                          } ${item.adminOnly ? 'bg-orange-50 border border-orange-200' : ''}`}
                        >
                          <Link to={item.url} className="flex items-center gap-4 px-4 py-3 relative">
                            <item.icon className={`w-5 h-5 ${item.adminOnly ? 'text-orange-600' : ''}`} />
                            <span className={`font-medium ${item.adminOnly ? 'text-orange-700' : ''}`}>{item.title}</span>
                            {item.adminOnly && (
                              <span className="absolute left-2 top-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-[var(--color-primary)]/10 p-4">
             {isLoading ? (
                <div className="flex items-center gap-3 p-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>
              ) : currentUser ? (
                <div className="space-y-3">
                   <Link to={createPageUrl("Profile")} className="flex items-center gap-3 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                      <Avatar className="w-10 h-10 border-2 border-white shadow-md">
                        <AvatarImage src={currentUser.profile_image} alt={currentUser.full_name} />
                        <AvatarFallback>{currentUser.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{currentUser.full_name}</p>
                        <p className="text-xs text-slate-500">{currentUser.role === 'admin' ? 'מנהלת' : 'חברת קהילה'}</p>
                      </div>
                    </Link>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <LogOut className="w-4 h-4 ml-2" />
                      התנתקות
                    </Button>
                </div>
              ) : (
                <>
                <Button onClick={handleLogin} className="w-full bg-purple-600 hover:bg-purple-700">
                  <LogIn className="w-5 h-5 ml-2" />
                  התחברות / הרשמה
                </Button>
                <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
              </>
              )}
          </SidebarFooter>
        </Sidebar>

        <main id="main-content" role="main" aria-label="תוכן ראשי" className="flex-1 flex flex-col min-w-0 z-0">
          <header className="glass-effect border-b border-[var(--color-primary)]/10 px-6 py-4 md:hidden relative z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[var(--color-primary)]" />
                <h1 className="text-xl font-bold text-[var(--color-primary)]">כְּלִים שְׁלוּבִים</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto w-full flex flex-col">
             <div className="flex-grow">
                <AnimatePresence mode="wait">
                  <PageTransition key={location.pathname}>
                    {children}
                  </PageTransition>
                </AnimatePresence>
             </div>
             <CollapsibleDisclaimer />
             <div className="h-16 md:hidden" /> {/* Spacer for bottom nav */}
          </div>
        </main>
        <BottomNav />
        <BackToTop />
      </div>
      </SidebarProvider>
      </ErrorBoundary>
      );
      }
