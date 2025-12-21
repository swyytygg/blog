import { useState, useEffect } from 'react';
import { categoryService, Category } from '../services/categoryService';

export const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data, error } = await categoryService.getCategoriesWithPostCount();
                if (error) throw error;
                setCategories(data || []);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const refresh = async () => {
        setLoading(true);
        try {
            const { data, error } = await categoryService.getCategoriesWithPostCount();
            if (error) throw error;
            setCategories(data || []);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return { categories, loading, error, refresh };
};
