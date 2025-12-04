export type FactorType = "parent" | "child";

export interface Control {
  id: string;
  controlId: string;
  name: string;
  effectiveness: string;
  weighting: string;
  designEffect: string;
  operativeEffect: string;
  isKeyControl: boolean;
  category: string;
  comments: string;
}
