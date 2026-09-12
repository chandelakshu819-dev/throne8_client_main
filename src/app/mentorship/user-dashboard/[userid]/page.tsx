"use client";

import React from "react";
import { useParams } from "next/navigation";
import UserDashboardLayout from "@/features/mentorship/components/user-dashboard/UserDashboardLayout";

export default function UserDashboardPage() {
    const params = useParams();
    const userId = params.userid as string;

    return <UserDashboardLayout userId={userId} />;
}
