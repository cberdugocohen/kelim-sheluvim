import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PrivateMessage } from '@/entities/PrivateMessage';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, ArrowLeft, RefreshCw, WifiOff, MessageSquare, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import MessageSkeleton from '../components/skeletons/MessageSkeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import toast from "react-hot-toast";

const groupMessagesByConversation = (messages, currentUserId) => {
  const conversations = {};

  messages.forEach(msg => {
    const otherUserId = msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_id;
    if (!otherUserId) return;

    if (!conversations[otherUserId]) {
      conversations[otherUserId] = {
        otherUserId: otherUserId,
        messages: [],
        unreadCount: 0,
        lastMessageTimestamp: null
      };
    }

    conversations[otherUserId].messages.push(msg);
  });

  // Sort messages within each conversation and determine last message/unread count
  for (const userId in conversations) {
    conversations[userId].messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    const lastMessage = conversations[userId].messages[conversations[userId].messages.length - 1];
    conversations[userId].lastMessageTimestamp = lastMessage.created_date;
    conversations[userId].unreadCount = conversations[userId].messages.filter(m => !m.is_read && m.recipient_id === currentUserId).length;
  }
  
  return Object.values(conversations).sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp));
};

export default function MyMessagesPage() {
  const { currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const [conversations, setConversations] = useState([]);
  const [usersData, setUsersData] = useState({});
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessageContent, setNewMessageContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const messagesEndRef = useRef(null);
  const selectedConversationRef = useRef(null);
  selectedConversationRef.current = selectedConversation; // Keep the ref updated with the latest state

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const interval = setInterval(() => {
      if (navigator.onLine && currentUser) loadConversations(true);
    }, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!isLoadingUser && currentUser) {
      loadConversations(false, currentUser);
    } else if (!isLoadingUser && !currentUser) {
      setError("יש להתחבר כדי לצפות בהודעות");
      setIsLoading(false);
    }
  }, [currentUser, isLoadingUser]);

  const loadConversations = async (silent = false, user = currentUser) => {
    if (!user) return;
    if (!silent) setIsLoading(true);
    setError(null);
    
    try {
      const [sentMessages, receivedMessages] = await Promise.all([
          PrivateMessage.filter({ sender_id: user.id }),
          PrivateMessage.filter({ recipient_id: user.id })
      ]);
      const allMessages = [...sentMessages, ...receivedMessages].filter((msg, index, self) =>
          index === self.findIndex((t) => t.id === msg.id)
      );

      const groupedConversations = groupMessagesByConversation(allMessages, user.id);
      
      const otherUserIds = groupedConversations.map(c => c.otherUserId).filter(Boolean);
      if (otherUserIds.length > 0) {
        const uniqueIds = [...new Set(otherUserIds)];
        // Fetch only new users to avoid re-fetching
        const usersToFetch = uniqueIds.filter(id => !usersData[id]);
        if (usersToFetch.length > 0) {
            const fetchedUsers = await User.filter({ id: { "$in": usersToFetch } });
            setUsersData(prev => {
                const newUsersMap = { ...prev };
                fetchedUsers.forEach(u => { newUsersMap[u.id] = u; });
                return newUsersMap;
            });
        }
      }
      setConversations(groupedConversations);

      // Keep selected conversation updated
      const currentSelected = selectedConversationRef.current;
      if (currentSelected) {
        const updatedSelectedConv = groupedConversations.find(c => c.otherUserId === currentSelected.otherUserId);
        if (updatedSelectedConv) {
          // Only update selectedConversation if the existing one is still present
          // and has actual changes (e.g. new messages, read status changed by other user)
          // This prevents re-setting it if it's already updated optimistically
          // and the new data matches current state.
          const currentSelectedId = selectedConversationRef.current?.otherUserId;
          if (currentSelectedId === updatedSelectedConv.otherUserId) {
            setSelectedConversation(updatedSelectedConv);
          }
        } else {
          setSelectedConversation(null); // Conversation no longer exists (e.g., all messages deleted)
        }
      }

    } catch (e) {
      console.error("Error loading conversations:", e);
      if (!silent) setError("שגיאה בטעינת השיחות");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    // 💡 FIX: This function was rewritten to prevent the "jump" effect.
    // Instead of reloading all conversations, we now update the state optimistically and locally.
    
    // 1. Set the conversation to display the chat view immediately.
    setSelectedConversation(conversation); 
    
    const unreadMessages = conversation.messages.filter(m => !m.is_read && m.recipient_id === currentUser.id);

    if (unreadMessages.length > 0) {
        // 2. Optimistically update the UI to show all messages as read.
        // This stops the unread count badge from showing while we update.
        const updatedConversation = {
            ...conversation,
            messages: conversation.messages.map(msg => ({ ...msg, is_read: true })),
            unreadCount: 0
        };
        
        // Update the master list of conversations so the unread count disappears there too.
        setConversations(prevConversations =>
            prevConversations.map(c =>
                c.otherUserId === conversation.otherUserId ? updatedConversation : c
            )
        );
        
        // Update the selected conversation state as well.
        setSelectedConversation(updatedConversation);
        
        // 3. Silently update the backend. No UI jump, no reload.
        try {
            await Promise.all(
                unreadMessages.map(m => PrivateMessage.update(m.id, { is_read: true }))
            );
        } catch (e) {
            console.error("Failed to mark messages as read", e);
            // On failure, a full reload is a simple way to resync.
            loadConversations(true); 
        }
    }
  };
  
  const handleSendMessage = async () => {
    if (!newMessageContent.trim() || !selectedConversation || !currentUser) return;
    
    setIsSending(true);
    
    const tempMessageContent = newMessageContent.trim();
    const recipientId = selectedConversation.otherUserId;

    const tempMessage = {
      id: `temp-${Date.now()}`, // Unique temporary ID
      content: tempMessageContent,
      sender_id: currentUser.id,
      recipient_id: recipientId,
      created_date: new Date().toISOString(),
      is_read: true, // Optimistically assume sent messages are read by sender
    };
    
    // Optimistic UI Update
    setSelectedConversation(prev => {
        if (!prev) return prev;
        return {
            ...prev,
            messages: [...prev.messages, tempMessage]
        };
    });
    setNewMessageContent("");
    
    try {
      await PrivateMessage.create({
        sender_id: currentUser.id, // Explicitly set sender_id, though backend might infer
        recipient_id: recipientId,
        subject: `הודעה חדשה`, // Subject for new conversation, but for replies, a placeholder
        content: tempMessageContent,
        is_read: false // Mark as unread for the recipient
      });
      // Refresh in background to get the real message ID and confirm
      await loadConversations(true); 
    } catch (e) {
      console.error("Failed to send message:", e);
      // Rollback optimistic update
      setSelectedConversation(prev => {
          if (!prev) return prev;
          return {
              ...prev,
              messages: prev.messages.filter(m => m.id !== tempMessage.id)
          };
      });
      toast.error("שגיאה בשליחת ההודעה");
    } finally {
      setIsSending(false);
    }
  };
  
  const totalUnread = useMemo(() => conversations.reduce((sum, c) => sum + c.unreadCount, 0), [conversations]);

  return (
    <div className="h-[calc(100vh-80px)] md:h-screen flex flex-col p-2 sm:p-4 bg-gray-50" dir="rtl">
        {/* Header */}
        <header className="flex-shrink-0 mb-4 px-2">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Mail className="text-purple-600 w-7 h-7" />
              ההודעות שלי
            </h1>
            <div className="flex items-center justify-between text-sm text-slate-500 mt-1">
              <p>
                {totalUnread > 0 ? `יש לך ${totalUnread} הודעות שלא נקראו` : "כל ההודעות נקראו"}
              </p>
              <Button onClick={() => loadConversations(false)} variant="ghost" size="sm" disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                  רענן
              </Button>
            </div>
            {!isOnline && (
              <Alert variant="destructive" className="mt-2 text-xs p-2">
                <WifiOff className="h-4 w-4" />
                <AlertDescription>
                  אין חיבור לאינטרנט.
                </AlertDescription>
              </Alert>
            )}
             {error && (
              <Alert variant="destructive" className="mt-2 text-xs p-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
        </header>

        <div className="flex-grow flex border border-gray-200 rounded-2xl bg-white shadow-lg overflow-hidden">
            {/* Conversations List (Left Pane) */}
            <aside className={`w-full md:w-1/3 lg:w-1/4 border-l border-gray-200 flex flex-col transition-all duration-300 ${selectedConversation && 'hidden md:flex'}`}>
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-lg text-slate-700">שיחות אחרונות</h2>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 space-y-2">
                          {[...Array(5)].map((_, i) => <MessageSkeleton key={i} />)}
                        </div>
                    ) : conversations.length > 0 ? (
                        conversations.map(conv => {
                            const otherUser = usersData[conv.otherUserId];
                            const lastMessage = conv.messages[conv.messages.length - 1];
                            return (
                              <div
                                key={conv.otherUserId}
                                className={`p-4 flex items-start gap-4 cursor-pointer hover:bg-purple-50 border-b ${selectedConversation?.otherUserId === conv.otherUserId ? 'bg-purple-100' : ''}`}
                                onClick={() => handleSelectConversation(conv)}
                              >
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={otherUser?.profile_image} />
                                  <AvatarFallback className="bg-purple-200 text-purple-700">
                                    {otherUser?.full_name?.charAt(0) || <UserIcon/>}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-grow overflow-hidden">
                                  <div className="flex justify-between items-center">
                                    <p className="font-semibold text-slate-800 truncate">{otherUser?.full_name || 'חברת קהילה'}</p>
                                    <p className="text-xs text-slate-500 flex-shrink-0">{new Date(lastMessage.created_date).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</p>
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                    <p className="text-sm text-slate-600 truncate">
                                      {lastMessage.sender_id === currentUser?.id && "את: "}
                                      {lastMessage.content}
                                    </p>
                                    {conv.unreadCount > 0 && (
                                      <Badge className="bg-purple-600 text-white rounded-full h-5 w-5 p-0 flex items-center justify-center">{conv.unreadCount}</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                        })
                    ) : (
                      <div className="text-center p-8 text-slate-500">
                        <MessageSquare className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <p>אין עדיין שיחות.</p>
                        <p className="text-xs">התחילי שיחה מפרופיל של חברה אחרת.</p>
                      </div>
                    )}
                </div>
            </aside>

            {/* Message View (Right Pane) */}
            <main className={`flex-1 flex flex-col ${!selectedConversation && 'hidden md:flex'}`}>
                {selectedConversation ? (
                    <AnimatePresence>
                        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="flex-1 flex flex-col">
                            {/* Header */}
                            <header className="p-4 border-b flex items-center gap-4">
                                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversation(null)}>
                                  <ArrowLeft className="w-5 h-5"/>
                                </Button>
                                <Avatar>
                                    <AvatarImage src={usersData[selectedConversation.otherUserId]?.profile_image} />
                                    <AvatarFallback>{usersData[selectedConversation.otherUserId]?.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <Link to={createPageUrl(`UserProfile?userId=${selectedConversation.otherUserId}`)} className="font-semibold hover:underline">
                                    {usersData[selectedConversation.otherUserId]?.full_name}
                                  </Link>
                                  <p className="text-xs text-green-500">מחוברת</p>
                                </div>
                            </header>

                            {/* Messages */}
                            <div className="flex-grow overflow-y-auto p-6 space-y-4">
                                {selectedConversation.messages.map(msg => (
                                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                        {msg.sender_id !== currentUser.id && <Avatar className="w-8 h-8"><AvatarImage src={usersData[msg.sender_id]?.profile_image}/><AvatarFallback>{usersData[msg.sender_id]?.full_name?.charAt(0)}</AvatarFallback></Avatar>}
                                        <div className={`max-w-xs lg:max-w-md p-3 rounded-2xl ${msg.sender_id === currentUser.id ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-200 text-slate-800 rounded-bl-none'}`}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            <p className={`text-xs mt-1 ${msg.sender_id === currentUser.id ? 'text-purple-200' : 'text-slate-500'}`}>{new Date(msg.created_date).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Form */}
                            <footer className="p-4 border-t bg-white">
                                <div className="relative">
                                  <Textarea
                                      placeholder="כתבי הודעה..."
                                      value={newMessageContent}
                                      onChange={(e) => setNewMessageContent(e.target.value)}
                                      onKeyPress={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                                      className="pr-12 bg-gray-100 rounded-full border-gray-300 focus:border-purple-500"
                                      rows={1}
                                  />
                                  <Button 
                                      size="icon" 
                                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full w-9 h-9 bg-purple-600 hover:bg-purple-700"
                                      onClick={handleSendMessage}
                                      disabled={isSending || !newMessageContent.trim()}
                                  >
                                      <Send className="w-5 h-5"/>
                                  </Button>
                                </div>
                            </footer>
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                        <Mail className="w-24 h-24 mb-4"/>
                        <h2 className="text-xl font-semibold text-slate-600">בחרי שיחה כדי להתחיל</h2>
                        <p>ההודעות שלך יופיעו כאן.</p>
                    </div>
                )}
            </main>
        </div>
    </div>
  );
}
