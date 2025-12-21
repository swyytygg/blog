import { supabase } from './supabase';

export interface Comment {
    id: string;
    post_id: string;
    author_name: string;
    author_email?: string;
    content: string;
    is_private: boolean;
    parent_id?: string;
    created_at: string;
    updated_at?: string;
    replies?: Comment[];
    likes_count?: number;
}

export interface CreateCommentInput {
    post_id: string;
    author_name?: string;
    author_email?: string;
    password?: string;
    content?: string;
    is_private?: boolean;
    parent_id?: string;
}

export const commentService = {
    // 포스트의 댓글 목록 가져오기
    async getCommentsByPostId(postId: string) {
        // 부모 댓글만 가져오기
        const { data: parentComments, error } = await (supabase as any)
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .is('parent_id', null)
            .order('created_at', { ascending: true });

        if (error || !parentComments) return { data: null, error };

        // 각 댓글의 대댓글 가져오기
        const commentsWithReplies = await Promise.all(
            parentComments.map(async (comment: any) => {
                const { data: replies } = await (supabase as any)
                    .from('comments')
                    .select('*')
                    .eq('parent_id', comment.id)
                    .order('created_at', { ascending: true });

                return {
                    ...comment,
                    replies: replies || []
                };
            })
        );

        return { data: commentsWithReplies, error: null };
    },

    // 댓글 수 가져오기
    async getCommentCount(postId: string) {
        const { count, error } = await (supabase as any)
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        return { count: count || 0, error };
    },

    // 댓글 작성
    async createComment(input: CreateCommentInput) {
        const { password, ...commentData } = input;

        // 비밀번호 해싱 (있는 경우만)
        const hashedPassword = password ? btoa(password) : null;

        const { data, error } = await (supabase as any)
            .from('comments')
            .insert({
                ...commentData,
                author_name: commentData.author_name || '익명',
                password_hash: hashedPassword,
                is_private: commentData.is_private || false
            })
            .select()
            .single();

        // RLS로 인해 select().single()이 실패하더라도(비밀댓글 등), 
        // error.code가 'PGRST116'(No rows returned)이면 성공으로 간주할 수 있음
        // 단, 여기서는 트리거로 count 관리를 하므로 수동 업데이트 코드는 제거함.

        return { data, error };
    },

    // 댓글 수정 (본인 또는 관리자)
    async updateComment(id: string, content: string, password?: string) {
        let query = (supabase as any).from('comments').update({ content, updated_at: new Date().toISOString() });

        const { data: sessionData } = await (supabase as any).auth.getSession();
        const isAdmin = !!sessionData.session;

        if (isAdmin) {
            query = query.eq('id', id);
        } else if (password) {
            query = query.eq('id', id).eq('password_hash', btoa(password));
        } else {
            return { data: null, error: new Error('비밀번호가 필요합니다.') };
        }

        return await query.select().single();
    },

    // 댓글 삭제
    async deleteComment(id: string, password?: string, postId?: string) {
        let query = (supabase as any).from('comments').delete();

        const { data: sessionData } = await (supabase as any).auth.getSession();
        const isAdmin = !!sessionData.session;

        if (isAdmin) {
            query = query.eq('id', id);
        } else if (password) {
            query = query.eq('id', id).eq('password_hash', btoa(password));
        } else {
            return { data: null, error: new Error('비밀번호가 필요합니다.') };
        }

        // 대댓글도 함께 삭제 (parent_id가 id인 댓글들)
        await (supabase as any)
            .from('comments')
            .delete()
            .eq('parent_id', id);

        const { data, error } = await query.select().single();

        // 포스트의 댓글 수 업데이트는 이제 DB 트리거가 담당하므로 여기서 호출하지 않음

        return { data, error };
    },

    // 최신 댓글 가져오기
    async getRecentComments(limit: number = 5) {
        return await (supabase as any)
            .from('comments')
            .select('id, content, author_name, post_id, created_at, posts(title, slug)')
            .order('created_at', { ascending: false })
            .limit(limit);
    },

    // 관리자 세션 체크를 위한 헬퍼 (사용 안함 - 상위에서 통합 체크 권장)
    async checkSession() {
        return await (supabase as any).auth.getSession();
    }
};
