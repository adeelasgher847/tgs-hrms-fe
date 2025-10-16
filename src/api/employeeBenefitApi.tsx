import axiosInstance from './axiosInstance';

const employeeBenefitApi = {
  async assignBenefit(data: {
    employeeId: string;
    benefitId: string;
    startDate: string;
    endDate?: string;
    status: string;
  }) {
    const response = await axiosInstance.post('/employee-benefits', data);
    return response.data;
  },

  async getEmployeeBenefits(employeeId: string) {
    const response = await axiosInstance.get(
      `/employee-benefits/${employeeId}`
    );
    return response.data;
  },
};

export default employeeBenefitApi;
