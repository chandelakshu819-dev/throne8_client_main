
//src/app/studyGroup/study/my-groups/page.tsx
'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Crown, Calendar, Clock, Camera, CameraOff, Globe, Lock,
  UserPlus, Settings, LogOut, MoreVertical, Target, TrendingUp,
  Award, MessageCircle, Bell, Search, Filter, ChevronRight, X,
  Trash2, Edit, CheckCircle, ChevronDown,
  Check
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/core/store/store.hooks";
import { updateGroup, deleteGroup, leaveGroup, selectMyGroups, selectMyGroupsLoading, selectGroupMembers, selectGroupMembersLoading, selectAllUsers, selectAllUsersLoading, selectPendingRequests, selectPendingRequestsLoading, selectRespondToRequestLoading, selectAttendanceStatus, selectAttendancePercentage } from "@/hooks/studyGroup/features/groups/groupsSlice";
import { deleteGroupThunk, fetchAllUsersThunk, fetchAttendancePercentageThunk, fetchAttendanceStatusThunk, fetchMyGroupsThunk, getGroupPendingRequestsThunk, leaveGroupThunk, removeMemberThunk, respondToJoinRequestThunk, updateGroupThunk } from "@/hooks/studyGroup/features/groups/group.thunks";
import {useAuth} from "@/features/auth/hooks/useAuth";
import { selectTimerStats } from "@/hooks/studyGroup/features/timer/timerSlice";
import { getTimerStatsThunk } from "@/hooks/studyGroup/features/timer/timer.thunks";
import { GroupVisibility } from "@/lib/api/studyGroup.service";
import { useGroupData } from "@/features/study-group/hooks/useGroupData";
import { FormData, Group, Member, SettingsModalProps } from "@/features/study-group/interface";



