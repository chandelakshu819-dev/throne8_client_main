'use client';

import React from 'react';
import { Users } from 'lucide-react';

interface DemographicItem {
    label: string;
    count: number;
}

interface DemographicsData {
    locations?: DemographicItem[];
    jobTitles?: DemographicItem[];
    industries?: DemographicItem[];
}

interface AudienceInsightsProps {
    demographics: DemographicsData | null;
}

const BAR_COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];

function DemographicSection({ title, items }: { title: string; items: DemographicItem[] }) {
    if (!items || items.length === 0) {
        return (
            <div>
                <h4 className="text-sm font-semibold text-[#4a3728] mb-3">{title}</h4>
                <p className="text-xs text-[#7a5c3e]">No data yet</p>
            </div>
        );
    }

    const total = items.reduce((sum, item) => sum + item.count, 0);
    // top 5 only, sorted descending
    const sorted = [...items].sort((a, b) => b.count - a.count).slice(0, 5);

    return (
        <div>
            <h4 className="text-sm font-semibold text-[#4a3728] mb-3">{title}</h4>
            <div className="space-y-3">
                {sorted.map((item, index) => {
                    const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    return (
                        <div key={item.label}>
                            <div className="flex justify-between mb-1">
                                <span className="text-xs text-[#4a3728] truncate max-w-[70%]">{item.label}</span>
                                <span className="text-xs font-semibold text-[#7a5c3e]">{pct}%</span>
                            </div>
                            <div className="w-full h-2 bg-[#e0d8cf] rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${BAR_COLORS[index % BAR_COLORS.length]} rounded-full`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function AudienceInsights({ demographics }: AudienceInsightsProps) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#e0d8cf]">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-[#4a3728]">Audience Insights</h3>
            </div>

            <div className="space-y-6">
                <DemographicSection title="Top Locations" items={demographics?.locations || []} />
                <DemographicSection title="Top Job Titles" items={demographics?.jobTitles || []} />
                <DemographicSection title="Top Industries" items={demographics?.industries || []} />
            </div>
        </div>
    );
}