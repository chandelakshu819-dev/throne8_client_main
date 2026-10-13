// src/app/shipping-policy/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import PolicyLayout, {
    PolicySection,
    PolicyList,
} from "@/features/mentorship/components/layout/PolicyLayout";
import { COMPANY } from "@/config/company.config";

export const metadata: Metadata = {
    title: "Shipping & Delivery Policy | Throne8",
    description: "How Throne8 digital services are delivered.",
};

export default function ShippingPolicyPage() {
    return (
        <PolicyLayout
            title="Shipping & Delivery Policy"
            subtitle="How Throne8 services are delivered to you"
        >
            <PolicySection title="1. Digital services only">
                <p>
                    {COMPANY.brand} provides online mentorship services such as video sessions, group sessions and
                    query answers. We do not sell or ship any physical goods, so no shipping charges apply and no
                    courier or postal delivery is involved.
                </p>
            </PolicySection>

            <PolicySection title="2. How and when you receive your service">
                <PolicyList
                    items={[
                        "Booking confirmation is shown on screen and sent to your registered email once payment is successful.",
                        "Your booking appears in your dashboard right after confirmation.",
                        "The session joining link is available in your dashboard and sent by email or notification before the session time.",
                        "Sessions are held live at the date and time you selected. Answers to queries are delivered in the platform and by notification.",
                    ]}
                />
            </PolicySection>

            <PolicySection title="3. What you need">
                <p>
                    A device with a stable internet connection, a modern browser, and working camera and microphone
                    for video sessions. Please join a few minutes early to check your setup.
                </p>
            </PolicySection>

            <PolicySection title="4. If you do not receive your booking details">
                <p>
                    Check your spam folder and your dashboard first. If you still cannot find your confirmation or
                    joining link, write to{" "}
                    <a className="font-semibold text-[#4a3426] underline" href={`mailto:${COMPANY.email}`}>
                        {COMPANY.email}
                    </a>{" "}
                    or call {COMPANY.phone}. For cancellations and refunds, see our{" "}
                    <Link className="font-semibold text-[#4a3426] underline" href="/refund-policy">
                        Refund &amp; Cancellation Policy
                    </Link>
                    .
                </p>
            </PolicySection>
        </PolicyLayout>
    );
}