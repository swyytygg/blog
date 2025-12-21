import React, { useState, useEffect } from 'react';
import { Trash2, MessageSquare, Reply, Lock, Search } from 'lucide-react';
import { guestbookService, GuestbookEntry } from '../../services/guestbookService';
import { formatDate } from '../../utils/dateFormat';

const GuestbookManager: React.FC = () => {
    const [entries, setEntries] = useState<GuestbookEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    useEffect(() => {
        loadEntries();
    }, [page]);

    const loadEntries = async () => {
        setLoading(true);
        try {
            const result = await guestbookService.getEntries(page, 20); // 관리자 페이지니까 더 많이
            if (result.data) setEntries(result.data);
        } catch (error) {
            console.error('방명록 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('정말 이 방명록을 삭제하시겠습니까? (답글도 모두 삭제됩니다)')) return;

        // 관리자 권한 삭제는 비밀번호 없이 가능하도록 서비스 로직 수정 필요하나,
        // 현재 guestbookService.deleteEntry는 비밀번호를 요구함.
        // 따라서 Supabase RLS 정책이나 관리자 전용 API가 필요한데, 임시로 비밀번호 우회 로직이 없으면 삭제 불가할 수 있음.
        // 여기서는 그냥 경고만 띄우거나, 실제로는 관리자용 delete 함수를 추가해야 함.
        alert('관리자 모드 삭제 기능은 서버 사이드 로직 수정이 필요합니다. (비밀번호 검증 우회)');
    };

    const handleReply = async (parentId: string) => {
        if (!replyContent.trim()) return;

        try {
            await guestbookService.createAdminReply(parentId, replyContent);
            setReplyTo(null);
            setReplyContent('');
            loadEntries();
        } catch (error) {
            alert('답글 작성 실패');
        }
    };

    return (
        <div className="max-w-4xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">방명록 관리</h2>

            {loading ? (
                <div className="text-center py-10">로딩 중...</div>
            ) : (
                <div className="space-y-4">
                    {entries.map((entry) => (
                        <div key={entry.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                        {entry.author_name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">{entry.author_name}</span>
                                            {entry.is_private && <Lock size={14} className="text-gray-400" />}
                                            <span className="text-xs text-gray-500">{formatDate(entry.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-gray-500">{entry.author_email || 'No Email'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setReplyTo(replyTo === entry.id ? null : entry.id)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                        title="답글 달기"
                                    >
                                        <Reply size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        title="삭제"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg text-gray-700 mb-3 ml-12">
                                {entry.content}
                            </div>

                            {/* 답글 목록 */}
                            {entry.replies && entry.replies.length > 0 && (
                                <div className="ml-12 pl-4 border-l-2 border-indigo-100 space-y-3 mt-3">
                                    {entry.replies.map(reply => (
                                        <div key={reply.id} className="bg-indigo-50/50 p-3 rounded-lg">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-semibold text-indigo-700 mb-1 block">
                                                    {reply.author_name} <span className="text-xs font-normal text-indigo-500">(관리자)</span>
                                                </span>
                                                <span className="text-xs text-gray-400">{formatDate(reply.created_at)}</span>
                                            </div>
                                            <p className="text-sm text-gray-600">{reply.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 답글 작성 폼 */}
                            {replyTo === entry.id && (
                                <div className="ml-12 mt-3 bg-white border border-indigo-200 p-4 rounded-lg shadow-sm">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">관리자 답글 작성</h4>
                                    <textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                                        rows={3}
                                        placeholder="답글 내용을 입력하세요..."
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setReplyTo(null)}
                                            className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
                                        >
                                            취소
                                        </button>
                                        <button
                                            onClick={() => handleReply(entry.id)}
                                            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                        >
                                            답글 등록
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GuestbookManager;
