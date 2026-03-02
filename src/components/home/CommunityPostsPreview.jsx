import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle, Heart, Send, Plus, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OptimizedImage from "../OptimizedImage";
import PostSkeleton from "../skeletons/PostSkeleton";

export default function CommunityPostsPreview({ 
  recentPosts, 
  allAuthors, 
  currentUser, 
  isContentLoading, 
  onLikePost, 
  onContactAuthor 
}) {
  return (
    <motion.section 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="mb-24"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
        <h2 className="text-4xl md:text-5xl font-black text-gray-800 flex items-center gap-4">
          <MessageCircle className="w-10 h-10 text-purple-600" />
          הודעות מהקהילה
        </h2>
        <Link to={createPageUrl("CommunityCenter")}>
          <Button className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6 rounded-2xl shadow-lg">
            למרכז הקהילה
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Button>
        </Link>
      </div>

      {isContentLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (<PostSkeleton key={i} />))}
        </div>
      ) : recentPosts.length > 0 ? (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPosts.map((post) => {
            const author = allAuthors[post.author_id];
            const isLiked = currentUser && post.likes?.includes(currentUser.id);
            return (
              <motion.div key={post.id} whileHover={{ y: -8, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                <Card className="glass-card h-full flex flex-col rounded-3xl overflow-hidden">
                  <CardContent className="p-8 flex-grow flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white">
                        {author?.profile_image ? (
                          <OptimizedImage src={author.profile_image} alt={author.full_name || 'אנונימי'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                            <Heart className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">
                          <Link to={post.author_id ? createPageUrl(`UserProfile?userId=${post.author_id}`) : '#'} className="hover:text-purple-600">
                            {author?.full_name || 'חברת קהילה'}
                          </Link>
                        </p>
                        <p className="text-sm text-gray-500">
                          {post.created_date ? new Date(post.created_date).toLocaleDateString('he-IL') : 'תאריך לא ידוע'}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-3 flex-grow">{post.content || 'תוכן לא זמין'}</p>

                    <div className="flex justify-between items-center mt-auto pt-4 border-t">
                      <button
                        onClick={() => onLikePost(post.id)}
                        className="flex items-center gap-2 text-slate-500 hover:text-pink-500"
                        disabled={!currentUser || !post.id}
                      >
                        <Heart className={`w-5 h-5 ${isLiked ? 'text-pink-500 fill-current' : ''}`} />
                        <span className="text-sm">{post.likes?.length || 0}</span>
                      </button>
                      
                      <Button
                        size="sm"
                        onClick={() => onContactAuthor(post)}
                        variant="outline"
                        className="text-purple-700 border-purple-300"
                        disabled={!currentUser || !post.author_id}
                      >
                        צרי קשר
                        <Send className="w-4 h-4 mr-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">אין הודעות זמינות כרגע</p>
          <Link to={createPageUrl("CommunityCenter")}>
            <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 ml-2" />
              לחצי כאן לשתף הודעה
            </Button>
          </Link>
        </div>
      )}
    </motion.section>
  );
}
