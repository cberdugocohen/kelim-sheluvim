import React, { useState, useEffect, useCallback } from "react";
import { GratitudePost } from "@/entities/GratitudePost";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Heart, Plus, Sparkles, HandHeart, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import OptimizedImage from "../OptimizedImage";

export default function GratitudeWallContent({ currentUser, onStatsUpdate, sharedUsersData, isLoadingSharedData }) {
  const [gratitudePosts, setGratitudePosts] = useState([]);
  const [users, setUsers] = useState(sharedUsersData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [newPost, setNewPost] = useState({
    recipient_id: "",
    content: "",
    service_related: false,
    service_type: "",
    is_public: true
  });

  useEffect(() => {
    if (Object.keys(sharedUsersData).length > 0) {
      setUsers(sharedUsersData);
    }
  }, [sharedUsersData]);

  const loadGratitudes = useCallback(async () => {
    if (isLoadingSharedData) return;

    setIsLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      
      // טוען רק תודות - לא פוסטים רגילים!
      const posts = await GratitudePost.filter({ is_public: true }, "-created_date", 50);
      
      const validPosts = posts.filter(p => p.sender_id && p.recipient_id && p.content);

      setGratitudePosts(validPosts);
      onStatsUpdate(validPosts.length);
      
    } catch (error) {
      console.error("Error loading gratitude posts:", error);
      setMessage({ type: "error", text: "שגיאה בטעינת התודות" });
    }
    setIsLoading(false);
  }, [onStatsUpdate, isLoadingSharedData]);

  useEffect(() => {
    loadGratitudes();
  }, [loadGratitudes]);

  const handleHeartToggle = async (postId) => {
    if (!currentUser) return;

    const postIndex = gratitudePosts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = gratitudePosts[postIndex];
    const hasHeart = post.hearts_from?.includes(currentUser.id);
    const newHeartsFrom = hasHeart
      ? (post.hearts_from || []).filter(id => id !== currentUser.id)
      : [...(post.hearts_from || []), currentUser.id];

    // Optimistic update
    const updatedPosts = [...gratitudePosts];
    updatedPosts[postIndex] = { ...post, hearts_from: newHeartsFrom, heart_count: newHeartsFrom.length };
    setGratitudePosts(updatedPosts);

    try {
      await GratitudePost.update(postId, {
        hearts_from: newHeartsFrom,
        heart_count: newHeartsFrom.length
      });
    } catch (error) {
      console.error("Error updating heart:", error);
      // Rollback on error
      setGratitudePosts(gratitudePosts);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.recipient_id || !newPost.content.trim()) {
      setMessage({ type: "error", text: "יש למלא את כל השדות" });
      return;
    }

    setIsSubmitting(true);
    try {
      await GratitudePost.create({
        ...newPost,
        sender_id: currentUser.id,
        heart_count: 0,
        hearts_from: []
      });

      setMessage({ type: "success", text: "התודה נשלחה בהצלחה!" });
      setNewPost({ recipient_id: "", content: "", service_related: false, service_type: "", is_public: true });
      setShowCreateModal(false);
      loadGratitudes();
    } catch (error) {
      console.error("Error creating gratitude:", error);
      setMessage({ type: "error", text: "שגיאה בשליחת התודה" });
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Button */}
      {currentUser && (
        <div className="text-center">
          <Button
            onClick={() => setShowCreateModal(true)}
            size="lg"
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full"
          >
            <Plus className="w-5 h-5 ml-2" />
            תודה חדשה
            <Sparkles className="w-5 h-5 mr-2" />
          </Button>
        </div>
      )}

      {/* Messages */}
      {message.text && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Gratitude Posts - רק תודות! */}
      {gratitudePosts.length > 0 ? (
        <div className="space-y-4">
          {gratitudePosts.map((post) => {
            const sender = users[post.sender_id];
            const recipient = users[post.recipient_id];
            
            if (!sender || !recipient) return null;

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
              >
                <Card className="bg-gradient-to-r from-pink-50 to-purple-50 shadow-sm border-pink-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Link to={createPageUrl(`UserProfile?userId=${sender.id}`)}>
                        <OptimizedImage
                          src={sender.profile_image}
                          alt={sender.full_name}
                          className="w-12 h-12 rounded-full shadow-md"
                          fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(sender.full_name)}&background=f472b6&color=fff&size=48`}
                        />
                      </Link>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          <Link to={createPageUrl(`UserProfile?userId=${sender.id}`)} className="font-bold text-pink-600 hover:underline">
                            {sender.full_name}
                          </Link>
                          {' שלחה תודה ל-'}
                          <Link to={createPageUrl(`UserProfile?userId=${recipient.id}`)} className="font-bold text-purple-600 hover:underline">
                            {recipient.full_name}
                          </Link>
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white/70 p-4 rounded-lg mb-4 border-r-4 border-pink-400">
                      <p className="text-gray-800 italic text-lg leading-relaxed">"{post.content}"</p>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleHeartToggle(post.id)}
                        disabled={!currentUser}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                          currentUser && post.hearts_from?.includes(currentUser.id) 
                            ? 'bg-pink-500 text-white shadow-md' 
                            : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${currentUser && post.hearts_from?.includes(currentUser.id) ? 'fill-current' : ''}`} />
                        <span className="font-medium">{post.heart_count || 0}</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl">
          <HandHeart className="w-20 h-20 text-pink-400 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-700 mb-3">הקיר עדיין ריק</h3>
          <p className="text-gray-500 text-lg">בואי תהיי הראשונה לשלוח תודה! 💕</p>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-pink-700 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              שליחת תודה
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="font-medium text-gray-700">למי את רוצה להודות?</Label>
              <select
                value={newPost.recipient_id}
                onChange={(e) => setNewPost(prev => ({ ...prev, recipient_id: e.target.value }))}
                className="w-full p-3 mt-2 border border-gray-300 rounded-xl focus:border-pink-400 focus:outline-none"
                required
              >
                <option value="">בחרי...</option>
                {Object.values(users)
                  .filter(u => u.id !== currentUser?.id)
                  .map(user => (
                  <option key={user.id} value={user.id}>{user.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="font-medium text-gray-700">על מה את רוצה להודות?</Label>
              <Textarea
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                placeholder="כתבי כאן את התודה שלך..."
                className="w-full h-28 p-3 mt-2 border border-gray-300 rounded-xl focus:border-pink-400 focus:outline-none resize-none"
                required
                maxLength={300}
              />
              <p className="text-xs text-gray-500 text-left mt-1">{newPost.content.length}/300</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                ביטול
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                {isSubmitting ? "שולחת..." : "שלחי תודה"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
