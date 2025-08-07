// src/Data/userMock.ts
export const departments = ["HR", "Engineering", "Marketing"];

export const designations: { [key: string]: string[] } = {
  HR: ["HR Manager", "Recruiter"],
  Engineering: ["Frontend Developer", "Backend Developer"],
  Marketing: ["SEO Specialist", "Content Writer"],
};

export const users = [
  {
    id: 1,
    name: "Ali Khan",
    email: "ali@example.com",
    role: "Admin",
    department: "HR",
    designation: "HR Manager",
  },
  {
    id: 2,
    name: "Sara Ahmad",
    email: "sara@example.com",
    role: "User",
    department: "Marketing",
    designation: "Frontend Developer",
  },
  {
    id: 3,
    name: "Ahmad",
    email: "sara@example.com",
    role: "User",
    department: "Marketing",
    designation: "Frontend Developer",
  },
  {
    id: 4,
    name: "Sara",
    email: "sara@example.com",
    role: "User",
    department: "Engineering",
    designation: "Frontend Developer",
  },
  {
    id: 5,
    name: "Ali",
    email: "sara@example.com",
    role: "User",
    department: "Engineering",
    designation: "backend Developer",
  },
  {
    id: 6,
    name: "hussain",
    email: "sara@example.com",
    role: "User",
    department: "Engineering",
    designation: "Backend Developer",
  },
  {
    id: 7,
    name: "jan",
    email: "sara@example.com",
    role: "User",
    department: "Engineering",
    designation: "Backend Developer",
  },
];
