'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon, X, Clock, TrendingUp, ArrowLeft, Filter } from 'lucide-react';
import { useSearch, highlightText } from '../../hooks/useSearch';
import { formatDate } from '../../utils/dateFormat';

export default function SearchPage() {
    const searchParams = useSearchParams();
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

    useEffect(() => {
        if (initialQuery) {
            search({ query: initialQuery, category: selectedCategory || undefined });
        }
    }, [initialQuery, selectedCategory, search]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
            setShowSuggestions(false);
        }
    };

    const handleHistoryClick = (historyQuery: string) => {
        setQuery(historyQuery);
        window.location.href = `/search?q=${encodeURIComponent(historyQuery.trim())}`;
        setShowSuggestions(false);
    };

    const handleClearQuery = () => {
        setQuery('');
        inputRef.current?.focus();
    };

    const categories = ['여행', '기술', '라이프스타일', '리뷰'];

    return (
        <div className="max-w-3xl mx-auto py-10 px-4">
            <div className="mb-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-4"
                >
                    <ArrowLeft size={16} /> 홈으로
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">검색</h1>

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
                            className="w-full pl-12 pr-24 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {query && (
                                <button type="button" onClick={handleClearQuery} className="p-1 text-gray-400">
                                    <X size={18} />
                                </button>
                            )}
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">
                                검색
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {results.length > 0 ? (
                <div className="space-y-4">
                    {results.map((post: any) => (
                        <article key={post.id} className="p-5 bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all">
                            <Link href={`/post/${post.slug || post.id}`}>
                                <div className="flex gap-4">
                                    {post.thumbnail_url && (
                                        <img src={post.thumbnail_url} alt={post.title} className="w-36 h-28 object-cover rounded-lg" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 line-clamp-1 mb-2">
                                            {highlightText(post.title, initialQuery)}
                                        </h2>
                                        <div className="text-xs text-gray-400">{formatDate(post.created_at)}</div>
                                    </div>
                                </div>
                            </Link>
                        </article>
                    ))}
                </div>
            ) : initialQuery && !loading && (
                <div className="text-center py-16">결과가 없습니다.</div>
            )}
        </div>
    );
}
