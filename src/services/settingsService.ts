import { supabase } from './supabase';

export interface SiteSetting {
    key: string;
    value: string;
    description?: string;
}

export const settingsService = {
    // 모든 설정 가져오기
    async getAllSettings() {
        return await supabase
            .from('site_settings')
            .select('*');
    },

    // 특정 키의 설정 가져오기
    async getSetting(key: string) {
        return await supabase
            .from('site_settings')
            .select('*')
            .eq('key', key)
            .single();
    },

    // 설정 저장 (없으면 생성, 있으면 수정)
    async saveSetting(key: string, value: string, description?: string) {
        return await supabase
            .from('site_settings')
            .upsert({
                key,
                value,
                description,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
    },

    // 여러 설정 일괄 저장
    async saveSettings(settings: { key: string; value: string; description?: string }[]) {
        return await supabase
            .from('site_settings')
            .upsert(settings.map(s => ({
                ...s,
                updated_at: new Date().toISOString()
            })));
    }
};
