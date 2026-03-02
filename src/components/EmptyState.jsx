import React from 'react';
import { motion } from 'framer-motion';

const illustrations = {
  services: { emoji: '🔍', text: 'אין שירותים עדיין', sub: 'היי הראשונה לפרסם שירות!' },
  posts: { emoji: '💬', text: 'אין פוסטים עדיין', sub: 'שתפי משהו עם הקהילה!' },
  messages: { emoji: '📬', text: 'אין הודעות', sub: 'כשמישהי תשלח לך הודעה היא תופיע כאן' },
  notifications: { emoji: '🔔', text: 'אין התראות', sub: 'הכל שקט כרגע' },
  events: { emoji: '📅', text: 'אין אירועים קרובים', sub: 'צרי אירוע חדש לקהילה!' },
  prayers: { emoji: '🤲', text: 'אין בקשות תפילה', sub: 'שתפי בקשת תפילה והקהילה תתפלל עבורך' },
  gratitude: { emoji: '💜', text: 'אין תודות עדיין', sub: 'הגיעי להודות למישהי מהקהילה!' },
  search: { emoji: '🔎', text: 'לא נמצאו תוצאות', sub: 'נסי לשנות את מילות החיפוש' },
  default: { emoji: '📭', text: 'אין תוכן להצגה', sub: '' },
};

export default function EmptyState({ type = 'default', title, subtitle, action }) {
  const config = illustrations[type] || illustrations.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">{config.emoji}</span>
      </div>
      <h3 className="text-xl font-bold text-slate-700 mb-2">
        {title || config.text}
      </h3>
      {(subtitle || config.sub) && (
        <p className="text-slate-500 text-sm max-w-xs mb-6">
          {subtitle || config.sub}
        </p>
      )}
      {action && (
        <div>{action}</div>
      )}
    </motion.div>
  );
}
