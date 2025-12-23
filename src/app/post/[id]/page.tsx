import { postService } from '../../../services/postService';
import PostDetail from '../../../components/blog/PostDetail';
import type { Metadata, ResolvingMetadata } from 'next';

interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params;
    const { data: post } = await postService.getPostBySlug(id);

    if (!post) {
        return {
            title: 'Post Not Found',
        };
    }

    return {
        title: post.title,
        description: post.excerpt || post.description || post.content.substring(0, 160).replace(/<[^>]*>/g, ''),
        openGraph: {
            title: post.title,
            description: post.excerpt || post.description,
            images: post.thumbnail_url ? [post.thumbnail_url] : [],
            type: 'article',
            publishedTime: post.published_at || post.created_at,
            authors: post.profiles?.display_name ? [post.profiles.display_name] : [],
        },
    };
}

export default async function PostPage({ params }: Props) {
    const { id } = await params;
    const { data: post, error } = await postService.getPostBySlug(id);

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
                <a
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    홈으로 돌아가기
                </a>
            </div>
        );
    }

    // Increment view count (This is a bit tricky in Server Components, 
    // better to do it via a separate client component or API route, 
    // but for now we'll rely on client-side logic if needed.)

    return (
        <div className="post-view">
            <PostDetail post={post} />
        </div>
    );
}
