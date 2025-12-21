import { supabase } from './supabase';
import { Tables, TablesInsert, TablesUpdate } from '../types/supabase';

export type Category = Tables<'categories'> & {
    children?: Category[];
    post_count?: number;
};
export type CategoryInsert = TablesInsert<'categories'>;
export type CategoryUpdate = TablesUpdate<'categories'>;

export const categoryService = {
    // 모든 카테고리 가져오기
    async getAllCategories() {
        return await supabase
            .from('categories')
            .select('*')
            .order('order_index', { ascending: true });
    },

    // 슬러그로 카테고리 정보 가져오기
    async getCategoryBySlug(slug: string) {
        // 먼저 정확한 슬러그 매칭 시도
        let { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .single();

        // 슬러그 로 찾지 못한 경우, 이름으로 시도 (레거시 지원)
        if (!data) {
            const result = await supabase
                .from('categories')
                .select('*')
                .eq('name', slug)
                .single();
            data = result.data;
        }

        return { data, error };
    },

    // 계층형 카테고리 트리 구조로 변환
    buildCategoryTree(categories: Category[]): Category[] {
        const categoryMap = new Map<string, Category>();
        const rootCategories: Category[] = [];

        // 먼저 모든 카테고리를 맵에 저장
        categories.forEach(cat => {
            categoryMap.set(cat.id, { ...cat, children: [] });
        });

        // 부모-자식 관계 설정
        categories.forEach(cat => {
            const category = categoryMap.get(cat.id)!;
            if (cat.parent_id && categoryMap.has(cat.parent_id)) {
                const parent = categoryMap.get(cat.parent_id)!;
                parent.children = parent.children || [];
                parent.children.push(category);
            } else {
                rootCategories.push(category);
            }
        });

        return rootCategories;
    },

    // 카테고리별 포스트 수 가져오기
    async getCategoriesWithPostCount() {
        const { data: categories, error: catError } = await this.getAllCategories();
        if (catError || !categories) return { data: [], error: catError };

        // 각 카테고리의 포스트 수 계산
        const categoriesWithCount = await Promise.all(
            categories.map(async (cat) => {
                const { count } = await supabase
                    .from('posts')
                    .select('*', { count: 'exact', head: true })
                    .eq('category_id', cat.id)
                    .eq('status', 'published');

                return {
                    ...cat,
                    post_count: count || 0
                };
            })
        );

        return { data: this.buildCategoryTree(categoriesWithCount as Category[]), error: null };
    },

    // 카테고리 생성
    async createCategory(category: CategoryInsert) {
        return await supabase
            .from('categories')
            .insert(category)
            .select()
            .single();
    },

    // 카테고리 수정
    async updateCategory(id: string, updates: CategoryUpdate) {
        return await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
    },

    // 카테고리 삭제
    async deleteCategory(id: string) {
        return await supabase
            .from('categories')
            .delete()
            .eq('id', id);
    },

    // 카테고리 순서 변경
    async reorderCategories(categoryOrders: { id: string; order_index: number }[]) {
        const promises = categoryOrders.map(({ id, order_index }) =>
            supabase
                .from('categories')
                .update({ order_index })
                .eq('id', id)
        );

        return await Promise.all(promises);
    }
};
