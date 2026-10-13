// src/app/privacy-policy/page.tsx
import type { Metadata } from "next";
import PolicyLayout, {
    PolicySection,
    PolicyList,
} from "@/features/mentorship/components/layout/PolicyLayout";
import { COMPANY } from "@/config/company.config";

export const metadata: Metadata = {
    title: "Privacy Policy | Throne8",
    description: "How Throne8 collects, uses and protects your personal data.",
};

export default function PrivacyPolicyPage() {
    const officer = COMPANY.grievanceOfficer;

    return (
        <PolicyLayout
            title="Privacy Policy"
            subtitle={`How ${COMPANY.legalName} handles your personal data`}
        >
            <PolicySection title="1. Introduction">
                <p>
                    {COMPANY.legalName} (&quot;Throne8&quot;, &quot;we&quot;, &quot;us&quot;) operates a
                    mentorship platform that connects learners (&quot;mentees&quot;) with industry mentors. This
                    Privacy Policy explains what personal data we collect, why we collect it, how we use and
                    protect it, and the choices you have. It is written in line with the Digital Personal Data
                    Protection Act, 2023 and the Information Technology Act, 2000 of India.
                </p>
                <p>By using Throne8 you agree to the practices described in this policy.</p>
            </PolicySection>

            <PolicySection title="2. Data we collect">
                <PolicyList
                    items={[
                        "Account details: name, email address, phone number, password (stored in encrypted form) and sign-in details if you use Google login.",
                        "Profile details: photo, headline, education, work experience, skills and other information you choose to add.",
                        "Booking details: sessions you book or host, selected date and time, queries you send to mentors, reviews and ratings.",
                        "Payment details: payment status, amount and transaction reference. Card, UPI and bank details are entered on our payment partner Razorpay and are not stored on our servers.",
                        "Session data: meeting links and attendance information for video sessions held on the platform.",
                        "Technical data: device and browser type, IP address, pages visited and cookies used to keep you signed in and to improve the service.",
                        "Messages and support requests you send to us.",
                    ]}
                />
            </PolicySection>

            <PolicySection title="3. How we use your data">
                <PolicyList
                    items={[
                        "To create and manage your account and verify your identity.",
                        "To show your profile to mentors or mentees as needed for bookings.",
                        "To process payments, refunds and mentor payouts.",
                        "To schedule sessions, send reminders, confirmations and other service notifications by email, SMS or in-app.",
                        "To keep the platform safe, prevent fraud and enforce our Terms and Conditions.",
                        "To provide customer support and to improve our features.",
                        "To comply with legal obligations.",
                    ]}
                />
            </PolicySection>

            <PolicySection title="4. Who we share data with">
                <p>We do not sell your personal data. We share it only in these cases:</p>
                <PolicyList
                    items={[
                        "With the mentor or mentee you book a session with, limited to what is needed to hold the session (for example name, profile and your query).",
                        "With service providers who work for us, such as payment processing (Razorpay), video calling, email and SMS delivery, cloud hosting and media storage. They may use your data only to provide their service to us.",
                        "With government or law enforcement authorities when required by law or to protect rights and safety.",
                        "In case of a merger, acquisition or restructuring, in which case you will be informed.",
                    ]}
                />
            </PolicySection>

            <PolicySection title="5. Cookies">
                <p>
                    We use cookies and similar technologies to keep you signed in, remember preferences and
                    understand how the platform is used. You can control cookies from your browser settings, but
                    some features may not work properly if you disable them.
                </p>
            </PolicySection>

            <PolicySection title="6. Data retention">
                <p>
                    We keep your data for as long as your account is active and as needed to provide the service.
                    After you delete your account we remove or anonymise your personal data, except where we must
                    keep certain records (for example payment and tax records) for the period required by law.
                </p>
            </PolicySection>

            <PolicySection title="7. Security">
                <p>
                    We use reasonable technical and organisational measures such as encrypted connections,
                    hashed passwords and access controls to protect your data. No online service can be
                    guaranteed to be completely secure, so please keep your password confidential.
                </p>
            </PolicySection>

            <PolicySection title="8. Your rights">
                <p>Under applicable law you can:</p>
                <PolicyList
                    items={[
                        "Ask for access to the personal data we hold about you.",
                        "Ask us to correct inaccurate or incomplete data.",
                        "Ask us to delete your data, subject to legal retention requirements.",
                        "Withdraw consent for processing that is based on consent.",
                        "Raise a grievance with us, as described below.",
                    ]}
                />
                <p>
                    To use any of these rights, write to us at{" "}
                    <a className="font-semibold text-[#4a3426] underline" href={`mailto:${COMPANY.email}`}>
                        {COMPANY.email}
                    </a>
                    .
                </p>
            </PolicySection>

            <PolicySection title="9. Children">
                <p>
                    Throne8 is meant for users who are 18 years or older. We do not knowingly collect personal data
                    from anyone under 18. If you believe a minor has given us their data, contact us and we will
                    delete it.
                </p>
            </PolicySection>

            <PolicySection title="10. Changes to this policy">
                <p>
                    We may update this policy from time to time. When we make important changes we will update the
                    date at the top of this page and, where appropriate, notify you through the platform or email.
                </p>
            </PolicySection>

            <PolicySection title="11. Grievance Officer and contact">
                <p>
                    For privacy questions or complaints, contact our {officer.title}
                    {officer.name ? `, ${officer.name}` : ""}:
                </p>
                <PolicyList
                    items={[
                        <>
                            Email:{" "}
                            <a className="font-semibold text-[#4a3426] underline" href={`mailto:${officer.email}`}>
                                {officer.email}
                            </a>
                        </>,
                        <>Phone: {COMPANY.phone}</>,
                        <>
                            Address: {COMPANY.legalName}, {COMPANY.address}
                        </>,
                    ]}
                />
            </PolicySection>
        </PolicyLayout>
    );
}