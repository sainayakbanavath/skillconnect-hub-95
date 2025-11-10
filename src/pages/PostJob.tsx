import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
// This is a code

const jobSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(200, "Title must be less than 200 characters"),
  description: z.string().trim().min(50, "Description must be at least 50 characters").max(5000, "Description must be less than 5000 characters"),
  required_skills: z.array(z.string().trim().min(1).max(50)).min(1, "At least one skill is required").max(20, "Maximum 20 skills allowed"),
  tech_stack: z.array(z.string().trim().max(50)).max(20, "Maximum 20 tech items allowed"),
  pay_per_hour: z.number().positive("Pay must be positive").max(10000, "Pay must be less than $10,000/hour"),
  experience_level: z.enum(["entry", "intermediate", "expert"]),
  location: z.string().trim().max(200, "Location must be less than 200 characters").optional(),
});

const PostJob = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [techStack, setTechStack] = useState("");
  const [payPerHour, setPayPerHour] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"entry" | "intermediate" | "expert">("entry");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const skillsArray = requiredSkills.split(",").map(s => s.trim()).filter(s => s);
      const techArray = techStack.split(",").map(s => s.trim()).filter(s => s);

      // Validate input with zod
      const validationResult = jobSchema.safeParse({
        title,
        description,
        required_skills: skillsArray,
        tech_stack: techArray,
        pay_per_hour: parseFloat(payPerHour),
        experience_level: experienceLevel,
        location: location || undefined,
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

      const { error } = await supabase.from("jobs").insert({
        recruiter_id: user.id,
        title: validationResult.data.title,
        description: validationResult.data.description,
        required_skills: validationResult.data.required_skills,
        tech_stack: validationResult.data.tech_stack,
        pay_per_hour: validationResult.data.pay_per_hour,
        experience_level: validationResult.data.experience_level,
        location: validationResult.data.location || null,
      });

      if (error) throw error;

      toast({
        title: "Job posted successfully!",
        description: "Your job posting is now live.",
      });

      navigate("/recruiter");
    } catch (error: any) {
      toast({
        title: "Error posting job",
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
          <Button variant="ghost" onClick={() => navigate("/recruiter")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Post a New Job</CardTitle>
            <CardDescription>
              Fill in the details to attract the right freelancers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Senior React Developer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Required Skills * (comma-separated)</Label>
                <Input
                  id="skills"
                  placeholder="e.g., React, TypeScript, Node.js"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Separate skills with commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="techStack">Tech Stack (comma-separated)</Label>
                <Input
                  id="techStack"
                  placeholder="e.g., Next.js, PostgreSQL, AWS"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pay">Pay Per Hour ($) *</Label>
                  <Input
                    id="pay"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="50.00"
                    value={payPerHour}
                    onChange={(e) => setPayPerHour(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience Level *</Label>
                  <Select
                    value={experienceLevel}
                    onValueChange={(v: "entry" | "intermediate" | "expert") => setExperienceLevel(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Remote, New York, USA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Posting..." : "Post Job"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PostJob;
