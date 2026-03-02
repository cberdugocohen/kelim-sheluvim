import React, { useState, useEffect, useCallback } from 'react';
import { CommunityPost } from '@/entities/CommunityPost';
import {
  Plus, Send, Trash2,
  AlertCircle, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ContactModal from '../ContactModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import PostSkeleton from '../skeletons/PostSkeleton';

export default function CommunityBoardContent({ currentUser, onStatsUpdate, sharedUsersData, isLoadingSharedData }) {
  const [posts, setPosts] = useState([]);
  const [authors, setAuthors] = useState(sharedUsersData); // Initialize with sharedUsersData
  const [isLoading, setIsLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [contactModal, setContactModal] = useState({ isOpen: false, recipientId: null, recipientName: "", postId: null });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Effect to update authors state when sharedUsersData prop changes
  useEffect(() => {
    setAuthors(sharedUsersData);
  }, [sharedUsersData]);

  const loadPostsAndAuthors = useCallback(async () => { // Renamed from loadData
    // Simple cache check for posts
    const cachedPosts = sessionStorage.getItem('communityPosts');
    const cacheTime = sessionStorage.getItem('communityPostsTime');
    const now = Date.now();

    // If cache is valid (2 minutes), use it
    if (cachedPosts && cacheTime && (now - parseInt(cacheTime)) < 2 * 60 * 1000) {
      const parsed = JSON.parse(cachedPosts);
      setPosts(parsed);
      onStatsUpdate(parsed.length);
      setIsLoading(false);
      return;
    }

    // If parent component is still loading shared user data,
    // we delay loading posts to prevent flickering and ensure author data is ready.
    if (isLoadingSharedData) {
      setIsLoading(true); // Keep loading state true while waiting for shared data
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {

      // Step 1: Load posts
      // Limiting to 30 posts for faster performance as per outline change
      const fetchedPosts = await CommunityPost.filter({ is_active: true }, "-created_date", 30);

      if (fetchedPosts.length === 0) {
        setPosts([]);
        onStatsUpdate(0);
        setIsLoading(false);
        // Cache empty result
        sessionStorage.setItem('communityPosts', JSON.stringify([]));
        sessionStorage.setItem('communityPostsTime', now.toString());
        return;
      }

      // Filter valid posts (content, length, and author_id must exist)
      const validPosts = fetchedPosts.filter(p =>
        p.content &&
        p.content.length >= 10 &&
        p.author_id
      );

      setPosts(validPosts);
      onStatsUpdate(validPosts.length);

      // Store fetched valid posts in cache
      sessionStorage.setItem('communityPosts', JSON.stringify(validPosts));
      sessionStorage.setItem('communityPostsTime', now.toString());

      // Removed Step 2: User loading logic from here.
      // The 'authors' state is now managed via the 'sharedUsersData' prop and its dedicated useEffect.

    } catch (error) {
      console.error("Error loading community posts:", error);
      setMessage({
        type: 'error',
        text: "שגיאה בטעינת הודעות הקהילה. אנא נסה שוב." // Updated error message
      });
      setPosts([]);
      // Clear cache on error so next attempt tries fresh data
      sessionStorage.removeItem('communityPosts');
      sessionStorage.removeItem('communityPostsTime');
    }

    setIsLoading(false);
  }, [onStatsUpdate, isLoadingSharedData]); // Dependencies for useCallback

  // Effect to trigger loading posts when the loadPostsAndAuthors function reference changes
  useEffect(() => {
    loadPostsAndAuthors();
  }, [loadPostsAndAuthors]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + 30); // Post expires in 30 days

      await CommunityPost.create({
        content: newPostContent.trim(),
        author_id: currentUser.id,
        expires_at: expires_at.toISOString()
      });

      setNewPostContent('');
      setIsModalOpen(false);
      setMessage({ type: 'success', text: "ההודעה פורסמה בהצלחה!" });
      sessionStorage.removeItem('communityPosts'); // Invalidate cache on new post
      sessionStorage.removeItem('communityPostsTime'); // Invalidate cache on new post
      loadPostsAndAuthors(); // Reload posts after successful submission
    } catch (error) {
      console.error("Error creating post:", error);
      setMessage({ type: 'error', text: 'שגיאה בפרסום ההודעה.' });
    }
    setIsSubmitting(false);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("האם למחוק הודעה זו?")) return;

    try {
      await CommunityPost.delete(postId);
      setMessage({ type: 'success', text: "ההודעה נמחקה." });
      sessionStorage.removeItem('communityPosts'); // Invalidate cache on delete
      sessionStorage.removeItem('communityPostsTime'); // Invalidate cache on delete
      loadPostsAndAuthors(); // Reload posts after successful deletion
    } catch(error) {
      console.error("Error deleting post:", error);
      setMessage({ type: 'error', text: "שגיאה במחיקה." });
    }
  };

  const handleContactAuthor = (post) => {
    const author = authors[post.author_id];
    // Allow contacting only if current user is not the author
    if (currentUser && post.author_id !== currentUser.id) {
      setContactModal({
        isOpen: true,
        recipientId: post.author_id,
        recipientName: author?.full_name || 'חברת קהילה',
        postId: post.id
      });
    }
  };

  // Loading state display using PostSkeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <PostSkeleton count={3} /> {/* Display 3 skeleton loaders */}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Post Button (visible only if currentUser exists) */}
      {currentUser && (
        <div className="text-center">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full"
          >
            <Plus className="w-5 h-5 ml-2" />
            הודעה חדשה
          </Button>
        </div>
      )}

      {/* Display Success/Error Messages */}
      {message.text && (
        <Alert className={message.type === 'success' ? "border-green-400 bg-green-50" : ""}>
          {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : ''}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Display Community Posts or No Posts message */}
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => {
            const author = authors[post.author_id];
            return (
              <Card key={post.id} className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={author?.profile_image} />
                      <AvatarFallback>{author?.full_name?.charAt(0) || 'ח'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{author?.full_name || 'חברת קהילה'}</p>
                      <p className="text-xs text-gray-500">{new Date(post.created_date).toLocaleDateString('he-IL')}</p>
                    </div>
                  </div>
                  <p className="text-gray-800 mb-4">{post.content}</p>
                  <div className="flex justify-end gap-2">
                    {/* Contact Author Button (visible if not current user's post) */}
                    {currentUser && post.author_id !== currentUser.id && (
                      <Button size="sm" onClick={() => handleContactAuthor(post)} className="bg-purple-500 hover:bg-purple-600">
                        <Send className="w-4 h-4 ml-2" />
                        צרי קשר
                      </Button>
                    )}
                    {/* Delete Post Button (visible if current user is the author) */}
                    {currentUser && post.author_id === currentUser.id && (
                      <Button size="sm" variant="ghost" onClick={() => handleDeletePost(post.id)} className="text-red-500 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <h3 className="text-xl font-bold text-gray-700 mb-2">אין הודעות עדיין</h3>
          <p className="text-gray-500">היי הראשונה לשתף משהו!</p>
        </div>
      )}

      {/* New Post Dialog/Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הודעה חדשה</DialogTitle>
            <DialogDescription>
              שתפי משהו עם הקהילה
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePostSubmit} className="space-y-4">
            <Textarea
              placeholder="כתבי כאן את ההודעה שלך..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              maxLength={200}
              className="min-h-[100px]"
            />
            <p className="text-xs text-gray-500 text-left">{newPostContent.length}/200</p>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">ביטול</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || !newPostContent.trim()}>
                {isSubmitting ? "מפרסמת..." : "פרסמי"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <ContactModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal({ isOpen: false, recipientId: null, recipientName: "", postId: null })}
        recipientId={contactModal.recipientId}
        recipientName={contactModal.recipientName}
        relatedPostId={contactModal.postId}
        defaultSubject="תגובה להודעתך"
        defaultContent="שלום! ראיתי את ההודעה שלך ואשמח ליצור קשר..."
      />
    </div>
  );
}
