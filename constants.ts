
import { IssueCategory } from './types';

export const CATEGORY_OPTIONS = Object.values(IssueCategory);

export const DEPARTMENT_MAP: Record<IssueCategory, string> = {
  [IssueCategory.DRAINAGE]: 'Department of Sewage & Water Management',
  [IssueCategory.POTHOLES]: 'Public Works Department (Roads Division)',
  [IssueCategory.STREETLIGHTS]: 'Urban Electrical Maintenance Wing',
  [IssueCategory.WASTE]: 'Municipal Sanitation & Waste Control',
  [IssueCategory.WATER_LEAK]: 'Regional Hydro-Supply Board',
  [IssueCategory.OTHER]: 'General Civic Administrative Body'
};

export const PRIORITY_WEIGHTS = {
  SEVERITY: 0.7,
  LOCATION: 0.3
};

export const SENSITIVE_KEYWORDS = ['school', 'hospital', 'nursing home', 'kindergarten', 'clinic', 'college', 'main road', 'highway'];

export const APP_NAME = "CivicCare";
