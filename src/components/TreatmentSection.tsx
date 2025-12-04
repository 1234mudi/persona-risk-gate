import React from "react";

interface TreatmentSectionProps {
  onNext: () => void;
}

const TreatmentSection: React.FC<TreatmentSectionProps> = ({ onNext }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">Risk Treatment Plans</h3>
      <p className="text-xs text-slate-500">No treatment plans configured yet.</p>
    </div>
  );
};

export default TreatmentSection;
