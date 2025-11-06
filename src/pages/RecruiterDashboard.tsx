import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, LogOut, Briefcase, Users, CheckCircle, XCircle } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface Job {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  pay_per_hour: number;
  experience_level: string;
  is_active: boolean;
  created_at: string;
}

interface Application {
  id: string;
  status: string;
  applied_at: string;
  jobs: {
    title: string;
  };
  profiles: {
    full_name: string;
    email: string;
  };
}

const RecruiterDashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchJobs();
    fetchApplications();
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

    if (userRole?.role !== "recruiter") {
      navigate("/freelancer");
      return;
    }

    setUser(user);
  };

  const fetchJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("recruiter_id", user.id)
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
          jobs!inner (
            title,
            recruiter_id
          ),
          profiles (
            full_name,
            email
          )
        `)
        .eq("jobs.recruiter_id", user.id)
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

  const handleApplicationStatus = async (applicationId: string, status: "accepted" | "rejected") => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", applicationId);

      if (error) throw error;

      toast({
        title: `Application ${status}`,
        description: `You have ${status} this application.`,
      });

      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error updating application",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            SkillConnect
          </h1>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/recruiter/post-job")}>
              <Plus className="mr-2 h-4 w-4" />
              Post Job
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Recruiter Dashboard</h2>
          <p className="text-muted-foreground">Manage your job postings and applications</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobs.filter(j => j.is_active).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter(a => a.status === "pending").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-4">Recent Applications</h3>
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{app.profiles.full_name}</CardTitle>
                      <CardDescription>
                        Applied for: {app.jobs.title}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground mt-1">
                        {app.profiles.email}
                      </p>
                    </div>
                    <Badge
                      className={
                        app.status === "accepted"
                          ? "bg-success text-success-foreground"
                          : app.status === "rejected"
                          ? "bg-destructive text-destructive-foreground"
                          : ""
                      }
                    >
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Applied on {new Date(app.applied_at).toLocaleDateString()}
                  </p>
                  {app.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApplicationStatus(app.id, "accepted")}
                        className="bg-success hover:bg-success/90"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApplicationStatus(app.id, "rejected")}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {applications.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No applications yet</p>
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <h3 className="text-2xl font-semibold mb-4">My Job Postings</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <CardTitle>{job.title}</CardTitle>
                  <CardDescription>
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {job.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">${job.pay_per_hour}/hour</span>
                    <Badge variant="outline" className="capitalize">
                      {job.experience_level}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {jobs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">You haven't posted any jobs yet</p>
                <Button onClick={() => navigate("/recruiter/post-job")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Post Your First Job
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
};

export default RecruiterDashboard;
