import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { type CompanyDetails } from '../api/companyApi';

interface CompanyContextType {
  companyDetails: CompanyDetails | null;
  companyName: string;
  companyLogo: string | null;
  setCompanyDetails: (details: CompanyDetails | null) => void;
  setCompanyLogo: (logoUrl: string | null) => void;
  clearCompanyData: () => void;
}

export const CompanyContext = createContext<CompanyContextType | undefined>(
  undefined
);

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(
    null
  );
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  const clearCompanyData = useCallback(() => {
    setCompanyDetails(null);
    setCompanyLogo(null);
  }, []);

  const companyName = useMemo(
    () => companyDetails?.company_name || 'HRMS',
    [companyDetails]
  );

  const contextValue = useMemo(
    () => ({
      companyDetails,
      companyName,
      companyLogo,
      setCompanyDetails,
      setCompanyLogo,
      clearCompanyData,
    }),
    [
      companyDetails,
      companyName,
      companyLogo,
      setCompanyDetails,
      setCompanyLogo,
      clearCompanyData,
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
