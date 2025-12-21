import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    MessageSquare,
    Send,
    Lock,
    Unlock,
    User,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Edit2,
    Reply,
    X,
    ArrowLeft
} from 'lucide-react';
import { guestbookService, GuestbookEntry, CreateGuestbookEntryInput } from '../services/guestbookService';
import { formatDate } from '../utils/dateFormat';

const Guestbook: React.FC = () => {
    const [entries, setEntries] = useState<GuestbookEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // 작성 폼 상태
    const [formData, setFormData] = useState<CreateGuestbookEntryInput>({
        author_name: '',
        author_email: '',
        password: '',
        content: '',
        is_private: false
    });

    // 삭제 모달 상태
    const [deleteModal, setDeleteModal] = useState<{ id: string; visible: boolean }>({ id: '', visible: false });
    const [deletePassword, setDeletePassword] = useState('');

    // 답글 상태
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    // 방명록 로드
    const loadEntries = async (page: number = 1) => {
        setLoading(true);
        try {
            const result = await guestbookService.getEntries(page, 10);
            if (result.data) {
                setEntries(result.data);
                setTotalPages(result.totalPages || 1);
                setTotalCount(result.count || 0);
            }
        } catch (error) {
            console.error('방명록 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEntries(currentPage);
    }, [currentPage]);

    // 방명록 작성
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.author_name.trim() || !formData.password.trim() || !formData.content.trim()) {
            alert('이름, 비밀번호, 내용을 모두 입력해주세요.');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await guestbookService.createEntry(formData);
            if (error) throw error;

            // 폼 초기화
            setFormData({
                author_name: '',
                author_email: '',
                password: '',
                content: '',
                is_private: false
            });

            // 목록 새로고침
            loadEntries(1);
            setCurrentPage(1);
        } catch (error) {
            console.error('방명록 작성 실패:', error);
            alert('작성에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setSubmitting(false);
        }
    };

    // 방명록 삭제
    const handleDelete = async () => {
        if (!deletePassword.trim()) {
            alert('비밀번호를 입력해주세요.');
            return;
        }

        try {
            const { error } = await guestbookService.deleteEntry(deleteModal.id, deletePassword);
            if (error) throw error;

            setDeleteModal({ id: '', visible: false });
            setDeletePassword('');
            loadEntries(currentPage);
        } catch (error: any) {
            alert(error.message || '삭제에 실패했습니다.');
        }
    };

    // 페이지 변경
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="guestbook-page px-40 py-10">
            {/* 헤더 */}
            <div className="mb-8">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4"
                >
                    <ArrowLeft size={16} />
                    홈으로
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                        <MessageSquare size={24} className="text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">방명록</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            총 {totalCount}개의 메시지
                        </p>
                    </div>
                </div>
            </div>

            {/* 작성 폼 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">메시지 남기기</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                이름 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.author_name}
                                onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                                placeholder="이름을 입력하세요"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                maxLength={50}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                비밀번호 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="수정/삭제 시 필요"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                maxLength={20}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            내용 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="메시지를 남겨주세요..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            maxLength={500}
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">
                            {formData.content.length}/500
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_private}
                                onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                                <Lock size={14} />
                                비공개
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>작성 중...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    <span>작성하기</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* 방명록 목록 */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="loading-spinner mb-4"></div>
                        <p className="text-gray-500">방명록을 불러오는 중...</p>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">💬</div>
                        <p className="text-gray-500 text-lg">아직 방명록이 없습니다.</p>
                        <p className="text-gray-400 text-sm mt-2">첫 번째 메시지를 남겨주세요!</p>
                    </div>
                ) : (
                    entries.map((entry) => (
                        <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-5">
                            {/* 메인 항목 */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                        {entry.author_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{entry.author_name}</span>
                                            {entry.is_private && (
                                                <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    <Lock size={10} />
                                                    비공개
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            <Calendar size={12} />
                                            {formatDate(entry.created_at)}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setDeleteModal({ id: entry.id, visible: true })}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="삭제"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <p className="text-gray-700 whitespace-pre-wrap mb-4 pl-13">
                                {entry.is_private ? '🔒 비공개 메시지입니다.' : entry.content}
                            </p>

                            {/* 답글 목록 */}
                            {entry.replies && entry.replies.length > 0 && (
                                <div className="ml-6 mt-4 space-y-3 border-l-2 border-indigo-100 pl-4">
                                    {entry.replies.map((reply) => (
                                        <div key={reply.id} className="bg-indigo-50/50 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-sm font-medium ${reply.is_admin_reply ? 'text-indigo-600' : 'text-gray-700'}`}>
                                                    {reply.author_name}
                                                    {reply.is_admin_reply && (
                                                        <span className="ml-1 text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded">관리자</span>
                                                    )}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {formatDate(reply.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">{reply.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg transition-colors ${currentPage === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === page
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg transition-colors ${currentPage === totalPages
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* 삭제 확인 모달 */}
            {deleteModal.visible && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">방명록 삭제</h3>
                            <button
                                onClick={() => {
                                    setDeleteModal({ id: '', visible: false });
                                    setDeletePassword('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            삭제하려면 작성 시 입력한 비밀번호를 입력하세요.
                        </p>
                        <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="비밀번호"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setDeleteModal({ id: '', visible: false });
                                    setDeletePassword('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Guestbook;
