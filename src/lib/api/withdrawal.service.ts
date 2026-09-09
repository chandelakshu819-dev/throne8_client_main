// lib/api/withdrawal.service.ts
import apiInstance from "./api.intance"; // your existing axios instance

export interface WithdrawalMethod {
  _id: string;
  mentorId: string;
  type: "bank" | "upi";
  // Bank
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountType?: "savings" | "current";
  // UPI
  upiId?: string;
  upiName?: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

export type AddBankPayload = {
  type: "bank";
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: "savings" | "current";
  isDefault?: boolean;
};

export type AddUpiPayload = {
  type: "upi";
  upiId: string;
  upiName: string;
  isDefault?: boolean;
};

const WithdrawalService = {
  getMethods: (mentorId: string) =>
    apiInstance.get(`/mentorship/withdrawal/${mentorId}`),

  addMethod: (mentorId: string, payload: AddBankPayload | AddUpiPayload) =>
    apiInstance.post(`/mentorship/withdrawal/${mentorId}`, payload),

  setDefault: (mentorId: string, methodId: string) =>
    apiInstance.patch(`/mentorship/withdrawal/${mentorId}/${methodId}/default`),

  deleteMethod: (mentorId: string, methodId: string) =>
    apiInstance.delete(`/mentorship/withdrawal/${mentorId}/${methodId}`),
};

export default WithdrawalService;