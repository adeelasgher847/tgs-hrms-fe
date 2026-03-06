import type { Application, Candidate } from './candidate';

export type OnboardingTaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Skipped';

export interface OnboardingTask {
    id: string;
    title: string;
    description: string;
    assignedToId: string; // Employee ID responsible for completing the task
    assignedToName: string;
    dueDate?: string;
    status: OnboardingTaskStatus;
    completedAt?: string;
}

export interface OnboardingTemplate {
    id: string;
    name: string;
    description: string;
    tasks: Omit<OnboardingTask, 'id' | 'status' | 'assignedToId' | 'assignedToName'>[];
    createdAt: string;
    updatedAt: string;
}

export interface EmployeeOnboarding {
    id: string;
    employeeId: string;
    employeeName: string;
    templateId?: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
    startDate: string;
    completionDate?: string;
    tasks: OnboardingTask[];
    progress: number; // 0-100
}
