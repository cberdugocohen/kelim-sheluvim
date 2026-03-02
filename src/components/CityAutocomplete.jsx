import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { InvokeLLM } from "@/integrations/Core";
import { MapPin, Search, CheckCircle, AlertTriangle, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CityAutocomplete({ value, onChange, onCitySelect }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [hasTyped, setHasTyped] = useState(false);

  useEffect(() => {
    setInputValue(value || "");
    // If there's a value and it matches selected city, maintain selection
    if (value && selectedCity && selectedCity.name_he === value) {
      // Keep selection
    } else if (value && !selectedCity) {
      // If there's a value but no selection, clear selection state
      setSelectedCity(null);
    }
  }, [value, selectedCity]); // Changed dependency array to include selectedCity

  // רשימת ערים מקומית מורחבת עם קואורדינטות מדויקות
  const getLocalCities = (searchTerm) => {
    const cities = [
      // מרכז הארץ
      { name_he: "תל אביב-יפו", latitude: 32.0853, longitude: 34.7818, district: "תל אביב", region: "מרכז" },
      { name_he: "פתח תקווה", latitude: 32.0878, longitude: 34.8878, district: "פתח תקווה", region: "מרכז" },
      { name_he: "נתניה", latitude: 32.3215, longitude: 34.8532, district: "נתניה", region: "מרכז" },
      { name_he: "ראשון לציון", latitude: 31.9730, longitude: 34.7925, district: "ראשון לציון", region: "מרכז" },
      { name_he: "חולון", latitude: 32.0161, longitude: 34.7733, district: "תל אביב", region: "מרכז" },
      { name_he: "בני ברק", latitude: 32.0863, longitude: 34.8306, district: "תל אביב", region: "מרכז" },
      { name_he: "רמת גן", latitude: 32.0826, longitude: 34.8105, district: "תל אביב", region: "מרכז" },
      { name_he: "גבעתיים", latitude: 32.0706, longitude: 34.8103, district: "תל אביב", region: "מרכז" },
      { name_he: "הרצליה", latitude: 32.1624, longitude: 34.8444, district: "תל אביב", region: "מרכז" },
      { name_he: "כפר סבא", latitude: 32.1742, longitude: 34.9076, district: "פתח תקווה", region: "מרכז" },
      { name_he: "רעננה", latitude: 32.1847, longitude: 34.8706, district: "פתח תקווה", region: "מרכז" },
      { name_he: "רחובות", latitude: 31.8947, longitude: 34.8081, district: "רמלה", region: "מרכז" },
      { name_he: "לוד", latitude: 31.9516, longitude: 34.8958, district: "רמלה", region: "מרכז" },
      { name_he: "רמלה", latitude: 31.9293, longitude: 34.8667, district: "רמלה", region: "מרכז" },
      { name_he: "מודיעין-מכבים-רעות", latitude: 31.8967, longitude: 35.0097, district: "רמלה", region: "מרכז" },
      { name_he: "בת ים", latitude: 32.0226, longitude: 34.7593, district: "תל אביב", region: "מרכז" },
      { name_he: "אור יהודה", latitude: 32.0361, longitude: 34.8592, district: "תל אביב", region: "מרכז" },
      { name_he: "יהוד-מונוסון", latitude: 32.0356, longitude: 34.8883, district: "פתח תקווה", region: "מרכז" },
      { name_he: "באר יעקב", latitude: 31.9245, longitude: 34.8379, district: "רמלה", region: "מרכז" },
      
      // ירושלים והסביבה
      { name_he: "ירושלים", latitude: 31.7683, longitude: 35.2137, district: "ירושלים", region: "ירושלים" },
      { name_he: "מעלה אדומים", latitude: 31.7706, longitude: 35.2969, district: "ירושלים", region: "ירושלים" },
      { name_he: "בית שמש", latitude: 31.7533, longitude: 35.0103, district: "ירושלים", region: "ירושלים" },
      { name_he: "מבשרת ציון", latitude: 31.8011, longitude: 35.1444, district: "ירושלים", region: "ירושלים" },
      { name_he: "גבעת זאב", latitude: 31.8511, longitude: 35.1722, district: "ירושלים", region: "ירושלים" },

      // צפון הארץ
      { name_he: "חיפה", latitude: 32.7940, longitude: 34.9896, district: "חיפה", region: "צפון" },
      { name_he: "קרית חיים", latitude: 32.8344, longitude: 35.0658, district: "חיפה", region: "צפון" },
      { name_he: "קרית ים", latitude: 32.8481, longitude: 35.0683, district: "חיפה", region: "צפון" },
      { name_he: "קרית ביאליק", latitude: 32.8378, longitude: 35.0800, district: "חיפה", region: "צפון" },
      { name_he: "קרית מוצקין", latitude: 32.8353, longitude: 35.0744, district: "חיפה", region: "צפון" },
      { name_he: "נהריה", latitude: 33.0073, longitude: 35.0944, district: "עכו", region: "צפון" },
      { name_he: "עכו", latitude: 32.9266, longitude: 35.0833, district: "עכו", region: "צפון" },
      { name_he: "טבריה", latitude: 32.7922, longitude: 35.5311, district: "כנרת", region: "צפון" },
      { name_he: "צפת", latitude: 32.9658, longitude: 35.4983, district: "צפת", region: "צפון" },
      { name_he: "קרית שמונה", latitude: 33.2074, longitude: 35.5695, district: "צפת", region: "צפון" },
      { name_he: "נצרת", latitude: 32.7022, longitude: 35.2969, district: "יזרעאל", region: "צפון" },
      { name_he: "עפולה", latitude: 32.6074, longitude: 35.2897, district: "יזרעאל", region: "צפון" },
      { name_he: "חדרה", latitude: 32.4339, longitude: 34.9186, district: "חדרה", region: "מרכז" },

      // דרום הארץ  
      { name_he: "באר שבע", latitude: 31.2518, longitude: 34.7915, district: "באר שבע", region: "דרום" },
      { name_he: "אשדוד", latitude: 31.8044, longitude: 34.6553, district: "אשקלון", region: "דרום" },
      { name_he: "אשקלון", latitude: 31.6688, longitude: 34.5742, district: "אשקלון", region: "דרום" },
      { name_he: "אילת", latitude: 29.5569, longitude: 34.9522, district: "באר שבע", region: "דרום" },
      { name_he: "דימונה", latitude: 31.0636, longitude: 35.0322, district: "באר שבע", region: "דרום" },
      { name_he: "נתיבות", latitude: 31.4239, longitude: 34.5958, district: "באר שבע", region: "דרום" },
      { name_he: "ערד", latitude: 31.2598, longitude: 35.2137, district: "באר שבע", region: "דרום" },
      { name_he: "קרית גת", latitude: 31.6100, longitude: 34.7642, district: "אשקלון", region: "דרום" },

      // מועצות אזוריות
      { name_he: "חלוץ", latitude: 32.7858, longitude: 35.2667, district: "משגב", region: "צפון" },

      // יהודה ושומרון (יישובים מרכזיים)
      { name_he: "אריאל", latitude: 32.1058, longitude: 35.1897, district: "יהודה ושומרון", region: "יהודה ושומרון" },
      { name_he: "מודיעין עילית", latitude: 31.9347, longitude: 35.0544, district: "יהודה ושומרון", region: "יהודה ושומרון" },
      { name_he: "ביתר עילית", latitude: 31.7267, longitude: 35.1131, district: "יהודה ושומרון", region: "יהודה ושומרון" },
      { name_he: "עמנואל", latitude: 32.0619, longitude: 35.1783, district: "יהודה ושומרון", region: "יהודה ושומרון" }
    ];

    const searchLower = searchTerm.toLowerCase();
    return cities.filter(city => 
      city.name_he.includes(searchTerm) || 
      city.name_he.toLowerCase().includes(searchLower) ||
      // תמיכה בחיפוש חלקי
      searchTerm.split(' ').some(term => city.name_he.toLowerCase().includes(term.toLowerCase()))
    );
  };

  const searchCities = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // תחילה נסה את החיפוש המקומי באופן מיידי (ללא loading)
    const localResults = getLocalCities(searchTerm);
    
    if (localResults.length > 0) {
      setSuggestions(localResults);
      setShowSuggestions(true);
      return;
    }

    // רק אם אין תוצאות מקומיות, הצג loading והתחל חיפוש אונליין
    setIsLoading(true);

    // אם לא נמצאו תוצאות מקומיות, נסה חיפוש אונליין עם AI
    try {
      const prompt = `
        חפש יישובים ישראליים שמתאימים ל"${searchTerm}" באמצעות מאגרי המידע הרשמיים של ישראל.
        החזר מערך של עד 8 יישובים מתאימים עם הפרטים שלהם.
        כל יישוב צריך לכלול: שם בעברית, latitude, longitude, נפה (מחוז), ואזור.
        התמקד בהתאמות מדויקות תחילה, ואז בהתאמות חלקיות.
        השתמש במאגר היישובים הישראלי הרשמי.
      `;
      
      const schema = {
        type: "object",
        properties: {
          cities: {
            type: "array",
            maxItems: 8,
            items: {
              type: "object",
              properties: {
                name_he: { type: "string", description: "שם היישוב בעברית" },
                latitude: { type: "number", minimum: 29, maximum: 34, description: "קו רוחב" },
                longitude: { type: "number", minimum: 34, maximum: 36, description: "קו אורך" },
                district: { type: "string", description: "נפה/מחוז" },
                region: { type: "string", enum: ["צפון", "מרכז", "ירושלים", "דרום", "יהודה ושומרון"], description: "אזור עיקרי" }
              },
              required: ["name_he", "latitude", "longitude", "district", "region"]
            }
          }
        },
        required: ["cities"]
      };

      const result = await InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: schema
      });

      if (result?.cities && result.cities.length > 0) {
        // וליד שהקואורדינטות סבירות לישראל
        const validCities = result.cities.filter(city => 
          city.latitude >= 29 && city.latitude <= 34 && 
          city.longitude >= 34 && city.longitude <= 36 &&
          city.name_he && city.name_he.length > 1
        );
        
        if (validCities.length > 0) {
          setSuggestions(validCities);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error searching cities with AI:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setIsLoading(false);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setHasTyped(true);
    onChange(newValue);
    
    // Clear selection if user types something different
    if (selectedCity && newValue !== selectedCity.name_he) {
      setSelectedCity(null);
      if (onCitySelect) onCitySelect(null);
    }

    if (newValue.trim()) {
      searchCities(newValue.trim());
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setHasTyped(false);
    }
  };

  const handleCitySelect = (city) => {
    
    setInputValue(city.name_he);
    setSelectedCity(city);
    setShowSuggestions(false);
    setSuggestions([]);
    setHasTyped(false);
    onChange(city.name_he);
    
    if (onCitySelect) {
      const cityData = {
        name: city.name_he,
        coordinates: {
          lat: city.latitude,
          lng: city.longitude
        },
        district: city.district,
        region: city.region
      };
      onCitySelect(cityData);
    }
  };

  const isTypedButNotSelected = hasTyped && inputValue && !selectedCity && suggestions.length === 0 && !isLoading;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder="הקלידי את שם היישוב..."
          className={`pr-10 ${
            selectedCity 
              ? 'border-green-400 bg-green-50/50' 
              : isTypedButNotSelected 
                ? 'border-red-400 bg-red-50/50'
                : 'bg-white/70 border-slate-200 focus:border-purple-400'
          }`}
          onFocus={() => inputValue && suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {selectedCity && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
            <CheckCircle className="text-green-600 w-4 h-4 mr-1" />
            <Navigation className="text-green-600 w-3 h-3" />
          </div>
        )}
        {isTypedButNotSelected && (
          <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 w-4 h-4" />
        )}
      </div>
      
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          <div className="flex items-center gap-2 text-slate-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span className="text-sm">מחפש יישובים במאגר המדינה...</span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-60 overflow-y-auto"
          >
            {suggestions.map((city, index) => (
              <button
                key={`${city.name_he}-${index}`}
                type="button"
                className="w-full text-right px-4 py-3 hover:bg-purple-50 transition-colors border-b border-slate-100 last:border-b-0"
                onMouseDown={() => handleCitySelect(city)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-800">{city.name_he}</p>
                    <p className="text-sm text-slate-500">{city.district} • {city.region}</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    <Navigation className="w-3 h-3" />
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning for unselected typed input */}
      {isTypedButNotSelected && (
        <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium text-sm">יישוב לא נמצא במאגר</span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            נסי לחפש שוב עם שם דומה או פני לתמיכה להוספת היישוב למאגר
          </p>
        </div>
      )}

      <p className="text-xs text-slate-500 mt-1">
        🗺️ <strong>חשוב:</strong> יש לבחור יישוב מהרשימה הנפתחת כדי שהמיקום יופיע במפה באופן אוטומטי
      </p>
      
      {selectedCity && (
        <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-4 h-4" />
            <Navigation className="w-4 h-4" />
            <span className="font-medium">✅ נבחר: {selectedCity.name_he}</span>
          </div>
          <div className="text-sm text-green-700 mt-1 space-y-1">
            <p>📍 הקואורדינטות נשמרו אוטומטית למפה</p>
            <p>🌍 אזור: {selectedCity.region}</p>
            <p className="text-xs opacity-75">
              {/* Ensure city.coordinates exists before trying to access its properties */}
              📐 GPS: {selectedCity.coordinates?.lat?.toFixed(4)}, {selectedCity.coordinates?.lng?.toFixed(4)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
