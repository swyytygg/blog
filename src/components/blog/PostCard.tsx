import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/dateFormat';
import { Eye, MessageCircle, Calendar, Folder } from 'lucide-react';

interface PostCardProps {
    post: any;
    variant?: 'card' | 'list'; // 카드형 또는 리스트형
}

const PostCard: React.FC<PostCardProps> = ({ post, variant = 'card' }) => {
    // 기본 썸네일 이미지 (없을 경우)
    const defaultThumbnail = `https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop`;

    // 카드형 레이아웃
    if (variant === 'card') {
        return (
            <article className="post-card group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-indigo-100 transition-all duration-300">
                <Link to={`/post/${post.slug || post.id}`} className="block">
                    {/* 썸네일 영역 */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                        <img
                            src={post.thumbnail_url || defaultThumbnail}
                            alt={post.title}
                            width={800}
                            height={500}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* 카테고리 라벨 */}
                        {post.category && (
                            <span className="absolute top-3 left-3 px-3 py-1 bg-indigo-600/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                                {post.category}
                            </span>
                        )}
                    </div>

                    {/* 콘텐츠 영역 */}
                    <div className="p-5">
                        {/* 제목 */}
                        <h2 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                            {post.title}
                        </h2>

                        {/* 설명 */}
                        {post.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                {post.description}
                            </p>
                        )}

                        {/* 메타 정보 */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                <span>{formatDate(post.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* 조회수 */}
                                <div className="flex items-center gap-1">
                                    <Eye size={12} />
                                    <span>{post.view_count || 0}</span>
                                </div>
                                {/* 댓글 수 */}
                                <div className="flex items-center gap-1">
                                    <MessageCircle size={12} />
                                    <span>{post.comment_count || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>
            </article>
        );
    }

    // 리스트형 레이아웃
    return (
        <article className="post-card group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-indigo-100 transition-all duration-300 p-4">
            <Link to={`/post/${post.slug || post.id}`} className="flex gap-4">
                {/* 썸네일 */}
                <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <img
                        src={post.thumbnail_url || defaultThumbnail}
                        alt={post.title}
                        width={128}
                        height={96}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>

                {/* 콘텐츠 */}
                <div className="flex-1 min-w-0">
                    {/* 카테고리 */}
                    {post.category && (
                        <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs font-medium rounded mb-2">
                            {post.category}
                        </span>
                    )}

                    {/* 제목 */}
                    <h2 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
                        {post.title}
                    </h2>

                    {/* 설명 */}
                    {post.description && (
                        <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                            {post.description}
                        </p>
                    )}

                    {/* 메타 정보 */}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{formatDate(post.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Eye size={12} />
                            <span>{post.view_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MessageCircle size={12} />
                            <span>{post.comment_count || 0}</span>
                        </div>
                    </div>
                </div>
            </Link>
        </article>
    );
};

export default PostCard;
