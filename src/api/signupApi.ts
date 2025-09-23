// src/api/signupApi.ts
import axiosInstance from './axiosInstance';

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

export interface SubscriptionPlan {
  id: string;
  name: string;
  stripePriceId: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface StripePriceInfo {
  priceId: string;
  currency: string; // e.g. "usd"
  unit_amount: number; // in minor units, e.g. cents
  interval?: 'day' | 'week' | 'month' | 'year';
}

export interface CompanyDetailsRequest {
  signupSessionId: string;
  companyName: string;
  domain: string;
  planId: string;
}

export interface CompanyDetailsResponse {
  message: string;
  status: string;
}

export interface PaymentRequest {
  signupSessionId: string;
  mode: 'checkout'; // Add mode field
}

export interface PaymentResponse {
  checkoutSessionId?: string;
  url?: string;
  subscriptionId?: string;
  status?: string;
}

// Accept either checkout session id (Stripe Checkout) or payment intent id (alt flows)
export interface PaymentConfirmRequest {
  signupSessionId: string;
  checkoutSessionId?: string;
  paymentIntentId?: string;
}

export interface PaymentConfirmResponse {
  status: 'succeeded' | 'failed';
  transactionId: string;
}

export interface CompleteSignupRequest {
  signupSessionId: string;
}

export interface CompleteSignupResponse {
  message: string;
  userId: string;
  plan: string;
  status: 'active';
}

class SignupApiService {
  private baseUrl = '/signup';

  // Step 1: Personal Details
  async createPersonalDetails(
    data: PersonalDetailsRequest
  ): Promise<PersonalDetailsResponse> {
    try {
      const response = await axiosInstance.post(
        `${this.baseUrl}/personal-details`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Get Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await axiosInstance.get('/subscription-plans');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Get Stripe prices for a list of price IDs (server must proxy this)
  async getStripePrices(priceIds: string[]): Promise<StripePriceInfo[]> {
    try {
      // Try the new endpoint first
      const params = new URLSearchParams();
      params.set('ids', priceIds.join(','));
      const response = await axiosInstance.get(
        `/subscription-plans/prices?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Get prices by plan IDs (backend supports this)
  async getStripePricesByPlanIds(
    planIds: string[]
  ): Promise<StripePriceInfo[]> {
    try {
      const params = new URLSearchParams();
      params.set('planIds', planIds.join(','));
      const response = await axiosInstance.get(
        `/subscription-plans/prices-by-plans?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        'Stripe prices by plan IDs API Error:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Step 2: Company Details
  async createCompanyDetails(
    data: CompanyDetailsRequest
  ): Promise<CompanyDetailsResponse> {
    try {
      const response = await axiosInstance.post(
        `${this.baseUrl}/company-details`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Step 3: Create Payment Intent
  async createPayment(data: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await axiosInstance.post(
        `${this.baseUrl}/payment`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Step 4: Confirm Payment
  async confirmPayment(
    data: PaymentConfirmRequest
  ): Promise<PaymentConfirmResponse> {
    try {
      const response = await axiosInstance.post(
        `${this.baseUrl}/payment/confirm`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Step 5: Complete Signup
  async completeSignup(
    data: CompleteSignupRequest
  ): Promise<CompleteSignupResponse> {
    try {
      const response = await axiosInstance.post(
        `${this.baseUrl}/complete`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}

const signupApi = new SignupApiService();
export default signupApi;
