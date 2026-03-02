import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ServiceAreasSelector({ 
  selectedAreas = [], 
  availableAreas = [], 
  onChange, 
  maxSelections = 5 
}) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleSelectArea = (area) => {
    if (selectedAreas.includes(area)) {
      // אם התחום כבר נבחר, הסר אותו
      onChange(selectedAreas.filter(selected => selected !== area));
    } else if (selectedAreas.length < maxSelections) {
      // אם יש עוד מקום, הוסף את התחום
      onChange([...selectedAreas, area]);
    }
    setOpen(false);
  };

  const handleRemoveArea = (areaToRemove) => {
    onChange(selectedAreas.filter(area => area !== areaToRemove));
  };

  const filteredAreas = availableAreas.filter(area => 
    area.toLowerCase().includes(searchValue.toLowerCase()) &&
    !selectedAreas.includes(area)
  );

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium text-slate-700">
        תחומי השירות שלך (ניתן לבחור עד {maxSelections} תחומים)
      </Label>
      
      {/* תחומים שנבחרו */}
      {selectedAreas.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
          {selectedAreas.map((area) => (
            <Badge
              key={area}
              variant="secondary"
              className="bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
            >
              {area}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-purple-500"
                onClick={() => handleRemoveArea(area)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* כפתור הוספת תחום */}
      {selectedAreas.length < maxSelections && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-white"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {selectedAreas.length === 0 
                  ? "בחרי את תחומי השירות שלך" 
                  : `הוספת תחום נוסף (${selectedAreas.length}/${maxSelections})` 
                }
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput 
                placeholder="חיפוש תחום..." 
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandEmpty>לא נמצא תחום זה</CommandEmpty>
              <CommandGroup className="max-h-48 overflow-y-auto">
                {filteredAreas.map((area) => (
                  <CommandItem
                    key={area}
                    value={area}
                    onSelect={() => handleSelectArea(area)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedAreas.includes(area) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {area}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {selectedAreas.length >= maxSelections && (
        <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
          💡 הגעת למספר התחומים המקסימלי ({maxSelections}). כדי להוסיף תחום חדש, הסירי קודם תחום קיים.
        </p>
      )}
    </div>
  );
}
