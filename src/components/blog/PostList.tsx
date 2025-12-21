import React, { useState } from 'react';
import PostCard from './PostCard';
import { Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';

interface PostListProps {
    posts: any[];
    postsPerPage?: number;
    showViewToggle?: boolean;
}

const PostList: React.FC<PostListProps> = ({
    posts,
    postsPerPage = 6,
    showViewToggle = true
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // 페이지네이션 계산
    const totalPages = Math.ceil(posts.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const currentPosts = posts.slice(startIndex, endIndex);

    // 페이지 변경
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // 페이지 번호 배열 생성
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    if (posts.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500 text-lg">아직 작성된 글이 없습니다.</p>
                <p className="text-gray-400 text-sm mt-2">첫 번째 글을 작성해보세요!</p>
            </div>
        );
    }

    return (
        <div className="post-list">
            {/* 헤더: 글 개수 및 뷰 모드 토글 */}
            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500">
                    총 <span className="font-semibold text-indigo-600">{posts.length}</span>개의 글
                </p>

                {showViewToggle && (
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            aria-label="그리드 보기"
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            aria-label="리스트 보기"
                        >
                            <List size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* 포스트 그리드/리스트 */}
            <div className={
                viewMode === 'grid'
                    ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-2'
                    : 'flex flex-col gap-4'
            }>
                {currentPosts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        variant={viewMode === 'grid' ? 'card' : 'list'}
                    />
                ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                    {/* 이전 페이지 */}
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg transition-colors ${currentPage === 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        aria-label="이전 페이지"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    {/* 페이지 번호 */}
                    {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                                ...
                            </span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => goToPage(page as number)}
                                className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === page
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {page}
                            </button>
                        )
                    ))}

                    {/* 다음 페이지 */}
                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg transition-colors ${currentPage === totalPages
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        aria-label="다음 페이지"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* 페이지 정보 */}
            {totalPages > 1 && (
                <p className="text-center text-sm text-gray-400 mt-4">
                    {currentPage} / {totalPages} 페이지
                </p>
            )}
        </div>
    );
};

export default PostList;
