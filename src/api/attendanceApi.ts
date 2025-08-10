import axiosInstance from "../api/axiosInstance";

const BASE_URL = "/attendance";

export const getAttendance = async (userId?: string) => {
  const url = userId ? `${BASE_URL}?userId=${userId}` : BASE_URL;
  const res = await axiosInstance.get(url);
  return res.data;
};

export const getAllAttendance = async () => {
  const res = await axiosInstance.get(`${BASE_URL}/all`);
  return res.data;
};

export const createAttendance = async (attendance: {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}) => {
  const res = await axiosInstance.post(BASE_URL, attendance);
  return res.data;
};
