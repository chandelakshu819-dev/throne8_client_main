// src/app/refund-policy/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import PolicyLayout, {
    PolicySection,
    PolicyList,
} from "@/features/mentorship/components/layout/PolicyLayout";
import { COMPANY, REFUND_RULES } from "@/config/company.config";

export const metadata: Metadata = {
    title: "Refund & Cancellation Policy | Throne8",
    description: "When and how you can cancel a Throne8 session and get a refund.",
};

export default function RefundPolicyPage() {
    const lateRefund = REFUND_RULES.lateCancellationRefundPercent;

    return (
        <PolicyLayout
            title="Refund & Cancellation Policy"
            subtitle="How cancellations, rescheduling and refunds work on Throne8"
        >
            <PolicySection title="1. Overview">
                <p>
                    This policy applies to paid sessions, group sessions and other paid services booked on
                    Throne8. All payments are made in Indian Rupees (INR) through Razorpay. Please read it before
                    you book.
                </p>
            </PolicySection>

            <PolicySection title="2. Cancellation by the mentee">
                <PolicyList
                    items={[
                        <>
                            <strong>
                                Cancel at least {REFUND_RULES.freeCancellationHours} hours before the session start
                                time:
                            </strong>{" "}
                            you receive a full refund of the amount paid.
                        </>,
                        <>
                            <strong>
                                Cancel less than {REFUND_RULES.freeCancellationHours} hours before the session:
                            </strong>{" "}
                            {lateRefund === 0
                                ? "no refund is given, because the mentor has reserved that time for you."
                                : `${lateRefund}% of the amount paid is refunded.`}
                        </>,
                        <>
                            <strong>No-show by the mentee:</strong> no refund is given.
                        </>,
                    ]}
                />
                <p>
                    You can cancel from your dashboard under your bookings. The cancellation time is the time you
                    cancel on the platform.
                </p>
            </PolicySection>

            <PolicySection title="3. Rescheduling">
                <p>
                    You can reschedule a booking to another available slot from your dashboard, subject to the
                    mentor availability. If the reschedule is requested very close to the session start time, it
                    may be treated as a late cancellation.
                </p>
            </PolicySection>

            <PolicySection title="4. Cancellation or no-show by the mentor">
                <PolicyList
                    items={[
                        "If a mentor cancels a confirmed session, you can choose a new slot or receive a full refund.",
                        "If a mentor does not join the session, you receive a full refund.",
                        "Mentors who repeatedly cancel or do not attend may be suspended from the platform.",
                    ]}
                />
            </PolicySection>

            <PolicySection title="5. Technical problems">
                <p>
                    If a session cannot take place or ends early because of a problem on the Throne8 platform,
                    contact us within 48 hours of the session. After checking, we will offer a free reschedule or
                    a full or partial refund, as appropriate. Problems caused by your own internet connection or
                    device are not eligible for a refund.
                </p>
            </PolicySection>

            <PolicySection title="6. Group sessions and join requests">
                <PolicyList
                    items={[
                        "For group sessions that need mentor approval, no charge is taken until your request is accepted. If the request is declined, you are not charged.",
                        "If a group session is cancelled by the mentor, you receive a full refund.",
                        "Cancellation by a participant follows the same time rules as in section 2.",
                    ]}
                />
            </PolicySection>

            <PolicySection title="7. Queries and other services">
                <p>
                    If a paid query is not answered by the mentor within the promised time, you can ask for a
                    refund. Once a query has been answered, it cannot be refunded.
                </p>
            </PolicySection>

            <PolicySection title="8. How refunds are paid">
                <PolicyList
                    items={[
                        "Refunds are sent to the original payment method used at checkout.",
                        `Once a refund is approved, it usually reaches your account within ${REFUND_RULES.processingDays} working days. The exact time depends on your bank or payment provider.`,
                        "Payment gateway charges may not be refundable where the law or the payment provider does not allow it.",
                    ]}
                />
            </PolicySection>

            <PolicySection title="9. How to request a refund">
                <p>
                    If you believe you are eligible for a refund that was not given automatically, email{" "}
                    <a className="font-semibold text-[#4a3426] underline" href={`mailto:${COMPANY.email}`}>
                        {COMPANY.email}
                    </a>{" "}
                    with your registered email, booking details and the reason. You can also reach us from our{" "}
                    <Link className="font-semibold text-[#4a3426] underline" href="/contact">
                        Contact page
                    </Link>
                    .
                </p>
            </PolicySection>
        </PolicyLayout>
    );
}