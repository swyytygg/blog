import { supabase } from './supabase';

/**
 * 이미지 업로드 및 관리 서비스
 * - 글 작성 시 이미지 업로드 (post-images 버킷)
 * - Hero 이미지 자동 갱신 (images 버킷)
 */

export interface UploadResult {
    url: string;
    path: string;
    error?: string;
}

export const imageService = {
    /**
     * 이미지 파일을 Supabase Storage에 업로드
     * @param file - 업로드할 파일
     * @param bucket - 버킷 이름 (기본: post-images)
     * @param folder - 폴더 경로 (옵션)
     */
    async uploadImage(file: File, bucket: string = 'post-images', folder?: string): Promise<UploadResult> {
        try {
            // 파일명 생성 (타임스탬프 + 랜덤 문자열 + 확장자)
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 8);
            const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
            const fileName = `${timestamp}-${randomStr}.${extension}`;

            // 경로 생성
            const filePath = folder ? `${folder}/${fileName}` : fileName;

            // 업로드
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    contentType: file.type,
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('이미지 업로드 실패:', error);
                return { url: '', path: '', error: error.message };
            }

            // Public URL 가져오기
            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            return {
                url: urlData.publicUrl,
                path: data.path
            };
        } catch (error: any) {
            console.error('이미지 업로드 중 오류:', error);
            return { url: '', path: '', error: error.message };
        }
    },

    /**
     * 이미지를 WebP로 변환하여 업로드
     * @param file - 원본 이미지 파일
     * @param bucket - 버킷 이름
     * @param folder - 폴더 경로
     * @param quality - WebP 품질 (0.0 ~ 1.0)
     */
    async uploadImageAsWebP(
        file: File,
        bucket: string = 'post-images',
        folder?: string,
        quality: number = 0.85
    ): Promise<UploadResult> {
        try {
            // 이미지를 Canvas에 그려서 WebP로 변환
            const webpBlob = await this.convertToWebP(file, quality);

            if (!webpBlob) {
                // WebP 변환 실패 시 원본 업로드
                return this.uploadImage(file, bucket, folder);
            }

            // WebP 파일명 생성
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 8);
            const fileName = `${timestamp}-${randomStr}.webp`;
            const filePath = folder ? `${folder}/${fileName}` : fileName;

            // 업로드
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, webpBlob, {
                    contentType: 'image/webp',
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('WebP 업로드 실패 (Supabase Error):', error);
                const errorMsg = error.message === 'Object not found' ? 'Storage의 post-images 버킷을 찾을 수 없습니다.' : error.message;
                return { url: '', path: '', error: errorMsg };
            }

            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            return {
                url: urlData.publicUrl,
                path: data.path
            };
        } catch (error: any) {
            console.error('WebP 변환/업로드 전체 프로세스 오류:', error);
            return { url: '', path: '', error: `이미지 처리 중 치명적 오류: ${error.message}` };
        }
    },

    /**
     * 이미지 파일을 WebP Blob으로 변환
     */
    async convertToWebP(file: File, quality: number = 0.85): Promise<Blob | null> {
        return new Promise((resolve) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(null);
                        return;
                    }

                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob(
                        (blob) => resolve(blob),
                        'image/webp',
                        quality
                    );
                };
                img.onerror = () => resolve(null);
                img.src = e.target?.result as string;
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    },

    /**
     * URL에서 이미지를 다운로드하여 WebP로 변환 후 Supabase에 업로드
     * (Pixabay 이미지 등 외부 이미지용)
     */
    async uploadFromUrl(
        imageUrl: string,
        bucket: string,
        filePath: string,
        quality: number = 0.85
    ): Promise<UploadResult> {
        try {
            // 이미지 다운로드
            const response = await fetch(imageUrl);
            if (!response.ok) {
                return { url: '', path: '', error: '이미지 다운로드 실패' };
            }

            const blob = await response.blob();

            // Canvas로 WebP 변환
            const webpBlob = await this.convertBlobToWebP(blob, quality);

            if (!webpBlob) {
                return { url: '', path: '', error: 'WebP 변환 실패' };
            }

            // Supabase에 업로드
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, webpBlob, {
                    contentType: 'image/webp',
                    cacheControl: '31536000', // 1년 캐시 (Hero 이미지용)
                    upsert: true // 기존 파일 덮어쓰기
                });

            if (error) {
                console.error('Supabase 업로드 실패:', error);
                return { url: '', path: '', error: error.message };
            }

            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            return {
                url: urlData.publicUrl,
                path: data.path
            };
        } catch (error: any) {
            console.error('URL 이미지 업로드 오류:', error);
            return { url: '', path: '', error: error.message };
        }
    },

    /**
     * Blob을 WebP로 변환
     */
    async convertBlobToWebP(blob: Blob, quality: number = 0.85): Promise<Blob | null> {
        return new Promise((resolve) => {
            const img = new Image();
            // CORS 문제 방지
            img.crossOrigin = 'Anonymous';
            const url = URL.createObjectURL(blob);

            img.onload = () => {
                URL.revokeObjectURL(url);

                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(null);
                    return;
                }

                ctx.drawImage(img, 0, 0);

                canvas.toBlob(
                    (webpBlob) => resolve(webpBlob),
                    'image/webp',
                    quality
                );
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(null);
            };
            img.src = url;
        });
    },

    /**
     * 이미지 삭제
     */
    async deleteImage(bucket: string, path: string): Promise<{ error?: string }> {
        try {
            const { error } = await supabase.storage
                .from(bucket)
                .remove([path]);

            if (error) {
                return { error: error.message };
            }
            return {};
        } catch (error: any) {
            return { error: error.message };
        }
    }
};

/**
 * 본문 HTML에서 썸네일 이미지 URL 추출
 * 우선순위:
 * 1. alt="thumbnail" 속성을 가진 이미지
 * 2. 첫 번째 이미지
 */
export function extractThumbnailFromContent(htmlContent: string): string | null {
    if (!htmlContent) return null;

    // 1. alt="thumbnail" 이미지 찾기 (src가 앞에 오는 경우)
    const thumbnailMatch1 = htmlContent.match(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']thumbnail["']/i);
    if (thumbnailMatch1) return thumbnailMatch1[1];

    // 2. alt="thumbnail" 이미지 찾기 (alt가 앞에 오는 경우)
    const thumbnailMatch2 = htmlContent.match(/<img[^>]*alt=["']thumbnail["'][^>]*src=["']([^"']+)["']/i);
    if (thumbnailMatch2) return thumbnailMatch2[1];

    // 3. 첫 번째 이미지 찾기
    const firstImageMatch = htmlContent.match(/<img[^>]*src=["']([^"']+)["']/i);
    if (firstImageMatch) return firstImageMatch[1];

    // Markdown 이미지 문법도 체크 (![alt](url))
    const mdImageMatch = htmlContent.match(/!\[thumbnail\]\(([^)]+)\)/i)
        || htmlContent.match(/!\[[^\]]*\]\(([^)]+)\)/);
    if (mdImageMatch) return mdImageMatch[1];

    return null;
}
