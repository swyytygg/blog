'use client';

import React from 'react';
import Link from 'next/link';
import { formatDate } from '../../utils/dateFormat';
import { Eye, MessageCircle, Calendar, Folder } from 'lucide-react';

interface PostCardProps {
    post: any;
    variant?: 'card' | 'list'; // 카드형 또는 리스트형
}

const PostCard: React.FC<PostCardProps> = ({ post, variant = 'card' }) => {
    // 공지사항용 랜덤 이미지 목록 (더 다양하게 확장)
    const noticeImages = [
        'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop', // 서류/정책 느낌
        'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=400&fit=crop', // 캘린더/공지
        'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop', // 노트북/업무
        'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800&h=400&fit=crop', // 타이핑
        'https://images.unsplash.com/photo-1454165833772-d99628a5ff6d?w=800&h=400&fit=crop', // 분석/회의
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop', // 디지털 서비스
        'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=800&h=400&fit=crop', // 추상적 배경
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop'  // 기록/펜
    ];

    const getNoticeImage = (id: string = '') => {
        // ID를 숫자로 변환하여 이미지 선택 (더 고르게 분산되도록)
        if (!id) return noticeImages[0];
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % noticeImages.length;
        return noticeImages[index];
    };

    // 파스텔 색상 목록
    const pastelColors = [
        { bg: 'bg-[#FFF5F5]', text: 'text-[#C53030]', border: 'border-[#FEB2B2]' }, // Red
        { bg: 'bg-[#FFFAF0]', text: 'text-[#C05621]', border: 'border-[#FEEBC8]' }, // Orange
        { bg: 'bg-[#FFFFF0]', text: 'text-[#B7791F]', border: 'border-[#FEFCBF]' }, // Yellow
        { bg: 'bg-[#F0FFF4]', text: 'text-[#2F855A]', border: 'border-[#C6F6D5]' }, // Green
        { bg: 'bg-[#EBF8FF]', text: 'text-[#2B6CB0]', border: 'border-[#BEE3F8]' }, // Blue
        { bg: 'bg-[#EBF4FF]', text: 'text-[#434190]', border: 'border-[#C3DAFE]' }, // Indigo
        { bg: 'bg-[#FAF5FF]', text: 'text-[#6B46C1]', border: 'border-[#E9D8FD]' }, // Purple
    ];

    // 포스트 ID를 기반으로 고정된 색상 선택
    const getColor = (id: string = '') => {
        const index = id ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % pastelColors.length : 0;
        return pastelColors[index];
    };

    const color = getColor(post.id);
    // 카테고리 매칭을 더 유연하게 (공백 제거 및 문자열/객체 처리 가능성 대비)
    const categoryName = typeof post.category === 'string' ? post.category.trim() : (post.category?.name || '');
    const isNotice = categoryName === '공지사항';
    const hasThumbnail = !!post.thumbnail_url;
    // 실제 표시할 이미지 URL 결정: 썸네일이 있으면 그것을, 없는데 공지사항이면 랜덤 이미지를 사용
    const displayImage = hasThumbnail ? post.thumbnail_url : (isNotice ? getNoticeImage(post.id) : null);

    // 카드형 레이아웃
    if (variant === 'card') {
        return (
            <article className={`post-card group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-indigo-100 transition-all duration-300 ${!displayImage ? 'flex flex-col h-full bg-gradient-to-br from-white to-indigo-50/30' : ''}`}>
                <Link href={`/post/${post.slug || post.id}`} className="block h-full">
                    {/* 콘텐츠 상단 영역 (제목 우선) */}
                    <div className="p-5 flex flex-col">
                        {/* 제목 */}
                        <h2 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2 text-lg">
                            {post.title}
                        </h2>

                        {/* 메타 정보 (제목 바로 아래) */}
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-3">
                            <div className="flex items-center gap-1">
                                <Calendar size={10} />
                                <span>{formatDate(post.published_at || post.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <Eye size={10} />
                                    <span>{post.view_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MessageCircle size={10} />
                                    <span>{post.comment_count || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 썸네일 영역 - 이미지 또는 컬러 블록(스니펫) 표시 (아래로 이동) */}
                    {displayImage ? (
                        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                            <img
                                src={displayImage}
                                alt={post.title}
                                width={800}
                                height={500}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* 카테고리 라벨 */}
                            {post.category && (
                                <span className="absolute bottom-3 right-3 px-3 py-1 bg-indigo-600/90 text-white text-[10px] font-medium rounded-full backdrop-blur-sm">
                                    {post.category}
                                </span>
                            )}
                        </div>
                    ) : (
                        /* 스니펫 파스텔 박스 (이미지 대용) */
                        <div className={`relative aspect-[16/10] overflow-hidden ${color.bg} ${color.border} border-t flex items-center justify-center p-6 transition-colors duration-300 group-hover:brightness-[0.98]`}>
                            <div className={`text-center font-medium ${color.text} leading-relaxed line-clamp-3 text-sm md:text-base`}>
                                {post.excerpt || post.description || post.title}
                            </div>
                            {/* 카테고리 라벨 (스니펫 모드) */}
                            {post.category && (
                                <span className="absolute bottom-3 right-3 px-3 py-1 bg-white/80 text-gray-800 text-[9px] font-bold uppercase tracking-wider rounded-md shadow-sm backdrop-blur-sm">
                                    {post.category}
                                </span>
                            )}
                        </div>
                    )}
                </Link>
            </article>
        );
    }

    // 리스트형 레이아웃
    return (
        <article className="post-card group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-indigo-100 transition-all duration-300 p-6">
            <Link href={`/post/${post.slug || post.id}`} className="flex flex-col sm:flex-row gap-6 items-center">
                {/* 콘텐츠 영역 (좌측 - 더 넓게) */}
                <div className="flex-[2] min-w-0 flex flex-col">
                    {/* 카테고리 */}
                    {post.category && (
                        <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-tight rounded mb-3 w-fit">
                            {post.category}
                        </span>
                    )}

                    {/* 제목 (가독성을 위해 크기 유지 또는 확대) */}
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-3">
                        {post.title}
                    </h2>

                    {/* 설명/스니펫 */}
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                        {post.excerpt || post.description || (post.content ? post.content.substring(0, 150).replace(/<[^>]*>/g, '') : '')}
                    </p>

                    {/* 메타 정보 */}
                    <div className="flex items-center gap-5 text-xs text-gray-400 mt-auto">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            <span>{formatDate(post.published_at || post.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <Eye size={14} />
                                <span>{post.view_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <MessageCircle size={14} />
                                <span>{post.comment_count || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 썸네일 이미지 또는 컬러 블록 (우측 - 좁게) */}
                <div className="flex-1 w-full sm:w-auto">
                    {displayImage ? (
                        <div className="relative aspect-video sm:aspect-square sm:w-48 rounded-2xl overflow-hidden bg-gray-100 mx-auto">
                            <img
                                src={displayImage}
                                alt={post.title}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>
                    ) : (
                        <div className={`relative aspect-video sm:aspect-square sm:w-48 rounded-2xl overflow-hidden ${color.bg} ${color.border} border flex items-center justify-center p-6 text-center mx-auto shadow-sm`}>
                            <div className={`text-xs font-medium ${color.text} line-clamp-4 leading-relaxed`}>
                                {post.excerpt || post.description || post.title}
                            </div>
                        </div>
                    )}
                </div>
            </Link>
        </article>
    );
};

export default PostCard;
