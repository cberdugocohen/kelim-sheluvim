import React, { useState, useCallback, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Shield,
  Loader2,
  AlertTriangle,
  Database,
  Crown,
  List,
  Bug,
  Gift,
  Users as UsersIcon,
  CheckSquare,
  Briefcase,
  BarChart2,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { apiCallWithRetry } from '@/utils/apiRetry';

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [adminReady, setAdminReady] = useState(false);

  const checkAdminPermissions = useCallback(async () => {
    setIsCheckingAuth(true);
    setAuthError(null);

    try {
      const user = await apiCallWithRetry(() => User.me());
      
      if (!user || user.role !== 'admin') {
        setAuthError('אין הרשאות אדמין - צור קשר עם מנהלת המערכת');
        return;
      }
      
      setCurrentUser(user);
      setIsInitialized(true);
      setAdminReady(true);
      
    } catch (error) {
      console.error("❌ Error checking admin permissions:", error);
      if (error.message?.includes('Rate limit exceeded')) {
        setAuthError('השרת עמוס מדי כרגע. אנא המתיני 10-15 דקות ונסי שוב.');
      } else if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
        setAuthError('בעיה בחיבור לאינטרנט. אנא בדקי את החיבור ונסי שוב.');
      } else {
        setAuthError('שגיאה בבדיקת הרשאות. נסי לרענן את הדף או לחזור מאוחר יותר.');
      }
    }
    setIsCheckingAuth(false);
  }, []);

  if (!isInitialized && !authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">מרכז הבקרה</h1>
            <p className="text-slate-600 text-lg mb-8">לחצי על הכפתור כדי לגשת למרכז הבקרה</p>
            
            <Alert className="border-blue-200 bg-blue-50 mb-8 max-w-2xl mx-auto">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>הודעה חשובה:</strong> פאנל הניהול לא נטען אוטומטית כדי למנוע עומס על השרת.
              </AlertDescription>
            </Alert>

            {!isCheckingAuth ? (
              <Button 
                onClick={checkAdminPermissions} 
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg px-8 py-4 text-lg"
              >
                <Shield className="w-5 h-5 ml-2" />
                בדוק הרשאות והיכנס למערכת
              </Button>
            ) : (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto" />
                <p className="text-purple-700 font-medium">בודק הרשאות מנהל...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 max-w-lg"
        >
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-red-800 mb-4">שגיאה בגישה</h2>
          <p className="text-red-600 text-lg mb-6">{authError}</p>
          
          <Button
            onClick={checkAdminPermissions}
            disabled={isCheckingAuth}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isCheckingAuth ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                בודק שוב...
              </>
            ) : (
              "נסה שוב"
            )}
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-red-800 mb-4">אין הרשאה</h2>
          <p className="text-red-600 text-lg">רק מנהלות המערכת יכולות לגשת לאיזור זה.</p>
        </div>
      </div>
    );
  }

  if (!adminReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-4">מכין את מרכז הבקרה</h1>
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-green-700 font-medium">טוען את כל הרכיבים...</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard currentUser={currentUser} />;
}

function AdminLoadingState() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">טוען נתונים עבורך...</p>
      </CardContent>
    </Card>
  );
}

const TABS_CONFIG = [
  { id: "users", component: "UserManagement", label: "משתמשות", icon: UsersIcon },
  { id: "profile-approvals", component: "ProfileApprovalManagement", label: "פרופילים", icon: CheckSquare },
  { id: "services", component: "ServiceApproval", label: "שירותים", icon: Briefcase },
  { id: "duplicates", component: "DuplicateServicesCleaner", label: "כפילויות", icon: Trash2, color: "orange" },
  { id: "spotlight", component: "SpotlightManagement", label: "כוכבת", icon: Crown },
  { id: "holidays", component: "HolidaySectionManager", label: "חגים", icon: Gift }
];

function AdminDashboard({ currentUser }) {
  const [activeTab, setActiveTab] = useState("users");
  const [adminComponents, setAdminComponents] = useState({});


  const loadAdminComponent = useCallback(async (componentName) => {
    if (adminComponents[componentName]) return adminComponents[componentName];
    
    try {
      let component;
      switch (componentName) {
        case 'UserManagement':
          component = (await import("../components/UserManagement")).default;
          break;
        case 'ServiceApproval':
          component = (await import("../components/ServiceApproval")).default;
          break;
        case 'SpotlightManagement':
          component = (await import("../components/SpotlightManagement")).default;
          break;
        case 'ProfileApprovalManagement':
          component = (await import("../components/ProfileApprovalManagement")).default;
          break;
        case 'HolidaySectionManager':
          component = (await import("../components/HolidaySectionManager")).default;
          break;
        case 'DuplicateServicesCleaner':
          component = (await import("../components/DuplicateServicesCleaner")).default;
          break;
        default:
          throw new Error(`Unknown admin component: ${componentName}`);
      }
      
      setAdminComponents(prev => ({ ...prev, [componentName]: component }));
      return component;
    } catch (error) {
      console.error(`Failed to load ${componentName}:`, error);
      return null;
    }
  }, [adminComponents]);

  useEffect(() => {
    const currentTabConfig = TABS_CONFIG.find(tab => tab.id === activeTab);
    if (currentTabConfig && !adminComponents[currentTabConfig.component]) {
      loadAdminComponent(currentTabConfig.component);
    }
  }, [activeTab, adminComponents, loadAdminComponent]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-4 sm:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">מרכז הבקרה</h1>
              <p className="text-slate-600">שלום {currentUser.full_name}</p>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir="rtl">
          <div className="sticky top-0 z-50 bg-white p-2 rounded-xl shadow-lg">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2 bg-slate-50 p-2 rounded-lg">
              {TABS_CONFIG.map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id} 
                  className={`data-[state=active]:bg-${tab.color || 'purple'}-600 data-[state=active]:text-white flex items-center justify-center gap-1 text-xs md:text-sm py-2`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {TABS_CONFIG.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {adminComponents[tab.component] ? (
                React.createElement(adminComponents[tab.component])
              ) : (
                <AdminLoadingState />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
