import React, { createContext, useContext, useState, ReactNode } from "react";

interface ChallengeDetails {
  justification: string;
  reviewer: string;
  date: Date;
  reasons: string[];
}

interface FormState {
  challengeDetails?: ChallengeDetails;
}

interface FormContextType {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [formState, setFormState] = useState<FormState>({});

  return (
    <FormContext.Provider value={{ formState, setFormState }}>
      {children}
    </FormContext.Provider>
  );
};

export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    return { formState: {}, setFormState: () => {} };
  }
  return context;
};
