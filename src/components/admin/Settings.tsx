import React, { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, ExternalLink, Save, Megaphone, RefreshCw, Search, CheckCircle, AlertCircle, X, Check } from 'lucide-react';
import PixabayImageSelector from './PixabayImageSelector';
import { settingsService } from '../../services/settingsService';
import { heroImageService } from '../../services/heroImageService';
import { pixabayService, PixabayImage } from '../../services/pixabayService';

const AdminSettings: React.FC = () => {
    const [settings, setSettings] = useState({
        title: '',
        description: '',
        profileImage: '',
        googleAnalyticsId: '',
        googleSearchConsoleId: '',
        adsensePubId: '',
        ad_sidebar_html: '',
        ad_content_html: '',
    });

    const [showPixabayModal, setShowPixabayModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Hero 이미지 상태
    const [isRefreshingHero, setIsRefreshingHero] = useState(false);
    const [heroSyncResult, setHeroSyncResult] = useState<string>('');
    const [heroSearchQuery, setHeroSearchQuery] = useState<string>('nature landscape beautiful');

    // 이미지 미리보기 상태
    const [isSearchingImages, setIsSearchingImages] = useState(false);
    const [previewImages, setPreviewImages] = useState<PixabayImage[]>([]);
    const [selectedImages, setSelectedImages] = useState<PixabayImage[]>([]);

    // ads.txt 검증 상태
    const [adsenseVerified, setAdsenseVerified] = useState<boolean | null>(null);

    // 설정 로드
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const { data, error } = await settingsService.getAllSettings();
                if (error) throw error;

                if (data) {
                    const newSettings: any = { ...settings };
                    data.forEach((item: any) => {
                        if (item.value && item.key in newSettings) {
                            newSettings[item.key] = item.value;
                        }
                    });
                    setSettings(newSettings);
                }
            } catch (error) {
                console.error('설정 로드 실패:', error);
                const saved = localStorage.getItem('blog_settings');
                if (saved) setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    // 설정 저장
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const settingsToSave = Object.entries(settings).map(([key, value]) => ({
                key,
                value: value || '',
                description: getKeyDescription(key)
            }));

            const { error } = await settingsService.saveSettings(settingsToSave);
            if (error) throw error;

            alert('설정이 저장되었습니다.');
        } catch (error) {
            console.error('설정 저장 실패:', error);
            alert('설정 저장에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const getKeyDescription = (key: string): string => {
        const map: Record<string, string> = {
            title: '블로그 제목',
            description: '블로그 설명',
            profileImage: '프로필 이미지 URL',
            googleAnalyticsId: 'Google Analytics ID',
            googleSearchConsoleId: 'Google Search Console Verification',
            adsensePubId: 'Google AdSense Publisher ID',
            ad_sidebar_html: '사이드바 광고 HTML',
            ad_content_html: '본문 광고 HTML'
        };
        return map[key] || '';
    };

    // Pixabay에서 이미지 검색 (미리보기)
    const handleSearchImages = async () => {
        if (!heroSearchQuery.trim()) {
            alert('검색어를 입력해주세요.');
            return;
        }

        const apiKey = import.meta.env.VITE_PUBLIC_PIXABAY_API_KEY;
        if (!apiKey) {
            alert('Pixabay API Key가 설정되지 않았습니다.');
            return;
        }

        setIsSearchingImages(true);
        setPreviewImages([]);
        setSelectedImages([]);

        try {
            const result = await pixabayService.searchImages(heroSearchQuery.trim(), apiKey, 1, 20);
            setPreviewImages(result.hits);
        } catch (error: any) {
            console.error('이미지 검색 실패:', error);
            alert('이미지 검색에 실패했습니다: ' + error.message);
        } finally {
            setIsSearchingImages(false);
        }
    };

    // 이미지 선택/해제 토글
    const toggleImageSelection = (image: PixabayImage) => {
        const isSelected = selectedImages.some(img => img.id === image.id);

        if (isSelected) {
            setSelectedImages(selectedImages.filter(img => img.id !== image.id));
        } else {
            if (selectedImages.length >= 5) {
                alert('최대 5개까지 선택할 수 있습니다.');
                return;
            }
            setSelectedImages([...selectedImages, image]);
        }
    };

    // 선택된 이미지들을 Supabase에 저장
    const handleSaveSelectedImages = async () => {
        if (selectedImages.length === 0) {
            alert('최소 1개 이상의 이미지를 선택해주세요.');
            return;
        }

        setIsRefreshingHero(true);
        setHeroSyncResult(`${selectedImages.length}개 이미지를 저장하는 중...`);

        try {
            const result = await heroImageService.uploadSelectedImages(selectedImages);
            setHeroSyncResult(result.message);

            if (result.success) {
                // 성공 시 미리보기 초기화
                setPreviewImages([]);
                setSelectedImages([]);
            }

            setTimeout(() => setHeroSyncResult(''), 5000);
        } catch (error: any) {
            console.error('Hero 이미지 저장 실패:', error);
            setHeroSyncResult(`오류: ${error.message}`);
        } finally {
            setIsRefreshingHero(false);
        }
    };

    // AdSense pub ID 검증
    const verifyAdsense = async () => {
        if (!settings.adsensePubId) {
            alert('AdSense Publisher ID를 입력해주세요.');
            return;
        }

        const pubId = settings.adsensePubId.startsWith('ca-pub-')
            ? settings.adsensePubId
            : `ca-pub-${settings.adsensePubId}`;

        const isValid = /^ca-pub-\d{16}$/.test(pubId);
        setAdsenseVerified(isValid);

        if (isValid) {
            alert(`✅ Publisher ID 형식이 올바릅니다: ${pubId}\n\nads.txt 파일을 public 폴더에 추가하세요:\ngoogle.com, ${pubId}, DIRECT, f08c47fec0942fa0`);
        } else {
            alert('❌ Publisher ID 형식이 올바르지 않습니다.\n예시: ca-pub-1234567890123456');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">설정을 불러오는 중...</div>;

    return (
        <div className="space-y-6">
            {/* 기본 설정 */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-gray-800">블로그 기본 설정</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">블로그 제목</label>
                            <input
                                type="text"
                                value={settings.title}
                                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">프로필 이미지 URL</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={settings.profileImage}
                                    onChange={(e) => setSettings({ ...settings, profileImage: e.target.value })}
                                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                                    placeholder="https://..."
                                />
                                <button
                                    onClick={() => setShowPixabayModal(true)}
                                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                                    title="Pixabay에서 검색"
                                >
                                    <ImageIcon size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">블로그 설명</label>
                        <textarea
                            value={settings.description}
                            onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg h-24 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none resize-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* 구글 애드센스 설정 */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                    <Megaphone size={20} className="text-yellow-600" />
                    구글 애드센스 (AdSense)
                </h2>

                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">Publisher ID (pub ID)</label>
                            <a href="https://www.google.com/adsense/" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                AdSense 바로가기 <ExternalLink size={10} />
                            </a>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={settings.adsensePubId}
                                onChange={(e) => {
                                    setSettings({ ...settings, adsensePubId: e.target.value });
                                    setAdsenseVerified(null);
                                }}
                                placeholder="ca-pub-1234567890123456"
                                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-mono"
                            />
                            <button
                                onClick={verifyAdsense}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                {adsenseVerified === true ? <CheckCircle size={16} /> : adsenseVerified === false ? <AlertCircle size={16} /> : null}
                                확인
                            </button>
                        </div>
                    </div>

                    {settings.adsensePubId && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <h4 className="font-medium text-blue-800 mb-2">📄 ads.txt 파일 생성</h4>
                            <p className="text-sm text-blue-700 mb-3">
                                아래 내용을 <code className="bg-blue-100 px-1 rounded">public/ads.txt</code> 파일로 저장하세요:
                            </p>
                            <code className="block p-3 bg-white rounded border text-xs font-mono text-gray-800 break-all">
                                google.com, {settings.adsensePubId.startsWith('ca-pub-') ? settings.adsensePubId : `ca-pub-${settings.adsensePubId}`}, DIRECT, f08c47fec0942fa0
                            </code>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">사이드바 광고 HTML</label>
                        <textarea
                            value={settings.ad_sidebar_html}
                            onChange={(e) => setSettings({ ...settings, ad_sidebar_html: e.target.value })}
                            placeholder="<!-- 광고 코드 입력 -->"
                            className="w-full px-4 py-2 border rounded-lg h-32 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-mono text-xs"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">본문 하단 광고 HTML</label>
                        <textarea
                            value={settings.ad_content_html}
                            onChange={(e) => setSettings({ ...settings, ad_content_html: e.target.value })}
                            placeholder="<div>...</div>"
                            className="w-full px-4 py-2 border rounded-lg h-24 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-mono text-xs"
                        />
                    </div>
                </div>
            </div>

            {/* 메인 화면 Hero 이미지 설정 */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                    <ImageIcon size={20} className="text-purple-600" />
                    메인 화면(Hero) 이미지 설정
                </h2>

                <div className="space-y-4">
                    {/* 검색어 입력 + 검색 버튼 */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            이미지 검색 주제 (영어 권장)
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={heroSearchQuery}
                                    onChange={(e) => setHeroSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSearchImages();
                                        }
                                    }}
                                    placeholder="예: sunset ocean, mountain snow, city night..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-600 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={handleSearchImages}
                                disabled={isSearchingImages}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Search size={16} className={isSearchingImages ? 'animate-pulse' : ''} />
                                검색
                            </button>
                        </div>
                    </div>

                    {/* 이미지 미리보기 그리드 */}
                    {previewImages.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    이미지를 클릭하여 선택하세요 (최대 5개)
                                </p>
                                <span className="text-sm font-medium text-purple-600">
                                    {selectedImages.length}/5 선택됨
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {previewImages.map((image) => {
                                    const isSelected = selectedImages.some(img => img.id === image.id);
                                    return (
                                        <div
                                            key={image.id}
                                            onClick={() => toggleImageSelection(image)}
                                            className={`relative cursor-pointer rounded-lg overflow-hidden aspect-video border-2 transition-all ${isSelected
                                                    ? 'border-purple-500 ring-2 ring-purple-200'
                                                    : 'border-gray-200 hover:border-purple-300'
                                                }`}
                                        >
                                            <img
                                                src={image.webformatURL}
                                                alt={image.tags}
                                                className="w-full h-full object-cover"
                                            />
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                                    <Check size={14} className="text-white" />
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/60 to-transparent">
                                                <p className="text-white text-xs truncate">{image.user}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 갱신 버튼 */}
                    {selectedImages.length > 0 && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setSelectedImages([]);
                                }}
                                className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <X size={16} />
                                선택 취소
                            </button>
                            <button
                                onClick={handleSaveSelectedImages}
                                disabled={isRefreshingHero}
                                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium"
                            >
                                <RefreshCw size={16} className={isRefreshingHero ? 'animate-spin' : ''} />
                                {selectedImages.length}개 이미지 저장
                            </button>
                        </div>
                    )}

                    {/* 결과 메시지 */}
                    {heroSyncResult && (
                        <div className={`p-3 rounded-lg text-sm ${heroSyncResult.includes('오류') || heroSyncResult.includes('실패') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {heroSyncResult}
                        </div>
                    )}

                    <p className="text-xs text-gray-500">
                        선택한 이미지들이 Supabase에 저장되며, 홈 화면 방문 시 랜덤으로 표시됩니다.
                    </p>
                </div>
            </div>

            {/* Analytics 설정 */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                    <FileText size={20} className="text-orange-600" />
                    Analytics 설정
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Google Analytics 측정 ID</label>
                        <input
                            type="text"
                            placeholder="G-XXXXXXXXXX"
                            value={settings.googleAnalyticsId}
                            onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Google Search Console 메타 태그</label>
                        <input
                            type="text"
                            placeholder='<meta name="google-site-verification" ... />'
                            value={settings.googleSearchConsoleId}
                            onChange={(e) => setSettings({ ...settings, googleSearchConsoleId: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-mono text-xs"
                        />
                    </div>
                </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end sticky bottom-6">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl flex items-center gap-2 active:scale-95 transform"
                >
                    {isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            저장 중...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            설정 저장하기
                        </>
                    )}
                </button>
            </div>

            {/* Pixabay 모달 */}
            {showPixabayModal && (
                <PixabayImageSelector
                    apiKey={import.meta.env.VITE_PUBLIC_PIXABAY_API_KEY || ''}
                    onSelect={(url) => {
                        setSettings({ ...settings, profileImage: url });
                        setShowPixabayModal(false);
                    }}
                    onClose={() => setShowPixabayModal(false)}
                />
            )}
        </div>
    );
};

export default AdminSettings;
