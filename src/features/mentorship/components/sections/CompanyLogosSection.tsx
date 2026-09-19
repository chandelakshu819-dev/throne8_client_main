"use client";

import React from "react";
import TrustedCompanies from "../TrustedCompanies";
import { TOP_COMPANIES, TOP_COMPANIES_ROW2 } from "../../constants/mock.data";

export default function CompanyLogosSection() {
    return (
        <TrustedCompanies
            companiesRow1={TOP_COMPANIES}
            companiesRow2={TOP_COMPANIES_ROW2}
        />
    );
}