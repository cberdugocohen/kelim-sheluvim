import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Home, Users, MessageSquare, Gift, User, Shield } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const baseNavItems = [
  { title: 'בית', url: createPageUrl('Home'), icon: Home },
  { title: 'שירותים', url: createPageUrl('CommunityHub'), icon: Users },
  { title: 'קהילה', url: createPageUrl('CommunityCenter'), icon: MessageSquare },
  { title: 'מתנות', url: createPageUrl('PesachGifts'), icon: Gift },
  { title: 'פרופיל', url: createPageUrl('Profile'), icon: User },
];

const adminNavItem = { title: 'ניהול', url: createPageUrl('Admin'), icon: Shield, isAdmin: true };

export default function BottomNav() {
  const location = useLocation();
  const { currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  // For admins: replace 'פרופיל' with 'ניהול' to fit 6 items, or add admin as 6th
  const navItems = isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems;

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-purple-100/60 shadow-[0_-4px_24px_rgba(139,92,246,0.08)]"
      dir="rtl"
      aria-label="ניווט תחתון"
    >
      <div className="flex items-center justify-around h-[64px] px-2 max-w-lg mx-auto">
        {navItems.map(({ title, url, icon: Icon, isAdmin: isAdminItem }) => {
          const isActive = location.pathname === url || 
            (url === '/' + 'Home' && location.pathname === '/');
          
          return (
            <Link
              key={title}
              to={url}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1.5 rounded-xl transition-colors active:scale-95"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavPill"
                  className={`absolute inset-0 rounded-xl ${isAdminItem ? 'bg-orange-50' : 'bg-purple-50'}`}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`relative z-10 w-[22px] h-[22px] transition-colors duration-200 ${
                  isActive 
                    ? (isAdminItem ? 'text-orange-600 stroke-[2.5]' : 'text-purple-600 stroke-[2.5]') 
                    : (isAdminItem ? 'text-orange-400' : 'text-gray-400')
                }`}
              />
              <span
                className={`relative z-10 text-[11px] mt-0.5 transition-colors duration-200 ${
                  isActive 
                    ? (isAdminItem ? 'text-orange-700 font-bold' : 'text-purple-700 font-bold') 
                    : (isAdminItem ? 'text-orange-400 font-medium' : 'text-gray-400 font-medium')
                }`}
              >
                {title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
