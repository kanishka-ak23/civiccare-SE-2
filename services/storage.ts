
import { CivicIssue } from '../types';

const STORAGE_KEY = 'civic_care_issues';

export const storage = {
  getIssues: (): CivicIssue[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  saveIssue: (issue: CivicIssue): void => {
    const issues = storage.getIssues();
    const existingIndex = issues.findIndex(i => i.id === issue.id);
    if (existingIndex > -1) {
      issues[existingIndex] = issue;
    } else {
      issues.push(issue);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  },
  
  getIssueById: (id: string): CivicIssue | undefined => {
    return storage.getIssues().find(i => i.id === id);
  },

  deleteIssue: (id: string): void => {
    const issues = storage.getIssues().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  }
};
