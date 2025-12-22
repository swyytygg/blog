import { supabase } from './supabase';

export interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    content_type?: 'markdown' | 'html';
    description?: string; // For backward compatibility/UI
    excerpt?: string;     // Actual DB column
    thumbnail_url?: string | null;
    category?: string;
    category_id?: string | null;
    author_id?: string | null;
    tags?: string[];
    view_count?: number | null;
    comment_count?: number;
    status: string;
    published_at?: string | null;
    created_at: string;
    updated_at?: string | null;
}

export interface SearchParams {
    query?: string;
    category?: string;
    tag?: string;
    limit?: number;
    offset?: number;
}

export interface CreatePostInput {
    title: string;
    content: string;
    content_type?: 'markdown' | 'html';
    slug: string;
    category?: string;
    tags?: string[];
    thumbnail_url?: string;
    excerpt?: string;
    author_id: string;
    is_published: boolean;
    published_at?: string; // 추가
}

export interface UpdatePostInput {
    title?: string;
    content?: string;
    content_type?: 'markdown' | 'html';
    slug?: string;
    category?: string;
    tags?: string[];
    thumbnail_url?: string;
    excerpt?: string;
    is_published?: boolean;
    published_at?: string; // 추가
}

export const postService = {
    // 게시글 생성
    async createPost(post: CreatePostInput) {
        const { is_published, ...postData } = post;
        return await (supabase.from('posts') as any)
            .insert({
                ...postData,
                status: is_published ? 'published' : 'draft'
            })
            .select()
            .single();
    },

    // 게시글 수정
    async updatePost(id: string, updates: UpdatePostInput) {
        const updateData: any = { ...updates };
        if (updates.is_published !== undefined) {
            updateData.status = updates.is_published ? 'published' : 'draft';
            delete updateData.is_published;
        }

        return await (supabase.from('posts') as any)
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
    },

    // 게시글 삭제
    async deletePost(id: string) {
        return await (supabase.from('posts') as any)
            .delete()
            .eq('id', id);
    },

    // 모든 게시글 가져오기 (관리자용, 페이지네이션 포함)
    async getAdminPosts(page: number = 1, limit: number = 10) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        return await (supabase.from('posts') as any)
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);
    },

    // 공개된 게시글 가져오기 (블로그용, 공지사항 제외)
    async getPosts(limit?: number) {
        let query = (supabase.from('posts') as any)
            .select('*')
            .eq('status', 'published')
            .lte('published_at', new Date().toISOString())
            .neq('category', '공지사항')
            .order('published_at', { ascending: false });

        if (limit) {
            query = query.limit(limit);
        }

        return await query;
    },

    // 슬러그로 게시글 가져오기
    async getPostBySlug(slug: string) {
        return await (supabase.from('posts') as any)
            .select('*, profiles(display_name, avatar_url)')
            .eq('slug', slug)
            .eq('status', 'published')
            .lte('published_at', new Date().toISOString())
            .single();
    },

    // 검색 기능
    async searchPosts(params: SearchParams) {
        let query = (supabase.from('posts') as any)
            .select('*')
            .eq('status', 'published')
            .lte('published_at', new Date().toISOString())
            .neq('category', '공지사항'); // 공지사항 제외

        // 텍스트 검색 (제목, 설명, 내용)
        if (params.query) {
            query = query.or(
                `title.ilike.%${params.query}%,excerpt.ilike.%${params.query}%,content.ilike.%${params.query}%`
            );
        }

        // 카테고리 필터
        if (params.category) {
            query = query.eq('category', params.category);
        }

        // 태그 필터
        if (params.tag) {
            query = query.contains('tags', [params.tag]);
        }

        // 정렬 및 페이지네이션
        query = query.order('published_at', { ascending: false });

        if (params.limit) {
            query = query.limit(params.limit);
        }

        if (params.offset) {
            query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
        }

        return await query;
    },

    // 카테고리별 게시글 가져오기
    async getPostsByCategory(category: string) {
        return await (supabase.from('posts') as any)
            .select('*')
            .eq('status', 'published')
            .lte('published_at', new Date().toISOString())
            .eq('category', category)
            .order('published_at', { ascending: false });
    },

    // 태그별 게시글 가져오기
    async getPostsByTag(tag: string) {
        return await (supabase.from('posts') as any)
            .select('*')
            .eq('status', 'published')
            .lte('published_at', new Date().toISOString())
            .neq('category', '공지사항') // 공지사항 제외
            .contains('tags', [tag])
            .order('published_at', { ascending: false });
    },

    // 인기 게시글 가져오기 (조회수 기준)
    async getPopularPosts(limit: number = 5) {
        return await (supabase.from('posts') as any)
            .select('*')
            .eq('status', 'published')
            .lte('published_at', new Date().toISOString())
            .neq('category', '공지사항') // 공지사항 제외
            .order('view_count', { ascending: false })
            .limit(limit);
    },

    // 최근 게시글 가져오기
    async getRecentPosts(limit: number = 5) {
        return await (supabase.from('posts') as any)
            .select('id, title, created_at, slug, published_at')
            .eq('status', 'published')
            .lte('published_at', new Date().toISOString())
            .neq('category', '공지사항') // 공지사항 제외
            .order('published_at', { ascending: false })
            .limit(limit);
    },

    // 조회수 증가
    async incrementViewCount(postId: string) {
        return await (supabase as any).rpc('increment_view_count', { post_id: postId });
    },

    // 이전글 가져오기 (현재 글보다 이전에 작성된 글)
    async getPrevPost(currentCreatedAt: string, isNotice: boolean = false) {
        let query = (supabase.from('posts') as any)
            .select('id, title, slug, thumbnail_url')
            .eq('status', 'published')
            .lte('published_at', new Date().toISOString())
            .lt('published_at', currentCreatedAt);

        if (isNotice) {
            query = query.eq('category', '공지사항');
        } else {
            query = query.neq('category', '공지사항');
        }

        return await query
            .order('published_at', { ascending: false })
            .limit(1)
            .single();
    },

    // 다음글 가져오기 (현재 글보다 이후에 작성된 글)
    async getNextPost(currentCreatedAt: string, isNotice: boolean = false) {
        let query = (supabase.from('posts') as any)
            .select('id, title, slug, thumbnail_url')
            .eq('status', 'published')
            .lte('published_at', new Date().toISOString())
            .gt('published_at', currentCreatedAt);

        if (isNotice) {
            query = query.eq('category', '공지사항');
        } else {
            query = query.neq('category', '공지사항');
        }

        return await query
            .order('published_at', { ascending: true })
            .limit(1)
            .single();
    },

    // 관련 게시글 가져오기 (같은 카테고리 또는 태그)
    async getRelatedPosts(postId: string, category?: string, tags?: string[], limit: number = 3) {
        let query = (supabase.from('posts') as any)
            .select('id, title, slug, thumbnail_url, published_at')
            .eq('status', 'published')
            .lte('published_at', new Date().toISOString())
            .neq('id', postId);

        if (category) {
            query = query.eq('category', category);
        }

        return await query
            .order('published_at', { ascending: false })
            .limit(limit);
    }
};

