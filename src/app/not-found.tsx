import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-10">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">404</h2>
            <p className="text-gray-500">페이지를 찾을 수 없습니다.</p>
            <Link
                href="/"
                className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
                홈으로 돌아가기
            </Link>
        </div>
    );
}
