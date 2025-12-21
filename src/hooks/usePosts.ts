import { useState, useEffect } from 'react';
import { postService } from '../services/postService';

export const usePosts = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const { data, error } = await postService.getPosts();
                if (error) throw error;
                setPosts(data || []);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return { posts, loading, error };
};
