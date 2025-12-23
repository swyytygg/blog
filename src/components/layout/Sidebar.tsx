import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, User, BookOpen, TrendingUp, Tag, Search, Home, MessageSquare, Share2 } from 'lucide-react';

// 카테고리 타입 정의
export interface Category {
    id: string;
    name: string;
    slug?: string;
    post_count?: number;
    children?: Category[];
}

// 최근/인기 글 타입
interface RecentPost {
    id: string;
    title: string;
    slug?: string;
    created_at?: string;
    view_count?: number;
}

interface SidebarProps {
    blogName: string;
    blogDescription: string;
    profileImage?: string;
    categories: Category[];
    recentPosts: RecentPost[];
    popularPosts: RecentPost[];
    tags: { name: string; count: number }[];
    onSearch: (query: string) => void;
    loading?: boolean;
}

// 카테고리 아이템 컴포넌트 (재귀적 렌더링)
const CategoryItem: React.FC<{ category: Category; depth?: number }> = ({ category, depth = 0 }) => {
    const [isOpen, setIsOpen] = useState(depth === 0); // 최상위 카테고리는 기본 열림
    const hasChildren = category.children && category.children.length > 0;

    return (
        <div className="category-item">
            <div
                className={`flex items-center justify-between py-2 px-3 hover:bg-gray-100 rounded-md cursor-pointer transition-colors`}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {hasChildren ? (
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-400 hover:text-gray-600 p-0.5"
                        >
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    ) : (
                        <span className="w-[18px]" />
                    )}
                    <Link
                        href={`/category/${category.slug || category.name}`}
                        className="flex-1 text-gray-700 hover:text-indigo-600 text-sm truncate"
                    >
                        {category.name}
                    </Link>
                </div>
                {category.post_count !== undefined && category.post_count > 0 && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                        {category.post_count}
                    </span>
                )}
            </div>
            {hasChildren && isOpen && (
                <div className="category-children">
                    {category.children!.map((child) => (
                        <CategoryItem key={child.id} category={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({
    blogName,
    blogDescription,
    profileImage,
    categories,
    recentPosts,
    popularPosts,
    tags,
    onSearch,
    loading = false,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            onSearch(searchQuery.trim());
            setSearchQuery('');
        }
    };

    return (
        <aside className="main-sidebar w-72 min-w-[288px] bg-white border-r border-gray-200 h-full overflow-y-auto">
            {/* 프로필 섹션 */}
            <div className="profile-section p-6 border-b border-gray-100">
                <Link href="/" className="block">
                    <div className="flex flex-col items-center text-center">
                        <div className="profile-image-wrapper mb-4 relative">
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt={blogName}
                                    width={96}
                                    height={96}
                                    loading="eager"
                                    decoding="async"
                                    className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ring-4 ring-white">
                                    <User size={40} className="text-white" />
                                </div>
                            )}
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">{blogName}</h1>
                        <p className="text-sm text-gray-500 leading-relaxed">{blogDescription}</p>
                    </div>
                </Link>
            </div>

            {/* 검색 섹션 */}
            <div className="search-section p-4 border-b border-gray-100">
                <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="검색어를 입력하세요"
                        className="w-full pl-4 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <button
                        type="submit"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors"
                    >
                        <Search size={18} />
                    </button>
                </form>
            </div>

            {/* 네비게이션 링크 */}
            <div className="nav-links px-4 pt-4">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors font-medium"
                >
                    <Home size={18} />
                    <span>홈</span>
                </Link>
                <Link
                    href="/category/all"
                    className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors font-medium"
                >
                    <BookOpen size={18} />
                    <span>전체 글</span>
                </Link>
                <Link
                    href="/notice"
                    className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors font-medium"
                >
                    <BookOpen size={18} className="text-indigo-500" />
                    <span>공지사항</span>
                </Link>
                <Link
                    href="/guestbook"
                    className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors font-medium"
                >
                    <MessageSquare size={18} />
                    <span>방명록</span>
                </Link>
                <button
                    onClick={() => {
                        const url = window.location.href;
                        navigator.clipboard.writeText(url).then(() => {
                            alert('주소가 복사되었습니다.');
                        }).catch(() => {
                            alert('주소 복사에 실패했습니다.');
                        });
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors font-medium text-left"
                >
                    <Share2 size={18} />
                    <span>공유하기</span>
                </button>
            </div>

            {/* 카테고리 섹션 */}
            <div className="category-section p-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                    <BookOpen size={14} />
                    카테고리
                </h3>
                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : categories.length > 0 ? (
                    <nav className="category-list">
                        {categories.map((category) => (
                            <CategoryItem key={category.id} category={category} />
                        ))}
                    </nav>
                ) : (
                    <p className="text-sm text-gray-400 px-3">카테고리가 없습니다</p>
                )}
            </div>

            {/* 최근 글 섹션 */}
            {recentPosts.length > 0 && (
                <div className="recent-posts-section p-4 border-t border-gray-100">
                    <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                        <BookOpen size={14} />
                        최근 글
                    </h3>
                    <ul className="space-y-1">
                        {recentPosts.slice(0, 5).map((post) => (
                            <li key={post.id}>
                                <Link
                                    href={`/post/${post.slug || post.id}`}
                                    className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600 rounded-md transition-colors line-clamp-1"
                                >
                                    {post.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 인기 글 섹션 */}
            {popularPosts.length > 0 && (
                <div className="popular-posts-section p-4 border-t border-gray-100">
                    <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                        <TrendingUp size={14} />
                        인기 글
                    </h3>
                    <ul className="space-y-1">
                        {popularPosts.slice(0, 5).map((post, index) => (
                            <li key={post.id}>
                                <Link
                                    href={`/post/${post.slug || post.id}`}
                                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600 rounded-md transition-colors"
                                >
                                    <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full text-xs font-bold flex items-center justify-center">
                                        {index + 1}
                                    </span>
                                    <span className="line-clamp-1 flex-1">{post.title}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 태그 클라우드 섹션 */}
            {tags.length > 0 && (
                <div className="tags-section p-4 border-t border-gray-100">
                    <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                        <Tag size={14} />
                        태그
                    </h3>
                    <div className="flex flex-wrap gap-2 px-3">
                        {tags.slice(0, 15).map((tag) => (
                            <Link
                                key={tag.name}
                                href={`/tag/${tag.name}`}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                            >
                                #{tag.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* 사이드바 광고 영역 */}
            <aside
                className="sidebar-ad-section p-4 border-t border-gray-100"
                aria-label="광고"
            >
                <div
                    className="ad-placeholder bg-gray-50 rounded-lg p-4 text-center min-h-[250px] flex items-center justify-center border border-dashed border-gray-200"
                >
                    <span className="text-xs text-gray-400 font-medium">
                        ADVERTISEMENT
                    </span>
                </div>
            </aside>
        </aside>
    );
};

export default Sidebar;
