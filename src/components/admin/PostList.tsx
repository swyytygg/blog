import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, EyeOff, CheckSquare, Square, ToggleLeft, ToggleRight } from 'lucide-react';
import { postService, Post } from '../../services/postService';
import { formatDate } from '../../utils/dateFormat';

interface PostListProps {
    onEdit: (post: Post) => void;
}

const PostList: React.FC<PostListProps> = ({ onEdit }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const result = await postService.getAdminPosts(1, 100); // 전체 목록 조회
            if (result.data) {
                setPosts(result.data);
            }
        } catch (error) {
            console.error('글 목록 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedPosts.length === posts.length) {
            setSelectedPosts([]);
        } else {
            setSelectedPosts(posts.map(p => p.id));
        }
    };

    const togglePostSelection = (postId: string) => {
        setSelectedPosts(prev =>
            prev.includes(postId)
                ? prev.filter(id => id !== postId)
                : [...prev, postId]
        );
    };

    const deletePost = async (postId: string) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            try {
                const { error } = await postService.deletePost(postId);
                if (error) throw error;
                loadPosts();
            } catch (error) {
                console.error('삭제 실패:', error);
                alert('삭제에 실패했습니다.');
            }
        }
    };

    const togglePublishStatus = async (postId: string, currentIsPublished: boolean) => {
        try {
            const { error } = await postService.updatePost(postId, {
                is_published: !currentIsPublished
            });
            if (error) throw error;

            // 로컬 상태 업데이트 (불필요한 리로딩 방지)
            setPosts(posts.map(p =>
                p.id === postId
                    ? { ...p, status: !currentIsPublished ? 'published' : 'draft', is_published: !currentIsPublished }
                    : p
            ));
        } catch (error) {
            console.error('상태 변경 실패:', error);
            alert('상태 변경에 실패했습니다.');
        }
    };

    const handleBulkAction = async (action: 'publish' | 'unpublish' | 'delete') => {
        if (!selectedPosts.length) return;

        const confirmMsg = action === 'delete'
            ? `${selectedPosts.length}개의 글을 삭제하시겠습니까?`
            : `${selectedPosts.length}개의 글을 ${action === 'publish' ? '공개' : '비공개'}로 변경하시겠습니까?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            const promises = selectedPosts.map(id => {
                if (action === 'delete') return postService.deletePost(id);
                return postService.updatePost(id, { is_published: action === 'publish' });
            });

            await Promise.all(promises);
            setSelectedPosts([]);
            loadPosts();
            alert('일괄 작업이 완료되었습니다.');
        } catch (error) {
            console.error('일괄 작업 실패:', error);
            alert('일괄 작업 중 오류가 발생했습니다.');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">글 목록을 불러오는 중...</div>;

    if (posts.length === 0) return (
        <div className="p-16 text-center border border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 mb-2">작성된 글이 없습니다.</p>
            <p className="text-sm text-gray-400">'새 글 쓰기' 버튼을 눌러 첫 번째 글을 작성해보세요!</p>
        </div>
    );

    // postService에서 오는 데이터가 status만 있을 수 있으므로 is_published 보정
    const normalizedPosts = posts.map(p => ({
        ...p,
        is_published: p.status === 'published'
    }));

    return (
        <div className="space-y-4">
            {selectedPosts.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-indigo-800 font-medium">
                        {selectedPosts.length}개 선택됨
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleBulkAction('publish')}
                            className="px-4 py-2 bg-white text-green-700 border border-green-200 rounded hover:bg-green-50 text-sm flex items-center gap-1"
                        >
                            <Eye size={16} /> 공개 전환
                        </button>
                        <button
                            onClick={() => handleBulkAction('unpublish')}
                            className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded hover:bg-gray-50 text-sm flex items-center gap-1"
                        >
                            <EyeOff size={16} /> 비공개 전환
                        </button>
                        <button
                            onClick={() => handleBulkAction('delete')}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center gap-1"
                        >
                            <Trash2 size={16} /> 삭제
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left w-12">
                                <input
                                    type="checkbox"
                                    checked={selectedPosts.length === posts.length && posts.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 text-sm">제목</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 text-sm">카테고리</th>
                            <th className="px-4 py-3 text-center font-semibold text-gray-600 text-sm">상태</th>
                            <th className="px-4 py-3 text-center font-semibold text-gray-600 text-sm">조회수</th>
                            <th className="px-4 py-3 text-center font-semibold text-gray-600 text-sm">발행/예약일</th>
                            <th className="px-4 py-3 text-center font-semibold text-gray-600 text-sm">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {normalizedPosts.map(post => (
                            <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedPosts.includes(post.id)}
                                        onChange={() => togglePostSelection(post.id)}
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900 cursor-pointer hover:text-indigo-600" onClick={() => onEdit(post)}>
                                        {post.title}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {post.category || '미지정'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => togglePublishStatus(post.id, !!post.is_published)}
                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${post.is_published
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                            }`}
                                    >
                                        {post.is_published ? (
                                            <>
                                                <Eye size={12} /> 공개
                                            </>
                                        ) : (
                                            <>
                                                <EyeOff size={12} /> 비공개
                                            </>
                                        )}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-center text-sm text-gray-500">{post.view_count || 0}</td>
                                <td className="px-4 py-3 text-center text-sm text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <span>{formatDate(post.published_at || post.created_at)}</span>
                                        {post.published_at && new Date(post.published_at) > new Date() && (
                                            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded mt-0.5 animate-pulse">
                                                예약
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => togglePublishStatus(post.id, !!post.is_published)}
                                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                            title={post.is_published ? "비공개로 전환" : "공개로 전환"}
                                        >
                                            {post.is_published ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} />}
                                        </button>
                                        <button
                                            onClick={() => onEdit(post)}
                                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                            title="수정"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => deletePost(post.id)}
                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                                            title="삭제"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PostList;
