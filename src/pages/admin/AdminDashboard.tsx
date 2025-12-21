import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, FolderPlus, Save, X, Settings as SettingsIcon, MessageSquare, Bell, FileText, Upload, BarChart2 } from 'lucide-react';
import PostList from '../../components/admin/PostList';
import PostEditor from '../../components/admin/PostEditor';
import AdminSettings from '../../components/admin/Settings';
import CategoryManager from '../../components/admin/CategoryManager';
import GuestbookManager from '../../components/admin/GuestbookManager';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('posts');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [currentPost, setCurrentPost] = useState(null);
    const [loading, setLoading] = useState(true);

    // 인증 체크
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                navigate('/admin/login');
            }
            setLoading(false);
        };

        checkSession();

        // 션 변경 감지
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                navigate('/admin/login');
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin/login');
    };

    // 탭 메뉴 핸들러
    const renderContent = () => {
        switch (activeTab) {
            case 'posts':
                return <PostList onEdit={(post) => { setCurrentPost(post); setIsEditorOpen(true); }} />;
            case 'categories':
                return <CategoryManager />;
            case 'guestbook':
                return <GuestbookManager />;
            case 'settings':
                return <AdminSettings />;
            default:
                return <PostList onEdit={(post) => { setCurrentPost(post); setIsEditorOpen(true); }} />;
        }
    };

    const handleCreatePost = () => {
        setCurrentPost(null);
        setIsEditorOpen(true);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* 상단 헤더 */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-gray-800">블로그 관리</h1>
                            <span className="text-gray-400 text-sm">v1.2</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="text-gray-500 hover:text-gray-800 px-3 py-2 text-sm font-medium transition"
                            >
                                블로그 홈
                            </button>
                            <button
                                onClick={handleLogout}
                                className="text-gray-500 hover:text-red-600 px-3 py-2 text-sm font-medium transition"
                            >
                                로그아웃
                            </button>
                            <button
                                onClick={handleCreatePost}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm"
                            >
                                <Plus size={18} />
                                새 글 쓰기
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* 네비게이션 탭 */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-8 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'write', label: '글쓰기', icon: Edit },
                            { id: 'posts', label: '글 관리', icon: FileText },
                            { id: 'categories', label: '카테고리', icon: FolderPlus },
                            { id: 'guestbook', label: '방명록', icon: MessageSquare },
                            { id: 'settings', label: '설정', icon: SettingsIcon },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (tab.id === 'write') {
                                        handleCreatePost();
                                    } else {
                                        setActiveTab(tab.id);
                                    }
                                }}
                                className={`py-4 border-b-2 font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 메인 컨텐츠 */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {renderContent()}
            </main>

            {/* 에디터 모달 */}
            {isEditorOpen && (
                <PostEditor
                    post={currentPost}
                    onClose={() => setIsEditorOpen(false)}
                    onSave={() => {
                        setIsEditorOpen(false);
                        // TODO: 리스트 새로고침 트리거 필요 (PostList에 key prop 변경 등)
                        setActiveTab('posts'); // 포커스 이동
                    }}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
