"use client";

import React from "react";
import { ShieldCheck, Zap, Star, Globe } from "lucide-react";

export default function UnstoppableAdvantageSection() {
    return (
        <section className="py-20 px-6 bg-[#f7f1e6] relative overflow-hidden">
            <div className="absolute top-10 right-20 w-64 h-64 bg-[#4a3728]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-20 w-80 h-80 bg-[#8b7355]/5 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-14 reveal-on-scroll">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[#4a3728] mb-3">
                        The <span className="text-[#8b7355]">Unstoppable</span> Advantage
                    </h2>
                    <p className="text-slate-500 text-base font-medium max-w-2xl mx-auto">
                        Why thousands choose us for their career growth
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Card 1 */}
                    <div className="reveal-on-scroll group perspective-1000">
                        <div className="relative bg-white rounded-[24px] p-6 border-2 border-[#ece7e2] shadow-xl hover:shadow-[0_15px_45px_rgba(74,55,40,0.12)] transition-all duration-700 transform-gpu hover:-translate-y-3 hover:rotate-y-3">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#4a3728]/10 to-transparent rounded-[24px] translate-x-1.5 translate-y-1.5 -z-10 group-hover:translate-x-3 group-hover:translate-y-3 transition-all duration-700" />
                            <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#8b7355]/20 rounded-full blur-xl group-hover:scale-150 transition-all duration-700" />
                            <div className="w-12 h-12 bg-gradient-to-br from-[#4a3728] to-[#634a36] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md relative z-10 mx-auto">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-sm font-black text-[#4a3728] text-center mb-1 group-hover:text-[#8b7355] transition-colors uppercase tracking-wider">
                                Verified Experts
                            </p>
                            <p className="text-[10px] text-slate-500 text-center font-medium leading-relaxed">
                                Industry-vetted professionals
                            </p>
                            <div className="w-8 h-0.5 bg-gradient-to-r from-[#4a3728] to-[#8b7355] mt-4 rounded-full group-hover:w-full transition-all duration-700 mx-auto" />
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="reveal-on-scroll group perspective-1000" style={{ animationDelay: "75ms" }}>
                        <div className="relative bg-white rounded-[24px] p-6 border-2 border-[#ece7e2] shadow-xl hover:shadow-[0_15px_45px_rgba(74,55,40,0.12)] transition-all duration-700 transform-gpu hover:-translate-y-3 hover:rotate-y-3">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#8b7355]/10 to-transparent rounded-[24px] translate-x-1.5 translate-y-1.5 -z-10 group-hover:translate-x-3 group-hover:translate-y-3 transition-all duration-700" />
                            <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#4a3728]/20 rounded-full blur-xl group-hover:scale-150 transition-all duration-700" />
                            <div className="w-12 h-12 bg-gradient-to-br from-[#8b7355] to-[#a08368] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md relative z-10 mx-auto">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-sm font-black text-[#4a3728] text-center mb-1 group-hover:text-[#8b7355] transition-colors uppercase tracking-wider">
                                Instant Booking
                            </p>
                            <p className="text-[10px] text-slate-500 text-center font-medium leading-relaxed">
                                Book sessions in seconds
                            </p>
                            <div className="w-8 h-0.5 bg-gradient-to-r from-[#8b7355] to-[#4a3728] mt-4 rounded-full group-hover:w-full transition-all duration-700 mx-auto" />
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="reveal-on-scroll group perspective-1000" style={{ animationDelay: "150ms" }}>
                        <div className="relative bg-white rounded-[24px] p-6 border-2 border-[#ece7e2] shadow-xl hover:shadow-[0_15px_45px_rgba(74,55,40,0.12)] transition-all duration-700 transform-gpu hover:-translate-y-3 hover:rotate-y-3">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#4a3728]/10 to-transparent rounded-[24px] translate-x-1.5 translate-y-1.5 -z-10 group-hover:translate-x-3 group-hover:translate-y-3 transition-all duration-700" />
                            <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#8b7355]/20 rounded-full blur-xl group-hover:scale-150 transition-all duration-700" />
                            <div className="w-12 h-12 bg-gradient-to-br from-[#4a3728] to-[#634a36] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md relative z-10 mx-auto">
                                <Star className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-sm font-black text-[#4a3728] text-center mb-1 group-hover:text-[#8b7355] transition-colors uppercase tracking-wider">
                                Best Value
                            </p>
                            <p className="text-[10px] text-slate-500 text-center font-medium leading-relaxed">
                                Premium quality, fair pricing
                            </p>
                            <div className="w-8 h-0.5 bg-gradient-to-r from-[#4a3728] to-[#8b7355] mt-4 rounded-full group-hover:w-full transition-all duration-700 mx-auto" />
                        </div>
                    </div>

                    {/* Card 4 */}
                    <div className="reveal-on-scroll group perspective-1000" style={{ animationDelay: "225ms" }}>
                        <div className="relative bg-white rounded-[24px] p-6 border-2 border-[#ece7e2] shadow-xl hover:shadow-[0_15px_45px_rgba(74,55,40,0.12)] transition-all duration-700 transform-gpu hover:-translate-y-3 hover:rotate-y-3">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#8b7355]/10 to-transparent rounded-[24px] translate-x-1.5 translate-y-1.5 -z-10 group-hover:translate-x-3 group-hover:translate-y-3 transition-all duration-700" />
                            <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#4a3728]/20 rounded-full blur-xl group-hover:scale-150 transition-all duration-700" />
                            <div className="w-12 h-12 bg-gradient-to-br from-[#8b7355] to-[#a08368] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md relative z-10 mx-auto">
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-sm font-black text-[#4a3728] text-center mb-1 group-hover:text-[#8b7355] transition-colors uppercase tracking-wider">
                                Global Reach
                            </p>
                            <p className="text-[10px] text-slate-500 text-center font-medium leading-relaxed">
                                Connect across time zones
                            </p>
                            <div className="w-8 h-0.5 bg-gradient-to-r from-[#8b7355] to-[#4a3728] mt-4 rounded-full group-hover:w-full transition-all duration-700 mx-auto" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}