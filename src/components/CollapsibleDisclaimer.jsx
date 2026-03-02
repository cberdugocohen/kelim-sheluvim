import React, { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

export default function CollapsibleDisclaimer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-purple-50 border-t border-purple-200 mt-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center gap-2 p-3 text-sm text-purple-700 hover:bg-purple-100 transition-colors"
      >
        <AlertTriangle className="w-4 h-4" />
        <span>הבהרה חשובה</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-xs text-purple-600 text-center leading-relaxed" dir="rtl">
          <p>
            חברות יקרות, הדף הזה הוא יוזמה של תלמידות שהוקם ונעשה עבור תלמידות שהכירו במסגרת הקבוצה 'נשים טובות', על מנת לאפשר פלטפורמה של חיבור בין החברות ברמה המקצועית למען חברות טובה ופרנסה טובה לכל הנוגעים בדבר.
          </p>
          <p className="mt-2">
            אין לנו שום אחריות ישירה או עקיפה על השירותים הניתנים, וההשתתפות במיזם וכל התקשרות היא באחריות המשתמש בלבד. המיזם הוא מיזם חברתי וללא מטרת רווח ואין לו קשר ישיר או עקיף לעמותת 'האמת והשלום' או לכבוד הרב אריק נווה בשום צורה או עניין.
          </p>
        </div>
      )}
    </div>
  );
}
