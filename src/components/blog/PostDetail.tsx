import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/dateFormat';
import { Share2, Tag, Calendar, Eye, Clock, MessageCircle, ChevronRight, ChevronLeft, Home, List, Facebook, Twitter, Link2, Copy, ArrowLeft } from 'lucide-react';
import { postService } from '../../services/postService';
import CommentSection from './CommentSection';
import GoogleAd from '../common/GoogleAd';

interface PostDetailProps {
    post: any;
}

// 목차 아이템 타입
interface TocItem {
    id: string;
    text: string;
    level: number;
}

const PostDetail: React.FC<PostDetailProps> = ({ post }) => {
    const [prevPost, setPrevPost] = useState<any>(null);
    const [nextPost, setNextPost] = useState<any>(null);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showToc, setShowToc] = useState(true);
    const [activeHeading, setActiveHeading] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadAdjacentPosts = async () => {
            const dateToUse = post.published_at || post.created_at;
            if (dateToUse) {
                const [prevResult, nextResult] = await Promise.all([
                    postService.getPrevPost(dateToUse),
                    postService.getNextPost(dateToUse)
                ]);

                if (prevResult.data) setPrevPost(prevResult.data);
                if (nextResult.data) setNextPost(nextResult.data);
            }
        };
        loadAdjacentPosts();
    }, [post.published_at, post.created_at]);

    // 목차 생성
    const tableOfContents = useMemo((): TocItem[] => {
        if (!post?.content) return [];

        let content = post.content;
        // 마크다운이면 변환 (헤더 추출 위함)
        if (post.content_type === 'markdown') {
            // 간단변환기 로직 복사 또는 공통함수 사용. 
            // 여기서는 useMemo 밖으로 simpleMarkdownToHtml을 뺄 수 없으므로(컴포넌트 내 정의), 
            // 정규식으로 마크다운 헤더를 직접 찾거나, 변환후 찾기.
            // 변환후 찾는게 일관됨.
            content = content
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>');
        }

        const headingRegex = /<h([1-5])[^>]*>([^<]+)<\/h[1-5]>/gi;
        const toc: TocItem[] = [];
        let match;
        let index = 0;

        while ((match = headingRegex.exec(content)) !== null) {
            const level = parseInt(match[1]);
            const text = match[2].trim();
            const id = `heading-${index}`;
            toc.push({ id, text, level });
            index++;
        }

        return toc;
    }, [post?.content, post?.content_type]);

    // 간단한 마크다운 변환기 (라이브러리 없이 구현)
    const simpleMarkdownToHtml = (markdown: string) => {
        let html = markdown
            .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 italic">$1</blockquote>')
            .replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' className='rounded-lg max-w-full' />")
            .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2' class='text-indigo-600 hover:underline'>$1</a>")
            .replace(/```([\s\S]*?)```/gim, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto"><code>$1</code></pre>')
            .replace(/\n/gim, '<br />');
        return html;
    };

    // 콘텐츠에 heading ID 추가
    const contentWithIds = useMemo(() => {
        if (!post?.content) return '';

        let content = post.content;

        // 마크다운 타입이면 변환 적용
        if (post.content_type === 'markdown') {
            content = simpleMarkdownToHtml(content);
        }

        let index = 0;
        return content.replace(
            /<h([1-5])([^>]*)>([^<]+)<\/h[1-5]>/gi,
            (match: string, level: string, attrs: string, text: string) => {
                const id = `heading-${index}`;
                index++;
                return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
            }
        );
    }, [post?.content, post?.content_type]);

    // 스크롤 시 활성 heading 감지
    useEffect(() => {
        const handleScroll = () => {
            const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id]');
            let current = '';

            headings.forEach((heading) => {
                const rect = heading.getBoundingClientRect();
                if (rect.top <= 100) {
                    current = heading.id;
                }
            });

            setActiveHeading(current);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 공유 기능
    const handleShare = (platform: string) => {
        const url = window.location.href;
        const title = post.title;

        const shareUrls: Record<string, string> = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
            naver: `https://share.naver.com/web/shareView?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
            kakaotalk: `https://story.kakao.com/share?url=${encodeURIComponent(url)}`,
        };

        if (platform === 'copy') {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } else {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
        setShowShareMenu(false);
    };

    // 목차 클릭 시 스크롤
    const scrollToHeading = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 80;
            const top = element.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    return (
        <div className="max-w-[95%] mx-auto px-4 sm:px-8 lg:px-12 py-8">
            <article className="post-detail bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 lg:p-16">
                {/* 브레드크럼 */}
                <nav className="breadcrumb flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link to="/" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                        <Home size={14} />
                        <span>홈</span>
                    </Link>
                    {post.category && (
                        <>
                            <ChevronRight size={14} className="text-gray-400" />
                            <Link
                                to={`/category/${post.category}`}
                                className="hover:text-indigo-600 transition-colors"
                            >
                                {post.category}
                            </Link>
                        </>
                    )}
                    <ChevronRight size={14} className="text-gray-400" />
                    <span className="text-gray-700 font-medium truncate max-w-[200px]">
                        {post.title}
                    </span>
                </nav>

                {/* 헤더 */}
                <header className="post-header mb-8">
                    {/* 카테고리 */}
                    {post.category && (
                        <Link
                            to={`/category/${post.category}`}
                            className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full mb-4 hover:bg-indigo-200 transition-colors"
                        >
                            {post.category}
                        </Link>
                    )}

                    {/* 제목 */}
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
                        {post.title}
                    </h1>

                    {/* 메타 정보 */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                        {/* 작성자 */}
                        {post.profiles?.display_name && (
                            <div className="flex items-center gap-2">
                                {post.profiles?.avatar_url ? (
                                    <img
                                        src={post.profiles.avatar_url}
                                        alt={post.profiles.display_name}
                                        className="w-6 h-6 rounded-full"
                                    />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <span className="text-xs font-medium text-indigo-600">
                                            {post.profiles.display_name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                <span>{post.profiles.display_name}</span>
                            </div>
                        )}

                        {/* 작성일 */}
                        <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDate(post.published_at || post.created_at)}</span>
                        </div>

                        {/* 수정일 */}
                        {post.updated_at && post.updated_at !== (post.published_at || post.created_at) && (
                            <div className="flex items-center gap-1 text-gray-400">
                                <Calendar size={14} className="opacity-0" /> {/* 간격 맞추기용 */}
                                <Clock size={14} />
                                <span>수정 {formatDate(post.updated_at)}</span>
                            </div>
                        )}

                        {/* 조회수 */}
                        {post.view_count !== undefined && (
                            <div className="flex items-center gap-1">
                                <Eye size={14} />
                                <span>{post.view_count.toLocaleString()}</span>
                            </div>
                        )}

                        {/* 댓글 수 */}
                        {post.comment_count !== undefined && (
                            <div className="flex items-center gap-1">
                                <MessageCircle size={14} />
                                <span>{post.comment_count}</span>
                            </div>
                        )}
                    </div>

                    {/* 썸네일 */}
                    {post.thumbnail_url && (
                        <div className="rounded-xl overflow-hidden mb-6">
                            <img
                                src={post.thumbnail_url}
                                alt={post.title}
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    )}
                </header>

                <div className="lg:flex lg:gap-16">
                    {/* 본문 영역 - 75% (lg:w-3/4) */}
                    <div className="flex-1 min-w-0">
                        {/* CSS for Tables and Tistory Images */}
                        <style>{`
                            .prose table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
                            .prose th { background-color: #f3f4f6; font-weight: 600; text-align: left; padding: 0.75rem; border: 1px solid #e5e7eb; }
                            .prose td { padding: 0.75rem; border: 1px solid #e5e7eb; }
                            .prose tr:nth-child(even) { background-color: #f9fafb; }
                            .tistory-image-wrapper { margin: 1.5rem 0; text-align: center; }
                            .tistory-image-wrapper img { max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                            .tistory-image-caption { font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem; }
                        `}</style>
                        <div
                            className="prose prose-lg max-w-none lg:mx-0"
                            dangerouslySetInnerHTML={{
                                __html: contentWithIds.replace(
                                    /\[##_Image\|kage@(.*?)\|(.*?)\|(.*?)_##\]/g,
                                    (match, path, args, info) => {
                                        // Tistory image tag parser
                                        // kage@... maps to https://blog.kakaocdn.net/dn/...
                                        // args might contain alt and caption info in JSON-like format or pipe separated
                                        // Example: [##_Image|kage@...|CDM|...filename="..."]
                                        const url = `https://blog.kakaocdn.net/dn/${path}`;

                                        // Extract alt/caption if possible (often complex string, doing simple fallback)
                                        let alt = '';
                                        let caption = '';

                                        // Simple heuristic to find filename or alt
                                        if (info.includes('filename="')) {
                                            const fileMatch = info.match(/filename="([^"]*)"/);
                                            if (fileMatch) alt = fileMatch[1];
                                        }

                                        return `<div class="tistory-image-wrapper">
                                            <img src="${url}" alt="${alt}" loading="lazy" />
                                            ${caption ? `<div class="tistory-image-caption">${caption}</div>` : ''}
                                        </div>`;
                                    }
                                )
                            }}
                        />

                        {/* 본문 하단 광고 영역 - 구글 애드센스용 */}
                        <GoogleAd
                            slot="content-bottom-ad"
                            format="auto"
                            className="mt-8 pt-6 border-t border-gray-200"
                        />

                        {/* 태그 */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag size={16} className="text-gray-400" />
                                    {post.tags.map((tag: string, index: number) => (
                                        <Link
                                            key={index}
                                            to={`/tag/${tag}`}
                                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                                        >
                                            #{tag}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SNS 공유 */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">이 글이 도움이 되셨나요?</span>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowShareMenu(!showShareMenu)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        <Share2 size={16} />
                                        <span className="text-sm">공유하기</span>
                                    </button>

                                    {showShareMenu && (
                                        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-10 min-w-[160px]">
                                            {/* 카카오톡 */}
                                            <button
                                                onClick={() => handleShare('kakaotalk')}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <div className="w-4 h-4 bg-yellow-400 rounded flex items-center justify-center">
                                                    <span className="text-[8px] font-bold text-yellow-900">K</span>
                                                </div>
                                                카카오톡
                                            </button>
                                            {/* 네이버 */}
                                            <button
                                                onClick={() => handleShare('naver')}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                                                    <span className="text-[8px] font-bold text-white">N</span>
                                                </div>
                                                네이버
                                            </button>
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <button
                                                onClick={() => handleShare('facebook')}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <Facebook size={16} className="text-blue-600" />
                                                Facebook
                                            </button>
                                            <button
                                                onClick={() => handleShare('twitter')}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <Twitter size={16} className="text-sky-500" />
                                                Twitter
                                            </button>
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <button
                                                onClick={() => handleShare('copy')}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                {copied ? (
                                                    <>
                                                        <Copy size={16} className="text-green-500" />
                                                        복사됨!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link2 size={16} className="text-gray-500" />
                                                        링크 복사
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 이전글 / 다음글 네비게이션 */}
                        <nav className="post-navigation mt-10 pt-8 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 이전글 */}
                                {prevPost ? (
                                    <Link
                                        to={`/post/${prevPost.slug || prevPost.id}`}
                                        className="group p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                            <ChevronLeft size={16} />
                                            <span>이전 글</span>
                                        </div>
                                        <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                            {prevPost.title}
                                        </p>
                                    </Link>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-xl opacity-50">
                                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                            <ChevronLeft size={16} />
                                            <span>이전 글</span>
                                        </div>
                                        <p className="text-gray-400">이전 글이 없습니다</p>
                                    </div>
                                )}

                                {/* 다음글 */}
                                {nextPost ? (
                                    <Link
                                        to={`/post/${nextPost.slug || nextPost.id}`}
                                        className="group p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors text-right"
                                    >
                                        <div className="flex items-center justify-end gap-2 text-sm text-gray-500 mb-2">
                                            <span>다음 글</span>
                                            <ChevronRight size={16} />
                                        </div>
                                        <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                            {nextPost.title}
                                        </p>
                                    </Link>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-xl opacity-50 text-right">
                                        <div className="flex items-center justify-end gap-2 text-sm text-gray-400 mb-2">
                                            <span>다음 글</span>
                                            <ChevronRight size={16} />
                                        </div>
                                        <p className="text-gray-400">다음 글이 없습니다</p>
                                    </div>
                                )}
                            </div>
                        </nav>
                    </div>

                    {/* 사이드바 영역 - 25% (lg:w-1/4, min-w-80) */}
                    <aside className="hidden lg:block w-80 flex-shrink-0">
                        <div className="sticky top-24 space-y-8">
                            {/* 사이드바 광고 영역 - 구글봇을 위해 DOM에 유지하되 승인 전까지는 사용자에게 숨김 */}
                            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${!import.meta.env.VITE_GOOGLE_ADSENSE_ID ? 'sr-only h-0 overflow-hidden opacity-0' : ''}`}>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">Advertisement</h3>
                                <GoogleAd
                                    slot="sidebar-ad"
                                    format="fluid"
                                    style={{ display: 'block', minHeight: '300px' }}
                                />
                            </div>

                            {/* 목차 */}
                            {tableOfContents.length > 0 && (
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                                        <List size={16} />
                                        목차
                                    </h3>
                                    <nav className="toc-list">
                                        <ul className="space-y-3 text-sm">
                                            {tableOfContents.map((item) => (
                                                <li
                                                    key={item.id}
                                                    style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                                                >
                                                    <button
                                                        onClick={() => scrollToHeading(item.id)}
                                                        className={`text-left w-full transition-colors line-clamp-2 ${activeHeading === item.id
                                                            ? 'text-indigo-600 font-bold'
                                                            : 'text-gray-600 hover:text-indigo-600'
                                                            }`}
                                                    >
                                                        {item.text}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>

                {/* 홈 버튼 위치 이동: 글 네비게이션과 댓글 섹션 사이 */}
                <div className="flex justify-center mt-12 mb-4">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-8 py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-full transition-all border-2 border-indigo-500 shadow-md font-medium"
                    >
                        <ArrowLeft size={16} />
                        처음으로 돌아가기
                    </Link>
                </div>

                {/* 댓글 섹션 */}
                {post.id && <CommentSection postId={post.id} />}
            </article>
        </div >
    );
};

export default PostDetail;
