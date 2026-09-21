import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  Camera,
  Layers,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { UploadFileItem } from '../types';
import { ImagePreviewModal } from './ImagePreviewModal';

interface FileUploadAreaProps {
  files: UploadFileItem[];
  onFilesChange: (files: UploadFileItem[]) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  files,
  onFilesChange,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<{ url: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setFileError(null);
      const incoming = Array.from(fileList);
      if (incoming.length === 0) return;

      const newItems: UploadFileItem[] = [];

      for (const file of incoming) {
        // Validation: mime type
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);

        if (!isPdf && !isImage) {
          setFileError(`"${file.name}" is not supported. Please upload an image or PDF.`);
          continue;
        }

        // Validation: file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
          setFileError(`"${file.name}" exceeds the 15MB limit. Please choose a smaller file.`);
          continue;
        }

        // Read file as base64
        try {
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              const commaIndex = res.indexOf(',');
              const cleanBase64 = commaIndex !== -1 ? res.substring(commaIndex + 1) : res;
              resolve(cleanBase64);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          });

          // Create preview URL if image
          let previewUrl: string | undefined;
          if (isImage) {
            previewUrl = URL.createObjectURL(file);
          }

          newItems.push({
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            mimeType: isPdf ? 'application/pdf' : file.type || 'image/jpeg',
            size: file.size,
            base64Data,
            previewUrl,
          });
        } catch (err) {
          console.error('File read error:', err);
          setFileError(`Failed to process "${file.name}".`);
        }
      }

      if (newItems.length > 0) {
        onFilesChange([...files, ...newItems]);
      }
    },
    [files, onFilesChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCameraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (id: string) => {
    const target = files.find((f) => f.id === id);
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onFilesChange(files.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Hidden native inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraInputChange}
        disabled={disabled}
      />

      {/* Drag & Drop Zone */}
      <motion.div
        id="dropzone-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        animate={{
          scale: isDragging ? 1.01 : 1,
          borderColor: isDragging ? '#3b82f6' : '#30363d',
        }}
        className={`relative group rounded-2xl border-2 border-dashed p-5 sm:p-6 text-center transition cursor-pointer ${
          isDragging
            ? 'bg-blue-950/30'
            : 'bg-slate-900/90 hover:bg-slate-900 hover:border-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <motion.div
            animate={{ y: isDragging ? -3 : 0 }}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
              isDragging
                ? 'bg-blue-600/30 border-blue-400 text-blue-300'
                : 'bg-blue-600/15 border-blue-500/30 text-blue-400 group-hover:border-blue-500/60'
            }`}
          >
            <UploadCloud className="h-6 w-6" />
          </motion.div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200">
              <span className="text-blue-400 underline decoration-blue-500/50 underline-offset-2 group-hover:text-blue-300">
                Click to browse
              </span>{' '}
              or drag & drop PDF / photo
            </p>
            <p className="text-xs text-slate-400">
              Textbook pages, lecture slides, hand-drawn diagrams, or PDF notes (up to 15MB)
            </p>
          </div>

          {/* Action pills: Browse Files / Camera Capture */}
          <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              id="browse-files-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Browse Files</span>
            </button>

            <button
              type="button"
              id="camera-photo-btn"
              onClick={() => cameraInputRef.current?.click()}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition cursor-pointer"
              title="Take a photo with your device camera"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>Take Photo</span>
            </button>
          </div>
        </div>

        {/* Diagram intelligence hint */}
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Layers className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span>Diagram-aware: Tests visual structures, process cycles & labeled components</span>
        </div>
      </motion.div>

      {/* File Upload Error Alert */}
      <AnimatePresence>
        {fileError && (
          <motion.div
            id="file-upload-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-800/50 p-3 text-xs text-red-200"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{fileError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Files Chips / Preview List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
              Attached Material ({files.length})
            </span>
            <button
              type="button"
              id="remove-all-files-btn"
              onClick={() => onFilesChange([])}
              disabled={disabled}
              className="text-[11px] text-slate-400 hover:text-red-400 transition cursor-pointer"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <AnimatePresence>
              {files.map((file) => {
                const isPdf = file.mimeType === 'application/pdf';
                return (
                  <motion.div
                    key={file.id}
                    id={`file-item-${file.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center gap-3 rounded-xl bg-slate-900 border border-slate-800 p-2.5 transition hover:border-slate-700"
                  >
                    {/* Thumbnail / Icon (clickable to preview if image) */}
                    {file.previewUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewModal({
                            url: file.previewUrl!,
                            title: file.name,
                          })
                        }
                        className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 group/thumb cursor-zoom-in"
                        title="Click to expand image"
                      >
                        <img
                          src={file.previewUrl}
                          alt={file.name}
                          className="h-full w-full object-cover transition group-hover/thumb:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-400">
                        {isPdf ? (
                          <FileText className="w-5 h-5" />
                        ) : (
                          <ImageIcon className="w-5 h-5" />
                        )}
                      </div>
                    )}

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-200" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span className="uppercase text-[10px] tracking-wider text-blue-400 font-mono">
                          {isPdf ? 'PDF' : 'IMAGE / DIAGRAM'}
                        </span>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      id={`remove-file-btn-${file.id}`}
                      onClick={() => handleRemoveFile(file.id)}
                      disabled={disabled}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition cursor-pointer flex-shrink-0"
                      title={`Remove ${file.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewModal && (
        <ImagePreviewModal
          isOpen={!!previewModal}
          imageUrl={previewModal.url}
          title={previewModal.title}
          onClose={() => setPreviewModal(null)}
        />
      )}
    </div>
  );
};
