import React from "react";

export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fbf8f4", overflowX: "hidden" }}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .skel {
          background-color: #e6dccf;
          animation: skeletonPulse 1.6s ease-in-out infinite;
        }
        @media (max-width: 900px) {
          .mentor-layout-grid {
            grid-template-columns: 1fr !important;
          }
          .services-skeleton-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "100px 16px 24px" }}>
        {/* Back Button Skeleton */}
        <div style={{ marginBottom: "24px" }}>
          <div className="skel" style={{ width: "96px", height: "36px", borderRadius: "8px" }} />
        </div>

        {/* 2-Column Main Grid */}
        <div
          className="mentor-layout-grid"
          style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "24px", alignItems: "start" }}
        >
          {/* Left Column: Mentor Sidebar */}
          <div
            style={{
              backgroundColor: "#f5f0ea",
              border: "1px solid #e6dccf",
              borderRadius: "16px",
              overflow: "hidden",
              paddingBottom: "20px",
            }}
          >
            {/* Banner */}
            <div className="skel" style={{ width: "100%", height: "110px" }} />

            {/* Circular Avatar */}
            <div
              className="skel"
              style={{
                width: "92px",
                height: "92px",
                borderRadius: "50%",
                margin: "-46px auto 14px",
                border: "4px solid #f5f0ea",
              }}
            />

            {/* 3 Text Lines */}
            <div className="skel" style={{ width: "55%", height: "20px", borderRadius: "4px", margin: "0 auto 8px" }} />
            <div className="skel" style={{ width: "40%", height: "14px", borderRadius: "4px", margin: "0 auto 8px" }} />
            <div className="skel" style={{ width: "70%", height: "13px", borderRadius: "4px", margin: "0 auto 20px" }} />

            {/* 4 Small Stat Boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "0 18px" }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skel" style={{ height: "62px", borderRadius: "10px" }} />
              ))}
            </div>
          </div>

          {/* Right Column: Available Services & Reviews */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", minWidth: 0 }}>
            {/* Available Services Card */}
            <div
              style={{
                backgroundColor: "#f5f0ea",
                border: "1px solid #e6dccf",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div className="skel" style={{ width: "180px", height: "22px", borderRadius: "4px", marginBottom: "8px" }} />
              <div className="skel" style={{ width: "260px", height: "14px", borderRadius: "4px", marginBottom: "20px" }} />

              {/* 3 Filter Pills */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                {[84, 96, 76].map((w, idx) => (
                  <div key={idx} className="skel" style={{ width: `${w}px`, height: "32px", borderRadius: "16px" }} />
                ))}
              </div>

              {/* 2 Service Cards */}
              <div
                className="services-skeleton-grid"
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
              >
                {[1, 2].map((i) => (
                  <div key={i} className="skel" style={{ height: "170px", borderRadius: "12px" }} />
                ))}
              </div>
            </div>

            {/* Ratings & Reviews Card */}
            <div
              style={{
                backgroundColor: "#f5f0ea",
                border: "1px solid #e6dccf",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div className="skel" style={{ width: "160px", height: "22px", borderRadius: "4px", marginBottom: "14px" }} />
              <div className="skel" style={{ width: "100%", height: "90px", borderRadius: "10px" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
