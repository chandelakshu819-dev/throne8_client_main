"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Clock, Globe, Calendar, ChevronLeft, ChevronRight,
  Shield, Trash2, Plus, X, BarChart2, RefreshCw, Ban
} from "lucide-react";
import SeniorAvailabilityService, { SeniorAvailabilityConfig } from "@/lib/api/seniorAvailability.service";

interface SeniorMentorAvailabilityPageProps {
  mentorData?: any;
}

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_WEEK_SCHEDULE = ALL_DAYS.map(day => ({
  day,
  enabled: ["Saturday", "Sunday"].indexOf(day) === -1,
  timeRanges: [{ startTime: "09:00", endTime: "17:00" }]
}));

export default function SeniorMentorAvailabilityPage({ mentorData }: SeniorMentorAvailabilityPageProps) {
  // ── State ─────────────────────────────────────────
  const [config, setConfig] = useState<SeniorAvailabilityConfig | null>(null);
  const [weekSchedule, setWeekSchedule] = useState(DEFAULT_WEEK_SCHEDULE);
  const [slotInterval, setSlotInterval] = useState(30);
  const [breakDuration, setBreakDuration] = useState(0);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [showBlockDateInput, setShowBlockDateInput] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockStart, setNewBlockStart] = useState("09:00");
  const [newBlockEnd, setNewBlockEnd] = useState("17:00");
  const [newBlockReason, setNewBlockReason] = useState("");

  // ── Fetch Config ─────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const dbConfig = await SeniorAvailabilityService.getConfig();
      if (dbConfig) {
        setConfig(dbConfig);
        setTimezone(dbConfig.timezone || timezone);
        setSlotInterval(dbConfig.slotInterval || 30);
        setBreakDuration(dbConfig.breakDuration || 0);
        
        if (dbConfig.weeklySchedule && dbConfig.weeklySchedule.length > 0) {
            // merge missing days just in case
            const merged = ALL_DAYS.map(day => {
                const found = dbConfig.weeklySchedule.find(d => d.day === day);
                return found || { day, enabled: false, timeRanges: [{ startTime: "09:00", endTime: "17:00" }] };
            });
            setWeekSchedule(merged);
        }
      }
    } catch (err: any) {
      console.error("Fetch availability config failed:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [timezone]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  useEffect(() => {
    if (!saveMessage) return;
    const t = setTimeout(() => setSaveMessage(null), 5000);
    return () => clearTimeout(t);
  }, [saveMessage]);

  // ── Save Config ───────────────────────────────────────
  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await SeniorAvailabilityService.updateConfig({
        timezone,
        slotInterval,
        breakDuration,
        weeklySchedule: weekSchedule
      });
      setSaveMessage({ type: "success", text: "Availability configuration saved successfully." });
      await fetchConfig();
    } catch (error: any) {
      setSaveMessage({ type: "error", text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Block Dates Logics ────────────────────────────────
  const handleAddBlockedDate = async () => {
    if (!newBlockDate) {
        setSaveMessage({ type: "error", text: "Please select a date." });
        return;
    }
    try {
      await SeniorAvailabilityService.addBlockedTime(newBlockDate, newBlockStart, newBlockEnd, newBlockReason);
      setSaveMessage({ type: "success", text: `Blocked time added for ${newBlockDate}` });
      setNewBlockDate("");
      setNewBlockReason("");
      setShowBlockDateInput(false);
      await fetchConfig();
    } catch (error: any) {
      setSaveMessage({ type: "error", text: error.message });
    }
  };

  const handleRemoveBlockedDate = async (id: string) => {
    try {
      await SeniorAvailabilityService.removeBlockedTime(id);
      setSaveMessage({ type: "success", text: "Blocked time removed." });
      await fetchConfig();
    } catch (error: any) {
      setSaveMessage({ type: "error", text: error.message });
    }
  };

  const copyMondayToAll = () => {
    const mon = weekSchedule.find(d => d.day === "Monday");
    if (!mon) return;
    setWeekSchedule(prev => prev.map(d => ({ ...d, timeRanges: mon.timeRanges })));
  };

  // ── Schedule Edit Helper ───────────────────────────────
  const handleTimeChange = (dayIndex: number, rangeIndex: number, field: 'startTime'|'endTime', value: string) => {
      const newSchedule = [...weekSchedule];
      newSchedule[dayIndex].timeRanges[rangeIndex][field] = value;
      setWeekSchedule(newSchedule);
  };
  
  const handleToggleDay = (dayIndex: number) => {
      const newSchedule = [...weekSchedule];
      newSchedule[dayIndex].enabled = !newSchedule[dayIndex].enabled;
      setWeekSchedule(newSchedule);
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {saveMessage && (
        <div
          className="fixed top-5 right-5 z-[500] px-5 py-3.5 rounded-xl text-sm font-semibold shadow-lg max-w-sm"
          style={{
            backgroundColor: saveMessage.type === "success" ? '#dcfce7' : '#fee2e2',
            color: saveMessage.type === "success" ? '#15803d' : '#dc2626',
            border: `1px solid ${saveMessage.type === "success" ? '#86efac' : '#fca5a5'}`,
          }}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#1e293b]">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Senior Mentor Availability</h2>
            <p className="text-slate-500 text-sm">Configure your rule-based availability schedule</p>
          </div>
        </div>
        <button
          onClick={fetchConfig}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-slate-100 border border-slate-200 text-slate-700"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Config cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Slot & Break */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-800">
                <Clock className="w-4 h-4 text-slate-600" /> Slot & Break Duration
              </h3>
              <div className="flex gap-4">
                  <div className="flex-1">
                      <label className="text-xs text-slate-500 font-semibold mb-1 block">Slot Interval (mins)</label>
                      <select
                        value={slotInterval}
                        onChange={e => setSlotInterval(parseInt(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg text-sm font-semibold outline-none border border-slate-200 bg-slate-50 text-slate-700"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>60 minutes</option>
                      </select>
                  </div>
                  <div className="flex-1">
                      <label className="text-xs text-slate-500 font-semibold mb-1 block">Break Between (mins)</label>
                      <select
                        value={breakDuration}
                        onChange={e => setBreakDuration(parseInt(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg text-sm font-semibold outline-none border border-slate-200 bg-slate-50 text-slate-700"
                      >
                        <option value={0}>No Break</option>
                        <option value={5}>5 minutes</option>
                        <option value={10}>10 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                      </select>
                  </div>
              </div>
            </div>

            {/* Timezone */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-slate-800">
                <Globe className="w-4 h-4 text-slate-600" /> Timezone
              </h3>
              <label className="text-xs text-slate-500 font-semibold mb-1 block">Your Local Timezone</label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-semibold outline-none border border-slate-200 bg-slate-50 text-slate-700"
              >
                <option value="Asia/Kolkata">IST (GMT+5:30) Asia/Kolkata</option>
                <option value="America/New_York">EST (GMT-5:00) America/New_York</option>
                <option value="America/Los_Angeles">PST (GMT-8:00) America/Los_Angeles</option>
                <option value="Europe/Paris">CET (GMT+1:00) Europe/Paris</option>
                <option value="UTC">UTC</option>
                <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>{Intl.DateTimeFormat().resolvedOptions().timeZone} (Auto)</option>
              </select>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-base font-bold text-slate-800">Weekly Schedule</h3>
              <button
                onClick={copyMondayToAll}
                className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90 bg-slate-800 text-white"
              >
                <Calendar className="w-4 h-4" /> Copy Monday → All
              </button>
            </div>

            <div className="space-y-4 mt-6">
              {weekSchedule.map((d, dayIdx) => (
                <div key={d.day} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="w-32 flex items-center gap-3 pt-1">
                    <input 
                        type="checkbox" 
                        checked={d.enabled} 
                        onChange={() => handleToggleDay(dayIdx)} 
                        className="w-4 h-4 rounded text-slate-800 focus:ring-slate-800"
                    />
                    <span className={`font-semibold text-sm ${d.enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                        {d.day}
                    </span>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    {d.enabled ? (
                        d.timeRanges.map((range, rangeIdx) => (
                            <div key={rangeIdx} className="flex items-center gap-3 w-full max-w-sm">
                                <input 
                                    type="time" 
                                    value={range.startTime}
                                    onChange={(e) => handleTimeChange(dayIdx, rangeIdx, 'startTime', e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold outline-none border border-slate-200 bg-white"
                                />
                                <span className="text-slate-400 font-bold">-</span>
                                <input 
                                    type="time" 
                                    value={range.endTime}
                                    onChange={(e) => handleTimeChange(dayIdx, rangeIdx, 'endTime', e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold outline-none border border-slate-200 bg-white"
                                />
                            </div>
                        ))
                    ) : (
                        <span className="text-slate-400 text-sm font-medium italic pt-1 inline-block">Unavailable</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
                <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-70 transition-all"
                >
                {isSaving ? "Saving Config..." : "Save Configuration"}
                </button>
            </div>
          </div>
        </div>

        {/* ── Right Section (Blocked Dates & Exceptions) ──────────────────────────────── */}
        <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Ban className="w-4 h-4 text-red-500" /> Date Overrides / Block
                    </h3>
                    <button
                        onClick={() => setShowBlockDateInput(!showBlockDateInput)}
                        className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200"
                    >
                        + Add Block
                    </button>
                </div>

                {showBlockDateInput && (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4 space-y-3">
                        <div>
                            <label className="text-xs text-red-800 font-semibold mb-1 block">Date to Block</label>
                            <input 
                                type="date" 
                                value={newBlockDate} 
                                onChange={e => setNewBlockDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 outline-none"
                            />
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-xs text-red-800 font-semibold mb-1 block">Start Time</label>
                                <input type="time" value={newBlockStart} onChange={e => setNewBlockStart(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 outline-none" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-red-800 font-semibold mb-1 block">End Time</label>
                                <input type="time" value={newBlockEnd} onChange={e => setNewBlockEnd(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-red-800 font-semibold mb-1 block">Reason (Optional)</label>
                            <input 
                                type="text" 
                                placeholder="eg. Doctor appointment"
                                value={newBlockReason} 
                                onChange={e => setNewBlockReason(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 outline-none"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={handleAddBlockedDate} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg">Save Block</button>
                            <button onClick={() => setShowBlockDateInput(false)} className="flex-1 bg-white text-slate-600 border border-slate-200 text-xs font-bold py-2 rounded-lg hover:bg-slate-50">Cancel</button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {config?.blockedTimes && config.blockedTimes.length > 0 ? (
                        config.blockedTimes.map(block => (
                            <div key={block._id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center group">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{block.date}</p>
                                    <p className="text-xs text-slate-500 font-semibold">{block.startTime} - {block.endTime}</p>
                                    {block.reason && <p className="text-xs text-slate-400 mt-1 truncate max-w-[150px]">{block.reason}</p>}
                                </div>
                                <button 
                                    onClick={() => block._id && handleRemoveBlockedDate(block._id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-slate-400 font-medium text-center py-6 italic">No dates blocked.</p>
                    )}
                </div>
            </div>

            <div className="bg-[#f8f9fa] p-5 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-600" /> How this works
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Unlike standard mentor availability, Senior Mentor availability uses a <b>rules-based engine</b>. 
                    <br/><br/>
                    When a junior views your profile, the system dynamically calculates available times by combining your weekly schedule with your scheduled Senior Sessions. 
                    <br/><br/>
                    Booked slots are automatically removed without generating thousands of static calendar entries.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
