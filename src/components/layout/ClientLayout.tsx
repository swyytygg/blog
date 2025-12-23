'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from './Sidebar';
import Header from './Header';
import { useCategories } from '../../hooks/useCategories';
import { postService } from '../../services/postService';
import { settingsService } from '../../services/settingsService';

const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const router = useRouter();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { categories, loading: categoriesLoading } = useCategories();

    // 최근 글, 인기 글, 태그 상태
    const [recentPosts, setRecentPosts] = useState<any[]>([]);
    const [popularPosts, setPopularPosts] = useState<any[]>([]);
    const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    // 블로그 설정 상태
    const [blogConfig, setBlogConfig] = useState({
        name: 'FREESIA',
        description: '오늘의 생각, 내일의 영감이 되는 공간',
        profileImage: '',
    });

    // 데이터 로드
    useEffect(() => {
        const loadData = async () => {
            try {
                const [settingsResult, recentResult, popularResult] = await Promise.all([
                    settingsService.getAllSettings(),
                    postService.getRecentPosts(5),
                    postService.getPopularPosts(5)
                ]);

                if (settingsResult.data) {
                    const newConfig = { ...blogConfig };
                    settingsResult.data.forEach((item: any) => {
                        if (item.key === 'title') newConfig.name = item.value;
                        if (item.key === 'description') newConfig.description = item.value;
                        if (item.key === 'profileImage') newConfig.profileImage = item.value;
                    });
                    setBlogConfig(newConfig);
                }

                if (recentResult.data) setRecentPosts(recentResult.data);
                if (popularResult.data) setPopularPosts(popularResult.data);

                const allPosts = [...(recentResult.data || []), ...(popularResult.data || [])];
                const tagCounts: Record<string, number> = {};

                allPosts.forEach((post: any) => {
                    if (post.tags && Array.isArray(post.tags)) {
                        post.tags.forEach((tag: string) => {
                            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                        });
                    }
                });

                const sortedTags = Object.entries(tagCounts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count);

                setTags(sortedTags);

            } catch (error) {
                console.error('데이터 로드 실패:', error);
            } finally {
                setDataLoading(false);
            }
        };

        loadData();
    }, []);

    const handleSearch = (query: string) => {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setIsMobileSidebarOpen(false);
    };

    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* SEO는 Next.js Metadata API로 이전됨 */}

            {/* 모바일 헤더 */}
            <Header
                blogName={blogConfig.name}
                onMenuToggle={toggleMobileSidebar}
                isSidebarOpen={isMobileSidebarOpen}
            />

            <div className="flex flex-col lg:flex-row pt-14 lg:pt-0 relative">

                {/* Desktop Trigger Zone */}
                <div className="hidden lg:block fixed left-0 top-0 h-full w-14 z-50 hover:w-72 group transition-all duration-300">
                    <div className="absolute left-0 top-0 h-full w-72 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out shadow-2xl z-50">
                        <Sidebar
                            blogName={blogConfig.name}
                            blogDescription={blogConfig.description}
                            profileImage={blogConfig.profileImage}
                            categories={categories}
                            recentPosts={recentPosts}
                            popularPosts={popularPosts}
                            tags={tags}
                            onSearch={handleSearch}
                            loading={categoriesLoading || dataLoading}
                        />
                    </div>
                </div>

                {/* 사이드바 - 모바일 */}
                <div
                    className={`
                        fixed top-14 left-0 h-[calc(100vh-3.5rem)] lg:hidden
                        transform transition-transform duration-300 ease-in-out z-40
                        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    `}
                >
                    <Sidebar
                        blogName={blogConfig.name}
                        blogDescription={blogConfig.description}
                        profileImage={blogConfig.profileImage}
                        categories={categories}
                        recentPosts={recentPosts}
                        popularPosts={popularPosts}
                        tags={tags}
                        onSearch={handleSearch}
                        loading={categoriesLoading || dataLoading}
                    />
                </div>

                {isMobileSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}

                <main className="flex-1 flex flex-col min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
                    <div className="w-full flex-1">
                        {children}
                    </div>

                    <footer className="border-t border-gray-200 bg-white mt-12">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                                <div className="flex gap-6 text-sm text-gray-600">
                                    <Link href="/notice/usage" className="hover:text-indigo-600 font-medium transition-colors">이용약관</Link>
                                    <Link href="/notice/privacy" className="hover:text-indigo-600 font-medium transition-colors">개인정보처리방침</Link>
                                    <Link href="/notice/copyright" className="hover:text-indigo-600 font-medium transition-colors">저작권 정책</Link>
                                    <Link href="/notice/ads" className="hover:text-indigo-600 font-medium transition-colors">광고 및 제휴</Link>
                                </div>
                                <div className="text-sm text-gray-500">
                                    © 2025 {blogConfig.name}. All rights reserved.
                                </div>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default ClientLayout;
