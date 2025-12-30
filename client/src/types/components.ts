// component-level shared types (placeholder)
export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}
export interface Pagination {
  totalPages: number;
  currentPage?: number;
  total?: number;
}
