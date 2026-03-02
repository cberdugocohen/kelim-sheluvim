import React, { useState, useEffect } from 'react';
import { HolidaySection } from '@/entities/HolidaySection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; // Added this import
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Gift, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HolidaySectionManager() {
    const [holidaySection, setHolidaySection] = useState({
        title: "🎉 החג מתקרב...",
        subtitle: "ויש כאן נשים שיוצרות, מעניקות ונותנות מהפנימיות שלהן. בואי לגלות שירותים ומתנות עם לב – במיוחד לחגים.",
        is_active: true,
        current_holiday: "כללי"
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const holidayOptions = [
        "ראש השנה", "יום כיפור", "סוכות", "חנוכה", "ט\"ו בשבט", 
        "פורים", "פסח", "יום העצמאות", "ל\"ג בעומר", "שבועות", 
        "שלושת השבועות", "תשעה באב", "כללי"
    ];

    useEffect(() => {
        loadHolidaySection();
    }, []);

    const loadHolidaySection = async () => {
        setIsLoading(true);
        try {
            const sections = await HolidaySection.list();
            if (sections.length > 0) {
                setHolidaySection(sections[0]);
            }
        } catch (error) {
            console.error("Error loading holiday section:", error);
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage({ type: "", text: "" });
        
        try {
            const existingSections = await HolidaySection.list();
            
            if (existingSections.length > 0) {
                await HolidaySection.update(existingSections[0].id, holidaySection);
            } else {
                await HolidaySection.create(holidaySection);
            }
            
            setMessage({ type: "success", text: "הגדרות אזור החגים נשמרו בהצלחה!" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: "שגיאה בשמירת ההגדרות" });
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p>טוען הגדרות אזור החגים...</p>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-orange-500" />
                    ניהול אזור החגים בדף הבית
                </CardTitle>
                <p className="text-sm text-slate-600">
                    כאן תוכלי לעדכן את כותרת החג, התיאור, ולהפעיל או לכבות את האזור החגיגי בדף הבית
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {message.text && (
                    <Alert className={`${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        {message.type === 'success' ? 
                            <CheckCircle className="h-4 w-4 text-green-600" /> : 
                            <AlertCircle className="h-4 w-4 text-red-600" />
                        }
                        <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                            {message.text}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <Switch
                            id="is_active"
                            checked={holidaySection.is_active}
                            onCheckedChange={(checked) => 
                                setHolidaySection(prev => ({ ...prev, is_active: checked }))
                            }
                        />
                        <Label htmlFor="is_active" className="font-medium flex items-center gap-2">
                            {holidaySection.is_active ? (
                                <>
                                    <Eye className="w-4 h-4 text-green-600" />
                                    הצג אזור חגים בדף הבית
                                </>
                            ) : (
                                <>
                                    <EyeOff className="w-4 h-4 text-gray-500" />
                                    הסתר אזור חגים מדף הבית
                                </>
                            )}
                        </Label>
                    </div>
                    <p className="text-sm text-slate-500">
                        {holidaySection.is_active 
                            ? "האזור החגיגי מוצג כעת בדף הבית" 
                            : "האזור החגיגי מוסתר מדף הבית"}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="title" className="font-medium">כותרת האזור החגיגי *</Label>
                    <Input
                        id="title"
                        value={holidaySection.title}
                        onChange={(e) => 
                            setHolidaySection(prev => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="🎉 החג מתקרב..."
                        className="text-lg"
                    />
                    <p className="text-xs text-slate-500">
                        זוהי הכותרת הראשית שתופיע באזור החגיגי
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="subtitle" className="font-medium">תת-כותרת / תיאור</Label>
                    <Textarea
                        id="subtitle"
                        value={holidaySection.subtitle}
                        onChange={(e) => 
                            setHolidaySection(prev => ({ ...prev, subtitle: e.target.value }))
                        }
                        placeholder="תיאור מקסים על החג והשירותים..."
                        className="min-h-[100px] resize-none"
                    />
                    <p className="text-xs text-slate-500">
                        הטקסט שיופיע מתחת לכותרת, מסביר על החג והשירותים המיוחדים
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="current_holiday" className="font-medium">החג הנוכחי</Label>
                    <Select 
                        value={holidaySection.current_holiday} 
                        onValueChange={(value) => 
                            setHolidaySection(prev => ({ ...prev, current_holiday: value }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="בחרי חג..." />
                        </SelectTrigger>
                        <SelectContent>
                            {holidayOptions.map(holiday => (
                                <SelectItem key={holiday} value={holiday}>
                                    {holiday}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                        בחירת החג הנוכחי תסייע לסינון השירותים הרלוונטיים
                    </p>
                </div>

                <div className="pt-4 border-t">
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving || !holidaySection.title.trim()}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium h-12"
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                שומר הגדרות...
                            </div>
                        ) : (
                            <>
                                <Save className="w-4 h-4 ml-2" />
                                שמור הגדרות אזור החגים
                            </>
                        )}
                    </Button>
                </div>

                {/* Enhanced Preview */}
                <div className="pt-6 border-t">
                    <Label className="font-medium mb-3 block">תצוגה מקדימה של האזור בדף הבית:</Label>
                    <motion.div 
                        className={`p-6 bg-gradient-to-br from-rose-50 via-purple-50 to-amber-50 rounded-2xl border border-rose-100 ${
                            holidaySection.is_active ? '' : 'opacity-50 grayscale'
                        }`}
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: holidaySection.is_active ? 1 : 0.5 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h3 className="text-2xl font-bold text-slate-800 mb-3 text-center">
                            {holidaySection.title || "כותרת החג"}
                        </h3>
                        <p className="text-slate-600 text-center leading-relaxed mb-4">
                            {holidaySection.subtitle || "תיאור החג יופיע כאן"}
                        </p>
                        <div className="text-center">
                            <Button 
                                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white" 
                                disabled
                            >
                                🛍 ראיית כל השירותים לחג הקרוב
                            </Button>
                        </div>
                        {!holidaySection.is_active && (
                            <div className="text-center mt-3">
                                <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                                    מוסתר מהמשתמשים
                                </Badge>
                            </div>
                        )}
                    </motion.div>
                </div>
            </CardContent>
        </Card>
    );
}
