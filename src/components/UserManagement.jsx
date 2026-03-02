import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '@/entities/User';
import { Student } from '@/entities/Student';
import { PrivateMessage } from '@/entities/PrivateMessage';
import { CommunityPost } from '@/entities/CommunityPost';
import { Service } from '@/entities/Service';
import { Recommendation } from '@/entities/Recommendation';
import { SpotlightRequest } from '@/entities/SpotlightRequest';
import { BugReport } from '@/entities/BugReport';
import { ProfileApproval } from '@/entities/ProfileApproval';
import { CategoryRequest } from '@/entities/CategoryRequest';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, Loader2, ShieldQuestion, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiCallWithRetry } from '@/utils/apiRetry';
import toast from "react-hot-toast";

// --- כלי עזר לזיהוי כפילויות ---

// מחשב את "מרחק לוינשטיין" - מדד לדמיון בין שתי מחרוזות
const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
  for (let j = 1; j <= b.length; j += 1) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  return matrix[b.length][a.length];
};

// מנרמל כתובת אימייל (חשוב בעיקר עבור ג'ימייל)
const normalizeEmail = (email) => {
  if (!email) return '';
  const [localPart, domain] = email.toLowerCase().split('@');
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${localPart.replace(/\./g, '').split('+')[0]}@${domain}`;
  }
  return email;
};

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [students, setStudents] = useState([]); // NEW: Track students separately
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [studentToDelete, setStudentToDelete] = useState(null); // NEW: For deleting student profiles directly
    const [isDeleting, setIsDeleting] = useState(false);
    const [userToUpdateRole, setUserToUpdateRole] = useState(null);
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);
    const [potentialDuplicates, setPotentialDuplicates] = useState({});
    const [viewingDuplicatesFor, setViewingDuplicatesFor] = useState(null);

    // NEW: Find duplicate students (not just users)
    const analyzeStudentDuplicates = useCallback((allStudents) => {
        const duplicates = {};
        for (const student of allStudents) {
            duplicates[student.id] = [];
            for (const otherStudent of allStudents) {
                if (student.id === otherStudent.id) continue;

                const reasons = [];
                
                // בדיקת user_id זהה
                if (student.user_id && otherStudent.user_id && student.user_id === otherStudent.user_id) {
                    reasons.push({ reason: "user_id זהה - פרופילים כפולים!", score: 100 });
                }
                
                // בדיקת דמיון בשם
                if (student.full_name && otherStudent.full_name) {
                    const distance = levenshteinDistance(student.full_name.trim().toLowerCase(), otherStudent.full_name.trim().toLowerCase());
                    const similarity = (1 - (distance / Math.max(student.full_name.length, otherStudent.full_name.length))) * 100;
                    if (similarity > 85) {
                        reasons.push({ reason: `שם דומה (${Math.round(similarity)}%)`, score: Math.round(similarity) });
                    }
                }

                // בדיקת דמיון בעיר - רק אם יש כבר סיבה אחרת
                if (student.city && otherStudent.city && student.city === otherStudent.city && reasons.length > 0) {
                    reasons.push({ reason: "עיר זהה", score: 70 });
                }
                
                if (reasons.length > 0) {
                    duplicates[student.id].push({
                        student: otherStudent,
                        reasons: reasons,
                    });
                }
            }
        }
        return duplicates;
    }, []);

    const analyzeDuplicates = useCallback((allUsers) => {
        const duplicates = {};
        for (const user of allUsers) {
            duplicates[user.id] = [];
            for (const otherUser of allUsers) {
                if (user.id === otherUser.id) continue;

                const reasons = [];
                // בדיקת אימייל מנורמל
                if (user.email && otherUser.email && normalizeEmail(user.email) === normalizeEmail(otherUser.email)) {
                    reasons.push({ reason: "אימייל זהה", score: 95 });
                }
                // בדיקת דמיון בשם
                if (user.full_name && otherUser.full_name) {
                    const distance = levenshteinDistance(user.full_name.trim().toLowerCase(), otherUser.full_name.trim().toLowerCase());
                    const similarity = (1 - (distance / Math.max(user.full_name.length, otherUser.full_name.length))) * 100;
                    if (similarity > 85) { // סף דמיון גבוה
                        reasons.push({ reason: `שם דומה (${Math.round(similarity)}%)`, score: Math.round(similarity) });
                    }
                }
                
                if (reasons.length > 0) {
                    duplicates[user.id].push({
                        user: otherUser,
                        reasons: reasons,
                    });
                }
            }
        }
        setPotentialDuplicates(duplicates);
    }, []);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        
        try {
            
            const [allUsers, allStudents, sessionUser] = await Promise.all([
                apiCallWithRetry(() => User.list('-created_date')),
                apiCallWithRetry(() => Student.list('-created_date')),
                apiCallWithRetry(() => User.me())
            ]);
            
            setUsers(allUsers);
            setStudents(allStudents);
            setCurrentUser(sessionUser);
            analyzeDuplicates(allUsers);
            
        } catch (error) {
            console.error("❌ UserManagement: Error loading data:", error);
            setLoadError(error.message || 'שגיאה בטעינת הנתונים');
        }
        
        setIsLoading(false);
    }, [analyzeDuplicates]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleRoleUpdate = async () => {
        if (!userToUpdateRole) return;
        setIsUpdatingRole(true);
        const newRole = userToUpdateRole.role === 'admin' ? 'user' : 'admin';
        try {
            await User.update(userToUpdateRole.id, { role: newRole });
            setUsers(prevUsers => prevUsers.map(u => 
                u.id === userToUpdateRole.id ? { ...u, role: newRole } : u
            ));
        } catch (error) {
            console.error("Failed to update user role:", error);
            toast.error("אירעה שגיאה בעדכון ההרשאה. נסי שוב.");
        } finally {
            setIsUpdatingRole(false);
            setUserToUpdateRole(null);
        }
    };

    // NEW: Delete student profile only (not the entire user)
    const handleDeleteStudentProfile = async () => {
        if (!studentToDelete) return;
        setIsDeleting(true);

        try {
            
            // Delete the student profile
            await Student.delete(studentToDelete.id);
            
            // Update UI
            setStudents(prevStudents => prevStudents.filter(s => s.id !== studentToDelete.id));
            
            
        } catch (error) {
            console.error("Failed to delete student profile:", error);
            toast.error("אירעה שגיאה במחיקת הפרופיל. נסי שוב.");
        } finally {
            setIsDeleting(false);
            setStudentToDelete(null);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);

        try {
            const userId = userToDelete.id;

            // Fetch all related items to delete in parallel
            const [
                studentProfiles,
                messagesSent,
                messagesReceived,
                posts,
                services,
                recommendations,
                spotlightRequests,
                bugReports,
                profileApprovals,
                categoryRequests,
            ] = await Promise.all([
                Student.filter({ user_id: userId }),
                PrivateMessage.filter({ sender_id: userId }),
                PrivateMessage.filter({ recipient_id: userId }),
                CommunityPost.filter({ author_id: userId }),
                Service.filter({ provider_id: userId }),
                Recommendation.filter({ recommender_id: userId }),
                SpotlightRequest.filter({ user_id: userId }),
                BugReport.filter({ reporter_id: userId }),
                ProfileApproval.filter({ user_id: userId }),
                CategoryRequest.filter({ user_id: userId }),
            ]);

            const deletionPromises = [];

            // Add deletion promises for all found items
            if (studentProfiles.length > 0) {
                studentProfiles.forEach(profile => deletionPromises.push(Student.delete(profile.id)));
            }
            
            const allMessages = [...messagesSent, ...messagesReceived];
            allMessages.forEach(item => deletionPromises.push(PrivateMessage.delete(item.id)));
            
            posts.forEach(item => deletionPromises.push(CommunityPost.delete(item.id)));
            services.forEach(item => deletionPromises.push(Service.delete(item.id)));
            recommendations.forEach(item => deletionPromises.push(Recommendation.delete(item.id)));
            spotlightRequests.forEach(item => deletionPromises.push(SpotlightRequest.delete(item.id)));
            bugReports.forEach(item => deletionPromises.push(BugReport.delete(item.id)));
            profileApprovals.forEach(item => deletionPromises.push(ProfileApproval.delete(item.id)));
            categoryRequests.forEach(item => deletionPromises.push(CategoryRequest.delete(item.id)));

            await Promise.all(deletionPromises);

            // Finally, delete the user itself
            await User.delete(userId);

            // Update UI
            setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
            setStudents(prevStudents => prevStudents.filter(s => s.user_id !== userId));
            
        } catch (error) {
            console.error("Failed to delete user and their data:", error);
            toast.error("אירעה שגיאה במחיקת המשתמשת. נסי שוב.");
        } finally {
            setIsDeleting(false);
            setUserToDelete(null);
        }
    };

    // NEW: Compute student duplicates
    const studentDuplicates = useMemo(() => {
        return analyzeStudentDuplicates(students);
    }, [students, analyzeStudentDuplicates]);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-slate-700 font-medium">טוען משתמשות ופרופילים...</p>
                    <p className="text-sm text-slate-500 mt-2">זה עשוי לקחת מספר שניות</p>
                </CardContent>
            </Card>
        );
    }

    if (loadError) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-red-800 mb-2">שגיאה בטעינת הנתונים</h3>
                    <p className="text-red-600 mb-6">{loadError}</p>
                    <Button onClick={loadData} className="bg-purple-600 hover:bg-purple-700">
                        <RefreshCw className="w-4 h-4 ml-2" />
                        נסי שוב
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            {/* Users Table */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>ניהול משתמשות (User Accounts)</CardTitle>
                    <CardDescription>
                        כאן ניתן לראות את כל המשתמשות הרשומות למערכת, לשנות הרשאות ולמחוק משתמשות.
                        <br />
                        <strong className="text-orange-600">⚠️ מחיקת משתמשת תמחק גם את כל הפרופילים והנתונים שלה!</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>שם מלא</TableHead>
                                <TableHead>אימייל</TableHead>
                                <TableHead>תפקיד</TableHead>
                                <TableHead>תאריך הצטרפות</TableHead>
                                <TableHead>התראות</TableHead>
                                <TableHead className="text-left">פעולות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} className={potentialDuplicates[user.id]?.length > 0 ? 'bg-yellow-50' : ''}>
                                    <TableCell className="font-medium">{user.full_name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                                            {user.role === 'admin' ? 'מנהלת' : 'משתמשת'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(user.created_date).toLocaleDateString('he-IL')}</TableCell>
                                    <TableCell>
                                        {potentialDuplicates[user.id]?.length > 0 && (
                                            <Button variant="ghost" size="icon" onClick={() => setViewingDuplicatesFor(user)}>
                                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-left flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setUserToUpdateRole(user)}
                                            disabled={currentUser?.id === user.id}
                                            className="text-blue-500 hover:text-blue-700 disabled:text-gray-400"
                                            title="שינוי הרשאה"
                                        >
                                            <ShieldQuestion className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setUserToDelete(user)}
                                            disabled={currentUser?.id === user.id}
                                            className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                                            title="מחיקת משתמשת (+ כל הנתונים)"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* NEW: Student Profiles Table */}
            <Card>
                <CardHeader>
                    <CardTitle>ניהול פרופילי סטודנטים (Student Profiles)</CardTitle>
                    <CardDescription>
                        כאן ניתן לראות את כל הפרופילים במערכת ולמחוק פרופילים כפולים.
                        <br />
                        <strong className="text-green-600">✅ מחיקת פרופיל סטודנט לא תמחק את חשבון המשתמשת!</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">💡 איך למצוא כפילויות:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• שורות מודגשות בצהוב = יש פרופילים דומים</li>
                            <li>• לחצי על <AlertTriangle className="inline-block w-4 h-4 text-yellow-500" /> לראות פרטי כפילות</li>
                            <li>• פרופילים עם user_id זהה = בטוח כפילויות!</li>
                        </ul>
                    </div>
                    
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>שם</TableHead>
                                <TableHead>עיר</TableHead>
                                <TableHead>User ID</TableHead>
                                <TableHead>תאריך יצירה</TableHead>
                                <TableHead>שירותים</TableHead>
                                <TableHead>התראות</TableHead>
                                <TableHead className="text-left">פעולות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student) => {
                                const duplicatesForStudent = studentDuplicates[student.id] || [];
                                const hasDuplicates = duplicatesForStudent.length > 0;
                                
                                return (
                                    <TableRow key={student.id} className={hasDuplicates ? 'bg-yellow-50' : ''}>
                                        <TableCell className="font-medium">{student.full_name || student.username || 'ללא שם'}</TableCell>
                                        <TableCell>{student.city || 'לא צוין'}</TableCell>
                                        <TableCell className="text-xs text-slate-500">{student.user_id?.substring(0, 8)}...</TableCell>
                                        <TableCell>{new Date(student.created_date).toLocaleDateString('he-IL')}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {student.services?.length || 0} שירותים
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {hasDuplicates && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => {
                                                        // Show duplicates for this student
                                                        const mockUser = {
                                                            id: student.id,
                                                            full_name: student.full_name || student.username,
                                                            email: `user_${student.user_id}`, // Dummy email for consistent UI
                                                            created_date: student.created_date,
                                                            isStudentView: true,
                                                            studentDuplicates: duplicatesForStudent
                                                        };
                                                        setViewingDuplicatesFor(mockUser);
                                                    }}
                                                >
                                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                                    <span className="ml-1 text-xs">{duplicatesForStudent.length}</span>
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setStudentToDelete(student)}
                                                className="text-orange-500 hover:text-orange-700"
                                                title="מחיקת פרופיל (לא תמחק את המשתמשת!)"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Delete User Dialog */}
            <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-red-500" />
                            אישור מחיקת משתמשת
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            האם את בטוחה שברצונך למחוק את <strong>{userToDelete?.full_name}</strong>?
                            <br />
                            פעולה זו תמחק את המשתמשת ואת כל הנתונים הקשורים אליה (פרופיל, הודעות, שירותים וכו').
                            <br />
                            <strong>זוהי פעולה סופית שלא ניתן לשחזר.</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>ביטול</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    מוחקת...
                                </>
                            ) : "כן, מחק את המשתמשת"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* NEW: Delete Student Profile Dialog */}
            <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-orange-500" />
                            אישור מחיקת פרופיל סטודנט
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            האם את בטוחה שברצונך למחוק את הפרופיל של <strong>{studentToDelete?.full_name || studentToDelete?.username}</strong>?
                            <br />
                            <br />
                            <strong className="text-green-600">✅ המשתמשת תישאר במערכת</strong> - רק הפרופיל יימחק.
                            <br />
                            היא תוכל ליצור פרופיל חדש אם תרצה.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>ביטול</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteStudentProfile}
                            disabled={isDeleting}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    מוחקת...
                                </>
                            ) : "כן, מחק את הפרופיל"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Role Update Dialog */}
            <AlertDialog open={!!userToUpdateRole} onOpenChange={() => setUserToUpdateRole(null)}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldQuestion className="text-blue-500" />
                            אישור שינוי הרשאה
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            האם את בטוחה שברצונך לשנות את הרשאתה של <strong>{userToUpdateRole?.full_name}</strong>?
                            <br />
                            ההרשאה הנוכחית היא: <strong>{userToUpdateRole?.role === 'admin' ? 'מנהלת' : 'משתמשת'}</strong>.
                            <br />
                            ההרשאה החדשה תהיה: <strong>{userToUpdateRole?.role === 'admin' ? 'משתמשת' : 'מנהלת'}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdatingRole}>ביטול</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRoleUpdate}
                            disabled={isUpdatingRole}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isUpdatingRole ? (
                                <>
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    מעדכנת...
                                </>
                            ) : "כן, שנה את ההרשאה"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog to view potential duplicates */}
            <AlertDialog open={!!viewingDuplicatesFor} onOpenChange={() => setViewingDuplicatesFor(null)}>
                <AlertDialogContent dir="rtl" className="max-w-4xl max-h-[90vh] overflow-hidden">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-xl">
                            <AlertTriangle className="text-amber-500" />
                            🔍 פרטי כפילויות עבור: {viewingDuplicatesFor?.full_name}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                           המערכת זיהתה {viewingDuplicatesFor?.isStudentView ? 'פרופילים' : 'משתמשות'} דומים. בדקי את הפרטים ותחליטי אם יש צורך במחיקה.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2"> {/* Added pr-2 for scrollbar spacing */}
                        {/* פרטי המשתמשת/פרופיל הנוכחי */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-bold text-blue-800 mb-2">
                                👤 {viewingDuplicatesFor?.isStudentView ? 'פרופיל נוכחי:' : 'משתמשת נוכחית:'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                <div><strong>שם:</strong> {viewingDuplicatesFor?.full_name}</div>
                                {viewingDuplicatesFor?.isStudentView ? (
                                    <div><strong>User ID:</strong> {viewingDuplicatesFor.email?.replace('user_', '')}</div> // Using email field for user_id mock
                                ) : (
                                    <div><strong>אימייל:</strong> {viewingDuplicatesFor?.email}</div>
                                )}
                                <div><strong>נרשם:</strong> {viewingDuplicatesFor?.created_date ? new Date(viewingDuplicatesFor.created_date).toLocaleDateString('he-IL') : 'N/A'}</div>
                            </div>
                        </div>

                        {/* פרופילים/משתמשות דומים */}
                        {viewingDuplicatesFor?.isStudentView ? (
                            // Student duplicates view
                            viewingDuplicatesFor.studentDuplicates?.map((dup, dupIndex) => (
                                <div key={dup.student.id} className="p-4 border rounded-lg bg-slate-50 border-slate-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-bold text-slate-800">🔗 פרופיל דומה #{dupIndex + 1}</h4>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setStudentToDelete(dup.student);
                                                setViewingDuplicatesFor(null); // Close the duplicates dialog
                                            }}
                                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                        >
                                            מחק פרופיל זה
                                        </Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mb-3">
                                        <div><strong>שם:</strong> {dup.student.full_name || dup.student.username}</div>
                                        <div><strong>עיר:</strong> {dup.student.city || 'לא צוין'}</div>
                                        <div><strong>נרשם:</strong> {new Date(dup.student.created_date).toLocaleDateString('he-IL')}</div>
                                    </div>

                                    <div className="bg-white p-3 rounded border-r-4 border-amber-400">
                                        <p className="text-sm font-medium text-amber-800 mb-2">🎯 סיבות לזיהוי כפילות:</p>
                                        <ul className="space-y-1">
                                            {dup.reasons.map((r, index) => (
                                                <li key={index} className="flex items-center gap-2 text-sm">
                                                    <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                                                    <span>{r.reason}</span>
                                                    <Badge className="bg-amber-100 text-amber-800 text-xs">
                                                        ציון: {r.score}%
                                                    </Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))
                        ) : (
                            // User duplicates view
                            potentialDuplicates[viewingDuplicatesFor?.id]?.map((dup, dupIndex) => (
                                <div key={dup.user.id} className="p-4 border rounded-lg bg-slate-50 border-slate-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-bold text-slate-800">🔗 משתמשת דומה #{dupIndex + 1}</h4>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setUserToDelete(dup.user);
                                                setViewingDuplicatesFor(null); // Close the duplicates dialog
                                            }}
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                            מחק משתמשת זו
                                        </Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mb-3">
                                        <div><strong>שם:</strong> {dup.user.full_name}</div>
                                        <div><strong>אימייל:</strong> {dup.user.email}</div>
                                        <div><strong>נרשם:</strong> {new Date(dup.user.created_date).toLocaleDateString('he-IL')}</div>
                                    </div>

                                    <div className="bg-white p-3 rounded border-r-4 border-amber-400">
                                        <p className="text-sm font-medium text-amber-800 mb-2">🎯 סיבות לזיהוי כפילות:</p>
                                        <ul className="space-y-1">
                                            {dup.reasons.map((r, index) => (
                                                <li key={index} className="flex items-center gap-2 text-sm">
                                                    <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                                                    <span>{r.reason}</span>
                                                    <Badge className="bg-amber-100 text-amber-800 text-xs">
                                                        ציון: {r.score}%
                                                    </Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* הנחיות לטיפול */}
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h5 className="font-bold text-green-800 mb-2">💡 מה לעשות?</h5>
                            <ul className="text-sm text-green-700 space-y-1">
                                {viewingDuplicatesFor?.isStudentView ? (
                                    <>
                                        <li>• אם ה-user_id זהה - בטוח כפילות, מחקי את אחד הפרופילים.</li>
                                        <li>• שימי לב לתאריכי יצירת הפרופילים - הישן יותר עשוי להיות האמיתי.</li>
                                        <li>• פרופיל עם יותר שירותים או מידע מלא יותר כדאי לשמור.</li>
                                    </>
                                ) : (
                                    <>
                                        <li>• אם האימיילים זהים (גם אחרי נירמול) - כנראה כפילות, מחקי אחד מהם.</li>
                                        <li>• אם השמות זהים/דומים מאוד אבל האימיילים שונים - בדקי האם זו אותה אישה (לדוגמה, עם אימיילים שונים).</li>
                                        <li>• שימי לב לתאריכי ההרשמה - הישן יותר עשוי להיות האמיתי.</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>סגור</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
