import React, { useState, useEffect } from 'react';
import { Service } from '@/entities/Service';
import { Student } from '@/entities/Student';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Image as ImageIcon, Search, Loader2, AlertCircle, RefreshCw, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ServiceImageUploader from './ServiceImageUploader';
import ServiceEditModal from './ServiceEditModal';
import { Input } from '@/components/ui/input';
import { apiCallWithRetry } from '@/utils/apiRetry';
import { convertStudentContributionsToServices } from '@/utils/studentServices';

export default function ServiceApproval() {
    const [pendingServices, setPendingServices] = useState([]);
    const [allStudentServices, setAllStudentServices] = useState([]);
    const [students, setStudents] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null); 
    const [editingService, setEditingService] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('all');

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                throw new Error('אין חיבור לאינטרנט');
            }

            const [allServicesFromEntity, studentsRes] = await Promise.all([
                apiCallWithRetry(() => Service.list("-created_date", 1000)),
                apiCallWithRetry(() => Student.list("-created_date", 1000))
            ]);
            
            const pending = allServicesFromEntity.filter(s => !s.is_approved);
            const approved = allServicesFromEntity.filter(s => s.is_approved);
            
            setPendingServices(pending);
            
            
            const studentsMap = {};
            studentsRes.forEach(s => {
                if (s.user_id) studentsMap[s.user_id] = s;
            });
            setStudents(studentsMap);

            const studentProfileServices = convertStudentContributionsToServices(studentsRes);

            const approvedServicesList = approved.map(service => ({
                ...service,
                student_id: service.student_id || null,
                student_user_id: service.provider_id,
                student_name: service.provider_name || studentsMap[service.provider_id]?.full_name || 'לא ידוע',
                student_profile: studentsMap[service.provider_id] || null,
                source: 'service_entity',
                images: service.images || []
            }));


            const allServices = [...studentProfileServices, ...approvedServicesList];

            setAllStudentServices(allServices);

        } catch (error) {
            console.error("❌ ServiceApproval: Error loading services:", error);
            
            if (error.message?.includes('אין חיבור לאינטרנט')) {
                setError('אין חיבור לאינטרנט. אנא בדקי את החיבור שלך ונסי שוב.');
            } else if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
                setError('בעיה בחיבור לשרת. ייתכן שחיבור האינטרנט שלך איטי או שהשרת עמוס. אנא המתיני 2-3 דקות ונסי שוב.');
            } else if (error.message?.includes('Rate limit')) {
                setError('השרת עמוס מדי כרגע. אנא המתיני 5-10 דקות ונסי שוב.');
            } else {
                setError('אירעה שגיאה בטעינת השירותים. אנא נסי לרענן את הדף או להמתין מספר דקות.');
            }
        } finally {
          setIsLoading(false);
        }
    };

    const handleApproval = async (serviceId, approve) => {
        setIsLoading(true);
        setError(null);
        try {
            if (approve) {
                await Service.update(serviceId, { is_approved: true });
            } else {
                await Service.delete(serviceId);
            }
            
            await loadServices();
        } catch (error) {
            console.error("Error handling service approval:", error);
            setError('שגיאה בעת ביצוע הפעולה. אנא נסי שוב.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPendingServices = pendingServices.filter(service =>
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (service.category && service.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (service.provider_name && service.provider_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredAllStudentServices = allStudentServices.filter(service => {
        const searchMatch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (service.category && service.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (service.provider_name && service.provider_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (service.student_name && service.student_name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        let categoryMatch = true;
        if (categoryFilter === 'needs_fixing') {
            categoryMatch = service.category === 'כללי' || service.category === 'אחר' || !service.category;
        } else if (categoryFilter === 'general') {
            categoryMatch = service.category === 'כללי' || !service.category;
        } else if (categoryFilter === 'other') {
            categoryMatch = service.category === 'אחר';
        } else if (categoryFilter !== 'all') {
            categoryMatch = service.category === categoryFilter;
        }
        
        return searchMatch && categoryMatch;
    });

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <p className="text-slate-600">טוען שירותים...</p>
                    <p className="text-xs text-slate-500 mt-2">זה יכול לקחת עד 30 שניות ⏱️</p>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">שגיאה</h3>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <Button onClick={loadServices} className="bg-purple-600 hover:bg-purple-700">
                        <RefreshCw className="w-4 h-4 ml-2" />
                        נסי שוב
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>ניהול שירותים</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                        type="text"
                        placeholder="חפש שירות לפי כותרת, תיאור, קטגוריה או שם ספק..."
                        className="pl-9 pr-4 py-2 w-full border rounded-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-2 w-full mb-6">
                        <TabsTrigger value="pending">
                            ממתינים לאישור ({filteredPendingServices.length})
                        </TabsTrigger>
                        <TabsTrigger value="all">
                            כל השירותים ({filteredAllStudentServices.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="space-y-4">
                        {filteredPendingServices.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">
                                {searchTerm ? "לא נמצאו שירותים ממתינים התואמים לחיפוש." : "אין שירותים הממתינים לאישור כרגע."}
                            </p>
                        ) : (
                            filteredPendingServices.map((service, index) => (
                                <motion.div
                                    key={service.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-yellow-50/50">
                                        <div className="flex-1">
                                            <h3 className="font-bold">{service.title}</h3>
                                            <p className="text-sm text-slate-600">{service.description}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                קטגוריה: {service.category} | אזור: {service.geographic_area}
                                            </p>
                                            {service.provider_name && (
                                                <p className="text-xs text-slate-500 mt-1">
                                                    ספק: {service.provider_name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 self-end sm:self-center">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => handleApproval(service.id, false)}
                                            >
                                                <X className="w-4 h-4 ml-1" /> דחייה
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleApproval(service.id, true)}
                                            >
                                                <Check className="w-4 h-4 ml-1" /> אישור
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="all" className="space-y-4">
                        <div className="flex flex-wrap gap-2 mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-sm font-medium text-slate-700 self-center ml-2">סנן לפי קטגוריה:</span>
                            <Button
                                size="sm"
                                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                                onClick={() => setCategoryFilter('all')}
                                className={categoryFilter === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                            >
                                הכל ({allStudentServices.length})
                            </Button>
                            <Button
                                size="sm"
                                variant={categoryFilter === 'needs_fixing' ? 'default' : 'outline'}
                                onClick={() => setCategoryFilter('needs_fixing')}
                                className={categoryFilter === 'needs_fixing' ? 'bg-orange-600 hover:bg-orange-700' : 'border-orange-300 text-orange-700 hover:bg-orange-50'}
                            >
                                ⚠️ דורש תיקון ({allStudentServices.filter(s => s.category === 'כללי' || s.category === 'אחר' || !s.category).length})
                            </Button>
                            <Button
                                size="sm"
                                variant={categoryFilter === 'general' ? 'default' : 'outline'}
                                onClick={() => setCategoryFilter('general')}
                                className={categoryFilter === 'general' ? 'bg-slate-600 hover:bg-slate-700' : ''}
                            >
                                כללי ({allStudentServices.filter(s => s.category === 'כללי' || !s.category).length})
                            </Button>
                            <Button
                                size="sm"
                                variant={categoryFilter === 'other' ? 'default' : 'outline'}
                                onClick={() => setCategoryFilter('other')}
                                className={categoryFilter === 'other' ? 'bg-slate-600 hover:bg-slate-700' : ''}
                            >
                                אחר ({allStudentServices.filter(s => s.category === 'אחר').length})
                            </Button>
                        </div>

                        {filteredAllStudentServices.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">
                                {searchTerm || categoryFilter !== 'all' ? "לא נמצאו שירותים התואמים לסינון." : "אין שירותים במערכת כרגע."}
                            </p>
                        ) : (
                            filteredAllStudentServices.map((service, index) => (
                                <motion.div
                                    key={`${service.source}-${service.student_id || service.id}-${service.id}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <div className="flex-shrink-0">
                                                    {service.images && service.images.length > 0 ? (
                                                        <div className="flex gap-2">
                                                            {service.images.slice(0, 3).map((img, idx) => (
                                                                <img
                                                                    key={idx}
                                                                    src={img}
                                                                    alt={`${service.title} ${idx + 1}`}
                                                                    className="w-16 h-16 object-cover rounded-lg border"
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                                                            <ImageIcon className="w-6 h-6 text-slate-400" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-start gap-2 flex-wrap">
                                                        <h3 className="font-bold text-slate-800">{service.title}</h3>
                                                        <span className={`text-xs px-2 py-1 rounded ${
                                                            service.source === 'profile_new' ? 'bg-blue-100 text-blue-700' :
                                                            service.source === 'profile_old' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                            {service.source === 'profile_new' ? 'פרופיל חדש' :
                                                             service.source === 'profile_old' ? 'פרופיל ישן' :
                                                             'שירות ישיר'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                                                        <span>👤 {service.student_name}</span>
                                                        <span className={`font-medium ${
                                                            service.category === 'כללי' || service.category === 'אחר' || !service.category
                                                                ? 'text-orange-600 bg-orange-50 px-2 py-1 rounded' 
                                                                : 'text-blue-600'
                                                        }`}>
                                                            🏷️ {service.category || 'ללא קטגוריה'}
                                                        </span>
                                                        <span>📍 {service.geographic_area || 'לא צוין'}</span>
                                                        <span>📷 {service.images?.length || 0}/3 תמונות</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 pt-2 border-t">
                                                <div className="flex items-center">
                                                    {(service.source === 'profile_new' || service.source === 'profile_old') && service.student_profile ? (
                                                        <ServiceImageUploader
                                                            service={service}
                                                            studentProfile={service.student_profile}
                                                            onSuccess={loadServices}
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-slate-500">
                                                            שירות ישיר
                                                        </span>
                                                    )}
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setEditingService(service)}
                                                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                                >
                                                    <Edit className="w-4 h-4 ml-1" />
                                                    ערוך שירות
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </TabsContent>
                </Tabs>

                {editingService && (
                    <ServiceEditModal
                        isOpen={!!editingService}
                        onClose={() => setEditingService(null)}
                        service={editingService}
                        onSuccess={loadServices}
                    />
                )}
            </CardContent>
        </Card>
    );
}
