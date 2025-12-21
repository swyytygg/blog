import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { postService } from '../services/postService';
import PostDetail from '../components/blog/PostDetail';

const PostView = () => {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (!id) return;

        const loadPost = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data, error } = await postService.getPostBySlug(id);

                if (error) throw error;
                if (!data) throw new Error('Post not found');

                setPost(data);

                // 조회수 증가 (비동기로 처리, 에러 무시)
                postService.incrementViewCount(data.id).catch(() => { });
            } catch (err) {
                console.error('포스트 로딩 실패:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        loadPost();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="loading-spinner mb-4"></div>
                <p className="text-gray-500">글을 불러오는 중...</p>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="text-6xl mb-4">📄</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    글을 찾을 수 없습니다
                </h2>
                <p className="text-gray-500 mb-6">
                    요청하신 글이 존재하지 않거나 삭제되었습니다.
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <ArrowLeft size={16} />
                    홈으로 돌아가기
                </Link>
            </div>
        );
    }

    return (
        <div className="post-view">
            <PostDetail post={post} />
        </div>
    );
};

export default PostView;
