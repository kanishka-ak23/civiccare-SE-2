import { CivicIssue } from '../types';

export const api = {
    login: async (email: string, role: 'CITIZEN' | 'ADMIN') => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Login failed');
        }
        return res.json();
    },

    signup: async (name: string, email: string, role: 'CITIZEN' | 'ADMIN') => {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, role })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Signup failed');
        }
        return res.json();
    },

    getIssues: async (role: 'CITIZEN' | 'ADMIN', userId?: string): Promise<CivicIssue[]> => {
        const url = `/api/issues?role=${role}${userId ? `&userId=${userId}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch issues');
        return res.json();
    },

    createIssue: async (data: Partial<CivicIssue>): Promise<CivicIssue> => {
        const res = await fetch('/api/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create issue');
        return res.json();
    },

    updateIssue: async (id: string, data: Partial<CivicIssue>): Promise<CivicIssue> => {
        const res = await fetch(`/api/issues/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update issue');
        return res.json();
    },

    deleteIssue: async (id: string): Promise<void> => {
        const res = await fetch(`/api/issues/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete issue');
    }
};
