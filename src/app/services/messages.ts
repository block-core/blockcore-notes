export interface WorkerRequest {}

export interface WorkerResponse {}

export interface RelayRequest extends WorkerRequest {
  type: string;
  data?: any;
}

export interface RelayResponse extends WorkerResponse {
  type: string;
  url: string;
  data?: any;
  subscription: string;
}
