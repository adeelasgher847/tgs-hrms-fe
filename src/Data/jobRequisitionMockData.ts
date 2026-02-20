import type { JobRequisition, RequisitionStatus } from '../api/jobRequisitionApi';

export const jobRequisitionMockData: JobRequisition[] = [
  {
    id: 'REQ-001',
    jobTitle: 'Senior Software Engineer',
    department: {
      id: 'DEPT-001',
      name: 'Engineering',
    },
    reportingManager: {
      id: 'MGR-001',
      name: 'John Smith',
    },
    employmentType: 'Full-time',
    workLocation: 'Hybrid',
    numberOfOpenings: 2,
    budgetedSalaryMin: 80000,
    budgetedSalaryMax: 120000,
    jobDescription:
      'We are looking for an experienced Senior Software Engineer to join our Engineering team. The ideal candidate will have strong backend development skills and experience with cloud technologies.',
    responsibilities:
      'Design and develop scalable backend systems\nMentor junior developers\nParticipate in code reviews\nContribute to system architecture decisions',
    requiredSkills: 'Node.js, TypeScript, AWS, Docker, PostgreSQL, GraphQL',
    requiredExperience: '5+ years of software development experience with at least 2 years in senior roles',
    justificationForHire:
      'To accelerate our product development and handle increased workload from new enterprise clients.',
    status: 'Approved' as RequisitionStatus,
    createdBy: {
      id: 'USER-001',
      name: 'Sarah Johnson',
    },
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-02-08T14:20:00Z',
    approvalLogs: [
      {
        id: 'APL-001',
        level: 'Department Head',
        status: 'Approved',
        approverName: 'Michael Brown',
        approverId: 'MGR-001',
        approvedAt: '2025-01-20T11:15:00Z',
        comments: 'Approved - this hire aligns with Q1 objectives',
      },
      {
        id: 'APL-002',
        level: 'Finance',
        status: 'Approved',
        approverName: 'Emma Wilson',
        approverId: 'FIN-001',
        approvedAt: '2025-02-05T09:45:00Z',
        comments: 'Budget allocated',
      },
    ],
    tenantId: 'TENANT-001',
  },
  {
    id: 'REQ-002',
    jobTitle: 'Product Manager',
    department: {
      id: 'DEPT-002',
      name: 'Product',
    },
    reportingManager: {
      id: 'MGR-002',
      name: 'Lisa Anderson',
    },
    employmentType: 'Full-time',
    workLocation: 'Remote',
    numberOfOpenings: 1,
    budgetedSalaryMin: 100000,
    budgetedSalaryMax: 140000,
    jobDescription:
      'Seeking a strategic Product Manager to lead the development and launch of our new platform features. The role involves working with cross-functional teams and managing the product roadmap.',
    responsibilities:
      'Define product vision and strategy\nManage product roadmap and priorities\nWork with engineering and design teams\nAnalyze market trends and user feedback\nDrive product metrics and success',
    requiredSkills:
      'Product management, Analytics, Agile/Scrum, Data-driven decision making, Stakeholder management',
    requiredExperience:
      '4+ years of product management experience in SaaS or tech companies',
    justificationForHire:
      'Need dedicated leadership for new platform initiatives and improvement of existing product lines.',
    status: 'Pending approval' as RequisitionStatus,
    createdBy: {
      id: 'USER-002',
      name: 'David Chen',
    },
    createdAt: '2025-02-01T08:00:00Z',
    updatedAt: '2025-02-08T12:00:00Z',
    approvalLogs: [
      {
        id: 'APL-003',
        level: 'Department Head',
        status: 'Approved',
        approverName: 'Lisa Anderson',
        approverId: 'MGR-002',
        approvedAt: '2025-02-02T10:30:00Z',
        comments: 'Approved - critical for Q2 roadmap',
      },
      {
        id: 'APL-004',
        level: 'Finance',
        status: 'Pending',
        approverName: 'Emma Wilson',
        approverId: 'FIN-001',
      },
    ],
    tenantId: 'TENANT-001',
  },
  {
    id: 'REQ-003',
    jobTitle: 'UX/UI Designer',
    department: {
      id: 'DEPT-003',
      name: 'Design',
    },
    reportingManager: {
      id: 'MGR-003',
      name: 'Alex Turner',
    },
    employmentType: 'Full-time',
    workLocation: 'Onsite',
    numberOfOpenings: 1,
    budgetedSalaryMin: 70000,
    budgetedSalaryMax: 95000,
    jobDescription:
      'Join our Design team to create beautiful and intuitive user interfaces for our web and mobile applications. You will collaborate with product managers and engineers to deliver exceptional user experiences.',
    responsibilities:
      'Design user interfaces and interactions\nConduct user research and testing\nCreate wireframes and prototypes\nMaintain design consistency\nCollaborate with engineering teams',
    requiredSkills:
      'Figma, Adobe XD, Prototyping, User Research, Visual Design, Accessibility',
    requiredExperience:
      '3+ years of UX/UI design experience with a strong portfolio',
    justificationForHire:
      'Current design team is at capacity. New hire will support multiple product lines.',
    status: 'Draft' as RequisitionStatus,
    createdBy: {
      id: 'USER-003',
      name: 'Rachel Green',
    },
    createdAt: '2025-02-05T14:30:00Z',
    updatedAt: '2025-02-08T16:45:00Z',
    approvalLogs: [],
    tenantId: 'TENANT-001',
  },
  {
    id: 'REQ-004',
    jobTitle: 'DevOps Engineer',
    department: {
      id: 'DEPT-001',
      name: 'Engineering',
    },
    reportingManager: {
      id: 'MGR-001',
      name: 'John Smith',
    },
    employmentType: 'Full-time',
    workLocation: 'Hybrid',
    numberOfOpenings: 1,
    budgetedSalaryMin: 75000,
    budgetedSalaryMax: 110000,
    jobDescription:
      'We are hiring a DevOps Engineer to manage and optimize our cloud infrastructure. You will work on CI/CD pipelines, infrastructure as code, and system reliability.',
    responsibilities:
      'Manage AWS and cloud infrastructure\nImplement CI/CD pipelines\nMonitor system performance\nHandle incident response\nOptimize infrastructure costs',
    requiredSkills: 'AWS, Kubernetes, Docker, Terraform, Jenkins, Linux',
    requiredExperience:
      '3+ years of DevOps experience with cloud platforms',
    justificationForHire:
      'Need additional capacity to handle production deployments and infrastructure scaling.',
    status: 'Approved' as RequisitionStatus,
    createdBy: {
      id: 'USER-001',
      name: 'Sarah Johnson',
    },
    createdAt: '2025-01-20T11:00:00Z',
    updatedAt: '2025-02-08T13:30:00Z',
    approvalLogs: [
      {
        id: 'APL-005',
        level: 'Department Head',
        status: 'Approved',
        approverName: 'Michael Brown',
        approverId: 'MGR-001',
        approvedAt: '2025-01-25T09:00:00Z',
        comments: 'Approved',
      },
      {
        id: 'APL-006',
        level: 'Finance',
        status: 'Approved',
        approverName: 'Emma Wilson',
        approverId: 'FIN-001',
        approvedAt: '2025-02-01T10:00:00Z',
      },
      {
        id: 'APL-007',
        level: 'HR',
        status: 'Approved',
        approverName: 'Robert Martinez',
        approverId: 'HR-001',
        approvedAt: '2025-02-05T14:00:00Z',
        comments: 'All approvals complete',
      },
    ],
    tenantId: 'TENANT-001',
  },
  {
    id: 'REQ-005',
    jobTitle: 'Business Analyst',
    department: {
      id: 'DEPT-004',
      name: 'Operations',
    },
    reportingManager: {
      id: 'MGR-004',
      name: 'Patricia Davis',
    },
    employmentType: 'Full-time',
    workLocation: 'Remote',
    numberOfOpenings: 2,
    budgetedSalaryMin: 65000,
    budgetedSalaryMax: 85000,
    jobDescription:
      'Looking for Business Analysts to support our operations team in process improvement and system optimization initiatives.',
    responsibilities:
      'Analyze business processes\nGather requirements from stakeholders\nCreate process documentation\nIdentify improvement opportunities\nSupport system implementations',
    requiredSkills:
      'Process mapping, Requirements gathering, SQL, Data analysis, Business process management',
    requiredExperience:
      '2+ years of business analysis experience in enterprise environments',
    justificationForHire:
      'Expansion of operations team to support new enterprise clients and process optimization initiatives.',
    status: 'Rejected' as RequisitionStatus,
    createdBy: {
      id: 'USER-004',
      name: 'Thomas Wright',
    },
    createdAt: '2025-01-30T09:30:00Z',
    updatedAt: '2025-02-08T15:00:00Z',
    approvalLogs: [
      {
        id: 'APL-008',
        level: 'Department Head',
        status: 'Approved',
        approverName: 'Patricia Davis',
        approverId: 'MGR-004',
        approvedAt: '2025-02-01T08:00:00Z',
      },
      {
        id: 'APL-009',
        level: 'Finance',
        status: 'Rejected',
        approverName: 'Emma Wilson',
        approverId: 'FIN-001',
        rejectionReason: 'Budget constraints in Q2',
        comments: 'Cannot approve at this time due to budget limitations',
      },
    ],
    tenantId: 'TENANT-001',
  },
];
