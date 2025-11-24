import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Edit, Trash2 } from "lucide-react";

interface Application {
  id: string;
  status: string;
  applied_at: string;
  cover_letter: string | null;
  jobs: {
    title: string;
  };
}
// This is a code
interface ApplicationCardProps {
  application: Application;
  onEdit: (app: Application) => void;
  onWithdraw: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "accepted":
      return "bg-gradient-to-r from-success to-success/80 text-success-foreground shadow-lg shadow-success/20";
    case "rejected":
      return "bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground shadow-lg shadow-destructive/20";
    default:
      return "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-lg shadow-secondary/20";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "accepted":
      return "✓";
    case "rejected":
      return "✗";
    default:
      return "⏳";
  }
};

export const ApplicationCard = memo(({ application, onEdit, onWithdraw }: ApplicationCardProps) => {
  return (
    <Card className="group hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-primary/30 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm animate-fade-in overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="relative z-10">
        <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
          {application.jobs.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 text-accent animate-pulse" />
          Applied {new Date(application.applied_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <Badge className={`${getStatusColor(application.status)} font-semibold px-4 py-1.5 text-sm animate-scale-in`}>
          <span className="mr-1.5">{getStatusIcon(application.status)}</span>
          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
        </Badge>
        
        {application.status === "pending" && (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(application)}
              className="flex-1 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-200"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onWithdraw(application.id)}
              className="flex-1"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ApplicationCard.displayName = "ApplicationCard";
