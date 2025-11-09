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

interface JobCardProps {
  job: Job;
  isApplied: boolean;
  onApply: (jobId: string, jobTitle: string) => void;
}

export const JobCard = memo(({ job, isApplied, onApply }: JobCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div>
            <CardTitle className="text-xl mb-1">{job.title}</CardTitle>
            <CardDescription>
              Posted by {job.profiles?.full_name || 'Unknown Recruiter'}
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
          onClick={() => onApply(job.id, job.title)}
          className="w-full"
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
