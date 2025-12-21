import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Folder, Tag, ArrowLeft, Hash } from 'lucide-react';
import { postService } from '../services/postService';
import { categoryService } from '../services/categoryService';
import PostList from '../components/blog/PostList';

const CategoryView = () => {
    const { category, tag } = useParams<{ category?: string; tag?: string }>();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // 표시할 제목과 타입 결정
    const isTagView = !!tag;
    const isAllView = category === 'all';
    const isNoticeView = category === 'notice' || window.location.pathname.startsWith('/notice');
    const displayName = tag || (isAllView ? '전체 글' : (isNoticeView ? '공지사항' : category)) || '';
    const pageTitle = isTagView ? `#${displayName}` : displayName;

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);

            try {
                let result;

                if (tag) {
                    // 태그로 검색
                    result = await postService.getPostsByTag(tag);
                } else if (category === 'all') {
                    // 전체 글 보기
                    result = await postService.getPosts();
                } else if (isNoticeView) {
                    // 공지사항 보기
                    result = await postService.getPostsByCategory('공지사항');
                } else if (category) {
                    // 카테고리로 검색
                    // 1. 카테고리 슬러그로 실제 카테고리 이름 조회
                    const catInfo = await categoryService.getCategoryBySlug(category);
                    const targetCategoryName = catInfo.data ? catInfo.data.name : category;

                    // 2. 실제 이름으로 포스트 조회
                    result = await postService.getPostsByCategory(targetCategoryName);
                }

                if (result?.error) throw result.error;
                setPosts(result?.data || []);
            } catch (err) {
                console.error('포스트 로딩 실패:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if (category || tag || isNoticeView) {
            fetchPosts();
        }
    }, [category, tag]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="loading-spinner mb-4"></div>
                <p className="text-gray-500">글을 불러오는 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="text-6xl mb-4">😢</div>
                <p className="text-red-500 mb-2">글을 불러오는데 실패했습니다.</p>
                <p className="text-gray-400 text-sm">잠시 후 다시 시도해주세요.</p>
            </div>
        );
    }

    return (
        <div className="max-w-[95%] mx-auto px-4 sm:px-8 lg:px-12 py-8">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 lg:p-16">
                {/* 헤더 */}
                <div className="mb-8">

                    <div className="flex items-center gap-3">
                        {isTagView ? (
                            <div className="p-3 bg-indigo-100 rounded-xl">
                                <Hash size={24} className="text-indigo-600" />
                            </div>
                        ) : (
                            <div className="p-3 bg-indigo-100 rounded-xl">
                                <Folder size={24} className="text-indigo-600" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {pageTitle}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {isTagView ? '태그' : (isAllView ? '전체 보기' : '카테고리')} · {posts.length}개의 글
                            </p>
                        </div>
                    </div>
                </div>

                {/* 포스트 리스트 */}
                {posts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📂</div>
                        <p className="text-gray-500 text-lg">
                            {isTagView
                                ? `"${displayName}" 태그의 글이 없습니다.`
                                : `"${displayName}" 카테고리의 글이 없습니다.`
                            }
                        </p>
                        <Link
                            to="/"
                            className="inline-block mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            전체 글 보기
                        </Link>
                    </div>
                ) : (
                    <PostList posts={posts} postsPerPage={6} />
                )}

                {/* 홈으로 가기 버튼 (하단 중앙) */}
                <div className="mt-20 text-center border-t border-gray-100 pt-10 pb-10">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-10 py-3 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        <ArrowLeft size={18} />
                        메인으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CategoryView;
