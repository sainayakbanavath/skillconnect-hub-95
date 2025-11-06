import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, DollarSign, MapPin, LogOut, User, Clock } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

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
  };
}

interface Application {
  id: string;
  status: string;
  applied_at: string;
  jobs: {
    title: string;
  };
}

const FreelancerDashboard = () => {
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

  const handleApply = async (jobId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("applications")
        .insert({
          job_id: jobId,
          freelancer_id: user.id,
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already applied",
            description: "You have already applied to this job.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Application submitted!",
        description: "The recruiter will review your application.",
      });

      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error submitting application",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-success text-success-foreground";
      case "rejected":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
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
            <Button variant="outline" onClick={() => navigate("/freelancer/profile")}>
              <User className="mr-2 h-4 w-4" />
              My Profile
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
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">Find your next opportunity</p>
        </div>

        {applications.length > 0 && (
          <section className="mb-12">
            <h3 className="text-2xl font-semibold mb-4">My Applications</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {applications.map((app) => (
                <Card key={app.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{app.jobs.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Applied {new Date(app.applied_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge className={getStatusColor(app.status)}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-2xl font-semibold mb-4">Available Jobs</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <CardTitle className="text-xl mb-1">{job.title}</CardTitle>
                      <CardDescription>
                        Posted by {job.profiles.full_name}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {job.experience_level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {job.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="font-semibold">${job.pay_per_hour}/hour</span>
                  </div>

                  {job.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-2">Required Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {job.tech_stack && job.tech_stack.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Tech Stack:</p>
                      <div className="flex flex-wrap gap-2">
                        {job.tech_stack.map((tech, idx) => (
                          <Badge key={idx} variant="outline">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => handleApply(job.id)}
                    className="w-full"
                    disabled={applications.some((app) => app.jobs.title === job.title)}
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    {applications.some((app) => app.jobs.title === job.title)
                      ? "Already Applied"
                      : "I'm Interested"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {jobs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No jobs available at the moment</p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
};

export default FreelancerDashboard;
