import { useState, useCallback, useMemo } from "react";

export interface TraversableRisk {
  id: string;
  title: string;
  sectionCompletion: {
    inherentRating: number;
    controlEffectiveness: number;
    residualRating: number;
    riskTreatment: number;
  };
}

interface UseRiskTraversalProps {
  risks: TraversableRisk[];
  selectedRiskIds?: Set<string>;
  isReviewMode?: boolean;
}

interface UseRiskTraversalReturn {
  currentRisk: TraversableRisk | null;
  currentIndex: number;
  totalCount: number;
  isFirst: boolean;
  isLast: boolean;
  isReviewMode: boolean;
  goToNext: () => void;
  goToPrevious: () => void;
  goToRisk: (riskId: string) => void;
  openRisk: (riskId: string) => void;
  closeModal: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  startReviewMode: (selectedIds: Set<string>) => void;
  exitReviewMode: () => void;
  reviewProgress: { current: number; total: number } | null;
}

export const useRiskTraversal = ({
  risks,
  selectedRiskIds,
  isReviewMode: initialReviewMode = false,
}: UseRiskTraversalProps): UseRiskTraversalReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRiskId, setCurrentRiskId] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(initialReviewMode);
  const [reviewRiskIds, setReviewRiskIds] = useState<string[]>([]);

  // Get the list of risks to traverse (either all visible or selected for review)
  const traversableRisks = useMemo(() => {
    if (isReviewMode && reviewRiskIds.length > 0) {
      return risks.filter(r => reviewRiskIds.includes(r.id));
    }
    return risks;
  }, [risks, isReviewMode, reviewRiskIds]);

  const currentIndex = useMemo(() => {
    if (!currentRiskId) return -1;
    return traversableRisks.findIndex(r => r.id === currentRiskId);
  }, [traversableRisks, currentRiskId]);

  const currentRisk = useMemo(() => {
    if (currentIndex === -1) return null;
    return traversableRisks[currentIndex] || null;
  }, [traversableRisks, currentIndex]);

  const totalCount = traversableRisks.length;
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= totalCount - 1;

  const goToNext = useCallback(() => {
    if (isLast || currentIndex === -1) return;
    const nextRisk = traversableRisks[currentIndex + 1];
    if (nextRisk) {
      setCurrentRiskId(nextRisk.id);
    }
  }, [traversableRisks, currentIndex, isLast]);

  const goToPrevious = useCallback(() => {
    if (isFirst || currentIndex === -1) return;
    const prevRisk = traversableRisks[currentIndex - 1];
    if (prevRisk) {
      setCurrentRiskId(prevRisk.id);
    }
  }, [traversableRisks, currentIndex, isFirst]);

  const goToRisk = useCallback((riskId: string) => {
    const exists = traversableRisks.some(r => r.id === riskId);
    if (exists) {
      setCurrentRiskId(riskId);
    }
  }, [traversableRisks]);

  const openRisk = useCallback((riskId: string) => {
    setCurrentRiskId(riskId);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Don't clear currentRiskId to preserve context when reopening
  }, []);

  const startReviewMode = useCallback((selectedIds: Set<string>) => {
    const idsArray = Array.from(selectedIds);
    // Filter to only include ids that exist in the current risks list
    const validIds = idsArray.filter(id => risks.some(r => r.id === id));
    if (validIds.length === 0) return;
    
    setReviewRiskIds(validIds);
    setIsReviewMode(true);
    setCurrentRiskId(validIds[0]);
    setIsOpen(true);
  }, [risks]);

  const exitReviewMode = useCallback(() => {
    setIsReviewMode(false);
    setReviewRiskIds([]);
  }, []);

  const reviewProgress = useMemo(() => {
    if (!isReviewMode) return null;
    return {
      current: currentIndex + 1,
      total: totalCount,
    };
  }, [isReviewMode, currentIndex, totalCount]);

  return {
    currentRisk,
    currentIndex,
    totalCount,
    isFirst,
    isLast,
    isReviewMode,
    goToNext,
    goToPrevious,
    goToRisk,
    openRisk,
    closeModal,
    isOpen,
    setIsOpen,
    startReviewMode,
    exitReviewMode,
    reviewProgress,
  };
};
