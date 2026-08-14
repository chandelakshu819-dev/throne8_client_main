import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message{
  id: string;
  from: string;
  preview: string;
  time: string;
  read: boolean;
  avatar: string;
}

interface InboxState {
  messages: Message[];
  unreadCount: number;
}

const INITIAL_MESSAGES: Message[] = [
  { id: '1', from: 'Chhavi Arora',    avatar: 'CA', preview: 'Hey! Would love to connect and discuss...',       time: '10m ago', read: false },
  { id: '2', from: 'Manan Telrandhe', avatar: 'MT', preview: 'Great post on AI networking! Wanted to...',       time: '1h ago',  read: false },
  { id: '3', from: 'Ankit Shinde',    avatar: 'AS', preview: 'Are you open for a freelance project?',           time: '2h ago',  read: false },
  { id: '4', from: 'Pooja Mehta',     avatar: 'PM', preview: 'Registered for your AI Summit event!',            time: '5h ago',  read: true  },
  { id: '5', from: 'Ravi Sharma',     avatar: 'RS', preview: 'Applied for the Senior React Developer role.',    time: '1d ago',  read: true  },
  { id: '6', from: 'Anjali Gupta',    avatar: 'AG', preview: 'Your recent post resonated with me a lot...',     time: '2d ago',  read: true  },
  { id: '7', from: 'Vikram Das',      avatar: 'VD', preview: 'Wanted to follow up on the partnership opp.',     time: '3d ago',  read: true  },
];

const inboxSlice = createSlice({
  name: 'inbox',
  initialState: {
    messages:    INITIAL_MESSAGES,
    unreadCount: INITIAL_MESSAGES.filter(m => !m.read).length, // 3
  } as InboxState,
  reducers: {
    markMessageRead: (state, action: PayloadAction<string>) => {
      const msg = state.messages.find(m => m.id === action.payload);
      if (msg && !msg.read) {
        msg.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
  },
});

export const { markMessageRead } = inboxSlice.actions;
export default inboxSlice.reducer;