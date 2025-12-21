import axios from 'axios';

const PIXABAY_API_URL = 'https://pixabay.com/api/';

export interface PixabayImage {
    id: number;
    webformatURL: string;
    largeImageURL: string;
    tags: string;
    user: string;
    views: number;
    likes: number;
}

export const pixabayService = {
    async searchImages(query: string, apiKey: string, page: number = 1, perPage: number = 20) {
        if (!apiKey) {
            throw new Error('Pixabay API Key가 필요합니다.');
        }

        try {
            const response = await axios.get(PIXABAY_API_URL, {
                params: {
                    key: apiKey,
                    q: query,
                    image_type: 'photo',
                    page,
                    per_page: perPage,
                    lang: 'ko' // 한국어 검색 지원
                }
            });
            return {
                hits: response.data.hits as PixabayImage[],
                totalHits: response.data.totalHits
            };
        } catch (error) {
            console.error('Pixabay API Error:', error);
            throw error;
        }
    }
};
