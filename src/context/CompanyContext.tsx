import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import companyApi, { type CompanyDetails } from '../api/companyApi';
import { useUser } from '../hooks/useUser';

interface CompanyContextType {
  companyDetails: CompanyDetails | null;
  companyName: string;
  companyLogo: string | null;
  loading: boolean;
  error: string | null;
  refreshCompanyDetails: () => Promise<void>;
  updateCompanyDetails: (details: CompanyDetails) => void;
}

export const CompanyContext = createContext<CompanyContextType | undefined>(
  undefined
);

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCompanyDetails = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!user || !user.tenant) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const details = await companyApi.getCompanyDetails();
      setCompanyDetails(details);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch company details');
      console.error('Error fetching company details:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateCompanyDetails = useCallback((details: CompanyDetails) => {
    setCompanyDetails(details);
  }, []);

  // Load company details on mount only if user is authenticated
  useEffect(() => {
    if (user && user.tenant) {
      refreshCompanyDetails();
    }
  }, [refreshCompanyDetails, user]);

  const companyName = useMemo(() => {
    return companyDetails?.company_name || 'HRMS';
  }, [companyDetails]);

  const companyLogo = useMemo(() => {
    if (!companyDetails?.logo_url) return null;
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/public${companyDetails.logo_url}`;
  }, [companyDetails]);

  const contextValue: CompanyContextType = useMemo(
    () => ({
      companyDetails,
      companyName,
      companyLogo,
      loading,
      error,
      refreshCompanyDetails,
      updateCompanyDetails,
    }),
    [
      companyDetails,
      companyName,
      companyLogo,
      loading,
      error,
      refreshCompanyDetails,
      updateCompanyDetails,
    ]
  );

  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  );
};

// Custom hook to use the company context
export const useCompany = (): CompanyContextType => {
  const context = React.useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
};
