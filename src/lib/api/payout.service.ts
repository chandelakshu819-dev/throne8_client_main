import api from "./api.intance";

export type PayoutStatus = "held" | "released" | "paid";

export interface PayoutMethod {
  type: "bank" | "upi";
  upiId?: string;
  upiName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
}

export interface AdminPayoutRow {
  paymentId: string;
  mentorId: string;
  mentorName: string;
  menteeId: string;
  sessionId?: string;
  title?: string;
  scheduledAt?: string;
 bookingStatus?: string;
  paidAt?: string;
  totalPaid: number;
  mentorAmount: number;
  platformAmount: number;
  payoutStatus: PayoutStatus;
  releasedAt?: string;
  payoutPaidAt?: string;
  reference?: string;
  payoutMethod: PayoutMethod | null;

}

export interface MentorPayoutItem {
  paymentId: string;
  bookingId?: string;
  sessionId?: string;
  title?: string;
  totalPaid: number;
  mentorAmount: number;
  platformAmount: number;
  payoutStatus: PayoutStatus;
  releasedAt?: string;
  payoutPaidAt?: string;
  reference?: string;
}

export interface MentorPayoutOverview {
  summary: { pending: number; available: number; paid: number; currency: string };
  items: MentorPayoutItem[];
}

export type RefundStatus = "pending" | "refunded";

export interface AdminRefundRow {
  bookingId: string;
  sessionId: string;
  title?: string;
  scheduledAt?: string;
  mentorName: string;
  menteeName?: string;
  amount: number;
  status: RefundStatus;
  refundMode?: "gateway" | "manual";
  requestedAt?: string;
  refundedAt?: string;
  reference?: string;
  details: { email?: string; phone?: string; upiId?: string; note?: string };
}

const errMsg = (e: any, fallback: string) =>
  e?.response?.data?.message || e?.message || fallback;

class PayoutService {
  static async adminList(
    status: PayoutStatus,
    page = 1,
    limit = 20
  ): Promise<{ rows: AdminPayoutRow[]; total: number }> {
    try {
      const { data } = await api.get("/mentorship/admin/payouts", { params: { status, page, limit } });
      return {
        rows: Array.isArray(data?.data) ? data.data : [],
        total: data?.meta?.total ?? data?.pagination?.total ?? (data?.data?.length || 0),
      };
    } catch (e) {
      throw new Error(errMsg(e, "Failed to load payouts."));
    }
  }

  static async release(paymentId: string): Promise<void> {
    try {
      await api.post(`/mentorship/admin/payouts/${paymentId}/release`);
    } catch (e) {
      throw new Error(errMsg(e, "Failed to release payout."));
    }
  }

  static async markPaid(paymentId: string, reference: string): Promise<void> {
    try {
      await api.post(`/mentorship/admin/payouts/${paymentId}/mark-paid`, { reference });
    } catch (e) {
      throw new Error(errMsg(e, "Failed to mark payout as paid."));
    }
  }

  static async adminListRefunds(
    status: RefundStatus,
    page = 1,
    limit = 20
  ): Promise<{ rows: AdminRefundRow[]; total: number }> {
    try {
      const { data } = await api.get("/mentorship/admin/refunds", { params: { status, page, limit } });
      return {
        rows: Array.isArray(data?.data) ? data.data : [],
        total: data?.meta?.total ?? data?.pagination?.total ?? (data?.data?.length || 0),
      };
    } catch (e) {
      throw new Error(errMsg(e, "Failed to load refunds."));
    }
  }


  static async payRefund(bookingId: string): Promise<{ payoutId: string; utr?: string; status: string }> {
    try {
      const { data } = await api.post(`/mentorship/admin/refunds/${bookingId}/pay`);
      return data?.data ?? data;
    } catch (e) {
      throw new Error(errMsg(e, "Failed to send refund."));
    }
  }

  static async markRefunded(bookingId: string, reference: string): Promise<void> {
    try {
      await api.post(`/mentorship/admin/refunds/${bookingId}/mark-refunded`, { reference });
    } catch (e) {
      throw new Error(errMsg(e, "Failed to mark refund as paid."));
    }
  }

  static async getMentorOverview(mentorId: string): Promise<MentorPayoutOverview> {
    try {
      const { data } = await api.get(`/mentorship/payouts/mentor/${mentorId}`);
      return (data?.data ?? data) as MentorPayoutOverview;
    } catch (e) {
      throw new Error(errMsg(e, "Failed to load earnings."));
    }
  }
}

export default PayoutService;