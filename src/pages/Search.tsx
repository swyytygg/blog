import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, X, Clock, TrendingUp, ArrowLeft, Filter } from 'lucide-react';
import { useSearch, highlightText } from '../hooks/useSearch';
import { formatDate } from '../utils/dateFormat';

const Search: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const [query, setQuery] = useState(initialQuery);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        results,
        loading,
        error,
        searchHistory,
        search,
        clearHistory,
        removeFromHistory,
    } = useSearch();

    // 초기 검색 실행
    useEffect(() => {
        if (initialQuery) {
            search({ query: initialQuery, category: selectedCategory || undefined });
        }
    }, [initialQuery, selectedCategory]);

    // 검색 제출
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setSearchParams({ q: query.trim() });
            setShowSuggestions(false);
        }
    };

    // 히스토리에서 검색어 선택
    const handleHistoryClick = (historyQuery: string) => {
        setQuery(historyQuery);
        setSearchParams({ q: historyQuery });
        setShowSuggestions(false);
    };

    // 검색어 지우기
    const handleClearQuery = () => {
        setQuery('');
        inputRef.current?.focus();
    };

    // 카테고리 목록 (실제로는 API에서 가져와야 함)
    const categories = ['여행', '기술', '라이프스타일', '리뷰'];

    return (
        <div className="search-page max-w-3xl mx-auto">
            {/* 검색 헤더 */}
            <div className="mb-8">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4"
                >
                    <ArrowLeft size={16} />
                    홈으로
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">검색</h1>

                {/* 검색 폼 */}
                <form onSubmit={handleSubmit} className="relative">
                    <div className="relative">
                        <SearchIcon
                            size={22}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder="검색어를 입력하세요..."
                            className="w-full pl-12 pr-24 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                            autoFocus
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {query && (
                                <button
                                    type="button"
                                    onClick={handleClearQuery}
                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            )}
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                            >
                                검색
                            </button>
                        </div>
                    </div>

                    {/* 검색 히스토리 드롭다운 */}
                    {showSuggestions && searchHistory.length > 0 && !initialQuery && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock size={14} />
                                    <span>최근 검색어</span>
                                </div>
                                <button
                                    onClick={clearHistory}
                                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    전체 삭제
                                </button>
                            </div>
                            <ul>
                                {searchHistory.map((item, index) => (
                                    <li key={index} className="border-b border-gray-50 last:border-0">
                                        <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                            <button
                                                onClick={() => handleHistoryClick(item)}
                                                className="flex-1 text-left text-gray-700 hover:text-indigo-600"
                                            >
                                                {item}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFromHistory(item);
                                                }}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </form>

                {/* 필터 토글 버튼 */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${showFilters || selectedCategory
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    <Filter size={16} />
                    필터 {selectedCategory && `(${selectedCategory})`}
                </button>

                {/* 필터 패널 */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">카테고리</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedCategory('')}
                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${!selectedCategory
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-gray-600 border hover:border-indigo-300'
                                    }`}
                            >
                                전체
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${selectedCategory === cat
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white text-gray-600 border hover:border-indigo-300'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 검색 결과 */}
            {initialQuery && (
                <div className="search-results">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-sm text-gray-500">
                            "<span className="font-semibold text-gray-700">{initialQuery}</span>" 검색 결과
                            <span className="ml-1 font-semibold text-indigo-600">{results.length}건</span>
                        </p>
                    </div>

                    {loading ? (
                        <div className="text-center py-16">
                            <div className="inline-block w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-500">검색 중...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">😢</div>
                            <p className="text-red-500 mb-2">검색 중 오류가 발생했습니다.</p>
                            <button
                                onClick={() => search({ query: initialQuery })}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                            >
                                다시 시도
                            </button>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">🔍</div>
                            <p className="text-gray-600 mb-2">검색 결과가 없습니다.</p>
                            <p className="text-sm text-gray-400">다른 키워드로 검색해 보세요.</p>

                            {/* 검색 팁 */}
                            <div className="mt-8 p-6 bg-gray-50 rounded-xl text-left max-w-md mx-auto">
                                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <TrendingUp size={16} />
                                    검색 팁
                                </h4>
                                <ul className="text-sm text-gray-500 space-y-2">
                                    <li>• 검색어의 철자가 정확한지 확인해 보세요.</li>
                                    <li>• 더 일반적인 검색어를 사용해 보세요.</li>
                                    <li>• 키워드 수를 줄여보세요.</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {results.map((post: any) => (
                                <article
                                    key={post.id}
                                    className="p-5 bg-white rounded-xl border border-gray-100 hover:shadow-lg hover:border-indigo-100 transition-all group"
                                >
                                    <Link to={`/post/${post.slug || post.id}`}>
                                        <div className="flex gap-4">
                                            {post.thumbnail_url && (
                                                <img
                                                    src={post.thumbnail_url}
                                                    alt={post.title}
                                                    className="w-36 h-28 object-cover rounded-lg flex-shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                {/* 카테고리 */}
                                                {post.category && (
                                                    <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs font-medium rounded mb-2">
                                                        {post.category}
                                                    </span>
                                                )}

                                                {/* 제목 - 하이라이팅 적용 */}
                                                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2">
                                                    {highlightText(post.title, initialQuery)}
                                                </h2>

                                                {/* 설명 - 하이라이팅 적용 */}
                                                {post.description && (
                                                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                                                        {highlightText(post.description, initialQuery)}
                                                    </p>
                                                )}

                                                {/* 메타 정보 */}
                                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                                    <span>{formatDate(post.created_at)}</span>
                                                    {post.view_count !== undefined && (
                                                        <span>조회 {post.view_count}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 검색어 없을 때 최근 검색어 표시 */}
            {!initialQuery && searchHistory.length > 0 && (
                <div className="mt-8">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                        <Clock size={16} />
                        최근 검색어
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {searchHistory.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => handleHistoryClick(item)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;
