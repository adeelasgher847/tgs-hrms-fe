import type { OnboardingTemplate, EmployeeOnboarding } from '../types/onboarding';

export const onboardingTemplatesMock: OnboardingTemplate[] = [
    {
        id: 'TPL-001',
        name: 'Standard IT Setup',
        description: 'Detailed process for IT infrastructure and hardware setup.',
        tasks: [
            { title: 'Hardware Provisioning', description: 'Request laptop (MacBook/ThinkPad) based on role requirements.' },
            { title: 'Email & Communication', description: 'Setup company email, Slack, and Zoom accounts.' },
            { title: 'VPN & Security', description: 'Install VPN, set up 2FA, and security software.' },
            { title: 'Development Environment', description: 'Install Docker, VS Code, and project dependencies.' }
        ],
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-01T10:00:00Z'
    },
    {
        id: 'TPL-002',
        name: 'HR Orientation & Legal',
        description: 'Essential HR tasks and legal documentation.',
        tasks: [
            { title: 'Contract Signing', description: 'Review and sign the employment agreement.' },
            { title: 'Benefits Enrollment', description: 'Select health insurance and retirement plans.' },
            { title: 'Policy Training', description: 'Complete anti-harassment and data privacy training.' },
            { title: 'ID Card & Bio-metrics', description: 'Get employee ID card and register bio-metrics for attendance.' }
        ],
        createdAt: '2025-01-10T10:00:00Z',
        updatedAt: '2025-01-10T10:00:00Z'
    },
    {
        id: 'TPL-003',
        name: 'Engineering Onboarding',
        description: 'Technical onboarding for software engineers.',
        tasks: [
            { title: 'Codebase Walkthrough', description: 'Meeting with lead developer for repository overview.' },
            { title: 'First PR', description: 'Complete a "Good First Issue" and submit a PR.' },
            { title: 'Architecture Deep-dive', description: 'Review system design and cloud infrastructure docs.' }
        ],
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z'
    }
];

export const activeOnboardingsMock: EmployeeOnboarding[] = [
    {
        id: 'ONB-001',
        employeeId: 'EMP-010',
        employeeName: 'Alice Johnson',
        templateId: 'TPL-001',
        status: 'In Progress',
        startDate: '2025-02-15T09:00:00Z',
        tasks: [
            { id: 'TSK-001', title: 'Hardware Provisioning', description: 'Request laptop based on role requirements.', status: 'Completed', assignedToId: 'EMP-001', assignedToName: 'John Admin', completedAt: '2025-02-15T11:00:00Z' },
            { id: 'TSK-002', title: 'Email & Communication', description: 'Setup company email and Slack.', status: 'In Progress', assignedToId: 'EMP-001', assignedToName: 'John Admin' },
            { id: 'TSK-003', title: 'VPN & Security', description: 'Install VPN and set up 2FA.', status: 'Pending', assignedToId: 'EMP-005', assignedToName: 'Security Team' },
            { id: 'TSK-004', title: 'Development Environment', description: 'Install Docker and VS Code.', status: 'Pending', assignedToId: 'EMP-010', assignedToName: 'Alice Johnson' }
        ],
        progress: 25
    },
    {
        id: 'ONB-002',
        employeeId: 'EMP-011',
        employeeName: 'Bob Smith',
        templateId: 'TPL-002',
        status: 'In Progress',
        startDate: '2025-02-20T10:00:00Z',
        tasks: [
            { id: 'TSK-005', title: 'Contract Signing', description: 'Review and sign the employment agreement.', status: 'Completed', assignedToId: 'EMP-002', assignedToName: 'Sarah HR', completedAt: '2025-02-20T14:00:00Z' },
            { id: 'TSK-006', title: 'Benefits Enrollment', description: 'Select health insurance.', status: 'Pending', assignedToId: 'EMP-011', assignedToName: 'Bob Smith' }
        ],
        progress: 50
    }
];
