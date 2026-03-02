import React, { useState } from 'react';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mail, Loader2, ArrowRight, CheckCircle, Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('choose'); // choose | login | register | forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await User.login();
    } catch (error) {
      console.error('Google login failed:', error);
      toast.error('שגיאה בהתחברות עם גוגל');
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast.error('נא למלא אימייל וסיסמה');
      return;
    }
    setIsLoading(true);
    try {
      await User.loginWithEmail(email, password);
      toast.success('התחברת בהצלחה! 🎉');
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Email login failed:', error);
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('אימייל או סיסמה שגויים');
      } else {
        toast.error('שגיאה בהתחברות: ' + (error.message || ''));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      toast.error('נא למלא את כל השדות');
      return;
    }
    if (password.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    setIsLoading(true);
    try {
      const result = await User.register(email, password, fullName);
      if (result.user?.identities?.length === 0) {
        toast.error('כתובת האימייל הזו כבר רשומה. נסי להתחבר.');
        setMode('login');
      } else {
        toast.success(
          <div className="text-right">
            <p className="font-bold">נרשמת בהצלחה! 🎉</p>
            <p className="text-sm">בדקי את האימייל שלך לאישור החשבון</p>
          </div>,
          { duration: 6000 }
        );
        handleClose();
      }
    } catch (error) {
      console.error('Register failed:', error);
      if (error.message?.includes('already registered')) {
        toast.error('כתובת האימייל כבר רשומה. נסי להתחבר.');
        setMode('login');
      } else {
        toast.error('שגיאה בהרשמה: ' + (error.message || ''));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('נא להזין כתובת אימייל');
      return;
    }
    setIsLoading(true);
    try {
      await User.resetPassword(email);
      toast.success(
        <div className="text-right">
          <p className="font-bold">נשלח! 📧</p>
          <p className="text-sm">בדקי את האימייל שלך לקישור איפוס הסיסמה</p>
        </div>,
        { duration: 6000 }
      );
      setMode('login');
    } catch (error) {
      console.error('Reset password failed:', error);
      toast.error('שגיאה בשליחת קישור איפוס: ' + (error.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMode('choose');
    setEmail('');
    setPassword('');
    setFullName('');
    setShowPassword(false);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      if (mode === 'login') handleEmailLogin();
      if (mode === 'register') handleRegister();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-purple-800">
            {mode === 'choose' && 'התחברי לכלים שלובים 💜'}
            {mode === 'login' && 'התחברות עם אימייל'}
            {mode === 'register' && 'הרשמה לקהילה ✨'}
            {mode === 'forgot' && 'איפוס סיסמה 🔑'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mode === 'choose' && (
            <>
              <Button
                onClick={handleGoogleLogin}
                className="w-full h-14 text-lg bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 shadow-sm"
                variant="outline"
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="w-5 h-5 ml-3"
                />
                התחברי עם Google
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-400">או</span>
                </div>
              </div>

              <Button
                onClick={() => setMode('login')}
                className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
              >
                <Mail className="w-5 h-5 ml-3" />
                התחברי עם אימייל וסיסמה
              </Button>

              <Button
                onClick={() => setMode('register')}
                variant="ghost"
                className="w-full text-purple-600 hover:text-purple-700 font-medium"
              >
                <UserPlus className="w-4 h-4 ml-2" />
                אין לך חשבון? הירשמי כאן
              </Button>

              <p className="text-center text-xs text-gray-400 mt-2">
                בהתחברות את מסכימה לתנאי השימוש ומדיניות הפרטיות
              </p>
            </>
          )}

          {mode === 'login' && (
            <>
              <div className="space-y-3" onKeyDown={handleKeyDown}>
                <div>
                  <Label htmlFor="login-email" className="text-right block font-medium mb-1">
                    אימייל
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                    dir="ltr"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="login-password" className="text-right block font-medium mb-1">
                    סיסמה
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-10"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleEmailLogin}
                disabled={isLoading}
                className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <CheckCircle className="w-5 h-5 ml-2" />}
                {isLoading ? 'מתחברת...' : 'התחברי'}
              </Button>

              <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={() => setMode('register')} className="text-purple-600 text-sm">
                  אין לך חשבון? הירשמי
                </Button>
                <Button variant="ghost" onClick={() => setMode('forgot')} className="text-gray-400 text-sm">
                  שכחתי סיסמה
                </Button>
              </div>
              <Button variant="ghost" onClick={() => setMode('choose')} className="w-full text-gray-500 text-sm">
                <ArrowRight className="w-4 h-4 ml-1" />
                חזרה
              </Button>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <p className="text-center text-gray-600 text-sm">
                הזיני את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
              </p>
              <div>
                <Label htmlFor="forgot-email" className="text-right block font-medium mb-1">
                  אימייל
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  dir="ltr"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading) handleResetPassword();
                  }}
                />
              </div>
              <Button
                onClick={handleResetPassword}
                disabled={isLoading}
                className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Mail className="w-5 h-5 ml-2" />}
                {isLoading ? 'שולחת...' : 'שלחי קישור איפוס'}
              </Button>
              <Button variant="ghost" onClick={() => setMode('login')} className="w-full text-gray-500 text-sm">
                <ArrowRight className="w-4 h-4 ml-1" />
                חזרה להתחברות
              </Button>
            </>
          )}

          {mode === 'register' && (
            <>
              <div className="space-y-3" onKeyDown={handleKeyDown}>
                <div>
                  <Label htmlFor="reg-name" className="text-right block font-medium mb-1">
                    שם מלא
                  </Label>
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="השם שלך"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="reg-email" className="text-right block font-medium mb-1">
                    אימייל
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-password" className="text-right block font-medium mb-1">
                    סיסמה (לפחות 6 תווים)
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-10"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <UserPlus className="w-5 h-5 ml-2" />}
                {isLoading ? 'נרשמת...' : 'הירשמי לקהילה'}
              </Button>

              <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={() => setMode('login')} className="text-purple-600 text-sm">
                  יש לך חשבון? התחברי
                </Button>
                <Button variant="ghost" onClick={() => setMode('choose')} className="text-gray-500 text-sm">
                  <ArrowRight className="w-4 h-4 ml-1" />
                  חזרה
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
