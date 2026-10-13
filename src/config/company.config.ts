// src/config/company.config.ts
// Company details ek hi jagah; footer aur saare policy pages yahin se padhte hain.

export const COMPANY = {
    legalName: "Throne8 Pvt. Ltd.",
    brand: "Throne8",
    email: "support@throne8.com",
    phone: "+91 79992 08700",
    phoneHref: "tel:+917999208700",
    address:
        "G-01, Anjani Residency, Church Road, Manak Vihar, Patel Nagar, Bhopal, Madhya Pradesh - 462022, India",
    linkedin: "https://www.linkedin.com/company/throne8/",
    // TODO: Grievance Officer ka naam mil jaye to yahan add kar do
    grievanceOfficer: {
        title: "Grievance Officer",
        name: "",
        email: "support@throne8.com",
    },
    policyUpdatedOn: "13 October 2026",
} as const;

// TODO: Ye values backend ke refundCalculator.ts se match honi chahiye.
// Refund policy page inhi se banta hai, isliye yahan badalte hi page update ho jayega.
export const REFUND_RULES = {
    /** Session shuru hone se itne ghante pehle cancel karne par full refund */
    freeCancellationHours: 24,
    /** Isse kam time bacha ho to kitna percent refund (0 = no refund) */
    lateCancellationRefundPercent: 0,
    /** Refund bank/card me kitne working days me aata hai */
    processingDays: "5-7",
} as const;