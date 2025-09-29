import axiosInstance from './axiosInstance';

export const refreshInviteStatus = async (id: string): Promise<string> => {
  const response = await axiosInstance.post(`/employees/${id}/refresh-invite-status`);
  return response.data.message;
};
