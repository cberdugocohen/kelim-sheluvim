import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Service } from "@/entities/Service";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Briefcase,
  Heart,
  GraduationCap,
  Home as HomeIcon,
  Scissors,
  Baby,
  Scale,
  Stethoscope,
  Users,
  ArrowLeft,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";

const POPULAR_CATEGORIES = [
  { name: "טיפולים", icon: Heart, color: "from-pink-500 to-rose-500", query: "טיפול" },
  { name: "עורכות דין", icon: Scale, color: "from-blue-500 to-indigo-500", query: "עורכת דין" },
  { name: "חינוך", icon: GraduationCap, color: "from-purple-500 to-violet-500", query: "חינוך" },
  { name: "בריאות", icon: Stethoscope, color: "from-green-500 to-emerald-500", query: "בריאות" },
  { name: "יופי וטיפוח", icon: Scissors, color: "from-orange-500 to-amber-500", query: "יופי" },
  { name: "ילדים", icon: Baby, color: "from-cyan-500 to-teal-500", query: "ילדים" },
  { name: "עסקים", icon: Briefcase, color: "from-slate-600 to-gray-600", query: "עסק" },
  { name: "בית ומשפחה", icon: HomeIcon, color: "from-red-500 to-pink-500", query: "בית" },
];

export default function HomeNew() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentServices, setRecentServices] = useState([]);
  const [stats, setStats] = useState({ services: 0, providers: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const services = await Service.list();
      const approved = services.filter(s => s.approval_status === 'approved');
      
      setRecentServices(approved.slice(0, 6));
      setStats({
        services: approved.length,
        providers: new Set(approved.map(s => s.user_id)).size
      });
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query = searchQuery) => {
    if (!query.trim()) {
      toast('הזיני מילת חיפוש', { icon: '🔍' });
      return;
    }
    navigate({
      pathname: createPageUrl('Services'),
      search: `?search=${encodeURIComponent(query)}`
    });
  };

  const handleCategoryClick = (categoryQuery) => {
    navigate({
      pathname: createPageUrl('Services'),
      search: `?search=${encodeURIComponent(categoryQuery)}`
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Hero Section with Search */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-pink-500/5 to-purple-600/5"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Logo/Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl mb-8 shadow-xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-6 leading-tight">
              <span className="block text-slate-800 mb-2">מחפשת</span>
              <span className="gradient-text">שירות בקהילה?</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-slate-600 mb-4 max-w-3xl mx-auto font-medium">
              עורכות דין, מטפלות, גננות, מאפרות ועוד
            </p>
            <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto">
              כל השירותים של נשות הקהילה במקום אחד 💜
            </p>

            {/* Giant Search Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-3xl mx-auto mb-8"
            >
              <div className="relative">
                <Input
                  type="text"
                  placeholder='חפשי "עורכת דין", "טיפול זוגי", "גננת" או כל שירות אחר...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-16 sm:h-20 text-lg sm:text-xl pl-16 pr-6 rounded-2xl shadow-2xl border-2 border-purple-200 focus:border-purple-400 bg-white"
                  dir="rtl"
                  autoFocus
                />
                <Button
                  onClick={() => handleSearch()}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-12 sm:h-16 px-6 sm:px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl shadow-lg"
                >
                  <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="hidden sm:inline mr-2">חפשי</span>
                </Button>
              </div>
            </motion.div>

            {/* Quick Stats */}
            {!isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-6 text-sm text-slate-500"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span><strong className="text-slate-700">{stats.services}</strong> שירותים</span>
                </div>
                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span><strong className="text-slate-700">{stats.providers}</strong> נשות קהילה</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-8 text-center">
            קטגוריות פופולריות
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {POPULAR_CATEGORIES.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <Card
                  onClick={() => handleCategoryClick(category.query)}
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm"
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}>
                      <category.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">{category.name}</h3>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Recent Services Preview */}
      {!isLoading && recentServices.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                שירותים אחרונים
              </h2>
              <Button
                onClick={() => navigate(createPageUrl('Services'))}
                variant="ghost"
                className="text-purple-600 hover:text-purple-700"
              >
                ראי הכל
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <Card
                    onClick={() => navigate(createPageUrl('Services') + `?service=${service.id}`)}
                    className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm h-full"
                  >
                    <CardContent className="p-6">
                      {service.images?.[0] && (
                        <div className="h-40 rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-purple-50 to-pink-50">
                          <img
                            src={service.images[0]}
                            alt={service.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-1">
                        {service.title}
                      </h3>
                      <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                        {service.description}
                      </p>
                      {service.category && (
                        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {service.category}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-gradient-to-br from-purple-600 to-pink-600 border-0 shadow-2xl">
            <CardContent className="p-8 sm:p-12 text-center text-white">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                את מציעה שירות?
              </h2>
              <p className="text-lg sm:text-xl mb-8 text-purple-100">
                הצטרפי לקהילה ופרסמי את השירות שלך בחינם
              </p>
              <Button
                onClick={() => navigate(createPageUrl('Profile'))}
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50 shadow-xl text-lg px-8 py-6 h-auto"
              >
                <Sparkles className="w-5 h-5 ml-2" />
                הוסיפי את השירות שלך
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}
