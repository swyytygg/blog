import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { heroImageService } from '../../services/heroImageService';
import { pixabayService } from '../../services/pixabayService';

/**
 * Hero 섹션 배경 이미지 - Supabase Storage 기반 + 자동 갱신
 * 
 * 작동 방식:
 * 1. Supabase Storage에서 현재 월의 이미지를 가져옴
 * 2. 이미지가 없으면 자동으로 Pixabay에서 가져와 저장
 * 3. 저장 후 다시 로드하여 표시
 */

const HeroSection: React.FC = () => {
    const [bgImage, setBgImage] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const syncAttempted = useRef(false); // 자동 갱신 시도 여부

    // 이미지 URL 생성 헬퍼 함수
    const getMonthlyImageUrl = useCallback((year: number, month: string, imageNum: number): string => {
        const folder = `monthly-picks/${year}-${month}`;
        const fileName = `${imageNum}.webp`;

        const { data } = supabase.storage
            .from('blog main image')
            .getPublicUrl(`${folder}/${fileName}`);

        return data?.publicUrl || '';
    }, []);

    // 이미지 preload 함수 - FCP/LCP 개선
    const preloadImage = useCallback((url: string) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        link.type = 'image/webp';
        document.head.appendChild(link);
    }, []);

    // 이미지 존재 여부 체크 (HEAD 요청)
    const checkImageExists = useCallback(async (url: string): Promise<boolean> => {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }, []);

    // 이미지 로드 함수 (Pixabay 우선 -> 실패 시 Supabase)
    const loadHeroImage = useCallback(async () => {
        try {
            // 1. Pixabay API로 직접 로드 (가장 우선)
            const apiKey = import.meta.env.VITE_PUBLIC_PIXABAY_API_KEY;
            if (apiKey) {
                try {
                    // 1페이지에서 30개 정도 가져와서 랜덤 선택
                    const randomPage = Math.floor(Math.random() * 3) + 1;
                    // 'background' 키워드 추가하여 배경에 적합한 이미지 검색
                    const { hits } = await pixabayService.searchImages('winter nature landscape beautiful background', apiKey, randomPage, 30);

                    if (hits && hits.length > 0) {
                        const randomIdx = Math.floor(Math.random() * hits.length);
                        // AdSense 승인 및 성능 최적화: largeImageURL(대용량) 대신 webformatURL(웹용) 사용
                        const imageUrl = hits[randomIdx].webformatURL;

                        preloadImage(imageUrl);
                        setBgImage(imageUrl);
                        setImageError(false);
                        setLoading(false);
                        return; // 성공하면 여기서 종료
                    }
                } catch (pixabayError) {
                    console.warn('Pixabay 직접 로드 실패, Supabase 시도:', pixabayError);
                    // Pixabay 실패 시 아래 Supabase 로직으로 넘어감
                }
            }

            // 2. Supabase 저장된 이미지 시도 (Fallback)
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const randomNum = Math.floor(Math.random() * 5) + 1;

            const currentMonthUrl = getMonthlyImageUrl(year, month, randomNum);
            const exists = await checkImageExists(currentMonthUrl);

            if (exists) {
                preloadImage(currentMonthUrl);
                setBgImage(currentMonthUrl);
                setImageError(false);
                setLoading(false);
                return;
            }

            // 이미지가 정말 하나도 없을 때
            console.log('이미지를 찾을 수 없습니다.');
            setLoading(false);

        } catch (error) {
            console.error('Hero 이미지 로딩 실패:', error);
            setImageError(true);
            setLoading(false);
        }
    }, [getMonthlyImageUrl, checkImageExists, preloadImage]);

    useEffect(() => {
        loadHeroImage();
    }, [loadHeroImage]);

    const scrollToContent = () => {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        });
    };

    return (
        <div className="relative h-screen w-full overflow-hidden">
            {/* 로딩 중 스켈레톤 */}
            {loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-pulse" />
            )}

            {/* 배경 이미지 */}
            {/* 배경 이미지 (LCP 최적화: img 태그 사용 + fetchPriority) */}
            {bgImage && (
                <img
                    src={bgImage}
                    alt="Main Background"
                    fetchPriority="high"
                    className={`absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-[20s] ${loading ? 'opacity-0' : 'opacity-100'}`}
                    style={{ filter: 'brightness(0.7)' }}
                />
            )}

            {!bgImage && !loading && (
                <div
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600"
                    style={{ filter: 'brightness(0.7)' }}
                />
            )}

            {/* 오버레이 콘텐츠 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center z-10">
                <div className="animate-fade-in-up space-y-6 max-w-4xl mx-auto">
                    <span className="inline-block px-4 py-1.5 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-sm font-medium mb-4">
                        Freesia! We support <br /> your new beginning.
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight drop-shadow-lg">
                        Discover Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
                            Inspiration
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                        새로운 이야기와 깊이 있는 통찰이 당신을 기다립니다.<br />
                        오늘의 생각, 내일의 영감이 되는 공간.
                    </p>

                    <button
                        onClick={scrollToContent}
                        className="group mt-8 px-8 py-4 bg-white text-indigo-900 rounded-full font-bold text-lg hover:bg-indigo-50 transition-all shadow-xl hover:shadow-2xl flex items-center gap-2 mx-auto"
                    >
                        최신 글보기
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* 스크롤 유도 아이콘 */}
            <div
                className="absolute bottom-10 left-0 right-0 flex justify-center cursor-pointer animate-bounce text-white/70 hover:text-white transition-colors z-20"
                onClick={scrollToContent}
            >
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs uppercase tracking-widest">Scroll Down</span>
                    <ChevronDown size={32} />
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
