import HeroSection from '../components/home/HeroSection';
import PostCard from '../components/blog/PostCard';
import { postService } from '../services/postService';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function HomePage() {
    let posts = [];
    let error = null;

    try {
        const { data, error: fetchError } = await postService.getPosts(6);
        if (fetchError) throw fetchError;
        posts = data || [];
    } catch (err) {
        console.error('Failed to load posts:', err);
        error = err;
    }

    return (
        <div className="home-page pb-20">
            <HeroSection />

            <div id="main-content" className="max-w-[95%] mx-auto px-4 sm:px-8 lg:px-12 py-20">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {posts.map((post: any) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>

                        <div className="mt-16 text-center">
                            <Link
                                href="/category/all"
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
}
