import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, LogOut, User } from "lucide-react";
// This is a code
import { EditApplicationDialog } from "@/components/EditApplicationDialog";
import { JobCard } from "@/components/JobCard";
import { ApplicationCard } from "@/components/ApplicationCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { ApplyJobDialog } from "@/components/ApplyJobDialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Job {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  tech_stack: string[];
  pay_per_hour: number;
  experience_level: string;
  location: string;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
}

interface Application {
  id: string;
  status: string;
  applied_at: string;
  cover_letter: string | null;
  jobs: {
    title: string;
  };
}

const FreelancerDashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<{ id: string; title: string } | null>(null);
  const [editApplicationDialogOpen, setEditApplicationDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [withdrawApplicationId, setWithdrawApplicationId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      await Promise.all([fetchJobs(), fetchApplications()]);
    };
    init();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (userRole?.role !== "freelancer") {
      navigate("/recruiter");
      return;
    }

    setUser(user);
  };

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading jobs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          jobs (
            title
          )
        `)
        .eq("freelancer_id", user.id)
        .order("applied_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading applications",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleApply = useCallback((jobId: string, jobTitle: string) => {
    setSelectedJob({ id: jobId, title: jobTitle });
    setApplyDialogOpen(true);
  }, []);

  const handleEditApplication = useCallback((application: Application) => {
    setSelectedApplication(application);
    setEditApplicationDialogOpen(true);
  }, []);

  const handleWithdrawApplication = useCallback(async () => {
    if (!withdrawApplicationId) return;

    try {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", withdrawApplicationId);

      if (error) throw error;

      toast({
        title: "Application withdrawn",
        description: "Your application has been withdrawn successfully.",
      });

      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error withdrawing application",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setWithdrawApplicationId(null);
    }
  }, [withdrawApplicationId, toast]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <header className="border-b bg-card/80 backdrop-blur-lg shadow-lg sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="h-8 w-40 bg-gradient-to-r from-primary to-secondary rounded-lg animate-shimmer" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 space-y-2">
            <Skeleton className="h-10 w-64 animate-fade-in" />
            <Skeleton className="h-6 w-48 animate-fade-in" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <header className="border-b bg-card/80 backdrop-blur-lg shadow-lg sticky top-0 z-10 animate-slide-in-left">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-glow">
            SkillConnect
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/freelancer/profile")} className="border-primary/30 hover:border-primary hover:shadow-lg hover:shadow-primary/20">
              <User className="mr-2 h-4 w-4" />
              My Profile
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="hover:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Welcome back!
          </h2>
          <p className="text-lg text-muted-foreground">Find your next opportunity</p>
        </div>

        {applications.length > 0 && (
          <section className="mb-12 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="h-1 w-12 bg-gradient-to-r from-primary to-secondary rounded-full" />
              My Applications
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {applications.map((app, idx) => (
                <div key={app.id} className="animate-bounce-in" style={{ animationDelay: `${idx * 50}ms` }}>
                  <ApplicationCard
                    application={app}
                    onEdit={handleEditApplication}
                    onWithdraw={setWithdrawApplicationId}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="animate-fade-in" style={{ animationDelay: applications.length > 0 ? '200ms' : '100ms' }}>
          <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="h-1 w-12 bg-gradient-to-r from-secondary to-accent rounded-full" />
            Available Jobs
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            {jobs.map((job, idx) => (
              <div key={job.id} className="animate-bounce-in" style={{ animationDelay: `${idx * 75}ms` }}>
                <JobCard
                  job={job}
                  isApplied={applications.some((app) => app.jobs.title === job.title)}
                  onApply={handleApply}
                />
              </div>
            ))}
          </div>

          {jobs.length === 0 && (
            <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/20 backdrop-blur-sm animate-fade-in">
              <CardContent className="py-12 text-center">
                <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50 animate-bounce" />
                <p className="text-muted-foreground text-lg">No jobs available at the moment</p>
                <p className="text-sm text-muted-foreground/70 mt-2">Check back soon for new opportunities!</p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      {selectedJob && (
        <ApplyJobDialog
          open={applyDialogOpen}
          onOpenChange={setApplyDialogOpen}
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          onSuccess={fetchApplications}
        />
      )}

      {selectedApplication && (
        <EditApplicationDialog
          open={editApplicationDialogOpen}
          onOpenChange={setEditApplicationDialogOpen}
          application={selectedApplication}
          onSuccess={fetchApplications}
        />
      )}

      <AlertDialog open={!!withdrawApplicationId} onOpenChange={(open) => !open && setWithdrawApplicationId(null)}>
        <AlertDialogContent className="border-2 border-destructive/20 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">Withdraw Application?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to withdraw this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdrawApplication} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/30">
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FreelancerDashboard;
