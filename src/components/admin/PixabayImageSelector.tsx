import React, { useState, useEffect } from 'react';
import { Search, X, Download, Image as ImageIcon } from 'lucide-react';
import { pixabayService, PixabayImage } from '../../services/pixabayService';

interface PixabayImageSelectorProps {
    apiKey: string;
    onSelect: (imageUrl: string) => void;
    onClose: () => void;
}

const PixabayImageSelector: React.FC<PixabayImageSelectorProps> = ({ apiKey, onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [images, setImages] = useState<PixabayImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [error, setError] = useState<string | null>(null);

    // 초기 로딩 (기본값 검색)
    useEffect(() => {
        handleSearch('nature'); // 기본 검색어: 자연
    }, []);

    const handleSearch = async (searchQuery: string, newSearch = true) => {
        if (!apiKey) return;

        setLoading(true);
        setError(null);

        try {
            const currentPage = newSearch ? 1 : page + 1;
            const result = await pixabayService.searchImages(searchQuery, apiKey, currentPage);

            if (newSearch) {
                setImages(result.hits);
                setPage(1);
            } else {
                setImages(prev => [...prev, ...result.hits]);
                setPage(currentPage);
            }
        } catch (err: any) {
            setError(err.message || '이미지를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            handleSearch(query, true);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
                {/* 헤더 */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
                            <ImageIcon size={20} />
                        </div>
                        <h2 className="text-lg font-bold">Pixabay 이미지 검색</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* 검색 바 */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <form onSubmit={onSubmit} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="이미지 검색 (예: 바다, 숲, 사무실...)"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                        >
                            검색
                        </button>
                    </form>
                </div>

                {/* 이미지 그리드 */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {!apiKey ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <p>Pixabay API Key가 설정되지 않았습니다.</p>
                            <p className="text-sm mt-2">.env.local에 NEXT_PUBLIC_PUBLIC_PIXABAY_API_KEY를 추가해주세요.</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex items-center justify-center text-red-500">
                            {error}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {images.map((img) => (
                                    <div
                                        key={img.id}
                                        onClick={() => onSelect(img.largeImageURL)}
                                        className="group relative cursor-pointer rounded-lg overflow-hidden bg-gray-100 aspect-video hover:ring-2 hover:ring-green-500 transition-all"
                                    >
                                        <img
                                            src={img.webformatURL}
                                            alt={img.tags}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-white text-xs truncate">{img.user}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {images.length > 0 && (
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={() => handleSearch(query || 'nature', false)}
                                        disabled={loading}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                                    >
                                        {loading ? '로딩 중...' : '더 보기'}
                                    </button>
                                </div>
                            )}

                            {images.length === 0 && !loading && (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    검색 결과가 없습니다.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PixabayImageSelector;
