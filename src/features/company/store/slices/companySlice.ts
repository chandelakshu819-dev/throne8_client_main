//main 
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import CompanyService from '@/lib/api/company.service';
import {
    MOCK_COMPANY_META, MOCK_STATS, MOCK_TEAM, MOCK_JOBS, MOCK_MILESTONES,
    MOCK_PRODUCTS, MOCK_CULTURE_VALUES, MOCK_PERKS, MOCK_NEWS,
    MOCK_TESTIMONIALS, MOCK_GALLERY, MOCK_POSTS,
} from '@/features/company/constants/company.data';
import type { Post } from '@/features/company/type/company.types';

interface CompanyState {
    companyId: string | null;
    companyName: string | null;
    loading: boolean;
    // ← first slice ke fields add karo
    meta: typeof MOCK_COMPANY_META | null;
    stats: typeof MOCK_STATS | null;
    team: typeof MOCK_TEAM;
    jobs: typeof MOCK_JOBS;
    milestones: typeof MOCK_MILESTONES;
    products: typeof MOCK_PRODUCTS;
    cultureValues: typeof MOCK_CULTURE_VALUES;
    perks: typeof MOCK_PERKS;
    news: typeof MOCK_NEWS;
    testimonials: typeof MOCK_TESTIMONIALS;
    gallery: typeof MOCK_GALLERY;
    posts: typeof MOCK_POSTS;
    error: string | null;
    lastFetched: string | null;
    isLoadingApi: boolean;
    isLoadingEmployees: boolean;
    isLoadingPosts: boolean;
    apiData: any | null;
    apiPosts: any[];
}

const initialState: CompanyState = {
    companyId: null,
    companyName: null,
    loading: false,
    meta: MOCK_COMPANY_META,
    stats: MOCK_STATS,
    team: MOCK_TEAM,
    jobs: MOCK_JOBS,
    milestones: MOCK_MILESTONES,
    products: MOCK_PRODUCTS,
    cultureValues: MOCK_CULTURE_VALUES,
    perks: MOCK_PERKS,
    news: MOCK_NEWS,
    testimonials: MOCK_TESTIMONIALS,
    gallery: MOCK_GALLERY,
    posts: MOCK_POSTS,
    error: null,
    lastFetched: null,
    isLoadingApi: false,
    isLoadingEmployees: false,
    isLoadingPosts: false,
    apiData: null,
    apiPosts: [],
    // apiPosts: [] as any[],
};

