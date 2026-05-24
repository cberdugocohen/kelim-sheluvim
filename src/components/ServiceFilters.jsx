import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

const REGIONS = {
  all: "כל הארץ",
  north: "צפון",
  center: "מרכז",
  jerusalem: "ירושלים והסביבה",
  south: "דרום",
};

const getRegionForCity = (city) => {
    if (!city) return "all";
    
    const cityLower = city.toLowerCase();
    
    // צפון - הרחבה משמעותית
    const northCities = [
      "חיפה", "קריות", "קרית", "נהריה", "עכו", "טבריה", "צפת", "קרית שמונה",
      "נצרת", "עפולה", "כרמיאל", "זכרון יעקב", "בנימינה", "פרדס חנה",
      "נשר", "טירת כרמל", "יקנעם", "מגדל העמק", "מעלות", "שלומי",
      "מעיליא", "נהריה", "ראש פינה", "כפר תבור", "מגדל", "נוף הגליל",
      "קרית ביאליק", "קרית ים", "קרית מוצקין", "קרית חיים"
    ];
    if (northCities.some(c => cityLower.includes(c))) return "north";

    // מרכז - הרחבה משמעותית
    const centerCities = [
      "תל אביב", "יפו", "פתח תקווה", "נתניה", "ראשון לציון", "חולון",
      "בני ברק", "רמת גן", "גבעתיים", "הרצליה", "כפר סבא", "רעננה",
      "רחובות", "לוד", "רמלה", "מודיעין", "בת ים", "אור יהודה",
      "יהוד", "באר יעקב", "חדרה", "נס ציונה", "ראש העין", "הוד השרון",
      "קרית אונו", "גבעת שמואל", "גן יבנה", "יבנה", "אזור", "קדימה",
      "צורן", "פרדסיה", "שוהם", "מזכרת בתיה", "גדרה", "רמלה",
      "נתניה", "כפר יונה", "טירה", "רעות", "מכבים רעות", "שוהם"
    ];
    if (centerCities.some(c => cityLower.includes(c))) return "center";

    // ירושלים - הרחבה
    const jerusalemCities = [
      "ירושלים", "מעלה אדומים", "בית שמש", "מבשרת ציון", "גבעת זאב",
      "ביתר עילית", "אפרת", "גוש עציון", "עלמון", "מעלה אפרים", "מודיעין עילית"
    ];
    if (jerusalemCities.some(c => cityLower.includes(c))) return "jerusalem";
    
    // דרום - הרחבה משמעותית
    const southCities = [
      "באר שבע", "אשדוד", "אשקלון", "אילת", "דימונה", "נתיבות", "ערד",
      "קרית גת", "שדרות", "אופקים", "קרית מלאכי", "נוף הגליל", "קרית ענבים",
      "יבנאל", "מגדל", "גדרות", "קרית אתא", "קרית ביאליק", "ירוחם"
    ];
    if (southCities.some(c => cityLower.includes(c))) return "south";

    // Default - if no match
    return "all";
};

export { getRegionForCity };

export default function ServiceFilters({
  filters, setFilters, categories = [],
  searchTerm, onSearchChange,
  selectedCategory, onCategoryChange,
  selectedArea, onAreaChange
}) {
  // Support both prop interfaces:
  // 1. { filters, setFilters, categories } (object-based)
  // 2. { searchTerm, onSearchChange, selectedCategory, onCategoryChange, selectedArea, onAreaChange } (individual props)
  const currentCategory = filters?.category ?? selectedCategory ?? 'all';
  const currentRegion = filters?.region ?? selectedArea ?? 'all';

  const handleCategoryChange = (value) => {
    if (setFilters) setFilters(prev => ({ ...prev, category: value }));
    if (onCategoryChange) onCategoryChange(value);
  };

  const handleRegionChange = (value) => {
    if (setFilters) setFilters(prev => ({ ...prev, region: value }));
    if (onAreaChange) onAreaChange(value);
  };

  const clearFilters = () => {
    if (setFilters) setFilters({ category: 'all', region: 'all' });
    if (onCategoryChange) onCategoryChange('all');
    if (onAreaChange) onAreaChange('all');
    if (onSearchChange) onSearchChange('');
  };
  
  const hasActiveFilters = currentCategory !== 'all' || currentRegion !== 'all' || (searchTerm && searchTerm.length > 0);

  return (
    <Card className="bg-white/70 backdrop-blur-sm shadow-md border-purple-100 mb-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-purple-700">
            <Filter className="w-5 h-5" />
            סינון שירותים
          </span>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-sm">
              <X className="w-4 h-4 ml-1" />
              נקי סינונים
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-600 mb-2 block">אזור גיאוגרפי</label>
          <Select value={currentRegion} onValueChange={handleRegionChange}>
            <SelectTrigger>
              <SelectValue placeholder="בחרי אזור" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REGIONS).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 mb-2 block">קטגוריה</label>
          <Select value={currentCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="בחרי קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הקטגוריות</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
