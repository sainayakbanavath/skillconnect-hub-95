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
      return "bg-success text-success-foreground";
    case "rejected":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

export const ApplicationCard = memo(({ application, onEdit, onWithdraw }: ApplicationCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{application.jobs.title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Applied {new Date(application.applied_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Badge className={getStatusColor(application.status)}>
          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
        </Badge>
        
        {application.status === "pending" && (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(application)}
              className="flex-1"
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
