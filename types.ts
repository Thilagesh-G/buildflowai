
export enum ProjectStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  WON = 'WON',
  LOST = 'LOST'
}

export interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: string;
}

export interface LaborItem {
  id: string;
  role: string;
  hours: number;
  rate: number;
  total: number;
}

export interface Estimate {
  id: string;
  projectName: string;
  projectType: string;
  location: string;
  deadline: string;
  materials: MaterialItem[];
  labor: LaborItem[];
  overheadPercentage: number;
  contingencyPercentage: number;
  profitPercentage: number;
  status: ProjectStatus;
  createdAt: string;
  extractedRFPData?: string;
  totalCost: number;
  notes: string;
}

export interface IndustryBenchmark {
  category: string;
  averageCost: number;
  currentProjectCost: number;
}
