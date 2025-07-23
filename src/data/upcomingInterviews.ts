import type { Interview } from "../types/interview";

export const upcomingInterviews: Record<"en" | "ar", Interview[]> = {
  en: [
    {
      name: "Rachel Parr",
      role: "UI/UX Designer",
      time: "09:00 am",
      avatarUrl: "https://i.pravatar.cc/150?img=5",
    },
    {
      name: "Paul Rees",
      role: "Frontend Developer",
      time: "10:30 am",
      avatarUrl: "https://i.pravatar.cc/150?img=6",
    },
    {
      name: "Luke Short",
      role: "Backend Developer",
      time: "11:45 am",
      avatarUrl: "https://i.pravatar.cc/150?img=7",
    },
    {
      name: "Paul JS",
      role: "Frontend Developer",
      time: "10:30 am",
      avatarUrl: "https://i.pravatar.cc/150?img=6",
    },
    {
      name: "Roman",
      role: "React Developer",
      time: "11:43 am",
      avatarUrl: "https://i.pravatar.cc/150?img=7",
    },
  ],
  ar: [
    {
      name: "راشيل بار",
      role: "مصمم",
      time: "09:00 ص",
      avatarUrl: "https://i.pravatar.cc/150?img=5",
    },
    {
      name: "بول ريس",
      role: "مطور الواجهة الأمامية",
      time: "10:30 ص",
      avatarUrl: "https://i.pravatar.cc/150?img=6",
    },
    {
      name: "لوك شورت",
      role: "مطور ",
      time: "11:45 ص",
      avatarUrl: "https://i.pravatar.cc/150?img=7",
    },
    {
      name: "بول جي إس",
      role: "مطور الواجهة الأمامية",
      time: "10:30 ص",
      avatarUrl: "https://i.pravatar.cc/150?img=6",
    },
    {
      name: "رومان",
      role: "مطور",
      time: "11:43 ص",
      avatarUrl: "https://i.pravatar.cc/150?img=7",
    },
  ],
};
