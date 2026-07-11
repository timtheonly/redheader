export type HeaderOperation = "set" | "remove";

export interface HeaderRule {
  id: number;
  enabled: boolean;
  urlFilter: string;
  operation: HeaderOperation;
  headerName: string;
  /** Ignored when operation is "remove". */
  headerValue: string;
}

export interface StorageShape {
  rules: HeaderRule[];
}
