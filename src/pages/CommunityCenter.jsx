import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { User } from '@/entities/User';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageSquare, Loader2, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiCallWithRetry } from '@/utils/apiRetry';

// Lazy load the content of the tabs for better performance
const GratitudeWallContent = lazy(() => import('../components/community/GratitudeWallContent'));
const CommunityBoardContent = lazy(() => import('../components/community/CommunityBoardContent'));

const LoadingComponent = () => (
  <div className="flex justify-center items-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    <span className="mr-2">טוענת...</span>
  </div>
);

export default function CommunityCenterPage() {
  const { currentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('board');
  const [stats, setStats] = useState({ posts: 0, gratitudes: 0 });
  const [sharedUsersData, setSharedUsersData] = useState({}); // נתונים משותפים
  const [isLoadingSharedData, setIsLoadingSharedData] = useState(true);
  const [error, setError] = useState(null);

  // Load shared data once to prevent rate limiting
  const loadSharedData = useCallback(async () => {
    setIsLoadingSharedData(true);
    setError(null);
    
    try {
      // Load all users with retry mechanism
      const allUsers = await apiCallWithRetry(() => User.list());
      const usersMap = allUsers.reduce((acc, u) => {
        if (u.full_name && u.full_name.length > 2) {
          acc[u.id] = u;
        }
        return acc;
      }, {});
      setSharedUsersData(usersMap);

    } catch (error) {
      console.error("Error loading shared community data:", error);
      setError("שגיאה בטעינת נתוני הקהילה. אנא נסי לרענן את הדף.");
    }
    
    setIsLoadingSharedData(false);
  }, []);

  useEffect(() => {
    loadSharedData();
  }, [loadSharedData]);

  const updatePostsStats = useCallback((count) => {
    setStats(prev => ({ ...prev, posts: count }));
  }, []); // setStats is a stable reference, so an empty dependency array is appropriate.

  const updateGratitudesStats = useCallback((count) => {
    setStats(prev => ({ ...prev, gratitudes: count }));
  }, []); // setStats is a stable reference, so an empty dependency array is appropriate.

  const handleRetry = () => {
    loadSharedData();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4 sm:p-6 flex items-center justify-center" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-4">אופס! יש לנו בעיה טכנית</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={handleRetry} className="bg-purple-600 hover:bg-purple-700">
              <RefreshCw className="w-4 h-4 ml-2" />
              נסי שוב
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4 sm:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-block mb-6 relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full blur-lg opacity-50"></div>
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl relative">
              <Users className="w-12 h-12 text-purple-500" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 mb-4">
            מרכז הקהילה
          </h1>
          
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8">
            המקום שלך לשתף, להודות, וליצור קשרים חמים בקהילה שלנו 💖
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <Card className="bg-white/70 backdrop-blur-sm border-purple-200 text-center p-4">
            <CardContent className="p-2">
              <div className="text-2xl font-bold text-purple-600">{stats.posts}</div>
              <div className="text-sm text-gray-600">הודעות בלוח</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm border-pink-200 text-center p-4">
            <CardContent className="p-2">
              <div className="text-2xl font-bold text-pink-600">{stats.gratitudes}</div>
              <div className="text-sm text-gray-600">תודות בקיר</div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl">
            <TabsTrigger value="board" className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              לוח הודעות
            </TabsTrigger>
            <TabsTrigger value="gratitude" className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              קיר התודות
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="board" className="mt-0">
            <Suspense fallback={<LoadingComponent />}>
              <CommunityBoardContent 
                currentUser={currentUser} 
                onStatsUpdate={updatePostsStats}
                sharedUsersData={sharedUsersData}
                isLoadingSharedData={isLoadingSharedData}
              />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="gratitude" className="mt-0">
            <Suspense fallback={<LoadingComponent />}>
              <GratitudeWallContent 
                currentUser={currentUser} 
                onStatsUpdate={updateGratitudesStats}
                sharedUsersData={sharedUsersData}
                isLoadingSharedData={isLoadingSharedData}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
