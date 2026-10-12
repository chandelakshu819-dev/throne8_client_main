// src/features/mentorship/utils/sessionCard.ts
import { parseRoleCompany, formatRoleCompany, normalizeRole } from "@/shared/utils/mentorFormat";

/** 0 => Free, missing => "Price TBA" (missing price ko ab "Free" nahi dikhata) */
export function formatPrice(price: any): string {
    if (price === 0 || price === "0") return "Free";
    if (price === null || price === undefined || price === "") return "Price TBA";
    const num = Number(price);
    if (isNaN(num)) return `₹${price}`;
    return `₹${num.toLocaleString("en-IN")}`;
}

interface HostFallback {
    name?: string;
    role?: string;
    image?: string;
}

interface HostDefaults {
    name: string;
    role: string;
}

export function resolveHostInfo(hostData: any, fallback: HostFallback, defaults: HostDefaults) {
    let name = "";
    if (hostData?.name) {
        name = hostData.name;
    } else if (hostData?.user) {
        name = `${hostData.user?.firstName || ""} ${hostData.user?.lastName || ""}`.trim();
    }
    name = name || fallback.name || defaults.name;

    const roleRaw: string =
        hostData?.role ||
        hostData?.experience?.currentRole ||
        hostData?.headline ||
        hostData?.currentRole ||
        fallback.role ||
        "";

    let roleLabel = defaults.role;
    if (roleRaw) {
        const { role, company } = parseRoleCompany(roleRaw, null, hostData?.company);
        roleLabel = formatRoleCompany(role, company) || normalizeRole(roleRaw) || defaults.role;
    }

    const pic: string =
        hostData?.image ||
        hostData?.profilePic ||
        hostData?.user?.profilePic ||
        fallback.image ||
        "";

    const isOnline = Boolean(
        hostData?.isOnline ?? hostData?.isAvailable ?? hostData?.status === "active"
    );

    return { name, roleLabel, pic, isOnline };
}