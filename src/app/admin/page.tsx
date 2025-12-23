'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Plus, Edit, FileText, FolderPlus, MessageSquare, Settings as SettingsIcon, Layout as LayoutIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../services/supabase';

// Lazy load components
const PostList = lazy(() => import('../../components/admin/PostList'));
const PostEditor = lazy(() => import('../../components/admin/PostEditor'));
const AdminSettings = lazy(() => import('../../components/admin/Settings'));
const CategoryManager = lazy(() => import('../../components/admin/CategoryManager'));
const GuestbookManager = lazy(() => import('../../components/admin/GuestbookManager'));
const TemplateManager = lazy(() => import('../../components/admin/TemplateManager'));

const TabLoader = () => (
    <div className="py-12 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
        <p className="text-gray-400 text-sm">기능을 불러오는 중...</p>
    </div>
);

export default function AdminDashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('posts');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [currentPost, setCurrentPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/admin/login');
            }
            setLoading(false);
        };
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                router.push('/admin/login');
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'posts':
                return <PostList onEdit={(post: any) => { setCurrentPost(post); setIsEditorOpen(true); }} />;
            case 'categories':
                return <CategoryManager />;
            case 'guestbook':
                return <GuestbookManager />;
            case 'templates':
                return <TemplateManager />;
            case 'settings':
                return <AdminSettings />;
            default:
                return <PostList onEdit={(post: any) => { setCurrentPost(post); setIsEditorOpen(true); }} />;
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">블로그 관리</h1>
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-800 px-3 py-2 text-sm font-medium">블로그 홈</button>
                        <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 px-3 py-2 text-sm font-medium">로그아웃</button>
                        <button
                            onClick={() => { setCurrentPost(null); setIsEditorOpen(true); }}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <Plus size={18} /> 새 글 쓰기
                        </button>
                    </div>
                </div>
            </header>

            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 flex gap-8 overflow-x-auto">
                    {[
                        { id: 'posts', label: '글 관리', icon: FileText },
                        { id: 'categories', label: '카테고리', icon: FolderPlus },
                        { id: 'templates', label: '서식 관리', icon: LayoutIcon },
                        { id: 'guestbook', label: '방명록', icon: MessageSquare },
                        { id: 'settings', label: '설정', icon: SettingsIcon },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 border-b-2 font-medium flex items-center gap-2 ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600'}`}
                        >
                            <tab.icon size={18} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <Suspense fallback={<TabLoader />}>
                    {renderContent()}
                </Suspense>
            </main>

            {isEditorOpen && (
                <PostEditor
                    post={currentPost}
                    onClose={() => setIsEditorOpen(false)}
                    onSave={() => {
                        setIsEditorOpen(false);
                        setActiveTab('posts');
                    }}
                />
            )}
        </div>
    );
}
