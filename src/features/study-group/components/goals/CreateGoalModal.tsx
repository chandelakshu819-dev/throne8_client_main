"use client";

import React, { useState } from "react";

interface CreateGoalModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function CreateGoalModal({
  onClose,
  onSave,
}: CreateGoalModalProps) {
  const today = new Date().toISOString().split("T")[0];
  const defaultEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [form, setForm] = useState({
    title: "",
    description: "",
    targetHours: "",
    startDate: today,
    endDate: defaultEnd,
    category: "",
    tags: "",
    color: "#3b82f6",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const colors = [
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#ec4899",
    "#f97316",
    "#ef4444",
    "#14b8a6",
  ];

  const set = (key: string, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.targetHours || Number(form.targetHours) < 1) {
      setError("Target hours must be at least 1");
      return;
    }
    if (!form.startDate) {
      setError("Start date is required");
      return;
    }
    if (!form.endDate) {
      setError("End date is required");
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setError("End date must be after start date");
      return;
    }

    setLoading(true);
    const tagsArray = form.tags.trim()
      ? form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    await onSave({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      targetHours: Number(form.targetHours),
      startDate: form.startDate,
      endDate: form.endDate,
      category: form.category.trim() || undefined,
      tags: tagsArray,
      _color: form.color,
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[#f6ede8] rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6b5847] hover:text-[#4a3728] text-2xl font-bold"
        >
          ×
        </button>

        <h2 className="text-xl font-black text-[#4a3728] mb-5">
          Create new goal
        </h2>

        {error && (
          <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#4a3728] mb-1.5 uppercase tracking-wide">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                setError("");
              }}
              placeholder="e.g. Complete DSA Course"
              className="w-full px-3 py-2.5 bg-white border-2 border-[#d4c4b0] rounded-lg text-sm text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#4a3728] mb-1.5 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="e.g. Finish all DSA topics before placement"
              rows={2}
              className="w-full px-3 py-2.5 bg-white border-2 border-[#d4c4b0] rounded-lg text-sm text-[#4a3728] focus:outline-none focus:border-[#4a3728] resize-none"
            />
          </div>

          {/* Target hours */}
          <div>
            <label className="block text-xs font-bold text-[#4a3728] mb-1.5 uppercase tracking-wide">
              Target hours *
            </label>
            <input
              type="number"
              value={form.targetHours}
              onChange={(e) => {
                set("targetHours", e.target.value);
                setError("");
              }}
              placeholder="e.g. 100"
              min={1}
              max={10000}
              className="w-full px-3 py-2.5 bg-white border-2 border-[#d4c4b0] rounded-lg text-sm text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#4a3728] mb-1.5 uppercase tracking-wide">
                Start date *
              </label>
              <input
                type="date"
                value={form.startDate}
                min={new Date().toISOString().split("T")[0]} // ADD
                onChange={(e) => {
                  set("startDate", e.target.value);
                  setError("");
                }}
                className="w-full px-3 py-2.5 bg-white border-2 border-[#d4c4b0] rounded-lg text-sm text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4a3728] mb-1.5 uppercase tracking-wide">
                End date *
              </label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || new Date().toISOString().split("T")[0]} // ADD — end date start se pehle nahi
                onChange={(e) => {
                  set("endDate", e.target.value);
                  setError("");
                }}
                className="w-full px-3 py-2.5 bg-white border-2 border-[#d4c4b0] rounded-lg text-sm text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-[#4a3728] mb-1.5 uppercase tracking-wide">
              Category
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="e.g. Programming"
              className="w-full px-3 py-2.5 bg-white border-2 border-[#d4c4b0] rounded-lg text-sm text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-[#4a3728] mb-1.5 uppercase tracking-wide">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="dsa, placement, coding"
              className="w-full px-3 py-2.5 bg-white border-2 border-[#d4c4b0] rounded-lg text-sm text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-bold text-[#4a3728] mb-2 uppercase tracking-wide">
              Color
            </label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => set("color", c)}
                  className={`w-8 h-8 rounded-full transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-[#4a3728] scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border-2 border-[#d4c4b0] text-[#4a3728] rounded-lg text-sm font-semibold hover:bg-[#e0d8cf] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 bg-gradient-to-r from-[#4a3728] to-[#6b4e3d] text-[#f6ede8] rounded-lg text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create goal"}
          </button>
        </div>
      </div>
    </div>
  );
}
