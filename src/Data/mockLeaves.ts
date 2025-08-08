import type { Leave } from "../type/levetypes";

export const mockLeaves: Leave[] = [
  {
    id: 1,
    name: "John Doe",
    from: "2025-08-05",
    to: "2025-08-07",
    reason: "Fever",
    type: "Sick",
    status: "Pending",
  },
  {
    id: 2,
    name: "Jane Smith",
    from: "2025-08-10",
    to: "2025-08-12",
    reason: "Personal",
    type: "Casual",
    status: "Approved",
  },
];
