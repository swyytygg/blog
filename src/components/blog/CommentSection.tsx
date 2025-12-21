import React, { useState, useEffect } from 'react';
import {
    MessageCircle,
    Send,
    Lock,
    Reply,
    Trash2,
    Edit2,
    X,
    ChevronDown,
    ChevronUp,
    User
} from 'lucide-react';
import { commentService, Comment } from '../../services/commentService';
import { formatDate } from '../../utils/dateFormat';

interface CommentSectionProps {
    postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(true);

    // 작성 폼 상태
    const [formData, setFormData] = useState({
        author_name: '',
        password: '',
        content: '',
        is_private: false
    });

    // 답글 상태
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [replyData, setReplyData] = useState({
        author_name: '',
        password: '',
        content: ''
    });

    // 삭제 모달
    const [deleteModal, setDeleteModal] = useState<{ id: string; visible: boolean }>({ id: '', visible: false });
    const [deletePassword, setDeletePassword] = useState('');

    // 댓글 로드
    const loadComments = async () => {
        setLoading(true);
        try {
            const { data, error } = await commentService.getCommentsByPostId(postId);
            if (!error && data) {
                setComments(data);
            }
        } catch (error) {
            console.error('댓글 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadComments();
    }, [postId]);

    // 댓글 작성
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.author_name.trim() || !formData.password.trim() || !formData.content.trim()) {
            alert('이름, 비밀번호, 내용을 모두 입력해주세요.');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await commentService.createComment({
                post_id: postId,
                ...formData
            });

            if (error) throw error;

            setFormData({
                author_name: '',
                password: '',
                content: '',
                is_private: false
            });

            loadComments();
        } catch (error) {
            console.error('댓글 작성 실패:', error);
            alert('댓글 작성에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    // 답글 작성
    const handleReplySubmit = async (parentId: string) => {
        if (!replyData.author_name.trim() || !replyData.password.trim() || !replyData.content.trim()) {
            alert('이름, 비밀번호, 내용을 모두 입력해주세요.');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await commentService.createComment({
                post_id: postId,
                parent_id: parentId,
                ...replyData
            });

            if (error) throw error;

            setReplyTo(null);
            setReplyData({ author_name: '', password: '', content: '' });
            loadComments();
        } catch (error) {
            console.error('답글 작성 실패:', error);
            alert('답글 작성에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    // 댓글 삭제
    const handleDelete = async () => {
        if (!deletePassword.trim()) {
            alert('비밀번호를 입력해주세요.');
            return;
        }

        try {
            const { error } = await commentService.deleteComment(deleteModal.id, deletePassword, postId);
            if (error) throw error;

            setDeleteModal({ id: '', visible: false });
            setDeletePassword('');
            loadComments();
        } catch (error: any) {
            alert(error.message || '삭제에 실패했습니다.');
        }
    };

    // 댓글 수
    const totalComments = comments.reduce((acc, comment) =>
        acc + 1 + (comment.replies?.length || 0), 0
    );

    return (
        <div className="comment-section mt-12 pt-8 border-t border-gray-200">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <MessageCircle size={20} />
                    댓글 {totalComments > 0 && <span className="text-indigo-600">({totalComments})</span>}
                </h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="text-sm text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
                >
                    {showForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {showForm ? '접기' : '댓글 작성'}
                </button>
            </div>

            {/* 작성 폼 */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-5 mb-6">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                            type="text"
                            value={formData.author_name}
                            onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                            placeholder="이름"
                            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            maxLength={30}
                        />
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="비밀번호"
                            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            maxLength={20}
                        />
                    </div>
                    <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="댓글을 작성해주세요..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none mb-3"
                        maxLength={500}
                    />
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_private}
                                onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                                <Lock size={12} />
                                비밀 댓글
                            </span>
                        </label>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
                        >
                            <Send size={14} />
                            등록
                        </button>
                    </div>
                </form>
            )}

            {/* 댓글 목록 */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-10">
                    <MessageCircle size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">첫 번째 댓글을 남겨주세요!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                            {/* 메인 댓글 */}
                            <div className="bg-white border border-gray-100 rounded-xl p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                            {comment.author_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900 text-sm">{comment.author_name}</span>
                                            <span className="text-xs text-gray-400 ml-2">{formatDate(comment.created_at)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                            title="답글"
                                        >
                                            <Reply size={14} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ id: comment.id, visible: true })}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            title="삭제"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap ml-11">
                                    {comment.is_private ? '🔒 비밀 댓글입니다.' : comment.content}
                                </p>
                            </div>

                            {/* 답글 폼 */}
                            {replyTo === comment.id && (
                                <div className="ml-8 mt-3 bg-indigo-50/50 rounded-lg p-4">
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={replyData.author_name}
                                            onChange={(e) => setReplyData({ ...replyData, author_name: e.target.value })}
                                            placeholder="이름"
                                            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        />
                                        <input
                                            type="password"
                                            value={replyData.password}
                                            onChange={(e) => setReplyData({ ...replyData, password: e.target.value })}
                                            placeholder="비밀번호"
                                            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={replyData.content}
                                            onChange={(e) => setReplyData({ ...replyData, content: e.target.value })}
                                            placeholder="답글을 입력하세요..."
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        />
                                        <button
                                            onClick={() => handleReplySubmit(comment.id)}
                                            disabled={submitting}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50"
                                        >
                                            등록
                                        </button>
                                        <button
                                            onClick={() => setReplyTo(null)}
                                            className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm"
                                        >
                                            취소
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 대댓글 목록 */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="ml-8 mt-3 space-y-2">
                                    {comment.replies.map((reply) => (
                                        <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Reply size={12} className="text-gray-400" />
                                                    <span className="font-medium text-gray-900 text-sm">{reply.author_name}</span>
                                                    <span className="text-xs text-gray-400">{formatDate(reply.created_at)}</span>
                                                </div>
                                                <button
                                                    onClick={() => setDeleteModal({ id: reply.id, visible: true })}
                                                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-600 ml-5">
                                                {reply.is_private ? '🔒 비밀 댓글입니다.' : reply.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 삭제 확인 모달 */}
            {deleteModal.visible && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">댓글 삭제</h3>
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
                            삭제하려면 비밀번호를 입력하세요.
                        </p>
                        <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="비밀번호"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setDeleteModal({ id: '', visible: false });
                                    setDeletePassword('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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

export default CommentSection;
