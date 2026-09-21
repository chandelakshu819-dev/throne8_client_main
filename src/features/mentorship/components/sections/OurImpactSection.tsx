"use client";

import React from "react";
import { Users, Clock, Briefcase, ArrowRight } from "lucide-react";

export default function OurImpactSection() {
  return (
    <section className="relative overflow-hidden bg-[#f7f1e6] px-6 py-14 md:py-16">

      {/* =====================================================
                BACKGROUND DECORATION
            ====================================================== */}

      <div className="absolute left-[-180px] top-[10%] h-[450px] w-[450px] rounded-full bg-[#8b7355]/5 blur-3xl" />

      <div className="absolute right-[-150px] bottom-[-150px] h-[450px] w-[450px] rounded-full bg-[#4a3728]/5 blur-3xl" />

      <div className="pointer-events-none absolute right-[28%] top-[8%] h-[460px] w-[460px] rounded-full border border-[#d4af37]/10" />

      <div className="pointer-events-none absolute right-[31%] top-[13%] h-[390px] w-[390px] rounded-full border border-[#d4af37]/10" />


      {/* =====================================================
                MAIN
            ====================================================== */}

      <div className="relative z-10 mx-auto max-w-[1240px]">

        <div
          className="
                        grid
                        items-center
                        lg:grid-cols-[32%_30%_38%]
                    "
        >

          {/* =================================================
                        LEFT — EDITORIAL CONTENT
                    ================================================== */}

          <div className="relative z-20 pr-8 lg:pr-10">

            <span
              className="
                                mb-4
                                block
                                text-[10px]
                                font-bold
                                uppercase
                                tracking-[5px]
                                text-[#8b7355]
                            "
            >
              Our Impact
            </span>

            <h2
              className="
                                whitespace-nowrap
                                text-[44px]
                                font-black
                                leading-none
                                tracking-[-2px]
                                text-[#4a3728]
                                md:text-[48px]
                                lg:text-[50px]
                            "
            >
              Our{" "}
              <span className="text-[#8b7355]">
                Impact
              </span>
            </h2>

            <p
              className="
                                mt-6
                                max-w-[390px]
                                text-[15px]
                                leading-[1.65]
                                text-[#75685d]
                                md:text-[16px]
                            "
            >
              Transforming careers through meaningful
              connections and expert guidance.
            </p>

            {/* Gold divider */}
            <div className="mt-7 h-[3px] w-[66px] rounded-full bg-[#b78b45]" />

            {/* CTA */}
            <button
              type="button"
              className="
                                group
                                mt-7
                                inline-flex
                                items-center
                                gap-4
                                rounded-full
                                bg-[#4a3728]
                                px-6
                                py-3.5
                                text-[13px]
                                font-bold
                                text-white
                                shadow-[0_12px_25px_rgba(74,55,40,0.18)]
                                transition-all
                                duration-300
                                hover:-translate-y-1
                                hover:bg-[#5b4230]
                            "
            >
              Join Our Community

              <ArrowRight
                className="
                                    h-4
                                    w-4
                                    transition-transform
                                    duration-300
                                    group-hover:translate-x-1
                                "
              />
            </button>
          </div>


          {/* =================================================
                        CENTER — 3000+
                        IMPORTANT: NO CARD
                    ================================================== */}

          <div
            className="
                            relative
                            flex
                            h-[390px]
                            items-center
                            justify-center
                            lg:h-[420px]
                        "
          >

            {/* Large soft half-circle */}
            <div
              className="
                                absolute
                                left-1/2
                                top-1/2
                                h-[390px]
                                w-[390px]
                                -translate-x-1/2
                                -translate-y-1/2
                                rounded-full
                                bg-[#eee5da]
                                opacity-75
                            "
            />

            {/* Outer ring */}
            <div
              className="
                                absolute
                                left-1/2
                                top-1/2
                                h-[440px]
                                w-[440px]
                                -translate-x-1/2
                                -translate-y-1/2
                                rounded-full
                                border
                                border-[#d4af37]/15
                            "
            />

            {/* Inner ring */}
            <div
              className="
                                absolute
                                left-1/2
                                top-1/2
                                h-[350px]
                                w-[350px]
                                -translate-x-1/2
                                -translate-y-1/2
                                rounded-full
                                border
                                border-[#d4af37]/10
                            "
            />

            {/* Central content */}
            <div className="relative z-10 text-center">

              {/* Icon */}
              <div
                className="
                                    mx-auto
                                    mb-5
                                    flex
                                    h-[62px]
                                    w-[62px]
                                    items-center
                                    justify-center
                                    rounded-full
                                    border
                                    border-[#dccdbb]
                                    bg-[#FFF9EF]
                                    shadow-[0_8px_20px_rgba(74,55,40,0.08)]
                                "
              >
                <Users
                  className="h-8 w-8 text-[#a27d48]"
                />
              </div>

              {/* Number */}
              <h3
                className="
                                    text-[68px]
                                    font-black
                                    leading-none
                                    tracking-[-4px]
                                    text-[#4a3728]
                                    md:text-[72px]
                                "
              >
                3000<span className="text-[#8b7355]">+</span>
              </h3>

              <p
                className="
                                    mt-3
                                    text-[18px]
                                    font-bold
                                    text-[#4a3728]
                                "
              >
                Expert Members
              </p>

              <div className="mx-auto mt-5 h-[2px] w-[66px] bg-[#b78b45]" />

              <p
                className="
                                    mt-5
                                    text-[14px]
                                    leading-[1.55]
                                    text-[#75685d]
                                "
              >
                A growing community
                <br />
                of industry leaders
              </p>

            </div>
          </div>


          {/* =================================================
                        RIGHT — STACKED CARDS
                    ================================================== */}

          <div
            className="
                            relative
                            flex
                            flex-col
                            gap-5
                            border-l
                            border-[#d8c4aa]
                            pl-8
                            lg:pl-9
                        "
          >

            {/* =================================================
                            350K+
                        ================================================== */}

            <div
              className="
                                group
                                relative
                                rounded-[22px]
                                border
                                border-[#e5d9cc]
                                bg-[#FFFDF9]
                                px-6
                                py-6
                                shadow-[0_10px_30px_rgba(74,55,40,0.07)]
                                transition-all
                                duration-300
                                hover:-translate-y-1
                                hover:shadow-[0_18px_40px_rgba(74,55,40,0.12)]
                            "
            >

              <div className="flex items-start gap-5">

                <div
                  className="
                                        flex
                                        h-[58px]
                                        w-[58px]
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-[#f4eadc]
                                    "
                >
                  <Clock
                    className="h-7 w-7 text-[#9b7542]"
                  />
                </div>

                <div className="pt-1">

                  <h3
                    className="
                                            text-[43px]
                                            font-black
                                            leading-none
                                            tracking-[-2px]
                                            text-[#4a3728]
                                        "
                  >
                    350K<span className="text-[#8b7355]">+</span>
                  </h3>

                  <p
                    className="
                                            mt-1.5
                                            text-[15px]
                                            font-bold
                                            text-[#4a3728]
                                        "
                  >
                    Mentorship Minutes
                  </p>

                  <div className="mt-3 h-[2px] w-[55px] bg-[#b78b45]" />

                  <p
                    className="
                                            mt-3
                                            text-[13px]
                                            leading-[1.55]
                                            text-[#75685d]
                                        "
                  >
                    Hours of impactful
                    <br />
                    conversations
                  </p>

                </div>
              </div>
            </div>


            {/* =================================================
                            70+
                        ================================================== */}

            <div
              className="
                                group
                                relative
                                rounded-[22px]
                                border
                                border-[#e5d9cc]
                                bg-[#FFFDF9]
                                px-6
                                py-6
                                shadow-[0_10px_30px_rgba(74,55,40,0.07)]
                                transition-all
                                duration-300
                                hover:-translate-y-1
                                hover:shadow-[0_18px_40px_rgba(74,55,40,0.12)]
                            "
            >

              <div className="flex items-start gap-5">

                <div
                  className="
                                        flex
                                        h-[58px]
                                        w-[58px]
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-[#f4eadc]
                                    "
                >
                  <Briefcase
                    className="h-7 w-7 text-[#9b7542]"
                  />
                </div>

                <div className="pt-1">

                  <h3
                    className="
                                            text-[43px]
                                            font-black
                                            leading-none
                                            tracking-[-2px]
                                            text-[#4a3728]
                                        "
                  >
                    70<span className="text-[#8b7355]">+</span>
                  </h3>

                  <p
                    className="
                                            mt-1.5
                                            text-[15px]
                                            font-bold
                                            text-[#4a3728]
                                        "
                  >
                    Career Domains
                  </p>

                  <div className="mt-3 h-[2px] w-[55px] bg-[#b78b45]" />

                  <p
                    className="
                                            mt-3
                                            text-[13px]
                                            leading-[1.55]
                                            text-[#75685d]
                                        "
                  >
                    Explore opportunities
                    <br />
                    across diverse fields
                  </p>

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}