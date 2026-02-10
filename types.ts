
export interface Resource {
  id: string;
  name: string;
  category: string;
  serviceCategories?: string[];
  resourceType: string;
  communityFocus: string;
  geographicArea: string;
  spa: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  hours?: string;
  eligibility?: string;
  languages?: string;
  targetPopulation?: string;
  referralNotes?: string;
  notes?: string;
  description: string;
  source?: string;
  lastUpdated?: string;
}

export interface FilterState {
  q: string;
  category: string;
  community: string;
  geo: string;
  spa: string;
  service: string;
  population: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
}

export interface ChatContext {
  needs: string[];
  recommendations: string[];
}

export const CATEGORIES = [
  "All",
  "Basic Needs",
  "Mental & Behavioral Health",
  "HIV / Sexual Health",
  "Housing & Shelter",
  "Health Care",
  "Food Assistance",
  "Community Support",
  "Legal Aid",
  "Transportation"
];
