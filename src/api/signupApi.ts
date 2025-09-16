// src/api/signupApi.ts
import axiosInstance from "./axiosInstance";

export interface PersonalDetailsRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface PersonalDetailsResponse {
  signupSessionId: string;
}

export interface CompanyDetailsRequest {
  signupSessionId: string;
  companyName: string;
  companyType: string;
  companyAddress: string;
}

export interface CompanyDetailsResponse {
  message: string;
  status: string;
}

export interface PaymentRequest {
  signupSessionId: string;
  planId: string;
}

export interface PaymentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaymentConfirmRequest {
  signupSessionId: string;
  paymentIntentId: string;
}

export interface PaymentConfirmResponse {
  status: "succeeded" | "failed";
  transactionId: string;
}

export interface CompleteSignupRequest {
  signupSessionId: string;
  transactionId: string;
}

export interface CompleteSignupResponse {
  message: string;
  userId: string;
  plan: string;
  status: "active";
}

class SignupApiService {
  private baseUrl = "/signup";

  // Step 1: Personal Details
  async createPersonalDetails(data: PersonalDetailsRequest): Promise<PersonalDetailsResponse> {
    try {
      console.log("Sending personal details:", data);
      const response = await axiosInstance.post(`${this.baseUrl}/personal-details`, data);
      console.log("Personal details response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Personal details API Error:", error.response?.data || error.message);
      throw error;
    }
  }

  // Step 2: Company Details
  async createCompanyDetails(data: CompanyDetailsRequest): Promise<CompanyDetailsResponse> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/company-details`, data);
      return response.data;
    } catch (error: any) {
      console.error("Company details API Error:", error.response?.data || error.message);
      throw error;
    }
  }

  // Step 3: Create Payment Intent
  async createPayment(data: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/payment`, data);
      return response.data;
    } catch (error: any) {
      console.error("Payment API Error:", error.response?.data || error.message);
      throw error;
    }
  }

  // Step 4: Confirm Payment
  async confirmPayment(data: PaymentConfirmRequest): Promise<PaymentConfirmResponse> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/payment/confirm`, data);
      return response.data;
    } catch (error: any) {
      console.error("Payment confirm API Error:", error.response?.data || error.message);
      throw error;
    }
  }

  // Step 5: Complete Signup
  async completeSignup(data: CompleteSignupRequest): Promise<CompleteSignupResponse> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/complete`, data);
      return response.data;
    } catch (error: any) {
      console.error("Complete signup API Error:", error.response?.data || error.message);
      throw error;
    }
  }
}

const signupApi = new SignupApiService();
export default signupApi;