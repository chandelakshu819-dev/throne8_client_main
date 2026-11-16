//src/lib/validations/studyGroup/liveroom.validation.ts

import { z } from 'zod';
import { LIVE_ROOM_MAX_PARTICIPANTS } from '../constants/liveRoom';

export const createLiveRoomSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  maxParticipants: z
    .number()
    .int()
    .min(2)
    .max(LIVE_ROOM_MAX_PARTICIPANTS, `A live room can hold at most ${LIVE_ROOM_MAX_PARTICIPANTS} people`)
    .default(LIVE_ROOM_MAX_PARTICIPANTS),
  settings: z.object({
    allowCamera: z.boolean().default(true),
    allowMic: z.boolean().default(true),
    allowScreenShare: z.boolean().default(true),
    requireApproval: z.boolean().default(false),
    muteOnEntry: z.boolean().default(false),
  }).optional(),
});

export const updateLiveRoomSchema = z.object({
  title: z.string().trim().min(3).max(100).optional(),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  maxParticipants: z
    .number()
    .int()
    .min(2)
    .max(LIVE_ROOM_MAX_PARTICIPANTS, `A live room can hold at most ${LIVE_ROOM_MAX_PARTICIPANTS} people`)
    .optional(),
  settings: z.object({
    allowCamera: z.boolean().optional(),
    allowMic: z.boolean().optional(),
    allowScreenShare: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    muteOnEntry: z.boolean().optional(),
  }).optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'At least one field required' });

export type CreateLiveRoomInput = z.infer<typeof createLiveRoomSchema>;
export type UpdateLiveRoomInput = z.infer<typeof updateLiveRoomSchema>;