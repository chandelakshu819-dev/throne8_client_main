import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Post {
  id: string;
  postId?: string;
  title?: string;
  text: string;
  image?: string;
  images?: string[];
  videos?: string[];
  documents?: Array<{
    url: string;
    type: string;
    name: string;
    size?: number;
  }>;
  hasPoll?: boolean;
  pollData?: {
    question: string;
    options: Array<{ optionId: string; text: string; votes: number }>;
    duration: number;
    endsAt: string;
    totalVotes: number;
    isActive: boolean;
  };
  likes: number;
  comments: number;
  reposts: number;
  time: string;
  liked: boolean;
  status?: 'published' | 'draft' | 'scheduled' | 'archived';
  type?: string;
  company?: { _id: string; name: string; logo?: string };
  author?: { _id: string; firstName: string; lastName: string };
  tags?: string[];
  createdAt?: string;
}

interface PostsState {
  items: Post[];
  loading: boolean;
  error: string | null;
}

const initialState: PostsState = {
  items: [],
  loading: false,
  error: null,
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    toggleLike(state, action: PayloadAction<string>) {
      const post = state.items.find(p => p.id === action.payload);
      if (post) {
        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;
      }
    },
    addPost(state, action: PayloadAction<Post>) {
      state.items.unshift(action.payload);
    },
    deletePost(state, action: PayloadAction<string>) {
      state.items = state.items.filter(p => p.id !== action.payload);
    },

    updatePost(state, action: PayloadAction<{ id: string; text: string }>) {
      const post = state.items.find(p => p.id === action.payload.id);
      if (post) {
        post.text = action.payload.text;
      }
    },


    setPosts(state, action: PayloadAction<Post[]>) {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    setPostsLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setPostsError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  toggleLike, addPost, deletePost, updatePost,
  setPosts, setPostsLoading, setPostsError,
} = postsSlice.actions;



export default postsSlice.reducer;