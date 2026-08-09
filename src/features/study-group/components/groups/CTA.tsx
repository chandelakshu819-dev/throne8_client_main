"use client";

import { UserPlus, ArrowRight, CheckCircle } from "lucide-react";
import CreateGroupModal from "@/features/study-group/modals/CreateGroupModal";// import { useAppDispatch, useAppSelector } from "../../../../lib/redux/hooks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openCreateModal, closeCreateModal, selectIsCreateModalOpen } from "@/hooks/studyGroup/features/groups/groupsSlice";

export default function CTA() {
  const dispatch = useAppDispatch();
  const isModalOpen = useAppSelector(selectIsCreateModalOpen);

  return (
    <>
    
      <div className="w-full mt-8 bg-white border-2 border-[#e0d8cf] rounded-2xl shadow-lg overflow-hidden">
        <div
          className="rounded-2xl shadow-xl overflow-hidden relative"
          style={{
            background:
              "linear-gradient(to bottom right, rgba(246, 237, 232, 0.8), rgba(224, 216, 207, 0.6), rgba(224, 216, 207, 0.4))",
          }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl"
              style={{
                background:
                  "linear-gradient(to right, rgba(139, 111, 71, 0.2), rgba(74, 55, 40, 0.1), rgba(107, 78, 61, 0.2))",
              }}
            ></div>
          </div>

          <div className="flex flex-col p-10 md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="w-16 h-16 bg-[#f6ede8] rounded-2xl flex items-center justify-center">
                  <UserPlus className="text-[#8b7355]" size={32} />
                </div>
              </div>

              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#4a3728] mb-2">
                  Can't Find the Perfect Group?
                </h2>
                <p className="text-lg text-[#6b5847]">
                  Create your own study group and invite friends to join you!
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-[#6b5847] justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#8b7355]" />
                  <span>Set your own rules</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#8b7355]" />
                  <span>Build your community</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#8b7355]" />
                  <span>Study together</span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 w-full md:w-auto">
              <button
                onClick={() => dispatch(openCreateModal())}
                className="group bg-gradient-to-r from-[#8b7355] to-[#6b5847] hover:from-[#6b5847] hover:to-[#4a3728] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3 justify-center w-full"
              >
                <UserPlus size={24} />
                Create Your Group
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </div>
          </div>

          <div className="mt-8 p-8 border-t border-[#e0d8cf]">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-[#4a3728]">2,500+</div>
                <div className="text-sm text-[#6b5847] mt-1">Groups Created</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#4a3728]">15,000+</div>
                <div className="text-sm text-[#6b5847] mt-1">Active Members</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#4a3728]">85%</div>
                <div className="text-sm text-[#6b5847] mt-1">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={() => dispatch(closeCreateModal())}
      />
    </>
  );
}