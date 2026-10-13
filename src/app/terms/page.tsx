// src/app/terms/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import PolicyLayout, {
    PolicySection,
    PolicyList,
} from "@/features/mentorship/components/layout/PolicyLayout";
import { COMPANY } from "@/config/company.config";

export const metadata: Metadata = {
    title: "Terms & Conditions | Throne8",
    description: "The terms that apply when you use the Throne8 mentorship platform.",
};

export default function TermsPage() {
    return (
        <PolicyLayout
            title="Terms & Conditions"
            subtitle={`Please read these terms before using ${COMPANY.brand}`}
        >
            <PolicySection title="1. About these terms">
                <p>
                    These Terms and Conditions (&quot;Terms&quot;) govern your use of the Throne8 website and
                    services operated by {COMPANY.legalName} (&quot;Throne8&quot;, &quot;we&quot;, &quot;us&quot;).
                    By creating an account or using the platform you agree to these Terms, our{" "}
                    <Link className="font-semibold text-[#4a3426] underline" href="/privacy-policy">
                        Privacy Policy
                    </Link>{" "}
                    and our{" "}
                    <Link className="font-semibold text-[#4a3426] underline" href="/refund-policy">
                        Refund &amp; Cancellation Policy
                    </Link>
                    . If you do not agree, please do not use the platform.
                </p>
            </PolicySection>

            <PolicySection title="2. Our service">
                <p>
                    Throne8 is an online marketplace where mentees can discover mentors and book one-to-one
                    sessions, group sessions, queries and related services, and take part in community features.
                    Throne8 provides the technology to find, book, pay for and hold sessions. Mentors are
                    independent individuals and are not employees or agents of Throne8.
                </p>
            </PolicySection>

            <PolicySection title="3. Eligibility and accounts">
                <PolicyList
                    items={[
                        "You must be at least 18 years old and able to enter into a binding contract.",
                        "You must give accurate information and keep it up to date.",
                        "You are responsible for all activity under your account and for keeping your password safe. Tell us immediately if you suspect unauthorised use.",
                        "One person may not maintain multiple accounts to misuse offers or avoid restrictions.",
                    ]}
                />
            </PolicySection>

            <PolicySection title="4. Bookings and payments">
                <PolicyList
                    items={[
                        "Prices are shown in Indian Rupees (INR) at the time of booking and include any applicable taxes unless stated otherwise.",
                        "Payments are processed by Razorpay. A booking is confirmed only after payment succeeds (or, for free sessions, after you confirm).",
                        "Refunds and cancellations are governed by our Refund & Cancellation Policy.",
                        "Throne8 may charge a platform fee or commission to mentors, as agreed with them.",
                    ]}
                />
            </PolicySection>

            <PolicySection title="5. Rules for mentees">
                <PolicyList
                    items={[
                        "Join sessions on time and be respectful to your mentor.",
                        "Do not ask for or share confidential information of your employer or any third party.",
                        "Do not make payments or arrange sessions outside the platform to avoid platform fees.",
                    ]}
                />
            </PolicySection>

            <PolicySection title="6. Rules for mentors">
                <PolicyList
                    items={[
                        "Give truthful information about your experience, skills and employer.",
                        "Honour confirmed bookings. Repeated cancellations or no-shows can lead to removal of your profile or reduced visibility.",
                        "Provide guidance in good faith and do not misrepresent outcomes, jobs or referrals.",
                        "You are responsible for your own taxes on earnings received through the platform.",
                    ]}
                />
            </PolicySection>

            <PolicySection title="7. Acceptable use">
                <p>You agree not to:</p>
                <PolicyList
                    items={[
                        "Harass, abuse, threaten, discriminate against or impersonate anyone.",
                        "Post spam, false, misleading, unlawful or infringing content.",
                        "Record, screenshot or share a session without the consent of everyone taking part.",
                        "Attempt to hack, overload, scrape or reverse engineer the platform.",
                        "Use the platform for any unlawful purpose.",
                    ]}
                />
                <p>
                    We may remove content, suspend or terminate accounts that break these rules, without prior
                    notice where required to protect users or the platform.
                </p>
            </PolicySection>

            <PolicySection title="8. Content and intellectual property">
                <p>
                    You keep ownership of content you post, but you give Throne8 a non-exclusive, worldwide,
                    royalty-free licence to host, display and use it to operate and promote the platform. The
                    Throne8 name, logo, design and software belong to {COMPANY.legalName} and may not be copied or
                    used without our written permission.
                </p>
            </PolicySection>

            <PolicySection title="9. No guarantee of results">
                <p>
                    Mentors share their personal experience and opinions. Throne8 does not guarantee any job,
                    interview result, promotion, income or other outcome from a session, and does not verify every
                    statement made by a mentor. You are responsible for your own decisions.
                </p>
            </PolicySection>

            <PolicySection title="10. Limitation of liability">
                <p>
                    To the extent permitted by law, the platform is provided on an &quot;as is&quot; and &quot;as
                    available&quot; basis. Throne8 is not liable for indirect or consequential losses, for the
                    conduct of any user, or for interruptions caused by events outside our control. Our total
                    liability for any claim related to a booking is limited to the amount you paid for that
                    booking.
                </p>
            </PolicySection>

            <PolicySection title="11. Suspension and termination">
                <p>
                    You may stop using Throne8 and delete your account at any time. We may suspend or end your
                    access if you break these Terms or if required by law. Provisions that by their nature should
                    continue (such as payment obligations, intellectual property and liability limits) will
                    continue after termination.
                </p>
            </PolicySection>

            <PolicySection title="12. Changes to these terms">
                <p>
                    We may update these Terms from time to time. The updated version will apply from the date
                    shown at the top of this page. Continuing to use Throne8 after a change means you accept the
                    updated Terms.
                </p>
            </PolicySection>

            <PolicySection title="13. Governing law">
                <p>
                    These Terms are governed by the laws of India. Courts at Bhopal, Madhya Pradesh will have
                    jurisdiction over any dispute, subject to applicable law.
                </p>
            </PolicySection>

            <PolicySection title="14. Contact">
                <p>
                    Questions about these Terms? Write to{" "}
                    <a className="font-semibold text-[#4a3426] underline" href={`mailto:${COMPANY.email}`}>
                        {COMPANY.email}
                    </a>{" "}
                    or visit our{" "}
                    <Link className="font-semibold text-[#4a3426] underline" href="/contact">
                        Contact page
                    </Link>
                    .
                </p>
            </PolicySection>
        </PolicyLayout>
    );
}