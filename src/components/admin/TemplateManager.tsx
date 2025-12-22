import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, FileText, Check, Layout, Info, Lightbulb } from 'lucide-react';
import { templateService, Template } from '../../services/templateService';

const TemplateManager: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<Partial<Template> | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        const { data, error } = await templateService.getTemplates();
        if (error) {
            console.error('Failed to load templates:', error);
            // 만약 테이블이 없으면 기본 서식 안내
            if (error.message.includes('relation "templates" does not exist')) {
                setStatus({ type: 'error', message: '서식 테이블이 없습니다. 템플릿 기능을 사용하려면 DB 생성이 필요합니다.' });
            }
        } else {
            setTemplates(data || []);
        }
        setLoading(false);
    };

    const handleCreate = () => {
        setCurrentTemplate({
            name: '',
            description: '',
            content: '',
            content_type: 'html',
            category: ''
        });
        setIsEditing(true);
    };

    const handleEdit = (template: Template) => {
        setCurrentTemplate(template);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('이 서식을 삭제하시겠습니까?')) return;

        const { error } = await templateService.deleteTemplate(id);
        if (error) {
            setStatus({ type: 'error', message: '삭제 실패: ' + error.message });
        } else {
            setStatus({ type: 'success', message: '서식이 삭제되었습니다.' });
            loadTemplates();
        }
    };

    const handleSave = async () => {
        if (!currentTemplate?.name || !currentTemplate?.content) {
            alert('이름과 내용을 입력해주세요.');
            return;
        }

        let result;
        if (currentTemplate.id) {
            result = await templateService.updateTemplate(currentTemplate.id, currentTemplate);
        } else {
            result = await templateService.createTemplate(currentTemplate as any);
        }

        if (result.error) {
            setStatus({ type: 'error', message: '저장 실패: ' + result.error.message });
        } else {
            setStatus({ type: 'success', message: '서식이 저장되었습니다.' });
            setIsEditing(false);
            setCurrentTemplate(null);
            loadTemplates();
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">서식을 불러오는 중...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <Layout size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">글 서식 관리</h2>
                </div>
                {!isEditing && (
                    <button
                        onClick={handleCreate}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition text-sm"
                    >
                        <Plus size={18} />
                        새 서식 추가
                    </button>
                )}
            </div>

            {status && (
                <div className={`m-6 p-4 rounded-lg flex items-center justify-between ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        {status.type === 'success' ? <Check size={16} /> : <Info size={16} />}
                        {status.message}
                    </div>
                    <button onClick={() => setStatus(null)}><X size={16} /></button>
                </div>
            )}

            {isEditing ? (
                <div className="p-8 space-y-6 bg-gray-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">서식 이름</label>
                            <input
                                type="text"
                                value={currentTemplate?.name || ''}
                                onChange={e => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="예: 공지사항 기본형"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">카테고리 (옵션)</label>
                            <input
                                type="text"
                                value={currentTemplate?.category || ''}
                                onChange={e => setCurrentTemplate({ ...currentTemplate, category: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="예: 공지사항"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">상세 설명</label>
                        <input
                            type="text"
                            value={currentTemplate?.description || ''}
                            onChange={e => setCurrentTemplate({ ...currentTemplate, description: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="이 서식에 대한 간단한 설명을 입력하세요."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">서식 내용 (HTML/마크다운)</label>
                        <textarea
                            value={currentTemplate?.content || ''}
                            onChange={e => setCurrentTemplate({ ...currentTemplate, content: e.target.value })}
                            className="w-full h-64 px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                            placeholder="사용할 서식의 내용을 입력하세요."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition shadow-md"
                        >
                            서식 저장
                        </button>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">서식명</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">설명</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {templates.length > 0 ? templates.map(template => (
                                <tr key={template.id} className="hover:bg-gray-50/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{template.name}</div>
                                        <div className="text-xs text-indigo-500 font-medium">{template.category || '일반'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {template.description || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleEdit(template)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                title="수정"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="삭제"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                                        <FileText size={48} className="mx-auto mb-3 opacity-20" />
                                        등록된 서식이 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TemplateManager;
