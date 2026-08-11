import { AlertCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Alert variant="danger" className="my-4">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-3">
        <span>{message ?? "We couldn't load this content. Please try again."}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="ml-auto">
            <RefreshCw aria-hidden="true" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
