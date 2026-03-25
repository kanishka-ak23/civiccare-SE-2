
export enum IssueStatus {
  PENDING = 'PENDING',
  INVESTIGATING = 'INVESTIGATING', // Admin Reviewed
  IN_PROGRESS = 'IN_PROGRESS',    // Department Assigned & Working
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  DISMISSED = 'DISMISSED'
}

export enum IssueCategory {
  DRAINAGE = 'Drainage',
  POTHOLES = 'Potholes',
  STREETLIGHTS = 'Streetlights',
  WASTE = 'Waste/Dustbins',
  WATER_LEAK = 'Water Leakage',
  OTHER = 'Other'
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  isSensitive?: boolean;
}

export interface Feedback {
  rating: number;
  comment: string;
  timestamp: string;
}

export interface CivicIssue {
  id: string;
  citizenName: string;
  category: IssueCategory;
  description: string;
  image?: string;
  location: Location;
  status: IssueStatus;
  priorityScore: number;
  priorityReasoning: string;
  createdAt: string;
  updatedAt: string;
  assignedDepartment?: string;
  adminNotes?: string;
  dismissalReason?: string;
  feedback?: Feedback;
}

export type UserRole = 'CITIZEN' | 'ADMIN';
