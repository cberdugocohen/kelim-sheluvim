import React, { useState, useEffect } from 'react';
import { CategoryRequest } from '@/entities/CategoryRequest';
import { ServiceCategory } from '@/entities/ServiceCategory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CategoryRequests() {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPendingRequests();
    }, []);

    const loadPendingRequests = async () => {
        setIsLoading(true);
        try {
            const requests = await CategoryRequest.filter({ status: "pending" });
            setPendingRequests(requests);
        } catch (error) {
            console.error("Error loading pending category requests:", error);
        }
        setIsLoading(false);
    };

    const handleRequest = async (request, approve) => {
        try {
            if (approve) {
                // 1. יצירת רשומה חדשה בטבלת הקטגוריות
                await ServiceCategory.create({
                    main_category: request.main_category_suggestion || 'כללי',
                    sub_category: request.requested_category,
                    is_active: true,
                });
                // 2. עדכון סטטוס הבקשה
                await CategoryRequest.update(request.id, { status: 'approved', admin_response: 'הקטגוריה אושרה והוספה למערכת.' });
            } else {
                await CategoryRequest.update(request.id, { status: 'rejected', admin_response: 'הבקשה נדחתה.' });
            }
            // 3. טעינה מחדש של הרשימה
            loadPendingRequests();
        } catch (error) {
            console.error("Error handling category request:", error);
        }
    };

    if (isLoading) return <p>טוען בקשות לקטגוריות...</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>בקשות לקטגוריות חדשות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {pendingRequests.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">אין בקשות חדשות לקטגוריות.</p>
                ) : (
                    pendingRequests.map((request, index) => (
                        <motion.div
                            key={request.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex-1">
                                    <p><strong>קטגוריה מבוקשת:</strong> {request.requested_category}</p>
                                    <p><strong>תחום ראשי מוצע:</strong> {request.main_category_suggestion || 'לא צוין'}</p>
                                    {request.description && <p className="text-sm text-slate-600 mt-1"><strong>תיאור:</strong> {request.description}</p>}
                                </div>
                                <div className="flex gap-2 self-end sm:self-center">
                                    <Button size="sm" variant="outline" className="text-red-500 border-red-500 hover:bg-red-50" onClick={() => handleRequest(request, false)}>
                                        <X className="w-4 h-4 ml-1" /> דחייה
                                    </Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleRequest(request, true)}>
                                        <Check className="w-4 h-4 ml-1" /> אישור
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
