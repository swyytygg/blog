import { useState, useEffect, useCallback } from 'react';
import { postService, SearchParams, Post } from '../services/postService';

// 검색 히스토리 관리용 상수
const SEARCH_HISTORY_KEY = 'blog_search_history';
const MAX_HISTORY_ITEMS = 10;

export interface UseSearchResult {
    results: Post[];
    loading: boolean;
    error: any;
    searchHistory: string[];
    search: (params: SearchParams) => Promise<void>;
    clearHistory: () => void;
    removeFromHistory: (query: string) => void;
}

export const useSearch = (): UseSearchResult => {
    const [results, setResults] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    // 검색 히스토리 로드
    useEffect(() => {
        const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
        if (savedHistory) {
            try {
                setSearchHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error('검색 히스토리 로드 실패:', e);
            }
        }
    }, []);

    // 검색 히스토리 저장
    const saveToHistory = useCallback((query: string) => {
        if (!query.trim()) return;

        setSearchHistory((prev) => {
            // 중복 제거 및 최신 검색어를 맨 앞에 추가
            const filtered = prev.filter((item) => item !== query);
            const newHistory = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
            return newHistory;
        });
    }, []);

    // 검색 실행
    const search = useCallback(async (params: SearchParams) => {
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await postService.searchPosts(params);

            if (error) throw error;

            setResults(data || []);

            // 검색어가 있으면 히스토리에 저장
            if (params.query) {
                saveToHistory(params.query);
            }
        } catch (err) {
            setError(err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [saveToHistory]);

    // 검색 히스토리 전체 삭제
    const clearHistory = useCallback(() => {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
        setSearchHistory([]);
    }, []);

    // 검색 히스토리에서 특정 항목 삭제
    const removeFromHistory = useCallback((query: string) => {
        setSearchHistory((prev) => {
            const newHistory = prev.filter((item) => item !== query);
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
            return newHistory;
        });
    }, []);

    return {
        results,
        loading,
        error,
        searchHistory,
        search,
        clearHistory,
        removeFromHistory,
    };
};

// 검색어 하이라이팅 유틸리티 함수
export const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim() || !text) return text;

    const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));

    return parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
            <mark key= { index } className = "bg-yellow-200 text-yellow-900 rounded px-0.5" >
            { part }
            </mark>
    ) : (
        part
    )
    );
};

// 정규식 특수문자 이스케이프
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
