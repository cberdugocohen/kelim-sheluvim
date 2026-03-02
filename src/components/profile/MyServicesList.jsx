import React, { useState, useEffect } from 'react';
import { Service } from '@/entities/Service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Edit, Trash2, Loader2, ShoppingBag } from 'lucide-react';
import ServiceFormModal from './ServiceFormModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const ServiceItem = ({ service, onEdit, onDelete }) => (
  <Card className="bg-white/80">
    <CardContent className="p-4 flex items-center justify-between">
      <div>
        <h4 className="font-bold text-slate-800">{service.title}</h4>
        <p className="text-sm text-slate-500">{service.category} - {service.geographic_area}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(service)}>
          <Edit className="w-4 h-4 ml-1" /> עריכה
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 ml-1" /> מחיקה
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>האם את בטוחה?</AlertDialogTitle>
              <AlertDialogDescription>
                פעולה זו תמחק את השירות "{service.title}" באופן סופי. לא ניתן לשחזר את המידע.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(service.id)} className="bg-red-600 hover:bg-red-700">
                כן, למחוק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CardContent>
  </Card>
);

export default function MyServicesList({ user, initialServices, onDataChange }) {
  const [services, setServices] = useState(initialServices || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  useEffect(() => {
    setServices(initialServices || []);
  }, [initialServices]);

  const handleAddNew = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDelete = async (serviceId) => {
    try {
      await Service.delete(serviceId);
      onDataChange(); // Refresh all profile data
    } catch (error) {
      console.error("Failed to delete service:", error);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingService(null);
  }

  const handleSave = () => {
    handleModalClose();
    onDataChange(); // Refresh all profile data
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm p-6 shadow-xl">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-purple-600" />
            המוצרים והשירותים שלי
          </CardTitle>
          <CardDescription className="mt-2">
            כאן תוכלי להוסיף שירותים ספציפיים (כמו סדנה, טיפול או מוצר) שיופיעו במאגר השירותים הכללי.
          </CardDescription>
        </div>
        <Button onClick={handleAddNew} className="flex-shrink-0">
          <Plus className="w-4 h-4 ml-2" />
          הוספת מוצר/שירות חדש
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : services.length > 0 ? (
          <div className="space-y-4">
            {services.map(service => (
              <ServiceItem key={service.id} service={service} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50/50 rounded-lg border border-dashed">
            <p className="text-slate-600 font-medium">עדיין לא הוספת מוצרים או שירותים.</p>
            <p className="text-slate-500 text-sm mt-1">לחצי על 'הוספת מוצר/שירות חדש' כדי להתחיל.</p>
          </div>
        )}
      </CardContent>

      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        service={editingService}
        user={user}
      />
    </Card>
  );
}
