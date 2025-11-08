import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Application {
  id: string;
  cover_letter: string | null;
  jobs: {
    title: string;
  };
}

interface EditApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application;
  onSuccess: () => void;
}

export const EditApplicationDialog = ({ open, onOpenChange, application, onSuccess }: EditApplicationDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState(application.cover_letter || "");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("applications")
        .update({
          cover_letter: coverLetter,
        })
        .eq("id", application.id);

      if (error) throw error;

      toast({
        title: "Application updated",
        description: "Your application has been updated successfully.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error updating application",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Application</DialogTitle>
          <DialogDescription>
            Update your cover letter for {application.jobs.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cover_letter">Cover Letter</Label>
            <Textarea
              id="cover_letter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={8}
              placeholder="Tell the recruiter why you're interested in this position..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};