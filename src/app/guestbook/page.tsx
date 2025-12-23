'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    MessageSquare,
    Send,
    Lock,
    User,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Trash2,
    X,
    ArrowLeft,
    Shield
} from 'lucide-react';
import { guestbookService, GuestbookEntry, CreateGuestbookEntryInput } from '../../services/guestbookService';
import { formatDate } from '../../utils/dateFormat';
import GoogleAd from '../../components/common/GoogleAd';

export default function GuestbookPage() {
    const [entries, setEntries] = useState<GuestbookEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);

    const [formData, setFormData] = useState<CreateGuestbookEntryInput>({
        author_name: '',
        author_email: '',
        password: '',
        content: '',
        is_private: false
    });

    const [deleteModal, setDeleteModal] = useState<{ id: string; visible: boolean }>({ id: '', visible: false });
    const [deletePassword, setDeletePassword] = useState('');

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
        checkAdmin();
    }, [currentPage]);

    const checkAdmin = async () => {
        const { data: { session } } = await guestbookService.checkSession();
        setIsAdmin(!!session);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { error } = await guestbookService.createEntry(formData);
            if (error) throw error;
            setFormData({
                author_name: '',
                author_email: '',
                password: '',
                content: '',
                is_private: false
            });
            loadEntries(1);
            setCurrentPage(1);
        } catch (error) {
            console.error('방명록 작성 실패:', error);
            alert('작성에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            const { error } = await guestbookService.deleteEntry(deleteModal.id, isAdmin ? undefined : deletePassword);
            if (error) throw error;
            setDeleteModal({ id: '', visible: false });
            setDeletePassword('');
            loadEntries(currentPage);
        } catch (error: any) {
            alert(error.message || '삭제에 실패했습니다.');
        }
    };

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="max-w-[95%] mx-auto px-4 sm:px-8 lg:px-12 py-8">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 lg:p-16">
                <div className="lg:flex lg:gap-16">
                    <div className="flex-1 min-w-0">
                        <div className="max-w-none lg:mx-0">
                            <div className="mb-8 flex items-center gap-3">
                                <div className="p-3 bg-indigo-100 rounded-xl">
                                    <MessageSquare size={24} className="text-indigo-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">방명록</h1>
                                    <p className="text-sm text-gray-500 mt-1">총 {totalCount}개의 메시지</p>
                                </div>
                            </div>

                            <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6 mb-8">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">메시지 남기기</h2>
                                <form onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">이름(ID)</label>
                                            <input
                                                type="text"
                                                value={formData.author_name}
                                                onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                                                placeholder="이름을 입력하세요"
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 (선택)</label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="수정/삭제 시 필요"
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                                        <textarea
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            placeholder="메시지를 남겨주세요..."
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_private}
                                                onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                                            />
                                            <span className="text-sm text-gray-600 flex items-center gap-1">
                                                <Lock size={14} /> 비공개
                                            </span>
                                        </label>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
                                        >
                                            {submitting ? '저장 중...' : '저장하기'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="flex justify-center mb-10">
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 px-8 py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-full transition-all border-2 border-indigo-500 shadow-md font-medium"
                                >
                                    <ArrowLeft size={16} /> 처음으로 돌아가기
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    <div className="text-center py-16">로딩 중...</div>
                                ) : entries.length === 0 ? (
                                    <div className="text-center py-16">아직 방명록이 없습니다.</div>
                                ) : (
                                    entries.map((entry) => (
                                        <div key={entry.id} className="border-b border-gray-100 py-8 last:border-0">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                                                        {entry.author_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-900">{entry.author_name}</span>
                                                            {entry.is_private && <Lock size={10} className="text-gray-400" />}
                                                        </div>
                                                        <div className="text-xs text-gray-400">{formatDate(entry.created_at)}</div>
                                                    </div>
                                                </div>
                                                <button onClick={() => setDeleteModal({ id: entry.id, visible: true })} className="text-gray-400 hover:text-red-500">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <p className="text-gray-700">{entry.is_private && !isAdmin ? '🔒 비공개 메시지입니다.' : entry.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {deleteModal.visible && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">방명록 삭제</h3>
                        <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="비밀번호"
                            className="w-full px-4 py-2 border mb-4 rounded-lg"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setDeleteModal({ id: '', visible: false })} className="flex-1 py-2 border rounded-lg">취소</button>
                            <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg">삭제</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
