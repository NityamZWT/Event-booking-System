import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ExistingImage {
  url: string;
  public_id?: string;
  id?: string | number;
  [key: string]: any;
}

type ImageValue = File | ExistingImage;

interface Props {
  uploadId?: string;
  existingImages?: ExistingImage[];
  multiple?: boolean;
  accept?: string;
  onFileChange?: (images: ImageValue[]) => void;
  maxFileSize?: number;
  maxFiles?: number;
  label?: string;
  description?: string;
  setFieldValue?: (field: string, value: any) => void;
  name?: string;
}

const ImageUploader: React.FC<Props> = ({
  uploadId,
  existingImages = [],
  multiple = true,
  accept = "image/*",
  onFileChange,
  maxFileSize = 5 * 1024 * 1024,
  maxFiles = 5,
  label = "Upload Images",
  description = "Upload up to 5 images (Max 5MB each)",
  setFieldValue,
  name = "images",
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [retainedExistingImages, setRetainedExistingImages] =
    useState<ExistingImage[]>(existingImages);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]); // Track images marked for removal
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputKey, setInputKey] = useState(Date.now());
  const idRef = useRef(
    uploadId || `imageUpload_${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    if (existingImages && existingImages.length > 0) {
      setRetainedExistingImages(existingImages);
      // Initialize imagesToRemove as empty
      // setImagesToRemove([]);
    }
  }, [existingImages]);

  useEffect(() => {
    // Filter out images marked for removal
    const activeExistingImages = retainedExistingImages.filter(
      (img) =>
        !imagesToRemove.includes(img.public_id || img.id?.toString() || "")
    );
    const allImages = [...activeExistingImages, ...files];
    updateFormikField(allImages);
  }, [retainedExistingImages, files, imagesToRemove]);

  const updateFormikField = (images: ImageValue[]) => {
    const existingImages = images.filter(
      (img) => !(img instanceof File)
    ) as ExistingImage[];

    const retainIds = existingImages
      .map((img) => img.public_id || img.id)
      .filter(Boolean);

    if (setFieldValue && name) {
      setFieldValue(name, images);
      setFieldValue("retain_images", retainIds);
      // Also track images to be removed
      const allExistingIds = retainedExistingImages
        .map((img) => img.public_id || img.id)
        .filter(Boolean);
      const removedIds = allExistingIds.filter((id) => !retainIds.includes(id));
      setFieldValue("remove_images", removedIds);
    }

    if (onFileChange) {
      onFileChange(images);
    }
  };

  const validateFile = (file: File): boolean => {
    const activeExistingCount = retainedExistingImages.filter(
      (img) =>
        !imagesToRemove.includes(img.public_id || img.id?.toString() || "")
    ).length;

    if (activeExistingCount + files.length >= maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return false;
    }
    if (
      !file ||
      file.size === 0 ||
      file.name === "" ||
      file.type === "" ||
      isNaN(file.size)
    ) {
      setError(`File "${file.name}" is invalid`);
      return false;
    }
    if (!file.name.match(/\.(jpg|jpeg|png)$/i)) {
      setError(`File "${file.name}" has unsupported format`);
      return false;
    }
    if (maxFileSize && file.size > maxFileSize) {
      setError(
        `File "${file.name}" exceeds maximum size of ${formatFileSize(
          maxFileSize
        )}`
      );
      return false;
    }

    if (!file.type.startsWith("image/")) {
      setError(`File "${file.name}" is not an image`);
      return false;
    }

    return true;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileChange = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError("No files selected");
      return;
    }

    const fileArray = Array.from(selectedFiles);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    setError("");

    const activeExistingCount = retainedExistingImages.filter(
      (img) =>
        !imagesToRemove.includes(img.public_id || img.id?.toString() || "")
    ).length;

    if (activeExistingCount + files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    for (const file of fileArray) {
      if (validateFile(file)) {
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }
    }

    if (validFiles.length > 0) {
      const newFiles = [...files, ...validFiles];
      const allPreviews = [...previews, ...newPreviews];

      setFiles(newFiles);
      setPreviews(allPreviews);
      simulateUploadProgress();

      // Reset input by changing the key
      setInputKey(Date.now());
    }
  };

  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const markImageForRemoval = (index: number) => {
    const image = retainedExistingImages[index];
    const imageId = image.public_id || image.id?.toString() || "";
    if (imageId) {
      setImagesToRemove((prev) => [...prev, imageId]);
    }
  };

  const undoImageRemoval = (imageId: string) => {
    setImagesToRemove((prev) => prev.filter((id) => id !== imageId));
  };

  // REMOVE THIS FUNCTION - It's not being used
  // const removeExistingImage = (index: number) => {
  //   const updatedImages = retainedExistingImages.filter((_, i) => i !== index);
  //   setRetainedExistingImages(updatedImages);
  //   // Also remove from imagesToRemove if it was there
  //   const image = retainedExistingImages[index];
  //   const imageId = image.public_id || image.id?.toString() || "";
  //   if (imageId) {
  //     setImagesToRemove(prev => prev.filter(id => id !== imageId));
  //   }
  // };

  const removeNewFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    URL.revokeObjectURL(previews[index]);

    setFiles(newFiles);
    setPreviews(newPreviews);
    setUploadProgress(0);
  };

  const clearAll = () => {
    // Clean up new file previews
    previews.forEach((preview) => URL.revokeObjectURL(preview));

    // Clear all new files
    setFiles([]);
    setPreviews([]);
    setUploadProgress(0);

    // Mark ALL existing images for removal
    const allExistingIds = retainedExistingImages
      .map((img) => img.public_id || img.id?.toString() || "")
      .filter(Boolean);
    setImagesToRemove(allExistingIds);

    setError("");

    // Reset input
    setInputKey(Date.now());

    // This will trigger the useEffect and update Formik
  };

  const clearNewFiles = () => {
    previews.forEach((preview) => URL.revokeObjectURL(preview));
    setFiles([]);
    setPreviews([]);
    setUploadProgress(0);

    // Reset input
    setInputKey(Date.now());
  };

  const clearExistingImages = () => {
    // Mark all existing images for removal
    const allIds = retainedExistingImages
      .map((img) => img.public_id || img.id?.toString() || "")
      .filter(Boolean);
    setImagesToRemove(allIds);
  };

  const undoAllRemovals = () => {
    setImagesToRemove([]);
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const activeExistingImages = retainedExistingImages.filter(
    (img) => !imagesToRemove.includes(img.public_id || img.id?.toString() || "")
  );

  const totalImages = activeExistingImages.length + files.length;

  return (
    <div className="space-y-4" id={idRef.current}>
      {retainedExistingImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">
              Existing Images ({activeExistingImages.length} active,{" "}
              {imagesToRemove.length} marked for removal)
            </h4>
            <div className="flex gap-2">
              {imagesToRemove.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={undoAllRemovals}
                  className="h-8"
                >
                  <Undo2 className="h-3 w-3 mr-1" />
                  Undo All Removals
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearExistingImages}
                className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remove All Existing
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {retainedExistingImages.map((image, index) => {
              const imageId = image.public_id || image.id?.toString() || "";
              const isMarkedForRemoval = imagesToRemove.includes(imageId);

              return (
                <div
                  key={`existing-${imageId || index}`}
                  className={cn(
                    "relative group",
                    isMarkedForRemoval && "opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "aspect-square rounded-lg overflow-hidden border-2 bg-muted relative",
                      isMarkedForRemoval
                        ? "border-destructive"
                        : "border-green-500"
                    )}
                  >
                    <img
                      src={image.url}
                      alt={`Existing ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDE2MCAxNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIiBmaWxsPSIjRkZGIiBzdHJva2U9IiNEOEQ4RDgiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNNTAgNjBMMTEwIDYwTTgwIDMwTDEyMCA2ME04MCA5MEwxMjAgNjBNNTAgNjBMODAgMzBNNTAgNjBMODAgOTAiIHN0cm9rZT0iI0Q4RDhEOCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      {isMarkedForRemoval ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            undoImageRemoval(imageId);
                          }}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            markImageForRemoval(index);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <div
                        className={cn(
                          "h-5 w-5 rounded-full flex items-center justify-center",
                          isMarkedForRemoval ? "bg-destructive" : "bg-green-500"
                        )}
                      >
                        {isMarkedForRemoval ? (
                          <Trash2 className="h-3 w-3 text-white" />
                        ) : (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-center text-muted-foreground">
                    {isMarkedForRemoval
                      ? "Marked for removal"
                      : "Existing Image"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalImages === 0 ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg transition-colors cursor-pointer",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold">{label}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
              <p className="text-xs text-muted-foreground">
                Supported: JPG, JPEG, PNG • Max:{" "}
                {formatFileSize(maxFileSize)}
              </p>
            </div>
            <Button type="button" variant="outline">
              Browse Files
            </Button>
          </CardContent>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg transition-colors cursor-pointer",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Add more images
            </span>
          </CardContent>
        </div>
      )}

      <input
        ref={inputRef}
        key={inputKey}
        type="file"
        id={`${idRef.current}_input`}
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFileChange(e.target.files)}
      />

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">New Images ({files.length})</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearNewFiles}
              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear New Images
            </Button>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {previews.map((preview, index) => (
              <div key={`new-${index}`} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-blue-500 bg-muted">
                  <img
                    src={preview}
                    alt={`New ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNewFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute -top-2 -right-2">
                  <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <ImageIcon className="h-3 w-3 text-white" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {files[index].name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(files[index].size)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalImages > 0 && (
        <div className="text-sm text-muted-foreground">
          Total: {totalImages} images ({activeExistingImages.length} existing,{" "}
          {files.length} new)
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {totalImages > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearAll}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Images
        </Button>
      )}
    </div>
  );
};

export default ImageUploader;
export type { ExistingImage };
