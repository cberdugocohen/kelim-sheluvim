import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import ServiceFormModal from './ServiceFormModal';
import toast from "react-hot-toast";

export default function ServicesManager({ 
  services, 
  onChange, 
  autoSave = false,
  currentUser,
  studentProfile 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showDuplicateCleaner, setShowDuplicateCleaner] = useState(false);

  const handleAddService = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDeleteService = (serviceId) => {
    const updatedServices = services.filter(s => s.id !== serviceId);
    onChange(updatedServices);
    setIsModalOpen(false); 
  };

  const findDuplicates = () => {
    const titleMap = new Map();
    const duplicates = [];
    
    services.forEach(service => {
      const titleKey = service.title.trim().toLowerCase();
      if (titleMap.has(titleKey)) {
        const existing = titleMap.get(titleKey);
        if (!duplicates.find(d => d.title === titleKey)) {
          duplicates.push({
            title: titleKey,
            services: [existing, service]
          });
        } else {
          duplicates.find(d => d.title === titleKey).services.push(service);
        }
      } else {
        titleMap.set(titleKey, service);
      }
    });
    
    return duplicates;
  };

  const cleanDuplicates = () => {
    const duplicates = findDuplicates();
    if (duplicates.length === 0) {
      toast.success('👍 לא נמצאו כפילויות!');
      return;
    }

    // שומרים רק את השירות הראשון מכל קבוצה
    const toKeep = new Set();
    const titleMap = new Map();
    
    services.forEach(service => {
      const titleKey = service.title.trim().toLowerCase();
      if (!titleMap.has(titleKey)) {
        titleMap.set(titleKey, true);
        toKeep.add(service.id);
      }
    });

    const cleaned = services.filter(s => toKeep.has(s.id));
    const removedCount = services.length - cleaned.length;
    
    if (confirm(`נמצאו ${removedCount} כפילויות.\n\nהאם למחוק אותן? (ישאר רק שירות אחד מכל שם)`)) {
      onChange(cleaned);
      setShowDuplicateCleaner(false);
      toast.success(`✅ נמחקו ${removedCount} כפילויות בהצלחה!`);
    }
  };

  const handleSaveService = (serviceData) => {
    
    // בדיקת ייחודיות - מניעת כפילויות
    const titleLower = serviceData.title.trim().toLowerCase();
    const duplicateService = services.find(s => 
      s.title.trim().toLowerCase() === titleLower && 
      (!editingService || s.id !== editingService.id)
    );
    
    if (duplicateService) {
      toast.success('⚠️ כבר קיים שירות עם השם הזה!\n\nאם את רוצה לעדכן את השירות הקיים, לחצי על "עריכה" ליד השירות במקום להוסיף חדש.');
      return;
    }
    
    let updatedServices;
    
    if (editingService) {
      // שיפור: חיפוש השירות לעדכון לפי ID וגם לפי שם (גיבוי)
      const serviceIndex = services.findIndex(s => s.id === editingService.id);
      
      if (serviceIndex !== -1) {
        // מצאנו את השירות לפי ID - עדכון במקום
        updatedServices = [...services];
        updatedServices[serviceIndex] = { ...serviceData, id: editingService.id };
      } else {
        // לא מצאנו לפי ID - זה לא אמור לקרות, אבל נוסיף בטיחות
        console.warn("⚠️ Service ID not found, adding as new");
        const newService = {
          ...serviceData,
          id: `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          is_active: true
        };
        updatedServices = [...services, newService];
      }
    } else {
      const newService = {
        ...serviceData,
        id: `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        is_active: true
      };
      updatedServices = [...services, newService];
    }
    
    onChange(updatedServices);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-right">
          <strong>💡 טיפ חשוב:</strong> כל שירות צריך תמונות משלו! 
          <br />
          תמונת הפרופיל האישית שלך נמצאת למעלה - כאן תעלי תמונות של המוצרים/שירותים הספציפיים שאת מציעה.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">השירותים שלי ({services.length})</h3>
        <div className="flex gap-2">
          {services.length > 1 && (
            <Button 
              onClick={() => setShowDuplicateCleaner(!showDuplicateCleaner)} 
              variant="outline" 
              size="sm"
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              🧹 נקי כפילויות
            </Button>
          )}
          <Button onClick={handleAddService} variant="outline" size="sm">
            <Plus className="w-4 h-4 ml-2" />
            הוסיפי שירות
          </Button>
        </div>
      </div>

      {showDuplicateCleaner && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 text-right">
            <div className="flex items-center justify-between">
              <div>
                <strong>🧹 ניקוי כפילויות אוטומטי</strong>
                <p className="text-sm mt-1">
                  הכלי ימצא ויסיר שירותים עם אותה כותרת (ישאיר רק אחד מכל שם)
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={cleanDuplicates} size="sm" className="bg-orange-600 hover:bg-orange-700">
                  הפעילי ניקוי
                </Button>
                <Button onClick={() => setShowDuplicateCleaner(false)} variant="outline" size="sm">
                  ביטול
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {services.length === 0 ? (
        <Card className="bg-slate-50">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500 mb-4">עדיין לא הוספת שירותים</p>
            <Button onClick={handleAddService}>
              <Plus className="w-4 h-4 ml-2" />
              הוסיפי את השירות הראשון שלך
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {service.images && service.images.length > 0 && (
                    <div className="flex gap-1 flex-shrink-0">
                      {service.images.slice(0, 2).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${service.title} ${idx + 1}`}
                          className="w-16 h-16 rounded object-cover border"
                        />
                      ))}
                      {service.images.length > 2 && (
                        <div className="w-16 h-16 rounded border bg-slate-100 flex items-center justify-center text-xs text-slate-600">
                          +{service.images.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-800">{service.title}</h4>
                        <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                          {service.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditService(service)}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          // This delete button is for the list view,
                          // a confirm dialog was previously here,
                          // but since the modal also has a delete,
                          // keeping this simple for list, or it can be removed
                          // if only modal delete is desired.
                          onClick={() => {
                            if (confirm('האם את בטוחה שברצונך למחוק את השירות הזה?')) {
                              handleDeleteService(service.id);
                            }
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {service.type === 'gift' ? '💝 מתנה' : 
                         service.type === 'paid' ? '💰 בתשלום' : 
                         '🔄 חליפין'}
                      </Badge>
                      {service.category && (
                        <Badge variant="outline" className="text-xs">
                          {service.category}
                        </Badge>
                      )}
                      {service.images && service.images.length > 0 && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <ImageIcon className="w-3 h-3 ml-1" />
                          {service.images.length} תמונות
                        </Badge>
                      )}
                      {service.is_active ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          פעיל
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          לא פעיל
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingService(null);
        }}
        onSave={handleSaveService}
        onDelete={handleDeleteService} // Pass the handleDeleteService to the modal
        service={editingService}
      />
    </div>
  );
}
