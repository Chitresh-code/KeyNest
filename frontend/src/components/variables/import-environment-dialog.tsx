'use client';

import { useState, useRef } from 'react';
import { Upload, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useImportEnvironment } from '@/lib/api/variables';
import { toast } from 'sonner';

interface ImportEnvironmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  environmentId: number;
}

interface ConflictData {
  conflicts: string[];
  error: string;
  message: string;
}

export default function ImportEnvironmentDialog({
  open,
  onOpenChange,
  environmentId
}: ImportEnvironmentDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conflicts, setConflicts] = useState<ConflictData | null>(null);
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const importMutation = useImportEnvironment();

  const resetState = () => {
    setSelectedFile(null);
    setConflicts(null);
    setOverwriteConfirmed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.env') && !file.name.includes('env')) {
      toast.error('Please select a valid .env file');
      return;
    }

    setSelectedFile(file);
    setConflicts(null);
    setOverwriteConfirmed(false);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      await importMutation.mutateAsync({
        environmentId,
        file: selectedFile,
        overwrite: overwriteConfirmed
      });
      
      handleClose();
    } catch (error: any) {
      // Check if this is a conflict error
      if (error.response?.status === 409 && error.response?.data?.conflicts) {
        setConflicts(error.response.data);
      } else {
        const message = error.response?.data?.detail || 
                       error.response?.data?.message || 
                       'Failed to import environment file';
        toast.error(message);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Import Environment Variables</span>
          </DialogTitle>
          <DialogDescription>
            Upload a .env file to import environment variables. 
            Variables will be encrypted and stored securely.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          {!selectedFile && (
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragOver 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
                Drop your .env file here
              </p>
              <p className="text-gray-500 dark:text-muted-foreground mb-4">
                or click to browse files
              </p>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".env,*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* Selected File Info */}
          {selectedFile && !conflicts && (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetState}
                className="text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Conflicts Warning */}
          {conflicts && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                    Variable Conflicts Detected
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                    The following variables already exist in this environment:
                  </p>
                  
                  <ScrollArea className="h-32 w-full border border-yellow-200 dark:border-yellow-700 rounded p-2 bg-white dark:bg-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {conflicts.conflicts.map((variable, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs font-mono bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                        >
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox
                      id="overwrite"
                      checked={overwriteConfirmed}
                      onCheckedChange={setOverwriteConfirmed}
                    />
                    <label 
                      htmlFor="overwrite" 
                      className="text-sm font-medium text-yellow-900 dark:text-yellow-100 cursor-pointer"
                    >
                      Replace existing variables with new values
                    </label>
                  </div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Unchecked variables will be skipped during import
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            
            <div className="space-x-2">
              {selectedFile && !conflicts && (
                <Button
                  onClick={resetState}
                  variant="outline"
                  disabled={importMutation.isPending}
                >
                  Choose Different File
                </Button>
              )}
              
              <Button
                onClick={handleImport}
                disabled={Boolean(!selectedFile || importMutation.isPending || (conflicts && !overwriteConfirmed && conflicts.conflicts && conflicts.conflicts.length > 0))}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {importMutation.isPending ? 'Importing...' : conflicts ? 'Import with Conflicts' : 'Import Variables'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}