import { postService } from '../../../services/postService';
import { categoryService } from '../../../services/categoryService';
import PostList from '../../../components/blog/PostList';
import Link from 'next/link';
import { Folder, ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const rawCategory = (await params).category;
    let category = '';
    try {
        category = decodeURIComponent(rawCategory);
        // 혹시 더블 인코딩된 경우를 대비해 한 번 더 시도 (안전장치)
        if (category.includes('%')) {
            category = decodeURIComponent(category);
        }
    } catch (e) {
        category = rawCategory;
    }

    // 공지사항이나 방명록 카테고리로 직접 접근 시 전용 페이지로 이동
    if (category === '공지사항') {
        redirect('/notice');
    }
    if (category === '방명록') {
        redirect('/guestbook');
    }

    let posts: any[] = [];
    let displayName = category;
    let isAllView = category === 'all';

    try {
        if (isAllView) {
            const result = await postService.getPosts();
            posts = result.data || [];
            displayName = '전체 글';
        } else {
            const catInfo = await categoryService.getCategoryBySlug(category);
            const targetCategoryName = catInfo.data ? catInfo.data.name : category;
            displayName = targetCategoryName;
            const result = await postService.getPostsByCategory(targetCategoryName);
            posts = result.data || [];
        }
    } catch (err) {
        console.error('Failed to load category posts:', err);
    }

    return (
        <div className="max-w-[95%] mx-auto px-4 sm:px-8 lg:px-12 py-8">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 lg:p-16">
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 rounded-xl">
                            <Folder size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {isAllView ? '전체 보기' : '카테고리'} · {posts.length}개의 글
                            </p>
                        </div>
                    </div>
                </div>

                {posts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📂</div>
                        <p className="text-gray-500 text-lg">"{displayName}" 카테고리의 글이 없습니다.</p>
                        <Link
                            href="/category/all"
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
