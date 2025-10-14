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
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCompanyDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const details = await companyApi.getCompanyDetails();
      console.log("Company details:", details)
      setCompanyDetails(details);

      const tenantId = details.tenant_id;
      if (!tenantId) {
        console.warn('tenant_id not found in company details');
        return;
      }

      const logoUrl = await companyApi.getCompanyLogo(tenantId);

      setCompanyLogo(logoUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch company details');
      console.error('Error fetching company details:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCompanyDetails = useCallback((details: CompanyDetails) => {
    setCompanyDetails(details);
  }, []);

  useEffect(() => {
    refreshCompanyDetails();
  }, [refreshCompanyDetails]);

  const companyName = useMemo(
    () => companyDetails?.company_name || 'HRMS',
    [companyDetails]
  );

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

export const useCompany = (): CompanyContextType => {
  const context = React.useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
};
