import api from "./api.intance";

declare global {
    interface Window {
        Razorpay?: any;
    }
}

const PAYMENTS_BASE = "/mentorship/payments";
const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export class PaymentCancelledError extends Error {
    constructor(message = "Payment was cancelled.") {
        super(message);
        this.name = "PaymentCancelledError";
        Object.setPrototypeOf(this, PaymentCancelledError.prototype);
    }
}

interface ApiResponse<T> {
    status: string;
    message: string;
    data: T;
}

export interface PaymentOrder {
    paymentId: string;
    orderId: string;
    amount: number; // paise
    currency: string;
    keyId: string;
    pricing: {
        basePrice: number;
        platformFee: number;
        gst: number;
        totalAmount: number;
        currency: string;
    };
    description: string;
}

export interface SessionOrderInput {
    sessionId: string;
    mentorId: string;
    availabilityId: string;
    slotTime: string;
    scheduledAt: string;
    timezone: string;
}

export interface PackageOrderInput {
    packageType: "starter" | "professional" | "premium";
    mentorId?: string;
}

export interface RazorpayCheckoutResult {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface VerifyPaymentInput {
    paymentId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}

export interface PaymentFulfillment {
    paymentId: string;
    purpose: "session_booking" | "package";
    status: "fulfilled" | "processing";
    sessionId?: string;
    bookingId?: string;
    packageId?: string;
}

export interface PaymentStatusResponse {
    paymentId: string;
    purpose: string;
    paymentStatus: string;
    fulfillmentStatus?: string;
    sessionId?: string;
    bookingId?: string;
    packageId?: string;
    error?: string;
}

export interface CheckoutOptions {
    name?: string;
    description?: string;
    themeColor?: string;
    prefill?: { name?: string; email?: string; contact?: string };
}

const messageFrom = (error: any, fallback: string): string =>
    error?.response?.data?.message || error?.message || fallback;

class PaymentService {
    static loadCheckoutScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof window === "undefined") {
                reject(new Error("Payment can only be started in the browser."));
                return;
            }
            if (window.Razorpay) {
                resolve();
                return;
            }
            const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
            if (existing) {
                existing.addEventListener("load", () => resolve());
                existing.addEventListener("error", () => reject(new Error("Could not load payment window.")));
                return;
            }
            const script = document.createElement("script");
            script.src = CHECKOUT_SRC;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Could not load payment window. Check your internet connection."));
            document.body.appendChild(script);
        });
    }

    static async createSessionOrder(input: SessionOrderInput): Promise<PaymentOrder> {
        try {
            const { data } = await api.post<ApiResponse<PaymentOrder>>(`${PAYMENTS_BASE}/session/order`, input);
            return data.data;
        } catch (error: any) {
            throw new Error(messageFrom(error, "Unable to start payment. Please try again."));
        }
    }

    static async createPackageOrder(input: PackageOrderInput): Promise<PaymentOrder> {
        try {
            const { data } = await api.post<ApiResponse<PaymentOrder>>(`${PAYMENTS_BASE}/package/order`, input);
            return data.data;
        } catch (error: any) {
            throw new Error(messageFrom(error, "Unable to start payment. Please try again."));
        }
    }

    /**
     * Razorpay Checkout kholta hai. Success par resolve, user ke band karne par PaymentCancelledError.
     * Payment fail hone par modal khud retry dikhata hai, isliye yahan reject nahi karte.
     */
    static async openCheckout(order: PaymentOrder, options: CheckoutOptions = {}): Promise<RazorpayCheckoutResult> {
        await PaymentService.loadCheckoutScript();

        return new Promise((resolve, reject) => {
            const instance = new window.Razorpay({
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                order_id: order.orderId,
                name: options.name || "Throne8",
                description: options.description || order.description,
                prefill: options.prefill,
                theme: { color: options.themeColor || "#4a3728" },
                handler: (response: RazorpayCheckoutResult) => resolve(response),
                modal: {
                    ondismiss: () => reject(new PaymentCancelledError()),
                },
            });
            instance.open();
        });
    }

    static async verifyPayment(input: VerifyPaymentInput): Promise<PaymentFulfillment> {
        try {
            const { data } = await api.post<ApiResponse<PaymentFulfillment>>(`${PAYMENTS_BASE}/verify`, input);
            let result = data.data;
            if (result.status === "processing") {
                result = await PaymentService.waitForFulfillment(input.paymentId);
            }
            return result;
        } catch (error: any) {
            throw new Error(messageFrom(error, "Could not confirm your payment."));
        }
    }

    static async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
        const { data } = await api.get<ApiResponse<PaymentStatusResponse>>(`${PAYMENTS_BASE}/${paymentId}`);
        return data.data;
    }

    private static async waitForFulfillment(paymentId: string): Promise<PaymentFulfillment> {
        for (let attempt = 0; attempt < 15; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const status = await PaymentService.getPaymentStatus(paymentId);

            if (status.fulfillmentStatus === "fulfilled") {
                return {
                    paymentId,
                    purpose: status.purpose as PaymentFulfillment["purpose"],
                    status: "fulfilled",
                    sessionId: status.sessionId,
                    bookingId: status.bookingId,
                    packageId: status.packageId,
                };
            }
            if (status.fulfillmentStatus === "refunded" || status.fulfillmentStatus === "failed") {
                throw new Error(status.error || "Booking could not be completed. Please contact support.");
            }
        }
        throw new Error(
            "Your payment was received, but confirmation is taking longer than usual. Please check My Bookings in a few minutes. Do not pay again."
        );
    }

    /**
     * Package ke liye poora flow: order -> checkout -> verify.
     * PlansPage ke "Buy" button se seedha call karo.
     */
    static async payForPackage(
        input: PackageOrderInput,
        checkoutOptions: CheckoutOptions = {}
    ): Promise<PaymentFulfillment> {
        const order = await PaymentService.createPackageOrder(input);
        const checkout = await PaymentService.openCheckout(order, checkoutOptions);
        return PaymentService.verifyPayment({
            paymentId: order.paymentId,
            razorpayOrderId: checkout.razorpay_order_id,
            razorpayPaymentId: checkout.razorpay_payment_id,
            razorpaySignature: checkout.razorpay_signature,
        });
    }
}

export default PaymentService;