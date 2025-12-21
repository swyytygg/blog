import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/home/HeroSection';
import PostCard from '../components/blog/PostCard';
import { postService, Post } from '../services/postService';
import { ArrowRight } from 'lucide-react';

const Home = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                // 3열 2행 = 6개 포스트 가져오기
                const { data, error } = await postService.getPosts(6);
                if (error) throw error;
                setPosts(data || []);
            } catch (err) {
                console.error('Failed to load posts:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) {
        return (
            <div className="home-page">
                <HeroSection />
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="home-page pb-20">
            {/* 히어로 섹션 (픽사베이 이미지 + 최신글 링크) */}
            <HeroSection />

            {/* 메인 콘텐츠 영역 */}
            <div id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Stories</h2>
                    <div className="w-20 h-1 bg-indigo-500 mx-auto rounded-full"></div>
                </div>

                {error ? (
                    <div className="text-center py-10 bg-red-50 rounded-xl">
                        <p className="text-red-600">글을 불러오는데 실패했습니다.</p>
                    </div>
                ) : posts.length > 0 ? (
                    <>
                        {/* 3열 2행 그리드 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {posts.map(post => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>

                        {/* 더보기 버튼 */}
                        <div className="mt-16 text-center">
                            <Link
                                to="/category/all"
                                className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm hover:shadow"
                            >
                                글 더보기
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-500 text-lg">아직 작성된 글이 없습니다.</p>
                        <p className="text-sm text-gray-400 mt-2">첫 번째 이야기를 들려주세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