// ─── SettingsModal (100% unchanged) ───────────────────────────
const SettingsModal: React.FC<SettingsModalProps> = ({ userId, isOpen, onClose, group, onUpdate, onDelete, onLeave }) => {
  const dispatch = useAppDispatch();
  const { fetchGroupMembers: fetchEnrichedMembers, groupMembers: enrichedMembers, isLoadingGroupMembers: enrichedLoading, getUserInfoSync } = useGroupData();
  const groupMembers = enrichedMembers; // hook se
  const membersLoading = enrichedLoading; // hook se
  const allUsers = useAppSelector(selectAllUsers);
  const [showRequestsDropdown, setShowRequestsDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const pendingRequestsMap = useAppSelector(selectPendingRequests);
  const pendingRequestsLoading = useAppSelector(selectPendingRequestsLoading);
  const respondLoading = useAppSelector(selectRespondToRequestLoading);

  // Current group ki pending requests
  const pendingRequests = pendingRequestsMap[(group as any)?.groupId] ?? [];
  const [formData, setFormData] = useState<FormData>({
    title: group?.title || '',
    description: group?.description || '',
    category: group?.category || '',
    goalHours: group?.goalHours || 8,
    capacity: group?.capacity || 20,
    cameraRequired: group?.cameraRequired || false,
    attendanceRequired: (group as any)?.attendanceRequired || false,
    minAttendancePercent: (group as any)?.minAttendancePercent ?? null,
    visibility: group?.visibility || 'public',
  });

  useEffect(() => {
    if (group) {
      setFormData({
        title: group.title || '',
        description: group.description || '',
        category: group.category || '',
        goalHours: group.goalHours || 8,
        capacity: group.capacity || 20,
        cameraRequired: group.cameraRequired || false,
        attendanceRequired: (group as any)?.attendanceRequired || false,
        minAttendancePercent: (group as any)?.minAttendancePercent ?? null,
        visibility: group.visibility || 'public',
      });
    }
  }, [(group as any)?.groupId]);

  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: "Priya Sharma", avatar: "👩‍🎓", joinedDate: "2024-01-10", studyTime: 145, attendance: 95, streak: 15, rank: 1, violations: 0, lastActive: "2 hours ago" },
    { id: 2, name: "Rahul Kumar", avatar: "👨‍💻", joinedDate: "2024-01-12", studyTime: 98, attendance: 78, streak: 8, rank: 4, violations: 2, lastActive: "1 day ago" },
    { id: 3, name: "Ananya Gupta", avatar: "👩‍💼", joinedDate: "2024-01-08", studyTime: 167, attendance: 92, streak: 20, rank: 2, violations: 0, lastActive: "30 mins ago" },
    { id: 4, name: "Vikram Singh", avatar: "👨‍🔬", joinedDate: "2024-01-15", studyTime: 72, attendance: 65, streak: 5, rank: 6, violations: 3, lastActive: "3 days ago" },
  ]);

  const categories: string[] = [
    'JEE Aspirant', 'NEET Aspirant', 'UPSC Preparation', 'College Student',
    'Professional', 'Language Learning', 'Coding & Tech', 'Other'
  ];

  const handleRemoveMember = (memberId: string): void => {
    if (window.confirm('Remove this member from group?')) {
      dispatch(removeMemberThunk({ groupId: (group as any).groupId, userId: memberId }))
        .unwrap()
        .then(() => {
          fetchEnrichedMembers((group as any).groupId); 
        })
        .catch((err: any) => alert(err));
    }
  };

  const handleSave = (): void => { if (group) { onUpdate((group as any).groupId, formData); onClose(); } };
  const handleDelete = (): void => { if (group && window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) { onDelete((group as any).groupId); onClose(); } };
  const handleLeave = (): void => { if (group && window.confirm('Are you sure you want to leave this group?')) { onLeave((group as any).groupId); onClose(); } };

  const handleRespondRequest = async (
    joinRequestId: string,
    action: 'approve' | 'reject'
  ): Promise<void> => {
    dispatch(respondToJoinRequestThunk({
      joinRequestId,
      groupId: (group as any).groupId,
      action,
    }))
      .unwrap()
      .then(() => {
        if (action === 'approve') {
          fetchEnrichedMembers((group as any).groupId);
        }
      })
      .catch((err: any) => alert(err));
  };

  const handleKickMember = (memberId: number, memberName: string): void => { if (window.confirm(`Are you sure you want to remove ${memberName} from the group?`)) { setMembers(members.filter(m => m.id !== memberId)); } };
  const handleWarnMember = (memberId: number, memberName: string): void => { if (window.confirm(`Send a warning to ${memberName}?`)) { alert(`Warning sent to ${memberName}`); } };


  const getUserInfo = (userId: string) => {
    const dataatGetUserInfo = getUserInfoSync(userId);

    return dataatGetUserInfo;
  };



  useEffect(() => {
    if (isOpen && group) {
      fetchEnrichedMembers((group as any).groupId);
      dispatch(fetchAllUsersThunk());
      if ((group as any).leaderId === userId) {
        dispatch(getGroupPendingRequestsThunk({ groupId: (group as any).groupId }));
      }
    }
  }, [isOpen, (group as any)?.groupId, dispatch]);

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#e0d8cf] p-3 sm:p-4 flex justify-between items-start sm:items-center rounded-t-xl sm:rounded-t-2xl z-10">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-lg sm:text-xl font-bold text-[#4a3728] truncate">{group.leaderId === userId ? 'Group Management' : 'Group Info'}</h2>
            <p className="text-xs sm:text-sm text-[#6b5847] truncate">{group.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1"><X size={20} className="sm:w-6 sm:h-6" /></button>
        </div>

        {group.leaderId === userId ? (
          <>
            <div className="border-b border-[#e0d8cf] bg-[#f6ede8] px-2 sm:px-4 overflow-x-auto">
              <div
                className="flex gap-1 sm:gap-2 min-w-max sm:min-w-0">
                {['overview', 'members', 'settings'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setIsEditing(false); }}
                    className={`px-3 sm:px-4 py-2 sm:py-3 font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${activeTab === tab ? 'border-b-4 border-[#8b7355] text-[#4a3728]' : 'text-[#6b5847] hover:text-[#4a3728]'}`}>
                    {/* {tab === 'members' ? `Members (${members.length})` :  */}
                    {tab === 'members' ? `Members (${groupMembers.length || (group as any).currentMemberCount})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 sm:p-4 md:p-6">
              {activeTab === 'overview' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                    {[

                      { label: 'Total Members', value: (group as any).currentMemberCount ?? groupMembers.length },
                      { label: 'Avg Attendance', value: `${Math.round(members.reduce((acc, m) => acc + m.attendance, 0) / members.length)}%` },
                      { label: 'Visibility', value: group.visibility },
                      { label: 'Violations', value: members.filter(m => m.violations > 0).length },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-[#f6ede8] rounded-lg p-2 sm:p-3 border border-[#e0d8cf]">
                        <div className="text-xl sm:text-2xl font-bold text-[#4a3728]">{value}</div>
                        <div className="text-[10px] sm:text-xs text-[#6b5847] mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#4a3728] mb-2">Top Performers (by join date)</h3>
                    <div className="space-y-2">
                      {membersLoading ? (
                        <div className="text-xs text-[#6b5847] text-center py-2">Loading...</div>
                      ) :
                        groupMembers.slice(0, 3).map((member: any, index: any) => {
                          const userInfo = getUserInfo(member.userId);
                          return (
                            <div key={member.userId} className="flex items-center gap-2 p-2 bg-[#f6ede8] rounded-lg text-sm">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold bg-[#8b7355] text-white text-xs flex-shrink-0">{index + 1}</div>
                              {userInfo.avatar ? (
                                <img src={userInfo.avatar} alt={userInfo.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-[#e0d8cf] flex items-center justify-center text-[#F4a3728] text-xs font-bold flex-shrink-0">
                                  {userInfo.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[#4a3728] text-xs sm:text-sm truncate flex items-center gap-1">
                                  {member.userId === userId ? (
                                    <>
                                      <span>You</span>
                                    </>
                                  ) : (
                                    userInfo.name
                                  )}
                                </div>
                                <div className="text-[10px] sm:text-xs text-[#6b5847]">
                                  {member.role === 'leader' ? '👑 Leader' : 'Member'} • Joined {new Date(member.joinedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      {!membersLoading && groupMembers.length === 0 && (
                        <div className="text-xs text-[#6b5847] text-center py-2">No members found</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#4a3728] mb-2">Needs Attention</h3>
                    {members.filter(m => m.attendance < 80 || m.violations > 0).length > 0 ? (
                      <div className="space-y-2">
                        {members.filter(m => m.attendance < 80 || m.violations > 0).map((member) => (
                          <div key={member.id} className="flex items-center gap-2 p-2 bg-[#f6ede8] rounded-lg border border-[#e0d8cf] text-sm">
                            <div className="text-base sm:text-lg">{member.avatar}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-[#4a3728] text-xs sm:text-sm truncate">{member.name}</div>
                              <div className="text-[10px] sm:text-xs text-[#6b5847]">
                                {member.attendance < 80 && `${member.attendance}% attendance`}
                                {member.attendance < 80 && member.violations > 0 && ' • '}
                                {member.violations > 0 && `${member.violations} violation(s)`}
                              </div>
                            </div>
                            <button onClick={() => handleWarnMember(member.id, member.name)} className="px-2 py-1 bg-[#8b7355] hover:bg-[#6b5847] text-white rounded text-xs font-semibold flex-shrink-0">Warn</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 sm:py-4 text-xs sm:text-sm text-[#6b5847] bg-[#f6ede8] rounded-lg">All members performing well</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-bold text-[#4a3728]">All Members</h3>
                    <div className="text-xs text-[#6b5847]">
                      {groupMembers.length || (group as any).currentMemberCount} / {group.capacity} members
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {membersLoading ? (
                      <div className="text-xs text-center py-4 text-[#6b5847]">Loading members...</div>
                    ) : groupMembers.length === 0 ? (
                      <div className="text-xs text-center py-4 text-[#6b5847]">No members found</div>
                    ) : groupMembers.map((member: any) => {
                      const userInfo = getUserInfo(member.userId);
                     
                      return (
                        <div key={member.userId} className="p-2 sm:p-3 bg-[#f6ede8] rounded-lg hover:bg-[#e0d8cf] transition-all border border-[#e0d8cf]">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {userInfo.avatar ? (
                                <img src={userInfo.avatar} alt={userInfo.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#e0d8cf] flex items-center justify-center text-xs font-bold text-[#4a3728] flex-shrink-0">
                                  {userInfo.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-[#4a3728] text-xs sm:text-sm truncate flex items-center gap-1">
                                  {member.userId === userId ? (
                                    <>
                                      <span>You</span>
                                    </>
                                  ) : (
                                    userInfo.name
                                  )}
                                </div>
                                <div className="text-[10px] sm:text-xs text-[#6b5847]">
                                  {member.role === 'leader' ? '👑 Leader' : 'Member'} • Joined {new Date(member.joinedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            {(group as any).leaderId === userId && member.userId !== userId && (

                              <button
                                onClick={() => handleRemoveMember(member.userId)}
                                className="px-2 py-1 bg-[#6b5847] hover:bg-[#4a3728] text-white rounded text-xs font-semibold flex items-center gap-1 flex-shrink-0 ml-2"
                              >
                                <X size={10} /> Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-2 border-t border-[#e0d8cf]">
                            <div>
                              <div className="text-[10px] sm:text-xs text-[#6b5847]">Role</div>
                              <div className="text-xs sm:text-sm font-bold text-[#4a3728] capitalize">{member.role}</div>
                            </div>
                            <div>
                              <div className="text-[10px] sm:text-xs text-[#6b5847]">Study Time</div>
                              <div className="text-xs sm:text-sm font-bold text-[#4a3728]">—</div>
                            </div>
                            <div>
                              <div className="text-[10px] sm:text-xs text-[#6b5847]">Attendance</div>
                              <div className="text-xs sm:text-sm font-bold text-[#4a3728]">—</div>
                            </div>
                            <div>
                              <div className="text-[10px] sm:text-xs text-[#6b5847]">Streak</div>
                              <div className="text-xs sm:text-sm font-bold text-[#4a3728]">—</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (() => {

                return (
                  <div className="space-y-3">
                    {/* Edit mode header */}
                    {isEditing && (
                      <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <span className="text-xs text-amber-700 font-semibold">Editing mode — unsaved changes</span>
                        <div className="flex gap-2">
                          <button
                          
                            onClick={() => {
                              setIsEditing(false);
                              setFormData({
                                title: group?.title || '',
                                description: group?.description || '',
                                category: group?.category || '',
                                goalHours: group?.goalHours || 8,
                                capacity: group?.capacity || 20,
                                cameraRequired: group?.cameraRequired || false,
                                attendanceRequired: (group as any)?.attendanceRequired || false,
                                minAttendancePercent: (group as any)?.minAttendancePercent ?? null,
                                visibility: group?.visibility || 'public'
                              });
                            }}
                            className="p-1.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-all"
                            title="Cancel"
                          >
                            <X size={14} className="text-gray-600" />
                          </button>
                          <button
                            onClick={() => { handleSave(); setIsEditing(false); }}
                            className="p-1.5 bg-[#8b7355] hover:bg-[#6b5847] rounded-lg transition-all"
                            title="Save"
                          >
                            <CheckCircle size={14} className="text-white" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#4a3728] mb-1">Group Title</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setIsEditing(true); }}
                          onDoubleClick={() => setIsEditing(true)}
                          readOnly={!isEditing}
                          className={`w-full px-3 py-2 border-2 rounded-lg outline-none text-xs sm:text-sm text-[#4a3728] bg-white ${isEditing ? 'border-[#8b7355] cursor-text' : 'border-[#e0d8cf] cursor-default'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4a3728] mb-1">Category</label>
                        <select
                          value={formData.category}
                          onChange={(e) => { setFormData({ ...formData, category: e.target.value }); setIsEditing(true); }}
                          disabled={!isEditing}
                          className={`w-full px-3 py-2 border-2 rounded-lg outline-none text-xs sm:text-sm text-[#4a3728] bg-white ${isEditing ? 'border-[#8b7355]' : 'border-[#e0d8cf] opacity-80'}`}
                        >
                          {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#4a3728] mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setIsEditing(true); }}
                        onDoubleClick={() => setIsEditing(true)}
                        readOnly={!isEditing}
                        rows={2}
                        className={`w-full px-3 py-2 border-2 rounded-lg outline-none text-xs sm:text-sm text-[#4a3728] bg-white resize-none ${isEditing ? 'border-[#8b7355] cursor-text' : 'border-[#e0d8cf] cursor-default'}`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#4a3728] mb-1">Daily Goal (hrs)</label>
                        <input
                          type="number" min="1" max="24"
                          value={formData.goalHours}
                          onChange={(e) => { setFormData({ ...formData, goalHours: parseInt(e.target.value) || 8 }); setIsEditing(true); }}
                          onDoubleClick={() => setIsEditing(true)}
                          readOnly={!isEditing}
                          className={`w-full px-3 py-2 border-2 rounded-lg outline-none text-xs sm:text-sm text-[#4a3728] bg-white ${isEditing ? 'border-[#8b7355] cursor-text' : 'border-[#e0d8cf] cursor-default'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4a3728] mb-1">Capacity</label>
                        <input
                          type="number" min="5" max="100"
                          value={formData.capacity}
                          onChange={(e) => { setFormData({ ...formData, capacity: parseInt(e.target.value) || 20 }); setIsEditing(true); }}
                          onDoubleClick={() => setIsEditing(true)}
                          readOnly={!isEditing}
                          className={`w-full px-3 py-2 border-2 rounded-lg outline-none text-xs sm:text-sm text-[#4a3728] bg-white ${isEditing ? 'border-[#8b7355] cursor-text' : 'border-[#e0d8cf] cursor-default'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4a3728] mb-1">Visibility</label>
                        <select
                          value={formData.visibility}
                          onChange={(e) => { setFormData({ ...formData, visibility: e.target.value as 'public' | 'private' }); setIsEditing(true); }}
                          disabled={!isEditing}
                          className={`w-full px-3 py-2 border-2 rounded-lg outline-none text-xs sm:text-sm text-[#4a3728] bg-white ${isEditing ? 'border-[#8b7355]' : 'border-[#e0d8cf] opacity-80'}`}
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 sm:p-3 bg-[#f6ede8] rounded-lg">
                      <div className="flex items-center gap-2">
                        <Camera className="text-[#4a3728]" size={14} />
                        <div className="text-xs sm:text-sm font-semibold text-[#4a3728]">Camera Required</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { if (isEditing) setFormData({ ...formData, cameraRequired: !formData.cameraRequired }); }}
                        className={`w-10 h-5 sm:w-11 sm:h-6 rounded-full transition-all ${formData.cameraRequired ? 'bg-[#8b7355]' : 'bg-gray-300'} ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full transition-all ${formData.cameraRequired ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {/* Attendance Required toggle */}
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-[#f6ede8] rounded-lg">
                      <div className="flex items-center gap-2">
                        <Award className="text-[#4a3728]" size={14} />
                        <div className="text-xs sm:text-sm font-semibold text-[#4a3728]">Attendance Required</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { if (isEditing) setFormData({ ...formData, attendanceRequired: !formData.attendanceRequired }); }}
                        className={`w-10 h-5 sm:w-11 sm:h-6 rounded-full transition-all ${formData.attendanceRequired ? 'bg-[#8b7355]' : 'bg-gray-300'} ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full transition-all ${formData.attendanceRequired ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {/* Min Attendance % */}
                    {formData.attendanceRequired && (
                      <div>
                        <label className="block text-xs font-semibold text-[#4a3728] mb-1">Min Attendance %</label>
                        <input
                          type="number" min="50" max="100"
                          value={formData.minAttendancePercent ?? 75}
                          onChange={(e) => { setFormData({ ...formData, minAttendancePercent: parseInt(e.target.value) || 75 }); setIsEditing(true); }}
                          readOnly={!isEditing}
                          className={`w-full px-3 py-2 border-2 rounded-lg outline-none text-xs sm:text-sm text-[#4a3728] bg-white ${isEditing ? 'border-[#8b7355] cursor-text' : 'border-[#e0d8cf] cursor-default'}`}
                        />
                      </div>
                    )}

                    {/* Join Code */}
                    {formData.visibility == GroupVisibility.PRIVATE ?
                      <div className="pt-3 border-t border-[#e0d8cf]">
                        <label className="block text-xs font-semibold text-[#4a3728] mb-1.5 uppercase tracking-wide">
                          Join Code
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={(group as any).joinCode ?? 'N/A'}
                            readOnly
                            className="flex-1 px-3 py-2 border-2 border-[#e0d8cf] rounded-lg text-xs text-[#4a3728] bg-[#f6ede8] cursor-default font-mono tracking-widest"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText((group as any).joinCode ?? '');
                              alert('Join code copied!');
                            }}
                            className="px-3 py-2 bg-[#8b7355] text-white rounded-lg text-xs font-semibold hover:bg-[#6b5847] transition-all flex-shrink-0"
                          >
                            Copy
                          </button>
                        </div>
                      </div> : ""}

                    {/* Join Requests */}
                    <div className="pt-3">
                      <label className="block text-xs font-semibold text-[#4a3728] mb-1.5 uppercase tracking-wide">
                        Join Requests
                        {pendingRequests.length > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 bg-[#8b7355] text-white rounded-full text-[10px]">
                            {pendingRequests.length}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <button
                          onClick={() => {
                            setShowRequestsDropdown(!showRequestsDropdown);
                            if (!showRequestsDropdown) {
                              dispatch(getGroupPendingRequestsThunk({
                                groupId: (group as any).groupId
                              }));
                            }
                          }}
                          className="w-full px-3 py-2 border-2 border-[#e0d8cf] rounded-lg text-xs text-[#6b5847] bg-white flex items-center justify-between hover:border-[#8b7355] transition-all"
                        >
                          <span>
                            {pendingRequestsLoading
                              ? 'Loading...'
                              : `${pendingRequests.length} pending request${pendingRequests.length !== 1 ? 's' : ''}`
                            }
                          </span>
                          <ChevronDown
                            size={14}
                            className={`transition-transform ${showRequestsDropdown ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {showRequestsDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#e0d8cf] rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                            {pendingRequestsLoading ? (
                              <div className="p-3 text-xs text-[#6b5847] text-center">
                                Loading requests...
                              </div>
                            ) : pendingRequests.length === 0 ? (
                              <div className="p-3 text-xs text-[#6b5847] text-center italic">
                                No pending join requests
                              </div>
                            ) : (
                              pendingRequests.map((request) => {
                                const userInfo = getUserInfo(request.userId);
                                return (
                                  <div
                                    key={request.joinRequestId}
                                    className="px-3 py-2.5 hover:bg-[#f6ede8] border-b border-[#e0d8cf] last:border-0"
                                  >
                                    <div className="flex items-center gap-2">
                                      {userInfo.avatar ? (
                                        <img
                                          src={userInfo.avatar}
                                          alt={userInfo.name}
                                          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                        />
                                      ) : (
                                        <div className="w-7 h-7 rounded-full bg-[#e0d8cf] flex items-center justify-center text-[10px] font-bold text-[#4a3728] flex-shrink-0">
                                          {userInfo.name?.slice(0, 2).toUpperCase() ?? 'U'}
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-[#4a3728] truncate">
                                          {userInfo.name ?? 'Unknown User'}
                                        </div>
                                        {request.message && (
                                          <div className="text-[10px] text-[#6b5847] truncate italic">
                                            "{request.message}"
                                          </div>
                                        )}
                                        <div className="text-[10px] text-[#a89080]">
                                          {new Date(request.createdAt).toLocaleDateString()}
                                        </div>
                                      </div>
                                      <div className="flex gap-1 flex-shrink-0">
                                        <button
                                          onClick={() => handleRespondRequest(request.joinRequestId, 'approve')}
                                          disabled={respondLoading}
                                          className="w-7 h-7 flex items-center justify-center bg-green-100 hover:bg-green-200 rounded-full text-green-700 disabled:opacity-50 transition-all"
                                          title="Approve"
                                        >
                                          <Check size={12} />
                                        </button>
                                        <button
                                          onClick={() => handleRespondRequest(request.joinRequestId, 'reject')}
                                          disabled={respondLoading}
                                          className="w-7 h-7 flex items-center justify-center bg-red-100 hover:bg-red-200 rounded-full text-red-600 disabled:opacity-50 transition-all"
                                          title="Reject"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className=" pt-2 border-t border-[#e0d8cf] space-y-2">
                      {/* Update button — disabled when editing */}
                      <button
                        onClick={() => setIsEditing(true)}
                        disabled={isEditing}
                        className={`w-full px-4 py-2 sm:py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-xs sm:text-sm border-2 ${isEditing ? 'border-[#e0d8cf] text-[#b0a090] bg-gray-50 cursor-not-allowed' : 'border-[#8b7355] text-[#8b7355] hover:bg-[#f6ede8]'}`}
                      >
                        <Edit size={14} className="sm:w-4 sm:h-4" />
                        {isEditing ? 'Finish editing first' : 'Edit Group Details'}
                      </button>

                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 sm:py-2.5 bg-[#6b5847] hover:bg-[#4a3728] text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" /> Delete Group
                      </button>
                    </div>
                  </div>
                );
              })()}

            </div>
          </>
        ) : (
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="bg-[#f6ede8] rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-[#4a3728] mb-2 sm:mb-3 text-sm sm:text-base">Group Information</h3>
              <div className="space-y-2 text-xs sm:text-sm">
                {[['Category', group.category], ['Daily Goal', `${group.goalHours} hours`], ['Capacity', `${group.members}/${group.capacity}`], ['Visibility', group.visibility], ['Camera', group.cameraRequired ? 'Required' : 'Optional'], ['Joined', group.joinedDate]].map(([l, v]) => (
                  <div key={l} className="flex justify-between gap-2"><span className="text-[#6b5847]">{l}:</span><span className="font-semibold text-[#4a3728] text-right">{v}</span></div>
                ))}
              </div>
            </div>
            <div className="bg-[#f6ede8] rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-[#4a3728] mb-2 sm:mb-3 text-sm sm:text-base">Your Stats</h3>
              <div className="space-y-2 text-xs sm:text-sm">
                {[['Study Time', `${group.studyTime} hours`], ['Attendance', `${group.attendance}%`], ['Streak', `${group.streak} days`], ['Rank', `#${group.rank}`]].map(([l, v]) => (
                  <div key={l} className="flex justify-between gap-2"><span className="text-[#6b5847]">{l}:</span><span className="font-semibold text-[#4a3728]">{v}</span></div>
                ))}
              </div>
            </div>
            <button onClick={handleLeave} className="w-full px-4 py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base">
              <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" /> Leave Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── GroupCard (100% unchanged) ───────────────────────────────
interface GroupCardProps {
  userId: string;
  group: Group;
  timerStats: any;
  groupStudyTime?: number;
  attendancePercent?: number;
  onSettingsClick: (group: Group) => void;
  onOpenClick: (groupId: string) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ userId, group, timerStats, groupStudyTime, attendancePercent, onSettingsClick, onOpenClick }) => (
  <div
    onClick={
      () => onOpenClick((group as any).groupId)
    }
    className="bg-white rounded-lg sm:rounded-xl border-2 border-[#e0d8cf] hover:border-[#8b7355] hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer">
    <div className="p-3 sm:p-4 bg-[#f6ede8] border-b border-[#e0d8cf]">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-[#4a3728] break-words">{group.title}</h3>
            {group.leaderId === userId && (
              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-[#8b7355] rounded-full flex-shrink-0">
                <Crown size={10} className="sm:w-3 sm:h-3 text-white" />
                <span className="text-[10px] sm:text-xs font-bold text-white">Creator</span>
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#6b5847] line-clamp-2">{group.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white rounded-md text-[10px] sm:text-xs font-semibold text-[#4a3728]">{group.category}</span>
        {group.visibility === 'public' ? (
          <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white rounded-md"><Globe size={10} className="sm:w-3 sm:h-3 text-[#4a3728]" /><span className="text-[10px] sm:text-xs font-semibold text-[#4a3728]">Public</span></div>
        ) : (
          <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white rounded-md"><Lock size={10} className="sm:w-3 sm:h-3 text-[#4a3728]" /><span className="text-[10px] sm:text-xs font-semibold text-[#4a3728]">Private</span></div>
        )}
        <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white rounded-md">
          {group.cameraRequired ? <Camera size={10} className="sm:w-3 sm:h-3 text-[#4a3728]" /> : <CameraOff size={10} className="sm:w-3 sm:h-3 text-[#4a3728]" />}
          <span className="text-[10px] sm:text-xs font-semibold text-[#4a3728]">Camera {group.cameraRequired ? 'On' : 'Off'}</span>
        </div>
      </div>
    </div>
    <div className="p-3 sm:p-4 grid grid-cols-4 gap-2 sm:gap-3 border-b border-[#e0d8cf]">
      {[
        { Icon: Users, v: group.currentMemberCount ?? group.members ?? 0, l: 'Members' },
        { Icon: Target, v: `${group.goalHours}h`, l: 'Daily Goal' },
        { Icon: TrendingUp, v: group.streak ?? '—', l: 'Streak' },
        { Icon: Award, v: group.rank ? `#${group.rank}` : '—', l: 'Rank' }]
        .map(({ Icon, v, l }) => (
          <div key={l} className="text-center">
            <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1"><Icon size={12} className="sm:w-[14px] sm:h-[14px] text-[#8b7355]" /><span className="text-base sm:text-lg font-bold text-[#4a3728]">{v}</span></div>
            <span className="text-[10px] sm:text-xs text-[#6b5847]">{l}</span>
          </div>
        ))}
    </div>
    <div className="px-3 sm:px-4 py-2 sm:py-3 space-y-2 border-b border-[#e0d8cf]">
      {[
        { l: 'Study Time', v: groupStudyTime ? `${(groupStudyTime / 3600).toFixed(1)}h` : '—', p: 0 },
        { l: 'Attendance', v: attendancePercent ? `${attendancePercent.toFixed(1)}%` : '—', p: attendancePercent ?? 0 }
      ]
        .map(({ l, v, p }) => (
          <div key={l}>
            <div className="flex justify-between items-center mb-1"><span className="text-[10px] sm:text-xs font-semibold text-[#4a3728]">{l}</span><span className="text-[10px] sm:text-xs font-bold text-[#8b7355]">{v}</span></div>
            <div className="w-full bg-[#e0d8cf] rounded-full h-1.5 sm:h-2"><div className="bg-[#8b7355] h-1.5 sm:h-2 rounded-full transition-all" style={{ width: `${p}%` }} /></div>
          </div>
        ))}
    </div>
    <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
      <div className="text-[10px] sm:text-xs text-[#6b5847] flex items-center gap-1">
        <Clock size={10} className="sm:w-3 sm:h-3 inline flex-shrink-0" />
        <span className="truncate">
          {group.lastActive
            ? `Active ${group.lastActive}`
            : group.updatedAt
              ? `Updated ${new Date(group.updatedAt).toLocaleDateString()}`
              : 'Recently active'
          }
        </span>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onSettingsClick(group); }} className="px-2 sm:px-3 py-1 sm:py-1.5 bg-[#f6ede8] hover:bg-[#e0d8cf] text-[#4a3728] rounded-lg text-[10px] sm:text-xs font-semibold transition-all flex items-center gap-1">
        <Settings size={12} className="sm:w-[14px] sm:h-[14px]" /><span className="hidden xs:inline">{group.leaderId === userId ? 'Manage' : 'Info'}</span>
      </button>
    </div>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────
export default function MyGroups() {
  const router = useRouter();
  const { user } = useAuth();

  const attendancePercentage = useAppSelector(selectAttendancePercentage);
  const attendanceStatus = useAppSelector(selectAttendanceStatus);

  const dispatch = useAppDispatch();
  const myGroups = useAppSelector(selectMyGroups);
  const myGroupsLoading = useAppSelector(selectMyGroupsLoading);
  const timerStats = useAppSelector(selectTimerStats);
  const groups = myGroups as any[];
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [settingsGroup, setSettingsGroup] = useState<Group | null>(null);

  const handleLeaveGroup = (groupId: string): void => {
    dispatch(leaveGroupThunk(groupId))
      .unwrap()
      .then(() => dispatch(fetchMyGroupsThunk())) // list refresh karo
      .catch((err) => alert(err));
  };

  const handleDeleteGroup = (groupId: string): void => {
    dispatch(deleteGroupThunk(groupId))
      .unwrap()
      .then(() => dispatch(fetchMyGroupsThunk()))
      .catch((err) => alert(err));
  };

  const handleUpdateGroup = (groupId: string, updatedData: Partial<Group>): void => {
    dispatch(updateGroupThunk({ groupId, updates: updatedData as any }))
      .unwrap()
      .then(() => dispatch(fetchMyGroupsThunk()))
      .catch((err) => alert(err));
  };

  const handleOpenGroup = (groupId: string,): void => {
    router.push(`/study/my-groups/${groupId}`);
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch =
      group.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" ||
      (activeTab === "created" && group.leaderId === user?.userId) ||
      (activeTab === "joined" && group.leaderId !== user?.userId);
    return matchesSearch && matchesTab;
  });


  const stats = {
    totalGroups: groups.length,
    createdGroups: groups.filter(g => g.leaderId === user?.userId).length,
    joinedGroups: groups.filter(g => g.leaderId !== user?.userId).length,
    totalStudyHours: timerStats?.totalDurationInHours ?? 0,
    avgAttendance: attendancePercentage?.overallPercentage ?? 0,
  };

  useEffect(() => {
    dispatch(fetchMyGroupsThunk());
    dispatch(fetchAllUsersThunk());
    dispatch(getTimerStatsThunk());
    dispatch(fetchAttendanceStatusThunk());        
    dispatch(fetchAttendancePercentageThunk());    
  }, [dispatch]);


  return (
    <div className="min-h-screen w-full p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#4a3728] mb-1 sm:mb-2">My Study Groups</h1>
          <p className="text-sm sm:text-base text-[#6b5847]">Manage and track your study groups</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          {[
            { Icon: Users, v: stats.totalGroups, l: 'Total Groups', extra: '' },
            { Icon: Crown, v: stats.createdGroups, l: 'Created', extra: '' },
            { Icon: UserPlus, v: stats.joinedGroups, l: 'Joined', extra: '' },
            { Icon: Clock, v: `${stats.totalStudyHours}h`, l: 'Study Hours', extra: '' },
            { Icon: Award, v: `${stats.avgAttendance}%`, l: 'Avg Attendance', extra: 'col-span-2 sm:col-span-1' },
          ].map(({ Icon, v, l, extra }) => (
            <div key={l} className={`bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border-2 border-[#e0d8cf] hover:border-[#8b7355] transition-all ${extra}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#8b7355] rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="text-white" size={16} /></div>
                <div className="min-w-0"><div className="text-xl sm:text-2xl font-bold text-[#4a3728]">{v}</div><div className="text-[10px] sm:text-xs text-[#6b5847] truncate">{l}</div></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border-2 border-[#e0d8cf]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto">
              <button onClick={() => setActiveTab("all")} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${activeTab === "all" ? "bg-gradient-to-r from-[#8b7355] to-[#6b5847] text-white shadow-md" : "bg-[#f6ede8] text-[#4a3728] hover:bg-[#e0d8cf]"}`}>
                All Groups ({stats.totalGroups})
              </button>
              <button onClick={() => setActiveTab("created")} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center gap-1 whitespace-nowrap ${activeTab === "created" ? "bg-gradient-to-r from-[#8b7355] to-[#6b5847] text-white shadow-md" : "bg-[#f6ede8] text-[#4a3728] hover:bg-[#e0d8cf]"}`}>
                <Crown size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Created ({stats.createdGroups})</span>
                <span className="xs:hidden">({stats.createdGroups})</span>
              </button>
              <button onClick={() => setActiveTab("joined")} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center gap-1 whitespace-nowrap ${activeTab === "joined" ? "bg-gradient-to-r from-[#8b7355] to-[#6b5847] text-white shadow-md" : "bg-[#f6ede8] text-[#4a3728] hover:bg-[#e0d8cf]"}`}>
                <UserPlus size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Joined ({stats.joinedGroups})</span>
                <span className="xs:hidden">({stats.joinedGroups})</span>
              </button>
            </div>
            <div className="flex-1 relative">
              <input type="text" placeholder="Search groups..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-1.5 sm:py-2 border-2 border-[#e0d8cf] rounded-lg focus:border-[#8b7355] focus:ring-2 focus:ring-[#8b7355]/30 outline-none text-xs sm:text-sm" />
              <Search className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[#6b5847] pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        {myGroupsLoading ? (
          <div className="text-center py-12 text-[#6b5847]">Loading your groups...</div>
        ) : filteredGroups.length > 0 ? (
          < div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
           
            {filteredGroups.map((group) => (
              <GroupCard
                key={group.groupId}
                group={group}
                timerStats={timerStats}
                attendancePercent={attendancePercentage?.overallPercentage}
                onSettingsClick={setSettingsGroup}
                onOpenClick={handleOpenGroup}
                userId={user?.userId ?? ''}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg sm:rounded-xl p-8 sm:p-12 text-center border-2 border-[#e0d8cf]">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#f6ede8] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"><Users size={32} className="sm:w-10 sm:h-10 text-[#8b7355]" /></div>
            <h3 className="text-lg sm:text-xl font-bold text-[#4a3728] mb-2">No groups found</h3>
            <p className="text-sm sm:text-base text-[#6b5847] mb-3 sm:mb-4">
              {searchQuery ? "Try adjusting your search query" : activeTab === "created" ? "You haven't created any groups yet" : "You haven't joined any groups yet"}
            </p>
            <button className="px-4 sm:px-6 py-2 bg-gradient-to-r from-[#8b7355] to-[#6b5847] hover:from-[#6b5847] hover:to-[#4a3728] text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl text-sm sm:text-base">Browse Groups</button>
          </div>
        )}

        {user?.userId && (
          <SettingsModal
            userId={user.userId}
            isOpen={!!settingsGroup}
            onClose={() => setSettingsGroup(null)}
            group={settingsGroup}
            onUpdate={handleUpdateGroup}
            onDelete={handleDeleteGroup}
            onLeave={handleLeaveGroup}
          />
        )}
      </div>
    </div >
  );
}


