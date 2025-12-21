import { supabase } from './supabase';
import { pixabayService } from './pixabayService';
import { imageService } from './imageService';

/**
 * Hero 이미지 자동 갱신 서비스
 * - Pixabay에서 자연 풍경 이미지 5장을 가져와 Supabase Storage에 저장
 * - 매월 첫 방문 시 또는 관리자 수동 트리거 시 실행
 */

const HERO_BUCKET = 'blog main image';
const HERO_FOLDER_PREFIX = 'monthly-picks';
const DEFAULT_SEARCH_QUERY = 'nature landscape beautiful';

export interface HeroImageSyncResult {
    success: boolean;
    message: string;
    uploadedCount: number;
    errors?: string[];
}

export const heroImageService = {
    /**
     * 현재 월의 Hero 이미지 폴더 경로 생성
     */
    getCurrentMonthFolder(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${HERO_FOLDER_PREFIX}/${year}-${month}`;
    },

    /**
     * 특정 월 폴더에 이미지가 있는지 확인
     */
    async checkImagesExist(folder: string): Promise<boolean> {
        try {
            const { data, error } = await supabase.storage
                .from(HERO_BUCKET)
                .list(folder);

            if (error) {
                console.error('폴더 확인 실패:', error);
                return false;
            }

            // 최소 1개 이상의 webp 파일이 있으면 true
            const webpFiles = data?.filter(file => file.name.endsWith('.webp')) || [];
            return webpFiles.length > 0;
        } catch (error) {
            console.error('이미지 존재 여부 확인 실패:', error);
            return false;
        }
    },

    /**
     * Pixabay에서 이미지를 가져와 현재 월 폴더에 저장
     * @param forceRefresh - true면 기존 이미지가 있어도 새로 가져옴
     * @param searchQuery - 검색어 (기본: 자연 풍경)
     */
    async syncHeroImages(forceRefresh: boolean = false, searchQuery?: string): Promise<HeroImageSyncResult> {
        const folder = this.getCurrentMonthFolder();
        const errors: string[] = [];

        try {
            // 이미 이미지가 있는지 확인 (forceRefresh가 아닌 경우)
            if (!forceRefresh) {
                const exists = await this.checkImagesExist(folder);
                if (exists) {
                    return {
                        success: true,
                        message: '이번 달 이미지가 이미 존재합니다.',
                        uploadedCount: 0
                    };
                }
            }

            // Pixabay API Key 가져오기 (환경변수에서)
            const pixabayApiKey = import.meta.env.VITE_PUBLIC_PIXABAY_API_KEY;

            if (!pixabayApiKey) {
                return {
                    success: false,
                    message: 'Pixabay API Key가 설정되지 않았습니다. .env.local에 VITE_PUBLIC_PIXABAY_API_KEY를 추가해주세요.',
                    uploadedCount: 0
                };
            }

            // Pixabay에서 이미지 검색 (searchQuery 파라미터 사용)
            const { hits } = await pixabayService.searchImages(
                searchQuery || DEFAULT_SEARCH_QUERY,
                pixabayApiKey,
                1,
                20 // 여유있게 검색
            );

            if (!hits || hits.length < 5) {
                return {
                    success: false,
                    message: 'Pixabay에서 충분한 이미지를 찾지 못했습니다.',
                    uploadedCount: 0
                };
            }

            // 랜덤하게 5개 선택
            const shuffled = hits.sort(() => Math.random() - 0.5);
            const selectedImages = shuffled.slice(0, 5);

            let uploadedCount = 0;

            // 각 이미지를 WebP로 변환하여 업로드
            for (let i = 0; i < selectedImages.length; i++) {
                const image = selectedImages[i];
                const fileName = `${i + 1}.webp`;
                const filePath = `${folder}/${fileName}`;

                try {
                    const result = await imageService.uploadFromUrl(
                        image.largeImageURL,
                        HERO_BUCKET,
                        filePath,
                        0.85
                    );

                    if (result.error) {
                        errors.push(`이미지 ${i + 1} 업로드 실패: ${result.error}`);
                    } else {
                        uploadedCount++;
                        console.log(`Hero 이미지 ${i + 1}/5 업로드 완료: ${result.url}`);
                    }
                } catch (error: any) {
                    errors.push(`이미지 ${i + 1} 처리 중 오류: ${error.message}`);
                }
            }

            return {
                success: uploadedCount > 0,
                message: uploadedCount === 5
                    ? `${folder}에 5장의 이미지가 성공적으로 저장되었습니다.`
                    : `${uploadedCount}/5 이미지 저장됨. 일부 실패가 있습니다.`,
                uploadedCount,
                errors: errors.length > 0 ? errors : undefined
            };

        } catch (error: any) {
            console.error('Hero 이미지 동기화 실패:', error);
            return {
                success: false,
                message: `동기화 중 오류 발생: ${error.message}`,
                uploadedCount: 0,
                errors: [error.message]
            };
        }
    },

    /**
     * 현재 월 이미지가 없으면 자동으로 갱신 (HeroSection에서 호출)
     * 조용히 백그라운드에서 실행
     */
    async autoSyncIfNeeded(): Promise<boolean> {
        const folder = this.getCurrentMonthFolder();

        try {
            const exists = await this.checkImagesExist(folder);

            if (!exists) {
                console.log('Hero 이미지가 없습니다. 자동 갱신을 시작합니다...');
                const result = await this.syncHeroImages(false);
                console.log('자동 갱신 결과:', result.message);
                return result.success;
            }

            return true;
        } catch (error) {
            console.error('자동 갱신 체크 실패:', error);
            return false;
        }
    },

    /**
     * 특정 월의 이미지 삭제
     */
    async deleteMonthlyImages(folder: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: files, error: listError } = await supabase.storage
                .from(HERO_BUCKET)
                .list(folder);

            if (listError) {
                return { success: false, error: listError.message };
            }

            if (!files || files.length === 0) {
                return { success: true };
            }

            const filePaths = files.map(file => `${folder}/${file.name}`);

            const { error: deleteError } = await supabase.storage
                .from(HERO_BUCKET)
                .remove(filePaths);

            if (deleteError) {
                return { success: false, error: deleteError.message };
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * 사용자가 선택한 이미지들을 Supabase Storage에 업로드
     * @param selectedImages - 선택된 Pixabay 이미지 배열
     */
    async uploadSelectedImages(selectedImages: { id: number; largeImageURL: string; tags: string }[]): Promise<HeroImageSyncResult> {
        const folder = this.getCurrentMonthFolder();
        const errors: string[] = [];
        let uploadedCount = 0;

        try {
            // 기존 이미지 삭제 과정을 제거하고 덮어쓰기(upsert)로 변경
            // await this.deleteMonthlyImages(folder);

            // 각 이미지를 WebP로 변환하여 업로드
            for (let i = 0; i < selectedImages.length; i++) {
                const image = selectedImages[i];
                const fileName = `${i + 1}.webp`;
                const filePath = `${folder}/${fileName}`;

                try {
                    const result = await imageService.uploadFromUrl(
                        image.largeImageURL,
                        HERO_BUCKET,
                        filePath,
                        0.85
                    );

                    if (result.error) {
                        errors.push(`이미지 ${i + 1} 업로드 실패: ${result.error}`);
                    } else {
                        uploadedCount++;
                        console.log(`Hero 이미지 ${i + 1}/${selectedImages.length} 업로드 완료`);
                    }
                } catch (error: any) {
                    errors.push(`이미지 ${i + 1} 처리 중 오류: ${error.message}`);
                }
            }

            return {
                success: uploadedCount > 0,
                message: uploadedCount === selectedImages.length
                    ? `✅ ${uploadedCount}장의 이미지가 성공적으로 저장되었습니다!`
                    : `${uploadedCount}/${selectedImages.length} 이미지 저장됨. 일부 실패가 있습니다.`,
                uploadedCount,
                errors: errors.length > 0 ? errors : undefined
            };

        } catch (error: any) {
            console.error('이미지 업로드 실패:', error);
            return {
                success: false,
                message: `오류 발생: ${error.message}`,
                uploadedCount: 0,
                errors: [error.message]
            };
        }
    }
};
