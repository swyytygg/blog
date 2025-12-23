import { postService } from '../../../services/postService';
import PostList from '../../../components/blog/PostList';
import Link from 'next/link';
import { Hash, ArrowLeft } from 'lucide-react';

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
    const { tag } = await params;
    let posts: any[] = [];
    const displayName = tag;

    try {
        const result = await postService.getPostsByTag(tag);
        posts = result.data || [];
    } catch (err) {
        console.error('Failed to load tag posts:', err);
    }

    return (
        <div className="max-w-[95%] mx-auto px-4 sm:px-8 lg:px-12 py-8">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 lg:p-16">
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 rounded-xl">
                            <Hash size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">#{displayName}</h1>
                            <p className="text-sm text-gray-500 mt-1">태그 · {posts.length}개의 글</p>
                        </div>
                    </div>
                </div>

                {posts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📂</div>
                        <p className="text-gray-500 text-lg">"#{displayName}" 태그의 글이 없습니다.</p>
                        <Link
                            href="/"
                            className="inline-block mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            전체 글 보기
                        </Link>
                    </div>
                ) : (
                    <PostList posts={posts} postsPerPage={6} />
                )}

                <div className="mt-20 text-center border-t border-gray-100 pt-10 pb-10">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-10 py-3 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        <ArrowLeft size={18} />
                        메인으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}
