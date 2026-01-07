import axiosInstance from './axiosInstance';

export interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  module: string;
  metadata: Record<string, unknown>;
}

export interface SearchResponse {
  query: string;
  totalResults: number;
  results: {
    employees?: SearchResultItem[];
    leaves?: SearchResultItem[];
    assets?: SearchResultItem[];
    assetRequests?: SearchResultItem[];
    teams?: SearchResultItem[];
    attendance?: SearchResultItem[];
    benefits?: SearchResultItem[];
    payroll?: SearchResultItem[];
  };
  counts: {
    employees?: number;
    leaves?: number;
    assets?: number;
    assetRequests?: number;
    teams?: number;
    attendance?: number;
    benefits?: number;
    payroll?: number;
  };
}

export interface SearchParams {
  query?: string;
  module?: string;
  limit?: number;
  tenantId?: string;
}

class SearchApiService {
  private baseUrl = '/search';

  async search(params: SearchParams = {}): Promise<SearchResponse> {
    const queryParams: Record<string, string | number> = {};

    if (params.query && params.query.trim().length >= 2) {
      queryParams.query = params.query.trim();
    }

    if (params.module) {
      queryParams.module = params.module;
    }

    if (params.limit) {
      queryParams.limit = params.limit;
    }

    if (params.tenantId) {
      queryParams.tenantId = params.tenantId;
    }

    const response = await axiosInstance.get<SearchResponse>(this.baseUrl, {
      params: queryParams,
    });

    return response.data;
  }

  async searchNetworkAdmin(params: SearchParams = {}): Promise<SearchResponse> {
    const queryParams: Record<string, string | number> = {};

    if (params.query && params.query.trim().length >= 2) {
      queryParams.query = params.query.trim();
    }

    if (params.module) {
      queryParams.module = params.module;
    }

    if (params.limit) {
      queryParams.limit = params.limit;
    }

    if (params.tenantId) {
      queryParams.tenantId = params.tenantId;
    }

    const response = await axiosInstance.get<SearchResponse>(
      `${this.baseUrl}/network-admin`,
      {
        params: queryParams,
      }
    );

    return response.data;
  }

  async searchSystemAdmin(params: SearchParams = {}): Promise<SearchResponse> {
    const queryParams: Record<string, string | number> = {};

    if (params.query && params.query.trim().length >= 2) {
      queryParams.query = params.query.trim();
    }

    if (params.module) {
      queryParams.module = params.module;
    }

    if (params.limit) {
      queryParams.limit = params.limit;
    }

    if (params.tenantId) {
      queryParams.tenantId = params.tenantId;
    }

    const response = await axiosInstance.get<SearchResponse>(
      `${this.baseUrl}/system-admin`,
      {
        params: queryParams,
      }
    );

    return response.data;
  }

  async searchAdmin(params: SearchParams = {}): Promise<SearchResponse> {
    const queryParams: Record<string, string | number> = {};

    if (params.query && params.query.trim().length >= 2) {
      queryParams.query = params.query.trim();
    }

    if (params.module) {
      queryParams.module = params.module;
    }

    if (params.limit) {
      queryParams.limit = params.limit;
    }

    const response = await axiosInstance.get<SearchResponse>(
      `${this.baseUrl}/admin`,
      {
        params: queryParams,
      }
    );

    return response.data;
  }

  async searchHrAdmin(params: SearchParams = {}): Promise<SearchResponse> {
    const queryParams: Record<string, string | number> = {};

    if (params.query && params.query.trim().length >= 2) {
      queryParams.query = params.query.trim();
    }

    if (params.module) {
      queryParams.module = params.module;
    }

    if (params.limit) {
      queryParams.limit = params.limit;
    }

    const response = await axiosInstance.get<SearchResponse>(
      `${this.baseUrl}/hr-admin`,
      {
        params: queryParams,
      }
    );

    return response.data;
  }

  async searchEmployee(params: SearchParams = {}): Promise<SearchResponse> {
    const queryParams: Record<string, string | number> = {};

    if (params.query && params.query.trim().length >= 2) {
      queryParams.query = params.query.trim();
    }

    if (params.module) {
      queryParams.module = params.module;
    }

    if (params.limit) {
      queryParams.limit = params.limit;
    }

    const response = await axiosInstance.get<SearchResponse>(
      `${this.baseUrl}/employee`,
      {
        params: queryParams,
      }
    );

    return response.data;
  }

  async searchManager(params: SearchParams = {}): Promise<SearchResponse> {
    const queryParams: Record<string, string | number> = {};

    if (params.query && params.query.trim().length >= 2) {
      queryParams.query = params.query.trim();
    }

    if (params.module) {
      queryParams.module = params.module;
    }

    if (params.limit) {
      queryParams.limit = params.limit;
    }

    const response = await axiosInstance.get<SearchResponse>(
      `${this.baseUrl}/manager`,
      {
        params: queryParams,
      }
    );

    return response.data;
  }
}

export const searchApiService = new SearchApiService();

