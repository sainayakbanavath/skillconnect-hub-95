import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, MapPin, Briefcase } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  tech_stack: string[];
  pay_per_hour: number;
  experience_level: string;
  location: string;
  profiles: {
    full_name: string;
  } | null;
}
// This is a code
interface JobCardProps {
  job: Job;
  isApplied: boolean;
  onApply: (jobId: string, jobTitle: string) => void;
}

export const JobCard = memo(({ job, isApplied, onApply }: JobCardProps) => {
  return (
    <Card className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border-2 hover:border-primary/20 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm animate-fade-in-up">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
              {job.title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Posted by {job.profiles?.full_name || 'Unknown Recruiter'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="capitalize bg-primary/10 border-primary/30 text-primary font-semibold">
            {job.experience_level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {job.description}
        </p>

        <div className="flex items-center gap-2 text-sm bg-primary/5 px-3 py-2 rounded-lg border border-primary/10">
          <DollarSign className="h-5 w-5 text-primary animate-pulse" />
          <span className="font-bold text-lg text-primary">${job.pay_per_hour}</span>
          <span className="text-muted-foreground">/hour</span>
        </div>

        {job.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
            <MapPin className="h-4 w-4 text-accent" />
            <span>{job.location}</span>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold mb-2 text-foreground">Required Skills:</p>
          <div className="flex flex-wrap gap-2">
            {job.required_skills.map((skill, idx) => (
              <Badge key={idx} className="bg-secondary/90 text-secondary-foreground hover:bg-secondary transition-colors duration-200 hover:scale-110">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {job.tech_stack && job.tech_stack.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2 text-foreground">Tech Stack:</p>
            <div className="flex flex-wrap gap-2">
              {job.tech_stack.map((tech, idx) => (
                <Badge key={idx} variant="outline" className="border-accent/50 text-accent hover:bg-accent/10 transition-colors duration-200 hover:scale-110">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={() => onApply(job.id, job.title)}
          className="w-full bg-gradient-to-r from-primary via-secondary to-accent text-white font-semibold shadow-lg hover:shadow-xl"
          disabled={isApplied}
        >
          <Briefcase className="mr-2 h-4 w-4" />
          {isApplied ? "Already Applied" : "I'm Interested"}
        </Button>
      </CardContent>
    </Card>
  );
});

JobCard.displayName = "JobCard";
