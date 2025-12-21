import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/layout/Layout';
import Home from './pages/Home';

// Lazy loading으로 코드 스플리팅 - 초기 번들 크기 감소
const PostView = lazy(() => import('./pages/PostView'));
const CategoryView = lazy(() => import('./pages/CategoryView'));
const Guestbook = lazy(() => import('./pages/Guestbook'));
const Search = lazy(() => import('./pages/Search'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Login = lazy(() => import('./pages/admin/Login'));

// 로딩 스피너 컴포넌트
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-gray-500 text-sm">로딩 중...</p>
    </div>
  </div>
);

// 404 페이지
const NotFound = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-10">
    <div className="text-6xl mb-6">🔍</div>
    <h2 className="text-3xl font-bold text-gray-800 mb-3">404</h2>
    <p className="text-gray-500">페이지를 찾을 수 없습니다.</p>
    <a href="/" className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
      홈으로 돌아가기
    </a>
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* 티스토리 스타일 레이아웃 적용 */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="post/:id" element={<PostView />} />
              <Route path="category/:category" element={<CategoryView />} />
              <Route path="tag/:tag" element={<CategoryView />} />
              <Route path="notice" element={<CategoryView />} />
              <Route path="notice/:id" element={<PostView />} />
              <Route path="guestbook" element={<Guestbook />} />
              <Route path="search" element={<Search />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            {/* 관리자 페이지는 별도 레이아웃 - lazy loading으로 분리 */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;