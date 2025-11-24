import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, LogOut, User, Search, Filter, X, DollarSign, MapPin, Code } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [payRateRange, setPayRateRange] = useState<[number, number]>([0, 500]);
  const [showFilters, setShowFilters] = useState(false);
  
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

  // Get all unique skills from jobs
  const allSkills = useMemo(() => {
    const skillsSet = new Set<string>();
    jobs.forEach(job => {
      job.required_skills.forEach(skill => skillsSet.add(skill));
      job.tech_stack?.forEach(tech => skillsSet.add(tech));
    });
    return Array.from(skillsSet).sort();
  }, [jobs]);

  // Filter jobs based on search and filters
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesDescription = job.description.toLowerCase().includes(query);
        const matchesSkills = job.required_skills.some(skill => 
          skill.toLowerCase().includes(query)
        );
        const matchesTech = job.tech_stack?.some(tech => 
          tech.toLowerCase().includes(query)
        );
        
        if (!matchesTitle && !matchesDescription && !matchesSkills && !matchesTech) {
          return false;
        }
      }

      // Skills filter
      if (selectedSkills.length > 0) {
        const jobSkills = [...job.required_skills, ...(job.tech_stack || [])];
        const hasMatchingSkill = selectedSkills.some(skill => 
          jobSkills.includes(skill)
        );
        if (!hasMatchingSkill) return false;
      }

      // Location filter
      if (locationFilter && job.location) {
        if (!job.location.toLowerCase().includes(locationFilter.toLowerCase())) {
          return false;
        }
      }

      // Pay rate filter
      if (job.pay_per_hour < payRateRange[0] || job.pay_per_hour > payRateRange[1]) {
        return false;
      }

      return true;
    });
  }, [jobs, searchQuery, selectedSkills, locationFilter, payRateRange]);

  const toggleSkill = useCallback((skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedSkills([]);
    setLocationFilter("");
    setPayRateRange([0, 500]);
  }, []);

  const hasActiveFilters = searchQuery || selectedSkills.length > 0 || locationFilter || payRateRange[0] > 0 || payRateRange[1] < 500;

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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold flex items-center gap-2">
              <span className="h-1 w-12 bg-gradient-to-r from-secondary to-accent rounded-full" />
              Available Jobs
              <Badge variant="secondary" className="ml-2 animate-bounce-in">
                {filteredJobs.length}
              </Badge>
            </h3>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {selectedSkills.length + (searchQuery ? 1 : 0) + (locationFilter ? 1 : 0) + ((payRateRange[0] > 0 || payRateRange[1] < 500) ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mb-6 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search jobs by title, description, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-12 border-2 border-primary/20 focus:border-primary bg-card/80 backdrop-blur-sm"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 backdrop-blur-sm animate-scale-in">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" />
                    Filter Jobs
                  </h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Location Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-accent" />
                    Location
                  </label>
                  <Input
                    placeholder="Filter by location..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="border-accent/30 focus:border-accent"
                  />
                </div>

                {/* Pay Rate Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-success" />
                    Pay Rate Range: ${payRateRange[0]} - ${payRateRange[1]}/hour
                  </label>
                  <Slider
                    value={payRateRange}
                    onValueChange={(value) => setPayRateRange(value as [number, number])}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0/hr</span>
                    <span>$500/hr</span>
                  </div>
                </div>

                {/* Skills Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Code className="h-4 w-4 text-secondary" />
                    Skills & Tech Stack ({selectedSkills.length} selected)
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-muted/20 rounded-lg border border-muted">
                    {allSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant={selectedSkills.includes(skill) ? "default" : "outline"}
                        className={`cursor-pointer transition-all duration-200 hover:scale-110 ${
                          selectedSkills.includes(skill)
                            ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                        {selectedSkills.includes(skill) && (
                          <X className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mb-6 flex flex-wrap gap-2 animate-fade-in">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  Search: "{searchQuery}"
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {locationFilter && (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  <MapPin className="h-3 w-3" />
                  {locationFilter}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocationFilter("")}
                    className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {(payRateRange[0] > 0 || payRateRange[1] < 500) && (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  <DollarSign className="h-3 w-3" />
                  ${payRateRange[0]} - ${payRateRange[1]}/hr
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPayRateRange([0, 500])}
                    className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {selectedSkills.map(skill => (
                <Badge key={skill} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  <Code className="h-3 w-3" />
                  {skill}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSkill(skill)}
                    className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Jobs Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {filteredJobs.map((job, idx) => (
              <div key={job.id} className="animate-bounce-in" style={{ animationDelay: `${idx * 50}ms` }}>
                <JobCard
                  job={job}
                  isApplied={applications.some((app) => app.jobs.title === job.title)}
                  onApply={handleApply}
                />
              </div>
            ))}
          </div>

          {filteredJobs.length === 0 && jobs.length > 0 && (
            <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/20 backdrop-blur-sm animate-fade-in">
              <CardContent className="py-12 text-center">
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50 animate-pulse" />
                <p className="text-muted-foreground text-lg mb-2">No jobs match your filters</p>
                <p className="text-sm text-muted-foreground/70 mb-4">Try adjusting your search criteria</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}

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
