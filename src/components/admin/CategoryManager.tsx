import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { categoryService, Category } from '../../services/categoryService';

const CategoryManager: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newParentId, setNewParentId] = useState<string>('');
    const [editName, setEditName] = useState('');

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const { data } = await categoryService.getCategoriesWithPostCount();
            if (data) setCategories(data);
        } catch (error) {
            console.error('카테고리 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            await categoryService.createCategory({
                name: newCategoryName,
                slug: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
                parent_id: newParentId || undefined,
                order_index: categories.length // 대충 마지막 순서로
            });
            setNewCategoryName('');
            setNewParentId('');
            loadCategories();
        } catch (error) {
            console.error('카테고리 생성 실패:', error);
            alert('카테고리 생성 실패: ' + (error as any).message);
        }
    };

    const startEdit = (category: Category) => {
        setEditingId(category.id);
        setEditName(category.name);
    };

    const handleUpdate = async (id: string) => {
        if (!editName.trim()) return;
        try {
            await categoryService.updateCategory(id, {
                name: editName,
                slug: editName.toLowerCase().replace(/\s+/g, '-')
            });
            setEditingId(null);
            loadCategories();
        } catch (error) {
            console.error('수정 실패:', error);
            alert('수정 실패: ' + (error as any).message);
        }
    };

    const handleDelete = async (id: string, hasChildren: boolean) => {
        if (hasChildren) {
            alert('하위 카테고리가 있는 경우 삭제할 수 없습니다.');
            return;
        }
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        try {
            await categoryService.deleteCategory(id);
            loadCategories();
        } catch (error) {
            console.error('삭제 실패:', error);
            alert('삭제 실패: ' + (error as any).message);
        }
    };

    const renderCategoryItem = (category: Category, depth = 0) => {
        const isEditing = editingId === category.id;
        const hasChildren = category.children && category.children.length > 0;

        return (
            <div key={category.id} className="mb-2">
                <div
                    className={`flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors ${depth > 0 ? 'ml-8 border-l-4 border-l-indigo-100' : ''}`}
                >
                    <GripVertical size={16} className="text-gray-400 cursor-move" />

                    {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                autoFocus
                            />
                            <button onClick={() => handleUpdate(category.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                                <Save size={16} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 font-medium text-gray-700 flex items-center gap-2">
                                {category.name}
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    /{category.slug}
                                </span>
                                {category.post_count !== undefined && (
                                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                        {category.post_count} posts
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => startEdit(category)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(category.id, !!hasChildren)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
                {hasChildren && (
                    <div className="mt-2 space-y-2">
                        {category.children!.map(child => renderCategoryItem(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">카테고리 관리</h2>
            </div>

            {/* 카테고리 추가 폼 */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">새 카테고리 추가</h3>
                <form onSubmit={handleCreate} className="flex gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="카테고리 이름"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="w-48">
                        <select
                            value={newParentId}
                            onChange={(e) => setNewParentId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">상위 카테고리 (없음)</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={!newCategoryName.trim()}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Plus size={18} />
                        추가
                    </button>
                </form>
            </div>

            {/* 카테고리 목록 */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">로딩 중...</div>
            ) : categories.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">카테고리가 없습니다.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {categories.map(cat => renderCategoryItem(cat))}
                </div>
            )}
        </div>
    );
};

export default CategoryManager;
