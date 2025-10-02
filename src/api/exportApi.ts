import axiosInstance from './axiosInstance';

export const exportCSV = async (endpoint: string, filename: string, token?: string, params?: Record<string, any>) => {
  try {
    const response = await axiosInstance.get(endpoint, {
      params,
      responseType: 'blob',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Export failed:', error);
  }
};
