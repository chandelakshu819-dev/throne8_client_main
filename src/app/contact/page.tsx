// src/app/contact/page.tsx
import type { Metadata } from "next";
import { Linkedin, Mail, MapPin, Phone } from "lucide-react";
import PolicyLayout, { PolicySection } from "@/features/mentorship/components/layout/PolicyLayout";
import { COMPANY } from "@/config/company.config";

export const metadata: Metadata = {
    title: "Contact Us | Throne8",
    description: "Get in touch with the Throne8 team.",
};

const cardClass =
    "flex items-start gap-3.5 rounded-2xl border border-[#ece7e2] bg-[#fbf8f4] p-4 sm:p-5";
const iconWrapClass =
    "w-10 h-10 rounded-xl bg-[#4a3728] text-[#e8c987] flex items-center justify-center flex-shrink-0";

export default function ContactPage() {
    const officer = COMPANY.grievanceOfficer;

    return (
        <PolicyLayout title="Contact Us" subtitle="We are happy to help with bookings, payments and feedback">
            <PolicySection title="Get in touch">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={cardClass}>
                        <div className={iconWrapClass}>
                            <Mail className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#8e847c] mb-1">Email</p>
                            <a
                                href={`mailto:${COMPANY.email}`}
                                className="font-semibold text-[#2d2116] hover:underline break-all"
                            >
                                {COMPANY.email}
                            </a>
                        </div>
                    </div>

                    <div className={cardClass}>
                        <div className={iconWrapClass}>
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#8e847c] mb-1">Phone</p>
                            <a href={COMPANY.phoneHref} className="font-semibold text-[#2d2116] hover:underline">
                                {COMPANY.phone}
                            </a>
                        </div>
                    </div>

                    <div className={`${cardClass} sm:col-span-2`}>
                        <div className={iconWrapClass}>
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#8e847c] mb-1">
                                Registered office
                            </p>
                            <p className="font-semibold text-[#2d2116]">{COMPANY.legalName}</p>
                            <p className="text-[#5c4a3d] mt-0.5">{COMPANY.address}</p>
                        </div>
                    </div>

                    <div className={`${cardClass} sm:col-span-2`}>
                        <div className={iconWrapClass}>
                            <Linkedin className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#8e847c] mb-1">
                                Follow us
                            </p>
                            <a
                                href={COMPANY.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-[#2d2116] hover:underline"
                            >
                                Throne8 on LinkedIn
                            </a>
                        </div>
                    </div>
                </div>
            </PolicySection>

            <PolicySection title="Booking, payment or refund issue?">
                <p>
                    Please email us with your registered email address, the session name and date, and a short
                    description of the issue (screenshots help). This lets us look into it quickly.
                </p>
            </PolicySection>

            <PolicySection title="Grievance Officer">
                <p>
                    As required under the Information Technology Rules, 2021, you can raise a complaint with our{" "}
                    {officer.title}
                    {officer.name ? `, ${officer.name}` : ""}, at{" "}
                    <a className="font-semibold text-[#4a3426] underline" href={`mailto:${officer.email}`}>
                        {officer.email}
                    </a>
                    .
                </p>
            </PolicySection>
        </PolicyLayout>
    );
}