// ── Thunk 1: Company by ID (already bataya tha) ──
export const fetchCompanyById = createAsyncThunk(
    'company/fetchById',
    async (companyId: string, { rejectWithValue }) => {
        try {
            const response = await CompanyService.getCompany(companyId);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// ── Thunk 2: Employees ──
export const fetchCompanyEmployees = createAsyncThunk(
    'company/fetchEmployees',
    async (companyId: string, { rejectWithValue }) => {
        try {
            const response = await CompanyService.getAllEmployees(companyId);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// ── Thunk 3: Posts ──
export const fetchCompanyPosts = createAsyncThunk(
    'company/fetchPosts',
    async (companyId: string, { rejectWithValue }) => {
        try {
            const response = await CompanyService.getPostsByCompany(companyId);
            console.log('API Response for posts:', response.data); // Debug log
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const companySlice = createSlice({
    name: 'company',
    initialState,
    reducers: {
        setCompany(state, action: PayloadAction<{ companyId: string; companyName: string }>) {
            state.companyId = action.payload.companyId;
            state.companyName = action.payload.companyName;
        },
        clearCompany(state) {
            state.companyId = null;
            state.companyName = null;
        },
        setCompanyData(state, action: PayloadAction<Partial<CompanyState>>) {
            Object.assign(state, action.payload);
        },
        incrementFollowers(state) {
            if (state.meta) state.meta.followers += 1;
        },
        decrementFollowers(state) {
            if (state.meta) state.meta.followers -= 1;
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        setLastFetched(state) {
            state.lastFetched = new Date().toISOString();
        },
    },
    extraReducers: (builder) => {
        // ── Company fetch ──
        builder
            .addCase(fetchCompanyById.pending, (state) => {
                state.isLoadingApi = true;
                state.error = null;
            })
            .addCase(fetchCompanyById.fulfilled, (state, action) => {
                console.log('✅ API Response:', action.payload);
                console.log('✅ Company Name from API:', action.payload?.companyName);
                // ❌ state.apiPosts = action.payload.data.items  ← YEH LINE DELETE KARO
                state.isLoadingApi = false;
                state.apiData = action.payload;
                state.meta = {
                    ...state.meta,
                    id: action.payload.companyId,
                    name: action.payload.companyName,
                    tagline: action.payload.descriptions?.tagline || state?.meta?.tagline,
                    industry: action.payload.industry,
                    founded: String(action.payload.foundedYear),
                    size: action.payload.companySize,
                    website: action.payload.website || state?.meta?.website,
                    headquarters: {
                        city: action.payload.headquarters?.city || '',
                        state: action.payload.headquarters?.state || '',
                        country: action.payload.headquarters?.country || '',
                        full: `${action.payload.headquarters?.city}, ${action.payload.headquarters?.state}, ${action.payload.headquarters?.country}`,
                    },
                    socialLinks: state?.meta?.socialLinks || {},
                    logoUrl: action.payload.media?.logo?.url,
                    bannerUrl: action.payload.media?.coverImage?.url || state?.meta?.bannerUrl,
                    isVerified: action.payload.account?.isVerified || false,
                    followers: action.payload.stats?.followersCount || 0,
                    employeeCount: action.payload.stats?.employeesCount || 0,
                };
                // API ke real stats se MOCK_STATS ke values override karo
               state.stats = state?.stats?.map((stat) => {
                    if (stat.id === 's1') return { ...stat, value: String(action.payload.stats?.totalApplications || stat.value) };
                    if (stat.id === 's2') return { ...stat, value: String(action.payload.stats?.activeJobs || stat.value) };
                    return stat;
                }) ?? null;
                state.lastFetched = new Date().toISOString();
            })
            .addCase(fetchCompanyById.rejected, (state, action) => {
                console.error('❌ Fetch failed:', action.payload);
                state.isLoadingApi = false;
                state.error = action.payload as string;
            })

        // ── Employees fetch → team override ──
        builder
            .addCase(fetchCompanyEmployees.pending, (state) => {
                state.isLoadingEmployees = true;
            })
            .addCase(fetchCompanyEmployees.fulfilled, (state, action) => {
                state.isLoadingEmployees = false;
                const employees = action.payload?.employees || action.payload || [];
                if (employees.length > 0) {
                    // Employee data ko TeamMember format me map karo
                    state.team = employees.map((emp: any) => ({
                        id: emp.employeeId || emp._id,
                        name: `${emp.firstName} ${emp.lastName}`,
                        role: emp.designation || 'Employee',
                        department: emp.department || 'General',
                        bio: emp.bio || '',
                        avatarUrl: emp.avatarUrl || undefined,
                        initials: `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`,
                        socialLinks: {},
                        isFounder: false,
                        joinedAt: emp.joinDate || emp.createdAt || '',
                    }));
                }
            })
            .addCase(fetchCompanyEmployees.rejected, (state) => {
                state.isLoadingEmployees = false;
                // team mock data pe hi rahega
            })

        // ── Posts fetch ──
        builder
            .addCase(fetchCompanyPosts.pending, (state) => {
                state.isLoadingPosts = true;
            })
            .addCase(fetchCompanyPosts.fulfilled, (state, action) => {
                console.log('✅ Saving posts to state:', action.payload);
                state.apiPosts = action.payload?.items ?? [];
                state.isLoadingApi = false;
                if (state.apiPosts.length > 0) {
                    // API posts ko Post format me map karo
                    state.posts = state.apiPosts.map((post: any) => ({
                        id: post.postId || post._id,
                        type: post.mediaType === 'image' ? 'image' : post.mediaType === 'document' ? 'document' : 'article',
                        author: {
                            name: post.authorName || state?.meta?.name,
                            role: post.authorRole || 'Official Account',
                            initials: (post.authorName || state?.meta?.name)?.[0] || 'C',
                            avatarUrl: post.authorAvatar || state?.meta?.logoUrl,
                        },
                        caption: post.content || post.caption || '',
                        publishedAt: post.createdAt || post.publishedAt || '',
                        likes: post.likes || post.likesCount || 0,
                        comments: post.comments || post.commentsCount || 0,
                        shares: post.shares || post.sharesCount || 0,
                        tags: post.tags || [],
                        // image specific
                        ...(post.mediaType === 'image' && {
                            imageUrl: post.mediaUrl || post.imageUrl || '',
                            altText: post.altText || post.content || '',
                            aspectRatio: '16:9',
                        }),
                        // document specific
                        ...(post.mediaType === 'document' && {
                            title: post.title || post.content || '',
                            fileType: 'pdf',
                            fileSize: post.fileSize || '',
                            downloadUrl: post.mediaUrl || '#',
                        }),
                        // article specific
                        ...(post.mediaType === 'article' && {
                            title: post.title || '',
                            excerpt: post.excerpt || post.content || '',
                            readTime: post.readTime || '3 min read',
                            articleUrl: post.articleUrl || '#',
                            category: post.category || 'General',
                        }),
                   })) as Post[];
                }
            })
            .addCase(fetchCompanyPosts.rejected, (state) => {
                state.isLoadingPosts = false;
                // posts mock data pe hi rahega
            })
    },
});

export const {
    setCompany, clearCompany,
    setCompanyData, incrementFollowers, decrementFollowers,
    setLoading, setError, setLastFetched,
} = companySlice.actions;

export default companySlice.reducer;