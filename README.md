# כלים שלובים 💜

קהילת נשים לשיתוף שירותים, כישורים ותמיכה הדדית.

## 🌟 אודות הפרויקט

**כלים שלובים** היא פלטפורמה קהילתית המאפשרת לנשים למצוא ולהציע שירותים בתוך הקהילה:
- עורכות דין
- מטפלות (פיזיות, רגשיות, זוגיות)
- גננות ומטפלות ילדים
- מאפרות ומעצבות שיער
- עסקים ושירותים ביתיים
- ועוד...

## ✨ תכונות עיקריות

- 🔍 **חיפוש מתקדם** - מצאי שירותים לפי קטגוריה, אזור גיאוגרפי ומילות חיפוש
- 👥 **פרופילים מלאים** - כל נותנת שירות עם פרטי קשר, תמונות והמלצות
- 💬 **הודעות פרטיות** - תקשורת ישירה בין חברות הקהילה
- 🙏 **קיר תפילות** - שיתוף בקשות תפילה ותמיכה רוחנית
- 💝 **קיר הודיות** - שיתוף תודות והוקרה
- 📱 **PWA** - התקנה כאפליקציה במכשיר הנייד

## 🚀 טכנולוגיות

- **Frontend**: React + Vite
- **UI**: TailwindCSS + shadcn/ui
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: React Query
- **Routing**: React Router v6

## 📦 התקנה והרצה

### דרישות מקדימות
- Node.js 18+
- npm או yarn

### התקנה

```bash
# שכפול הפרויקט
git clone https://github.com/YOUR-USERNAME/kelim-sheluvim.git
cd kelim-sheluvim

# התקנת תלויות
npm install

# יצירת קובץ .env
cp .env.example .env
```

### הגדרת Supabase

1. צרי פרויקט חדש ב-[Supabase](https://supabase.com)
2. העתיקי את ה-URL ואת ה-API Keys לקובץ `.env`:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. הריצי את סקריפטי ה-SQL:
   - `supabase-schema.sql` - יצירת הטבלאות
   - `supabase-rls-upgrade.sql` - הגדרת Row Level Security

### הרצה מקומית

```bash
# Development mode
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 🔐 אבטחה

- **Row Level Security (RLS)** על כל הטבלאות
- **אימות משתמשים** דרך Supabase Auth (Google OAuth + Email/Password)
- **הגנת API Keys** דרך משתני סביבה
- **Storage Policies** להגנה על תמונות ומדיה

## 📱 PWA

האפליקציה תומכת בהתקנה כ-Progressive Web App:
- עובדת offline (partial)
- ניתנת להתקנה על מסך הבית
- אייקון ו-splash screen מותאמים אישית

## 🎨 עיצוב

- **RTL Support** - תמיכה מלאה בעברית מימין לשמאל
- **Responsive** - מותאם למובייל, טאבלט ודסקטופ
- **Accessible** - נגישות לכל המשתמשות
- **Modern UI** - עיצוב נקי ומודרני עם אנימציות חלקות

## 📄 רישיון

MIT License - ראי קובץ LICENSE לפרטים

## 🤝 תרומה לפרויקט

נשמח לקבל תרומות! אנא:
1. עשי Fork לפרויקט
2. צרי branch חדש (`git checkout -b feature/amazing-feature`)
3. בצעי commit לשינויים (`git commit -m 'Add amazing feature'`)
4. דחפי ל-branch (`git push origin feature/amazing-feature`)
5. פתחי Pull Request

## 📞 יצירת קשר

לשאלות ותמיכה: cberdugocohen@gmail.com

---

**נבנה באהבה עבור קהילת הנשים 💜**
