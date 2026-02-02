export interface ValidationError {
  field: string;
  message: string;
  rejectedValue?: unknown;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  code?: string;
  message: string;
  path: string;
  validationErrors?: ValidationError[];
}
