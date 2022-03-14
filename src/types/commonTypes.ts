export interface ListResponse<T> {
  data: T[];
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
}
