import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';

interface HeaderProps {
    blogName: string;
    onMenuToggle: () => void;
    isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({
    blogName,
    onMenuToggle,
    isSidebarOpen,
}) => {
    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50 lg:hidden">
            <div className="flex items-center justify-between h-full px-4">
                {/* 메뉴 토글 버튼 */}
                <button
                    onClick={onMenuToggle}
                    className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label={isSidebarOpen ? '메뉴 닫기' : '메뉴 열기'}
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* 블로그 제목 */}
                <Link
                    to="/"
                    className="text-lg font-bold text-gray-900 tracking-wide"
                >
                    {blogName}
                </Link>

                {/* 검색 버튼 */}
                <Link
                    to="/search"
                    className="p-2 -mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="검색"
                >
                    <Search size={22} />
                </Link>
            </div>
        </header>
    );
};

export default Header;
