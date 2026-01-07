import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="flex items-center gap-2">
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        className="h-6 px-2 text-xs gap-1"
        onClick={onPrevious}
        disabled={isFirst}
      >
        <ChevronLeft className="h-3 w-3" />
        Previous
      </Button>

      {/* Progress indicator */}
      {isReviewMode && reviewProgress ? (
        <span className="text-xs font-medium text-primary px-1">
          {reviewProgress.current} of {reviewProgress.total}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground px-1">
          {currentIndex + 1} / {totalCount}
        </span>
      )}

      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        className="h-6 px-2 text-xs gap-1"
        onClick={onNext}
        disabled={isLast}
      >
        Next
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
};
