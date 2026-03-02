import React, { useState, useEffect } from 'react';
import { Event } from '@/entities/Event';
import { User } from '@/entities/User';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Users, Plus, Search, Filter, Video, BookOpen, PartyPopper, GraduationCap, MoreHorizontal, Presentation, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { he } from 'date-fns/locale';

const eventTypeIcons = {
  workshop: BookOpen,
  lecture: GraduationCap, 
  meeting: Users,
  celebration: PartyPopper,
  course: BookOpen,
  conference: Presentation,
  sale: ShoppingBag,
  other: MoreHorizontal
};

const eventTypeLabels = {
  workshop: 'סדנה',
  lecture: 'הרצאה', 
  meeting: 'מפגש',
  celebration: 'חגיגה',
  course: 'קורס',
  conference: 'כנס',
  sale: 'מכירה',
  other: 'אחר'
};

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const { currentUser } = useCurrentUser();
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTime, setFilterTime] = useState('upcoming');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form state for creating events
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'workshop',
    location: '',
    is_online: false,
    start_date: '',
    end_date: '',
    max_participants: '',
    registration_required: false,
    cost: 'חינם',
    contact_info: '',
    tags: [],
    image_url: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, searchTerm, filterType, filterTime]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allEvents, allUsers] = await Promise.all([
        Event.filter({ is_active: true }, '-start_date'),
        User.list()
      ]);
      
      setEvents(allEvents);
      
      const usersMap = {};
      allUsers.forEach(user => {
        usersMap[user.id] = user;
      });
      setUsers(usersMap);
      
    } catch (error) {
      console.error('Error loading events:', error);
    }
    setIsLoading(false);
  };

  const applyFilters = () => {
    let filtered = events;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filter by event type
    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.event_type === filterType);
    }
    
    // Filter by time
    const now = new Date();
    const nextWeek = addDays(now, 7);
    
    if (filterTime === 'upcoming') {
      filtered = filtered.filter(event => isAfter(new Date(event.start_date), now));
    } else if (filterTime === 'this_week') {
      filtered = filtered.filter(event => 
        isAfter(new Date(event.start_date), now) && 
        isBefore(new Date(event.start_date), nextWeek)
      );
    } else if (filterTime === 'past') {
      filtered = filtered.filter(event => isBefore(new Date(event.start_date), now));
    }
    
    setFilteredEvents(filtered);
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.description || !newEvent.start_date || !newEvent.end_date) {
      // Potentially add a toast notification for missing fields
      return;
    }
    
    try {
      await Event.create({
        ...newEvent,
        creator_id: currentUser.id,
        max_participants: newEvent.max_participants ? parseInt(newEvent.max_participants) : null
      });
      
      setIsCreateDialogOpen(false);
      setNewEvent({
        title: '',
        description: '',
        event_type: 'workshop',
        location: '',
        is_online: false,
        start_date: '',
        end_date: '',
        max_participants: '',
        registration_required: false,
        cost: 'חינם',
        contact_info: '',
        tags: [],
        image_url: ''
      });
      
      loadData();
    } catch (error) {
      console.error('Error creating event:', error);
      // Potentially add a toast notification for error
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4 sm:p-6" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-200 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4 sm:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
              📅 לוח אירועים קהילתי
            </h1>
            <p className="text-gray-600 text-lg">אירועים, סדנאות ומפגשים של הקהילה</p>
          </div>
          
          {currentUser && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg">
                  <Plus className="w-5 h-5 ml-2" />
                  יצירת אירוע חדש
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle>יצירת אירוע חדש</DialogTitle>
                  <DialogDescription>
                    מלאי את הפרטים כדי ליצור אירוע חדש עבור הקהילה
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">כותרת האירוע *</Label>
                      <Input
                        id="title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                        placeholder="למשל: סדנת יצירה"
                      />
                    </div>
                    <div>
                      <Label htmlFor="event_type">סוג האירוע *</Label>
                      <Select value={newEvent.event_type} onValueChange={(value) => setNewEvent({...newEvent, event_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(eventTypeLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">תיאור האירוע *</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                      placeholder="תארי את האירוע..."
                      className="h-24"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">תאריך ושעת התחלה *</Label>
                      <Input
                        id="start_date"
                        type="datetime-local"
                        value={newEvent.start_date}
                        onChange={(e) => setNewEvent({...newEvent, start_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">תאריך ושעת סיום *</Label>
                      <Input
                        id="end_date"
                        type="datetime-local"
                        value={newEvent.end_date}
                        onChange={(e) => setNewEvent({...newEvent, end_date: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="location">מקום האירוע</Label>
                    <Input
                      id="location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                      placeholder="כתובת או קישור זום"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cost">עלות</Label>
                      <Input
                        id="cost"
                        value={newEvent.cost}
                        onChange={(e) => setNewEvent({...newEvent, cost: e.target.value})}
                        placeholder="חינם / 50 ש״ח"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_participants">מספר משתתפות מקסימלי</Label>
                      <Input
                        id="max_participants"
                        type="number"
                        value={newEvent.max_participants}
                        onChange={(e) => setNewEvent({...newEvent, max_participants: e.target.value})}
                        placeholder="אופציונלי"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="contact_info">פרטי קשר</Label>
                    <Input
                      id="contact_info"
                      value={newEvent.contact_info}
                      onChange={(e) => setNewEvent({...newEvent, contact_info: e.target.value})}
                      placeholder="טלפון או אימייל ליצירת קשר"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleCreateEvent} className="bg-purple-600 hover:bg-purple-700">
                    יצירת אירוע
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="חיפוש אירועים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="סוג אירוע" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסוגים</SelectItem>
              {Object.entries(eventTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterTime} onValueChange={setFilterTime}>
            <SelectTrigger>
              <SelectValue placeholder="זמן" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">אירועים קרובים</SelectItem>
              <SelectItem value="this_week">השבוע</SelectItem>
              <SelectItem value="past">אירועים שעברו</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center justify-center bg-white rounded-lg border px-4 py-2">
            <Filter className="w-5 h-5 text-slate-400 ml-2" />
            <span className="text-sm text-slate-600">{filteredEvents.length} אירועים</span>
          </div>
        </motion.div>

        {/* Events Grid */}
        <AnimatePresence>
          {filteredEvents.length > 0 ? (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredEvents.map((event, index) => {
                const creator = users[event.creator_id];
                const EventIcon = eventTypeIcons[event.event_type];
                const isUpcoming = isAfter(new Date(event.start_date), new Date());
                
                return (
                  <motion.div
                    key={event.id}
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={`h-full shadow-lg hover:shadow-xl transition-all duration-300 ${isUpcoming ? 'border-purple-200 bg-white' : 'border-gray-200 bg-gray-50'}`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isUpcoming ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-500'}`}>
                              <EventIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <Badge variant="outline" className="text-xs">
                                {eventTypeLabels[event.event_type]}
                              </Badge>
                            </div>
                          </div>
                          {!isUpcoming && (
                            <Badge variant="secondary" className="text-xs">עבר</Badge>
                          )}
                        </div>
                        
                        <CardTitle className="text-xl font-bold text-slate-800 line-clamp-2">
                          {event.title}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <p className="text-slate-600 text-sm line-clamp-3">
                          {event.description}
                        </p>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(event.start_date), 'PPP', { locale: he })}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="w-4 h-4" />
                            <span>
                              {format(new Date(event.start_date), 'HH:mm')} - {format(new Date(event.end_date), 'HH:mm')}
                            </span>
                          </div>
                          
                          {event.location && (
                            <div className="flex items-center gap-2 text-slate-600">
                              {event.is_online ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          )}
                          
                          {event.max_participants && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Users className="w-4 h-4" />
                              <span>עד {event.max_participants} משתתפות</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-xs text-slate-500">
                            נוצר על ידי {creator?.full_name || 'חברת קהילה'}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {event.cost && event.cost !== 'חינם' && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {event.cost}
                              </Badge>
                            )}
                            {event.cost === 'חינם' && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                חינם
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {event.contact_info && isUpcoming && (
                          <div className="pt-2">
                            <a 
                              href={event.contact_info.includes('@') ? `mailto:${event.contact_info}` : `tel:${event.contact_info}`}
                              className="text-purple-600 hover:text-purple-800 text-sm font-medium underline"
                            >
                              יצירת קשר להרשמה
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-600 mb-2">אין אירועים</h3>
              <p className="text-slate-500 mb-6">
                {searchTerm || filterType !== 'all' || filterTime !== 'upcoming' 
                  ? 'נסי לשנות את הפילטרים' 
                  : 'עדיין אין אירועים. בואי תהיי הראשונה ליצור!'
                }
              </p>
              {currentUser && !searchTerm && filterType === 'all' && filterTime === 'upcoming' && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-5 h-5 ml-2" />
                  יצירת אירוע ראשון
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
