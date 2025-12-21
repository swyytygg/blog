import { supabase } from './supabase';

export interface GuestbookEntry {
    id: string;
    author_name: string;
    author_email?: string;
    content: string;
    is_private: boolean;
    is_admin_reply: boolean;
    parent_id?: string;
    created_at: string;
    replies?: GuestbookEntry[];
}

export interface CreateGuestbookEntryInput {
    author_name: string;
    author_email?: string;
    password: string; // 수정/삭제용 비밀번호
    content: string;
    is_private?: boolean;
    parent_id?: string;
}

export const guestbookService = {
    // 방명록 목록 가져오기 (페이지네이션)
    async getEntries(page: number = 1, limit: number = 10) {
        const offset = (page - 1) * limit;

        // 총 개수 먼저 가져오기
        const { count } = await supabase
            .from('guestbook')
            .select('*', { count: 'exact', head: true })
            .is('parent_id', null);

        // 본문 가져오기 (부모 항목만)
        const { data, error } = await supabase
            .from('guestbook')
            .select('*')
            .is('parent_id', null)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) return { data: null, error, count: 0 };

        // 각 항목의 답글 가져오기
        if (data && data.length > 0) {
            const entriesWithReplies = await Promise.all(
                data.map(async (entry) => {
                    const { data: replies } = await supabase
                        .from('guestbook')
                        .select('*')
                        .eq('parent_id', entry.id)
                        .order('created_at', { ascending: true });

                    return {
                        ...entry,
                        replies: replies || []
                    };
                })
            );

            return {
                data: entriesWithReplies,
                error: null,
                count: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            };
        }

        return { data, error: null, count: count || 0, totalPages: Math.ceil((count || 0) / limit) };
    },

    // 방명록 작성
    async createEntry(input: CreateGuestbookEntryInput) {
        const { password, ...entryData } = input;

        // 비밀번호 해싱 (간단한 방식, 실제로는 bcrypt 등 사용 권장)
        const hashedPassword = btoa(password);

        return await supabase
            .from('guestbook')
            .insert({
                ...entryData,
                password_hash: hashedPassword,
                is_private: entryData.is_private || false,
                is_admin_reply: false
            })
            .select()
            .single();
    },

    // 방명록 수정
    async updateEntry(id: string, content: string, password: string) {
        // 비밀번호 확인
        const { data: entry } = await supabase
            .from('guestbook')
            .select('password_hash')
            .eq('id', id)
            .single();

        if (!entry || entry.password_hash !== btoa(password)) {
            return { data: null, error: new Error('비밀번호가 일치하지 않습니다.') };
        }

        return await supabase
            .from('guestbook')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
    },

    // 방명록 삭제
    async deleteEntry(id: string, password: string) {
        // 비밀번호 확인
        const { data: entry } = await supabase
            .from('guestbook')
            .select('password_hash')
            .eq('id', id)
            .single();

        if (!entry || entry.password_hash !== btoa(password)) {
            return { data: null, error: new Error('비밀번호가 일치하지 않습니다.') };
        }

        // 답글도 함께 삭제
        await supabase
            .from('guestbook')
            .delete()
            .eq('parent_id', id);

        return await supabase
            .from('guestbook')
            .delete()
            .eq('id', id);
    },

    // 관리자 답글 작성
    async createAdminReply(parentId: string, content: string) {
        return await supabase
            .from('guestbook')
            .insert({
                author_name: '관리자',
                content,
                is_private: false,
                is_admin_reply: true,
                parent_id: parentId
            })
            .select()
            .single();
    }
};
