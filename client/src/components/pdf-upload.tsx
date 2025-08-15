import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadFile, deleteFile, reparseProject } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Upload, Eye, FileText, Trash2, RefreshCw, Zap } from "lucide-react";

interface PdfUploadProps {
  projectId: string;
  files: any[];
}

export default function PdfUpload({ projectId, files }: PdfUploadProps) {
  const { toast } = useToast();

  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => uploadFile(projectId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "File uploaded!",
        description: "PDF file has been uploaded and parsed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) => deleteFile(projectId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "File deleted!",
        description: "PDF file has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const reparseProjectMutation = useMutation({
    mutationFn: () => reparseProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "Data extracted!",
        description: "PDF data has been extracted and updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Extraction failed",
        description: error.message || "Failed to extract data from PDFs",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      uploadFileMutation.mutate(file);
    });
  }, [uploadFileMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 5
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? "border-primary-400 bg-primary-50" 
              : "border-slate-300 hover:border-primary-400"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">
            {isDragActive 
              ? "Drop PDF files here..." 
              : "Drop PDF files here or click to upload"
            }
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Support for rack elevation and top view drawings
          </p>
        </div>

        {/* Document Thumbnails */}
        {files.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {files.map((file, index) => (
              <div key={file.id} className="pdf-thumb rounded-lg p-3 relative group border border-slate-200">
                <div className="relative z-10">
                  <div className="text-xs font-medium text-slate-700 mb-2 truncate">
                    {file.filename}
                  </div>
                  <div className="w-full h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded mb-2 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="text-xs text-slate-600">
                    Page {file.pageCount || 1}/1
                  </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFileMutation.mutate(file.id);
                    }}
                    disabled={deleteFileMutation.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <div className="flex items-center justify-center space-x-3 pt-4 border-t border-slate-200">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => reparseProjectMutation.mutate()}
              disabled={reparseProjectMutation.isPending}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Zap className={`w-4 h-4 mr-2 ${reparseProjectMutation.isPending ? 'animate-pulse' : ''}`} />
              {reparseProjectMutation.isPending ? 'Extracting Data...' : 'Extract Data from PDFs'}
            </Button>
            <Button variant="link" size="sm">
              <Eye className="w-4 h-4 mr-1" />
              View Documents
            </Button>
          </div>
        )}

        {uploadFileMutation.isPending && (
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-primary-50 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
              <span className="text-sm text-primary-700">Uploading and parsing...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
