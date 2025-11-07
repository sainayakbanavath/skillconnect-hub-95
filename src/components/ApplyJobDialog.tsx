import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText } from "lucide-react";

interface ApplyJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
  onSuccess: () => void;
}

export const ApplyJobDialog = ({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  onSuccess,
}: ApplyJobDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Word document (.pdf, .doc, .docx)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({
        title: "Resume required",
        description: "Please upload your resume to apply",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload resume to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${jobId}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL (even though bucket is private, we need the path)
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      // Create application with resume URL
      const { error: applicationError } = await supabase
        .from("applications")
        .insert({
          job_id: jobId,
          freelancer_id: user.id,
          resume_url: fileName, // Store the file path, not public URL
        });

      if (applicationError) {
        // Clean up uploaded file if application creation fails
        await supabase.storage.from('resumes').remove([fileName]);
        
        if (applicationError.code === "23505") {
          toast({
            title: "Already applied",
            description: "You have already applied to this job.",
            variant: "destructive",
          });
        } else {
          throw applicationError;
        }
        return;
      }

      toast({
        title: "Application submitted!",
        description: "The recruiter will review your application and resume.",
      });

      setFile(null);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error submitting application",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply to Job</DialogTitle>
          <DialogDescription>
            Upload your resume to apply for: <strong>{jobTitle}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="resume">Resume (PDF, DOC, DOCX - Max 10MB)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                disabled={uploading}
                className="cursor-pointer"
              />
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 p-2 bg-secondary rounded">
                <FileText className="h-4 w-4" />
                <span className="truncate">{file.name}</span>
                <span className="text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploading || !file}
          >
            {uploading ? (
              <>Submitting...</>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit Application
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
