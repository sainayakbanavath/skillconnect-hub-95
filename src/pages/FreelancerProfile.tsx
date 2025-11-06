import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  bio: z.string().trim().max(2000, "Bio must be less than 2000 characters").optional(),
  education: z.string().trim().max(2000, "Education must be less than 2000 characters").optional(),
  experience: z.string().trim().max(5000, "Experience must be less than 5000 characters").optional(),
  skills: z.array(z.string().trim().min(1).max(50)).max(30, "Maximum 30 skills allowed"),
  tech_stack: z.array(z.string().trim().max(50)).max(30, "Maximum 30 tech items allowed"),
  hourly_rate: z.number().positive("Hourly rate must be positive").max(10000, "Rate must be less than $10,000/hour").optional(),
  years_of_experience: z.number().int().min(0, "Years must be 0 or more").max(100, "Years must be less than 100").optional(),
  portfolio_url: z.string().trim().url("Invalid portfolio URL").max(500).optional().or(z.literal("")),
  github_url: z.string().trim().url("Invalid GitHub URL").max(500).optional().or(z.literal("")),
  linkedin_url: z.string().trim().url("Invalid LinkedIn URL").max(500).optional().or(z.literal("")),
});

const FreelancerProfile = () => {
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [techStack, setTechStack] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("freelancer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setBio(data.bio || "");
        setEducation(data.education || "");
        setExperience(data.experience || "");
        setSkills(data.skills?.join(", ") || "");
        setTechStack(data.tech_stack?.join(", ") || "");
        setHourlyRate(data.hourly_rate?.toString() || "");
        setYearsOfExperience(data.years_of_experience?.toString() || "");
        setPortfolioUrl(data.portfolio_url || "");
        setGithubUrl(data.github_url || "");
        setLinkedinUrl(data.linkedin_url || "");
      }
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const skillsArray = skills.split(",").map(s => s.trim()).filter(s => s);
      const techArray = techStack.split(",").map(s => s.trim()).filter(s => s);

      // Validate input with zod
      const validationResult = profileSchema.safeParse({
        bio: bio || undefined,
        education: education || undefined,
        experience: experience || undefined,
        skills: skillsArray,
        tech_stack: techArray,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        years_of_experience: yearsOfExperience ? parseInt(yearsOfExperience) : undefined,
        portfolio_url: portfolioUrl || "",
        github_url: githubUrl || "",
        linkedin_url: linkedinUrl || "",
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Invalid input",
          description: firstError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const profileData = {
        user_id: user.id,
        bio: validationResult.data.bio || null,
        education: validationResult.data.education || null,
        experience: validationResult.data.experience || null,
        skills: validationResult.data.skills,
        tech_stack: validationResult.data.tech_stack,
        hourly_rate: validationResult.data.hourly_rate || null,
        years_of_experience: validationResult.data.years_of_experience || null,
        portfolio_url: validationResult.data.portfolio_url || null,
        github_url: validationResult.data.github_url || null,
        linkedin_url: validationResult.data.linkedin_url || null,
      };

      const { error } = await supabase
        .from("freelancer_profiles")
        .upsert(profileData);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your profile has been saved successfully.",
      });

      navigate("/freelancer");
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/freelancer")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Freelancer Profile</CardTitle>
            <CardDescription>
              Complete your profile to stand out to recruiters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Textarea
                  id="education"
                  placeholder="Your educational background..."
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Textarea
                  id="experience"
                  placeholder="Your work experience..."
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input
                  id="skills"
                  placeholder="e.g., JavaScript, Python, UI/UX Design"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="techStack">Tech Stack (comma-separated)</Label>
                <Input
                  id="techStack"
                  placeholder="e.g., React, Node.js, PostgreSQL"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="50.00"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years">Years of Experience</Label>
                  <Input
                    id="years"
                    type="number"
                    min="0"
                    placeholder="5"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio URL</Label>
                <Input
                  id="portfolio"
                  type="url"
                  placeholder="https://yourportfolio.com"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github">GitHub URL</Label>
                <Input
                  id="github"
                  type="url"
                  placeholder="https://github.com/yourusername"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FreelancerProfile;
