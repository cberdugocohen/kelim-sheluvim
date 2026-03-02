import React, { useState, useEffect } from "react";
import { PrayerRequest } from "@/entities/PrayerRequest";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  Heart,
  Loader2,
  Filter,
  AlertCircle,
  RefreshCw,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import PrayerRequestModal from "../components/prayer/PrayerRequestModal";
import PrayerRequestCard from "../components/prayer/PrayerRequestCard";
import toast from "react-hot-toast";

export default function PrayerRequests() {
  const { currentUser } = useCurrentUser();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);

  const requestTypes = [
    "רפואת הגוף והנפש",
    "זיווג הגון משורש השנה",
    "חופה וקידושין עוד השנה",
    "שלום בית",
    "פרנסה",
    "הריון / לידה",
    "שמירה / ילדים",
    "הצלחה / לימודים",
    "אחר"
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, selectedTypes]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = currentUser;

      const today = new Date().toISOString().split('T')[0];
      const allRequests = await PrayerRequest.filter(
        { status: "פעיל" },
        "-created_date",
        200
      );

      const activeRequests = allRequests.filter(req => {
        if (!req.valid_until) return true;
        return req.valid_until >= today;
      });

      setRequests(activeRequests);
    } catch (err) {
      console.error("Error loading prayer requests:", err);
      setError("שגיאה בטעינת הבקשות. נסי שוב.");
    }
    setIsLoading(false);
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(req =>
        req.name_for_prayer?.toLowerCase().includes(lowerSearch) ||
        req.context_note?.toLowerCase().includes(lowerSearch)
      );
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(req => {
        if (Array.isArray(req.request_types)) {
          return req.request_types.some(type => selectedTypes.includes(type));
        }
        return selectedTypes.includes(req.request_type);
      });
    }

    setFilteredRequests(filtered);
  };

  const handleTypeToggle = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSearchTerm("");
  };

  const handleAddRequest = () => {
    if (!currentUser) {
      toast.success("יש להתחבר כדי להוסיף בקשת תפילה");
      return;
    }
    setEditingRequest(null);
    setIsModalOpen(true);
  };

  const handleEditRequest = (request) => {
    setEditingRequest(request);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm("האם את בטוחה שברצונך למחוק את הבקשה?")) {
      return;
    }

    try {
      await PrayerRequest.delete(requestId);
      loadData();
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error("שגיאה במחיקת הבקשה");
    }
  };

  const handleModalClose = (shouldRefresh) => {
    setIsModalOpen(false);
    setEditingRequest(null);
    if (shouldRefresh) {
      loadData();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-6 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="animate-spin h-16 w-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">טוענים בקשות תפילה...</h2>
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
            <h2 className="text-xl font-bold text-slate-800 mb-4">שגיאה</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={loadData} className="w-full bg-purple-600 hover:bg-purple-700">
              <RefreshCw className="w-4 h-4 ml-2" />
              נסי שוב
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100/30 p-4 sm:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex justify-center mb-4"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Heart className="w-10 h-10 text-white" fill="currentColor" />
              </div>
            </motion.div>
            <h1 className="text-4xl font-black text-slate-800 mb-2">
              קיר בקשות התפילה 🙏
            </h1>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              מקום משותף לכל תלמידות האמת והשלום להעלות בקשות תפילה ולהתפלל אחת בעד השנייה
            </p>
          </div>

          <Card className="mb-6 glass-effect">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      placeholder="חיפוש לפי שם או הקשר..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAddRequest}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-full md:w-auto"
                  size="lg"
                >
                  <Plus className="w-5 h-5 ml-2" />
                  הוספת בקשה
                </Button>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    סינון לפי קטגוריות (ניתן לבחור מספר):
                  </Label>
                  {(selectedTypes.length > 0 || searchTerm) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <X className="w-4 h-4 ml-1" />
                      נקה סינון
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {requestTypes.map(type => (
                    <div key={type} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={type}
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={() => handleTypeToggle(type)}
                        className="border-slate-300"
                      />
                      <label
                        htmlFor={type}
                        className="text-sm font-medium cursor-pointer select-none text-slate-700 hover:text-purple-600"
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <span className="text-sm text-slate-600 font-medium">מסננים פעילים:</span>
                  {selectedTypes.map(type => (
                    <Badge key={type} variant="secondary" className="bg-purple-100 text-purple-800">
                      {type}
                      <button
                        onClick={() => handleTypeToggle(type)}
                        className="mr-1 hover:text-purple-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {filteredRequests.length === 0 ? (
            <Card className="glass-effect">
              <CardContent className="p-12 text-center">
                <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">
                  {searchTerm || selectedTypes.length > 0 ? "לא נמצאו בקשות" : "עדיין אין בקשות תפילה"}
                </h3>
                <p className="text-slate-500 mb-6">
                  {searchTerm || selectedTypes.length > 0
                    ? "נסי לשנות את הסינון או החיפוש"
                    : "היי הראשונה להוסיף בקשת תפילה"}
                </p>
                {!searchTerm && selectedTypes.length === 0 && (
                  <Button onClick={handleAddRequest} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-5 h-5 ml-2" />
                    הוסיפי בקשה
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map(request => (
                <PrayerRequestCard
                  key={request.id}
                  request={request}
                  currentUser={currentUser}
                  onEdit={handleEditRequest}
                  onDelete={handleDeleteRequest}
                  onPrayerUpdate={loadData}
                />
              ))}
            </div>
          )}

          <div className="mt-8 text-center text-slate-600">
            <p className="text-sm">
              💜 מוצגים {filteredRequests.length} מתוך {requests.length} בקשות תפילה פעילות
            </p>
          </div>
        </motion.div>
      </div>

      <PrayerRequestModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        currentUser={currentUser}
        editingRequest={editingRequest}
      />
    </div>
  );
}
