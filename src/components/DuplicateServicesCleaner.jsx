import React, { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, AlertTriangle, CheckCircle, Trash2, RefreshCw, Users } from 'lucide-react';
import toast from "react-hot-toast";

export default function DuplicateServicesCleaner() {
  const [students, setStudents] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [duplicateProfiles, setDuplicateProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({ total: 0, withDuplicates: 0, totalDuplicates: 0 });
  const [profileStats, setProfileStats] = useState({ total: 0, duplicateUsers: 0, totalDuplicateProfiles: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allStudents = await Student.list('-created_date', 500);
      setStudents(allStudents);
      analyzeDuplicates(allStudents);
      analyzeDuplicateProfiles(allStudents);
    } catch (error) {
      console.error('Error loading students:', error);
    }
    setIsLoading(false);
  };

  const analyzeDuplicateProfiles = (studentsList) => {
    const userIdMap = new Map();
    const duplicatesList = [];
    
    studentsList.forEach(student => {
      if (!student.user_id) return;
      
      if (!userIdMap.has(student.user_id)) {
        userIdMap.set(student.user_id, []);
      }
      userIdMap.get(student.user_id).push(student);
    });

    let totalDuplicateProfiles = 0;
    userIdMap.forEach((profiles, userId) => {
      if (profiles.length > 1) {
        profiles.sort((a, b) => {
          const scoreA = (a.services?.length || 0) * 10 + (a.description?.length || 0);
          const scoreB = (b.services?.length || 0) * 10 + (b.description?.length || 0);
          return scoreB - scoreA;
        });

        duplicatesList.push({
          user_id: userId,
          profiles: profiles,
          keepProfile: profiles[0],
          deleteProfiles: profiles.slice(1)
        });
        totalDuplicateProfiles += profiles.length - 1;
      }
    });

    setDuplicateProfiles(duplicatesList);
    setProfileStats({
      total: studentsList.length,
      duplicateUsers: duplicatesList.length,
      totalDuplicateProfiles: totalDuplicateProfiles
    });
  };

  const analyzeDuplicates = (studentsList) => {
    const duplicatesList = [];
    let totalDupsCount = 0;
    let totalStudentsWithServices = 0;

    studentsList.forEach(student => {
      // Skip if no services array
      if (!student.services || student.services.length === 0) return;

      totalStudentsWithServices++;
      
      const titleMap = new Map();
      const studentDuplicates = [];

      student.services.forEach(service => {
        // More robust check for service validity
        if (!service || !service.title) {
          console.warn(`Student ${student.full_name} has invalid service:`, service);
          return;
        }
        
        const titleKey = service.title.trim().toLowerCase();
        
        if (titleMap.has(titleKey)) {
          const existing = titleMap.get(titleKey);
          if (!studentDuplicates.find(d => d.title === titleKey)) {
            studentDuplicates.push({
              title: titleKey,
              displayTitle: service.title,
              services: [existing, service],
              count: 2
            });
            totalDupsCount++;
          } else {
            const dup = studentDuplicates.find(d => d.title === titleKey);
            dup.services.push(service);
            dup.count++;
            totalDupsCount++;
          }
        } else {
          titleMap.set(titleKey, service);
        }
      });

      if (studentDuplicates.length > 0) {
        duplicatesList.push({
          student,
          duplicates: studentDuplicates,
          totalDuplicates: studentDuplicates.reduce((sum, d) => sum + (d.count - 1), 0)
        });
      }
    });

    setDuplicates(duplicatesList);
    setStats({
      total: studentsList.length,
      withDuplicates: duplicatesList.length,
      totalDuplicates: totalDupsCount,
      studentsWithServices: totalStudentsWithServices
    });
  };

  const cleanDuplicatesForStudent = async (studentData) => {
    setIsProcessing(true);
    try {
      const titleMap = new Map();
      const cleanedServices = [];

      studentData.student.services.forEach(service => {
        const titleKey = service.title.trim().toLowerCase();
        if (!titleMap.has(titleKey)) {
          titleMap.set(titleKey, true);
          cleanedServices.push(service);
        }
      });

      await Student.update(studentData.student.id, {
        services: cleanedServices
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error cleaning duplicates:', error);
      toast.error('שגיאה בניקוי הכפילויות');
    }
    setIsProcessing(false);
  };

  const cleanAllDuplicates = async () => {
    if (!confirm(`האם למחוק ${stats.totalDuplicates} כפילויות מ-${stats.withDuplicates} משתמשות?\n\nלכל שירות ישאר רק עותק אחד.`)) {
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const studentData of duplicates) {
      try {
        const titleMap = new Map();
        const cleanedServices = [];

        studentData.student.services.forEach(service => {
          const titleKey = service.title.trim().toLowerCase();
          if (!titleMap.has(titleKey)) {
            titleMap.set(titleKey, true);
            cleanedServices.push(service);
          }
        });

        await Student.update(studentData.student.id, {
          services: cleanedServices
        });
        successCount++;
      } catch (error) {
        console.error(`Error cleaning for student ${studentData.student.id}:`, error);
        errorCount++;
      }
    }

    toast.error(`✅ ניקוי הושלם!\n\n✓ ${successCount} משתמשות עודכנו\n${errorCount > 0 ? `✗ ${errorCount} שגיאות` : ''}`);
    await loadData();
    setIsProcessing(false);
  };

  const cleanDuplicateProfilesForUser = async (duplicateData) => {
    setIsProcessing(true);
    try {
      for (const profile of duplicateData.deleteProfiles) {
        await Student.delete(profile.id);
      }
      await loadData();
    } catch (error) {
      console.error('Error cleaning duplicate profiles:', error);
      toast.error('שגיאה במחיקת פרופילים כפולים');
    }
    setIsProcessing(false);
  };

  const cleanAllDuplicateProfiles = async () => {
    if (!confirm(`האם למחוק ${profileStats.totalDuplicateProfiles} פרופילים כפולים מ-${profileStats.duplicateUsers} משתמשות?\n\nלכל משתמשת ישאר רק הפרופיל המלא והעדכני ביותר.`)) {
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;
    let totalDeleted = 0;

    for (const duplicateData of duplicateProfiles) {
      try {
        for (const profile of duplicateData.deleteProfiles) {
          await Student.delete(profile.id);
          totalDeleted++;
        }
        successCount++;
      } catch (error) {
        console.error(`Error cleaning profiles for user ${duplicateData.user_id}:`, error);
        errorCount++;
      }
    }

    toast.error(`✅ ניקוי הושלם!\n\n✓ נמחקו ${totalDeleted} פרופילים כפולים\n✓ ${successCount} משתמשות עודכנו\n${errorCount > 0 ? `✗ ${errorCount} שגיאות` : ''}`);
    await loadData();
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">סורקת כפילויות במערכת...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="profiles" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="profiles">פרופילים כפולים</TabsTrigger>
        <TabsTrigger value="services">כפילויות שירותים</TabsTrigger>
      </TabsList>

      <TabsContent value="services" className="space-y-6">
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="w-6 h-6" />
            מרכז ניקוי כפילויות 🧹
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-sm text-slate-600">סך כל המשתמשות</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.studentsWithServices || 0}</div>
              <div className="text-sm text-slate-600">עם שירותים</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.withDuplicates}</div>
              <div className="text-sm text-slate-600">עם כפילויות</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-red-600">{stats.totalDuplicates}</div>
              <div className="text-sm text-slate-600">כפילויות למחיקה</div>
            </div>
          </div>

          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>הסבר:</strong> הכלי בודק רק כפילויות של <strong>אותה משתמשת</strong> שהוסיפה את אותו שירות פעמיים.
              אם את רואה בעיות, זה יכול להיות בגלל:<br/>
              • משתמשות שונות עם שירותים דומים (זה תקין)<br/>
              • הבעיה כבר תוקנה והמשתמשות מוסיפות חדש בצורה נכונה<br/>
              • השירותים נמצאים במבנה הישן (contribution_details) - צריך להמיר דרך טאב "המרה"
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              onClick={cleanAllDuplicates}
              disabled={duplicates.length === 0 || isProcessing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מנקה...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 ml-2" />
                  נקי את כל הכפילויות
                </>
              )}
            </Button>
            <Button onClick={loadData} variant="outline" disabled={isLoading}>
              <RefreshCw className="w-4 h-4 ml-2" />
              רענן
            </Button>
          </div>
        </CardContent>
      </Card>

      {duplicates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-700 mb-2">מצוין! 🎉</h3>
            <p className="text-slate-600">לא נמצאו כפילויות במערכת</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {duplicates.map((studentData, idx) => (
            <Card key={studentData.student.id} className="border-orange-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {studentData.student.full_name || studentData.student.username || 'ללא שם'}
                    </CardTitle>
                    <p className="text-sm text-slate-500">
                      {studentData.totalDuplicates} כפילויות נמצאו
                    </p>
                  </div>
                  <Button
                    onClick={() => cleanDuplicatesForStudent(studentData)}
                    disabled={isProcessing}
                    size="sm"
                    variant="outline"
                    className="text-orange-600 border-orange-300"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    נקי כפילויות
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentData.duplicates.map((dup, dupIdx) => (
                    <Alert key={dupIdx} className="border-red-200 bg-red-50">
                      <AlertDescription>
                        <div className="flex items-start justify-between">
                          <div>
                            <strong className="text-red-800">"{dup.displayTitle}"</strong>
                            <p className="text-sm text-red-600 mt-1">
                              מופיע {dup.count} פעמים (ימחקו {dup.count - 1} עותקים)
                            </p>
                          </div>
                          <Badge variant="destructive">{dup.count}x</Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </TabsContent>

      <TabsContent value="profiles" className="space-y-6">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Users className="w-6 h-6" />
              ניקוי פרופילים כפולים 👥
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-slate-800">{profileStats.total}</div>
                <div className="text-sm text-slate-600">סך כל הפרופילים</div>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600">{profileStats.duplicateUsers}</div>
                <div className="text-sm text-slate-600">משתמשות עם כפילויות</div>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-pink-600">{profileStats.totalDuplicateProfiles}</div>
                <div className="text-sm text-slate-600">פרופילים למחיקה</div>
              </div>
            </div>

            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>הסבר:</strong> הכלי מזהה משתמשות עם יותר מפרופיל אחד (אותו user_id).<br/>
                הוא שומר את הפרופיל המלא והעדכני ביותר (עם הכי הרבה שירותים ותוכן) ומוחק את השאר.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={cleanAllDuplicateProfiles}
                disabled={duplicateProfiles.length === 0 || isProcessing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מנקה...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 ml-2" />
                    נקי את כל הפרופילים הכפולים
                  </>
                )}
              </Button>
              <Button onClick={loadData} variant="outline" disabled={isLoading}>
                <RefreshCw className="w-4 h-4 ml-2" />
                רענן
              </Button>
            </div>
          </CardContent>
        </Card>

        {duplicateProfiles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-700 mb-2">מצוין! 🎉</h3>
              <p className="text-slate-600">לא נמצאו פרופילים כפולים</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {duplicateProfiles.map((duplicateData) => (
              <Card key={duplicateData.user_id} className="border-purple-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {duplicateData.keepProfile.full_name || duplicateData.keepProfile.username || 'ללא שם'}
                      </CardTitle>
                      <p className="text-sm text-slate-500">
                        {duplicateData.profiles.length} פרופילים, {duplicateData.deleteProfiles.length} ימחקו
                      </p>
                    </div>
                    <Button
                      onClick={() => cleanDuplicateProfilesForUser(duplicateData)}
                      disabled={isProcessing}
                      size="sm"
                      variant="outline"
                      className="text-purple-600 border-purple-300"
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      נקי כפילויות
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription>
                        <div className="flex items-start justify-between">
                          <div>
                            <strong className="text-green-800">✅ יישמר:</strong>
                            <p className="text-sm text-green-700 mt-1">
                              {duplicateData.keepProfile.services?.length || 0} שירותים • 
                              {duplicateData.keepProfile.description ? ' תיאור מלא' : ' ללא תיאור'} • 
                              נוצר {new Date(duplicateData.keepProfile.created_date).toLocaleDateString('he-IL')}
                            </p>
                          </div>
                          <Badge className="bg-green-600">שומר</Badge>
                        </div>
                      </AlertDescription>
                    </Alert>

                    {duplicateData.deleteProfiles.map((profile, idx) => (
                      <Alert key={profile.id} className="border-red-200 bg-red-50">
                        <AlertDescription>
                          <div className="flex items-start justify-between">
                            <div>
                              <strong className="text-red-800">❌ יימחק:</strong>
                              <p className="text-sm text-red-600 mt-1">
                                {profile.services?.length || 0} שירותים • 
                                {profile.description ? ' תיאור מלא' : ' ללא תיאור'} • 
                                נוצר {new Date(profile.created_date).toLocaleDateString('he-IL')}
                              </p>
                            </div>
                            <Badge variant="destructive">מחק</Badge>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
