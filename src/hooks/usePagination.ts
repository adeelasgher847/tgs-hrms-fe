import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  initialRowsPerPage?: number;
}

interface UsePaginationReturn<T> {
  paginatedData: T[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  handlePageChange: (event: unknown, newPage: number) => void;
  handleRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const usePagination = <T>({
  data,
  initialRowsPerPage = 10,
}: UsePaginationProps<T>): UsePaginationReturn<T> => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, page, rowsPerPage]);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page when changing rows per page
  };

  return {
    paginatedData,
    page,
    rowsPerPage,
    totalCount: data.length,
    handlePageChange,
    handleRowsPerPageChange,
  };
};
