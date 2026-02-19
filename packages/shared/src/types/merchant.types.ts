export interface Merchant {
  id: string;
  name: string;
  email: string;
  webhookUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyPayload {
  merchantId: string;
  keyPrefix: string;
}
