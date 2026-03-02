import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowLeft, Image, BookOpen, MapPin, Sparkles, Gift, ShoppingBag } from 'lucide-react';

export default function ProfileCompletionProgress({ user, student, formData, myServices, onItemClick, formRefs }) {
  const completionTasks = [
    { 
      id: 'profileImage',
      label: 'תמונת פרופיל', 
      isComplete: !!formData.profile_image, 
      weight: 15,
      ref: formRefs.profileImage,
      icon: Image
    },
    { 
      id: 'description',
      label: 'ספרי על עצמך', 
      isComplete: formData.description && formData.description.length > 20, 
      weight: 15,
      ref: formRefs.description,
      icon: BookOpen
    },
    { 
      id: 'city',
      label: 'עיר מגורים', 
      isComplete: !!formData.city, 
      weight: 10,
      ref: formRefs.city,
      icon: MapPin
    },
    { 
      id: 'serviceAreas',
      label: 'תחומי שירות', 
      isComplete: formData.service_areas && formData.service_areas.length > 0, 
      weight: 20,
      ref: formRefs.serviceAreas,
      icon: Sparkles
    },
    { 
      id: 'giving',
      label: 'צורת נתינה', 
      isComplete: (formData.contribution_details?.gift?.description || formData.contribution_details?.paid?.description),
      weight: 20,
      ref: formRefs.giving,
      icon: Gift
    },
    { 
      id: 'myServices',
      label: 'הוסיפי שירות ספציפי', 
      isComplete: myServices && myServices.length > 0,
      weight: 20,
      ref: formRefs.myServices,
      icon: ShoppingBag
    },
  ];

  const completedWeight = completionTasks
    .filter(task => task.isComplete)
    .reduce((sum, task) => sum + task.weight, 0);
  
  const totalWeight = completionTasks.reduce((sum, task) => sum + task.weight, 0);
  const completionPercentage = Math.round((completedWeight / totalWeight) * 100);

  const getGreeting = () => {
    if (completionPercentage === 100) return "כל הכבוד, הפרופיל שלך מושלם! 🌟";
    if (completionPercentage >= 70) return "כמעט שם! עוד מאמץ קטן";
    if (completionPercentage >= 40) return "התקדמות יפה, בואי נמשיך";
    return "בואי נשלים את הפרופיל שלך";
  };
  
  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle>השלמת פרופיל - {completionPercentage}%</CardTitle>
        <p className="text-sm text-slate-500">{getGreeting()}</p>
        <Progress value={completionPercentage} className="mt-2" />
      </CardHeader>
      <CardContent>
        <p className="font-semibold text-slate-600 mb-3">איך להגיע ל-100%?</p>
        <div className="space-y-2">
          {completionTasks.map(task => (
            <div 
              key={task.id}
              className={`flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${task.isComplete ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer'}`}
              onClick={() => !task.isComplete && onItemClick(task.ref)}
            >
              <div className="flex items-center gap-3">
                {task.isComplete ? <CheckCircle className="w-5 h-5"/> : <task.icon className="w-5 h-5 opacity-70"/>}
                <span className="font-medium text-sm">{task.label}</span>
              </div>
              {!task.isComplete && <ArrowLeft className="w-4 h-4 text-slate-400" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
