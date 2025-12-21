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
    author_name: string;
    author_email?: string;
    password: string;
    content: string;
    is_private?: boolean;
    parent_id?: string;
}

export const commentService = {
    // 포스트의 댓글 목록 가져오기
    async getCommentsByPostId(postId: string) {
        // 부모 댓글만 가져오기
        const { data: parentComments, error } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .is('parent_id', null)
            .order('created_at', { ascending: true });

        if (error || !parentComments) return { data: null, error };

        // 각 댓글의 대댓글 가져오기
        const commentsWithReplies = await Promise.all(
            parentComments.map(async (comment) => {
                const { data: replies } = await supabase
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
        const { count, error } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        return { count: count || 0, error };
    },

    // 댓글 작성
    async createComment(input: CreateCommentInput) {
        const { password, ...commentData } = input;
        const hashedPassword = btoa(password);

        const { data, error } = await supabase
            .from('comments')
            .insert({
                ...commentData,
                password_hash: hashedPassword,
                is_private: commentData.is_private || false
            })
            .select()
            .single();

        if (!error && data) {
            // 포스트의 댓글 수 업데이트
            await this.updatePostCommentCount(input.post_id);
        }

        return { data, error };
    },

    // 댓글 수정
    async updateComment(id: string, content: string, password: string) {
        const { data: comment } = await supabase
            .from('comments')
            .select('password_hash')
            .eq('id', id)
            .single();

        if (!comment || comment.password_hash !== btoa(password)) {
            return { data: null, error: new Error('비밀번호가 일치하지 않습니다.') };
        }

        return await supabase
            .from('comments')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
    },

    // 댓글 삭제
    async deleteComment(id: string, password: string, postId: string) {
        const { data: comment } = await supabase
            .from('comments')
            .select('password_hash')
            .eq('id', id)
            .single();

        if (!comment || comment.password_hash !== btoa(password)) {
            return { data: null, error: new Error('비밀번호가 일치하지 않습니다.') };
        }

        // 대댓글도 함께 삭제
        await supabase
            .from('comments')
            .delete()
            .eq('parent_id', id);

        const result = await supabase
            .from('comments')
            .delete()
            .eq('id', id);

        // 포스트의 댓글 수 업데이트
        await this.updatePostCommentCount(postId);

        return result;
    },

    // 포스트의 댓글 수 업데이트
    async updatePostCommentCount(postId: string) {
        const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        await supabase
            .from('posts')
            .update({ comment_count: count || 0 })
            .eq('id', postId);
    },

    // 최신 댓글 가져오기
    async getRecentComments(limit: number = 5) {
        return await supabase
            .from('comments')
            .select('id, content, author_name, post_id, created_at, posts(title, slug)')
            .order('created_at', { ascending: false })
            .limit(limit);
    }
};
