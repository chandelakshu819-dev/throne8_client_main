// Max people in one study-group live room.
// Video is peer-to-peer (everyone sends their video to everyone else), so quality drops quickly
// past a handful of people. Keep this in sync with LIVE_ROOM_MAX_PARTICIPANTS on the server
// (server/thronet-server/src/StudyGroup/utils/constants.ts).
export const LIVE_ROOM_MAX_PARTICIPANTS = 6;
