import React, { useState, useRef } from 'react';
import { UploadFile } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, X } from 'lucide-react';
import toast from "react-hot-toast";

export default function ImageUploader({ filePath, onUpload, multiple = false, maxFiles = 1 }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    
    
    setIsUploading(true);
    try {
      if (multiple) {
        const existingUrls = Array.isArray(filePath) ? filePath : (filePath ? [filePath] : []);
        const filesToUpload = Array.from(files).slice(0, maxFiles - existingUrls.length);
        
        const uploadPromises = filesToUpload.map(file => {
          return UploadFile({ file });
        });
        const results = await Promise.all(uploadPromises);
        const newUrls = results.map(res => res.file_url);
        onUpload([...existingUrls, ...newUrls]);

      } else {
        const { file_url } = await UploadFile({ file: files[0] });
        onUpload(file_url);
      }
    } catch (error) {
      console.error("❌ Upload failed:", error);
      toast.error("שגיאה בהעלאת התמונה. נסי שוב.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const removeImage = (urlToRemove) => {
    if (multiple && Array.isArray(filePath)) {
      onUpload(filePath.filter(url => url !== urlToRemove));
    } else {
      onUpload('');
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const images = Array.isArray(filePath) ? filePath : (filePath ? [filePath] : []);
  const canUploadMore = !multiple || images.length < maxFiles;

  return (
    <div>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((url, index) => (
            <div key={`${url}-${index}`} className="relative w-24 h-24 rounded-lg overflow-hidden border">
              <img src={url} alt="תמונה שהועלתה" className="w-full h-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0"
                onClick={() => removeImage(url)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {canUploadMore && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
            id={`file-upload-${multiple ? 'multi' : 'single'}`}
          />
          
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={openFileDialog}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragOver ? 'border-purple-500 bg-purple-50' : 'border-slate-300 hover:border-purple-400'}
              ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <p className="mt-2 text-sm text-slate-500">מעלה תמונה...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <UploadCloud className="h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm text-slate-500">
                  {isDragOver ? 'שחררי את הקובץ כאן' : 'גררי לכאן תמונה, או לחצי לבחירה'}
                </p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP (עד 5MB)</p>
                {multiple && (
                  <p className="text-xs text-slate-400 mt-1">
                    ניתן להעלות עד {maxFiles} תמונות ({images.length}/{maxFiles})
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
