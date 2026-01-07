import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RiskTraversalNavProps {
  currentIndex: number;
  totalCount: number;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onPrevious: () => void;
  isReviewMode?: boolean;
  reviewProgress?: { current: number; total: number } | null;
}

export const RiskTraversalNav = ({
  currentIndex,
  totalCount,
  isFirst,
  isLast,
  onNext,
  onPrevious,
  isReviewMode = false,
  reviewProgress,
}: RiskTraversalNavProps) => {
  if (totalCount <= 1) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {/* Progress indicator */}
        {isReviewMode && reviewProgress ? (
          <Badge 
            variant="secondary" 
            className="mr-2 text-xs font-medium bg-primary/10 text-primary border-primary/20"
          >
            {reviewProgress.current} of {reviewProgress.total}
          </Badge>
        ) : (
          <Badge 
            variant="outline" 
            className="mr-2 text-xs font-medium text-muted-foreground"
          >
            {currentIndex + 1} / {totalCount}
          </Badge>
        )}

        {/* Previous button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onPrevious}
              disabled={isFirst}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous risk</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isFirst ? "This is the first risk" : "Previous risk"}
          </TooltipContent>
        </Tooltip>

        {/* Next button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onNext}
              disabled={isLast}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next risk</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isLast ? "This is the last risk" : "Next risk"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
