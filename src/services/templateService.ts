import { supabase } from './supabase';

export interface Template {
    id: string;
    name: string;
    description?: string;
    content: string;
    content_type: 'markdown' | 'html';
    category?: string;
    icon?: string;
    created_at?: string;
    updated_at?: string;
}

export const templateService = {
    // 모든 서식 가져오기
    async getTemplates() {
        return await (supabase as any).from('templates')
            .select('*')
            .order('created_at', { ascending: false });
    },

    // 서식 상세 정보
    async getTemplate(id: string) {
        return await (supabase as any).from('templates')
            .select('*')
            .eq('id', id)
            .single();
    },

    // 서식 생성
    async createTemplate(template: Omit<Template, 'id' | 'created_at' | 'updated_at'>) {
        return await (supabase as any).from('templates')
            .insert(template)
            .select()
            .single();
    },

    // 서식 업데이트
    async updateTemplate(id: string, updates: Partial<Template>) {
        return await (supabase as any).from('templates')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
    },

    // 서식 삭제
    async deleteTemplate(id: string) {
        return await (supabase as any).from('templates')
            .delete()
            .eq('id', id);
    }
};
