'use client';

import React, { useEffect, useState } from 'react';
import { X, Search, TrendingUp, Calendar, Hash } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import AnalyticsService from '@/lib/api/analytics.service';

interface SearchAppearancesModalProps {
    isOpen: boolean;
    onClose: () => void;
    analytics: any;
}

// Real appearedAt timestamps ko day-wise group karke graph data banata hai
const buildRealGraphData = (rawAppearances: any[], days: number) => {
    const labels: string[] = [];
    const countsByDate: Record<string, number> = {};

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        countsByDate[key] = 0;
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }

    rawAppearances.forEach((item) => {
        if (!item?.appearedAt) return;
        const key = new Date(item.appearedAt).toISOString().split('T')[0];
        if (key in countsByDate) {
            countsByDate[key]++;
        }
    });

    return { labels, searches: Object.values(countsByDate) };
};

const SearchAppearancesModal: React.FC<SearchAppearancesModalProps> = ({
    isOpen,
    onClose,
    analytics
}) => {
    const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
    const [filterType, setFilterType] = useState<'all' | 'highlighted'>('all');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customDays, setCustomDays] = useState('');

    const [searchHistory, setSearchHistory] = useState<any[]>([]);
    const [rawAppearances, setRawAppearances] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [change, setChange] = useState<any>(null);


    useEffect(() => {
        if (isOpen) {
            loadSearchHistory();
        }
    }, [isOpen, timeRange]);

    const loadSearchHistory = async () => {
        try {
            setIsLoadingHistory(true);

            const [response, changeResponse] = await Promise.all([
                AnalyticsService.getSearchAppearancesWithHighlights(1, 50),   // ✅ ye method call karo

                AnalyticsService.getSearchAppearancesChange(timeRange)
            ]);

            setRawAppearances(response.data.appearances || []);

            // ✅ FIX: searchQuery ki jagah searcherId se group karo,
            // taaki "kisne search kiya" dikhe, na ki "kya search kiya"
            const grouped = response.data.appearances.reduce((acc: any, item: any) => {
                const key = item.searcherId || `anon-${item.searchQuery}`;
                if (!acc[key]) {
                    acc[key] = {
                        searcherId: item.searcherId,
                        searcherName: item.searcherName || 'LinkedIn Member',
                        searcherPhotoUrl: item.searcherPhotoUrl || null,
                        queries: [],
                        count: 0,
                        dates: [],
                        highlighted: false
                    };
                }
                acc[key].count++;
                acc[key].dates.push(item.appearedAt);
                if (!acc[key].queries.includes(item.searchQuery)) {
                    acc[key].queries.push(item.searchQuery);
                }
                if (item.wasClicked) {
                    acc[key].highlighted = true;
                }
                return acc;
            }, {});

            const searchData = Object.values(grouped).sort((a: any, b: any) => b.count - a.count);
            setSearchHistory(searchData);
            setChange(changeResponse.data);

        } catch (error) {
            console.error('Failed to load search history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // ✅ Background scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);


    if (!isOpen) return null;

    const graphData = buildRealGraphData(rawAppearances, timeRange);

    const filteredSearches = filterType === 'all'
    ? searchHistory
    : searchHistory.filter((s: any) => s.highlighted);

    const chartData = {
        labels: graphData.labels,
        datasets: [
            {
                label: 'Search Appearances',
                data: graphData.searches,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#4a3728',
                padding: 12,
                borderRadius: 8,
                titleColor: '#f6ede8',
                bodyColor: '#f6ede8'
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#7a5c3e',
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(122, 92, 62, 0.1)'
                },
                ticks: {
                    color: '#7a5c3e',
                    font: {
                        size: 11
                    }
                }
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#f6ede8] rounded-3xl shadow-2xl border border-[#e0d8cf] max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#7a5c3e] to-[#5f4630] p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Search className="w-8 h-8 text-white" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">Search Appearances</h2>
                            <p className="text-sm text-white/80">
                                Total Appearances: <span className="font-bold">{analytics?.searchAppearances?.total || 0}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Graph Controls */}
                    <div className="mb-6 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-[#4a3728]">Appearances Over Time</h3>
                        <div className="flex gap-2 items-center">
                            {[7, 30, 90].map((days) => (
                                <button
                                    key={days}
                                    onClick={() => {
                                        setTimeRange(days as 7 | 30 | 90);
                                        setShowCustomInput(false);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === days && !showCustomInput
                                        ? 'bg-[#7a5c3e] text-white'
                                        : 'bg-[#e0d8cf] text-[#7a5c3e] hover:bg-[#d4c4b5]'
                                        }`}
                                >
                                    {days} days
                                </button>
                            ))}

                            {/* Custom Days Button */}
                            <button
                                onClick={() => setShowCustomInput(!showCustomInput)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${showCustomInput
                                    ? 'bg-[#7a5c3e] text-white'
                                    : 'bg-[#e0d8cf] text-[#7a5c3e] hover:bg-[#d4c4b5]'
                                    }`}
                            >
                                Custom
                            </button>

                            {/* Custom Input Field */}
                            {showCustomInput && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={customDays}
                                        onChange={(e) => setCustomDays(e.target.value)}
                                        placeholder="Days"
                                        className="w-20 px-3 py-2 rounded-lg border border-[#e0d8cf] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#4a3728]"
                                    />
                                    <button
                                        onClick={() => {
                                            const days = parseInt(customDays);
                                            if (days > 0 && days <= 365) {
                                                setTimeRange(days as any);
                                            }
                                        }}
                                        className="px-3 py-2 bg-[#7a5c3e] text-white rounded-lg text-sm font-medium hover:bg-[#6b4e34] transition-all"
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Graph */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#e0d8cf] mb-6">
                        <div style={{ height: '250px' }}>
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 shadow border border-[#e0d8cf]">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                <span className="text-sm text-[#7a5c3e]">Last 7 Days</span>
                            </div>
                            <p className="text-2xl font-bold text-[#4a3728]">
                                {analytics?.searchAppearances?.last7Days || 0}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow border border-[#e0d8cf]">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                <span className="text-sm text-[#7a5c3e]">Last 30 Days</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-2xl font-bold text-[#4a3728]">
                                    {analytics?.searchAppearances?.last30Days || 0}
                                </p>
                                {change?.change && (
                                    <span
                                        className={`text-xs font-semibold ${
                                            change.change.trend === 'up'
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }`}
                                    >
                                        {change.change.trend === 'up' ? '▲' : '▼'}{' '}
                                        {Math.abs(change.change.percentage)}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow border border-[#e0d8cf]">
                            <div className="flex items-center gap-2 mb-2">
                                <Hash className="w-5 h-5 text-blue-500" />
                                <span className="text-sm text-[#7a5c3e]">Highlighted</span>
                            </div>
                            <p className="text-2xl font-bold text-[#4a3728]">
                                 {searchHistory.filter((s: any) => s.highlighted).length}
                            </p>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="mb-4 flex gap-2">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'all'
                                ? 'bg-[#7a5c3e] text-white'
                                : 'bg-[#e0d8cf] text-[#7a5c3e] hover:bg-[#d4c4b5]'
                                }`}
                        >
                            All Searches
                        </button>
                        <button
                            onClick={() => setFilterType('highlighted')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'highlighted'
                                ? 'bg-blue-500 text-white'
                                : 'bg-[#e0d8cf] text-[#7a5c3e] hover:bg-[#d4c4b5]'
                                }`}
                        >
                            Highlighted Only
                        </button>
                    </div>

                    {/* Search History */}
                    <div>
                        <h3 className="text-xl font-bold text-[#4a3728] mb-4">
                            Who Searched You
                        </h3>

                        <div className="space-y-3">

                        {filteredSearches.map((search: any, index: number) => {
    // Sabse latest appearance ka date/time nikaalo (dates array me se pehla, kyunki backend already descending sort karta hai)
    const latestDate = search.dates && search.dates.length > 0
        ? new Date(search.dates[0])
        : null;

    return (
        <div
            key={(search.searcherId || search.searcherName) + index}
            className="bg-white rounded-xl p-4 shadow border border-[#e0d8cf] hover:shadow-lg transition-all"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-blue-100 flex items-center justify-center">
                        {search.searcherPhotoUrl ? (
                            <img
                                src={search.searcherPhotoUrl}
                                alt={search.searcherName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Search className="w-6 h-6 text-blue-600" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-[#4a3728]">{search.searcherName}</h4>
                            {search.highlighted && (
                                <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">
                                    ⭐ Highlighted
                                </span>
                            )}
                        </div>
                        {/* <p className="text-xs text-[#7a5c3e] mb-1 truncate">
                            searched: "{search.queries.join('", "')}"
                        </p> */}
                        <div className="flex items-center gap-4 text-sm text-[#7a5c3e]">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {latestDate ? latestDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                            </span>
                            <span>
                                {latestDate ? latestDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{search.count}</p>
                    <p className="text-xs text-[#7a5c3e]">appearances</p>
                </div>
            </div>
        </div>
    );
})}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchAppearancesModal;