import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, Image as ImageIcon, Tag, Lock, Globe, Bold, Italic, Link, List, Quote, Code, Heading, Upload, Minus, ChevronDown, Calendar, Clock, Lightbulb, Info } from 'lucide-react';
import { postService, CreatePostInput, UpdatePostInput } from '../../services/postService';
import { supabase } from '../../services/supabase';
import { categoryService, Category } from '../../services/categoryService';
import { imageService, extractThumbnailFromContent } from '../../services/imageService';

interface PostEditorProps {
    post: any;
    onClose: () => void;
    onSave: () => void;
}

const PostEditor: React.FC<PostEditorProps> = ({ post, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [slug, setSlug] = useState(''); // 슬러그 상태 추가
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isPublished, setIsPublished] = useState(true);
    const [publishedAt, setPublishedAt] = useState(''); // 예약 발행 상태
    const [submitting, setSubmitting] = useState(false);
    const [editorMode, setEditorMode] = useState<'basic' | 'markdown' | 'html'>('basic');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const contentEditableRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 이미지 업로드 상태
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // 드롭다운 메뉴 상태
    const [showHeadingMenu, setShowHeadingMenu] = useState(false);
    const [showDividerMenu, setShowDividerMenu] = useState(false);

    // 카테고리 목록
    const [categories, setCategories] = useState<Category[]>([]);


    useEffect(() => {
        // 카테고리 로드
        categoryService.getAllCategories().then(res => {
            if (res.data) setCategories(res.data);
        });

        // 수정 모드일 때 데이터 채우기
        if (post) {
            setTitle(post.title);
            setContent(post.content || '');
            setCategory(post.category || '');
            setSlug(post.slug || ''); // 기존 슬러그 로드
            setThumbnailUrl(post.thumbnail_url || '');
            setTags(post.tags || []);
            setIsPublished(post.is_published ?? true);
            setEditorMode(post.content_type || 'markdown'); // 기존 글은 마크다운으로 간주

            // 날짜 형식 변환 (YYYY-MM-DDTHH:MM)
            if (post.published_at) {
                const date = new Date(post.published_at);
                const localISODate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                setPublishedAt(localISODate);
            } else {
                const now = new Date();
                const localISODate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                setPublishedAt(localISODate);
            }
        } else {
            // 새 글일 때 현재 시간으로 초기화
            const now = new Date();
            const localISODate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            setPublishedAt(localISODate);
        }
    }, [post]);

    // 한글 입력(IME) 중복 및 밀림 방지를 위한 상태 관리
    const isComposing = useRef(false);
    const lastSyncedContent = useRef('');

    useEffect(() => {
        if (editorMode === 'basic' && contentEditableRef.current) {
            // 외부(post 로드 등)에서 내용이 바뀌었거나 모드가 바뀌었을 때만 DOM 업데이트
            // lastSyncedContent를 사용하여 타이핑 중인 내용과의 무한 루프를 방지합니다.
            if (content !== lastSyncedContent.current) {
                contentEditableRef.current.innerHTML = content;
                lastSyncedContent.current = content;
            }
        }
    }, [editorMode, content]); // 모드 변경 및 외부 데이터 변경 시 동기화

    // ==================== 이미지 업로드 관련 함수들 ====================

    /**
     * 이미지 파일 업로드 및 본문에 삽입
     */
    const handleImageUpload = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }

        // 파일 크기 제한 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('이미지 크기는 10MB 이하로 업로드해주세요.');
            return;
        }

        setIsUploading(true);
        setUploadProgress('이미지 업로드 중...');

        try {
            // WebP로 변환하여 업로드
            const result = await imageService.uploadImageAsWebP(file, 'post-images');

            if (result.error) {
                alert(`업로드 실패: ${result.error}`);
                return;
            }

            // 에디터에 이미지 삽입
            insertImageToContent(result.url, file.name);
            setUploadProgress('업로드 완료!');

            setTimeout(() => setUploadProgress(''), 2000);
        } catch (error: any) {
            console.error('이미지 업로드 오류:', error);
            alert(`업로드 중 오류: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    }, [editorMode]);

    /**
     * 본문에 이미지 태그 삽입
     */
    const insertImageToContent = useCallback((imageUrl: string, altText: string = '') => {
        const cleanAlt = altText.replace(/\.[^/.]+$/, ''); // 확장자 제거

        if (editorMode === 'basic') {
            // contentEditable에 이미지 삽입
            const imgHtml = `<img src="${imageUrl}" alt="${cleanAlt}" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
            document.execCommand('insertHTML', false, imgHtml);
            if (contentEditableRef.current) {
                setContent(contentEditableRef.current.innerHTML);
            }
        } else if (editorMode === 'markdown') {
            // 마크다운 이미지 문법
            const imgMd = `\n![${cleanAlt}](${imageUrl})\n`;
            const textarea = textareaRef.current;
            if (textarea) {
                const start = textarea.selectionStart;
                const newContent = content.substring(0, start) + imgMd + content.substring(start);
                setContent(newContent);
            } else {
                setContent(prev => prev + imgMd);
            }
        } else {
            // HTML 모드
            const imgHtml = `\n<img src="${imageUrl}" alt="${cleanAlt}" style="max-width: 100%; height: auto;" />\n`;
            const textarea = textareaRef.current;
            if (textarea) {
                const start = textarea.selectionStart;
                const newContent = content.substring(0, start) + imgHtml + content.substring(start);
                setContent(newContent);
            } else {
                setContent(prev => prev + imgHtml);
            }
        }
    }, [editorMode, content]);

    /**
     * 파일 선택 버튼 클릭
     */
    const handleImageButtonClick = () => {
        fileInputRef.current?.click();
    };

    /**
     * 파일 input 변경 이벤트
     */
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
        // input 초기화 (같은 파일 다시 선택 가능하도록)
        e.target.value = '';
    };

    /**
     * 드래그 앤 드롭 핸들러
     */
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(f => f.type.startsWith('image/'));

        if (imageFile) {
            handleImageUpload(imageFile);
        }
    }, [handleImageUpload]);

    // ==================== 기존 함수들 ====================

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const insertText = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);

        const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
        setContent(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (contentEditableRef.current) {
            setContent(contentEditableRef.current.innerHTML);
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        setSubmitting(true);
        try {
            // 현재 로그인한 사용자 가져오기
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert('로그인이 필요합니다. 관리자 계정으로 로그인해주세요.');
                setSubmitting(false);
                return;
            }

            const authorId = user.id;

            // 썸네일 자동 추출: thumbnailUrl이 비어있으면 본문에서 추출
            // alt="thumbnail" 이미지 우선, 없으면 첫 번째 이미지 사용
            let finalThumbnailUrl = thumbnailUrl;
            if (!finalThumbnailUrl.trim()) {
                const extractedThumbnail = extractThumbnailFromContent(content);
                if (extractedThumbnail) {
                    finalThumbnailUrl = extractedThumbnail;
                    console.log('썸네일 자동 추출:', finalThumbnailUrl);
                }
            }

            if (post) {
                // 수정
                const updateData: UpdatePostInput = {
                    title,
                    content,
                    category,
                    slug: slug.trim() || post.slug, // 슬러그 업데이트 유연하게
                    thumbnail_url: finalThumbnailUrl,
                    tags,
                    is_published: isPublished,
                    published_at: new Date(publishedAt).toISOString(), // 예약 날짜 추가
                    content_type: editorMode === 'basic' ? 'html' : editorMode // basic은 html로 저장
                };
                const { error } = await postService.updatePost(post.id, updateData);
                if (error) throw error;
            } else {
                // 생성
                // 사용자가 입력한 슬러그가 없으면 자동 생성
                const finalSlug = slug.trim() || (title.toLowerCase().trim().replace(/[^a-z0-9\u3131-\uD79D]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6));

                const createData: CreatePostInput = {
                    title,
                    content,
                    category,
                    thumbnail_url: finalThumbnailUrl,
                    tags,
                    author_id: authorId,
                    slug: finalSlug,
                    is_published: isPublished,
                    published_at: new Date(publishedAt).toISOString(), // 예약 날짜 추가
                    content_type: editorMode === 'basic' ? 'html' : editorMode
                };
                const { error } = await postService.createPost(createData);
                if (error) throw error;
            }
            onSave(); // 목록 새로고침 및 닫기
        } catch (error: any) {
            console.error('저장 실패:', error);
            alert(`저장에 실패했습니다: ${error.message || JSON.stringify(error)}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-[95%] h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
                    <h2 className="text-xl font-bold text-gray-800">
                        {post ? '글 수정' : '새 글 작성'}
                    </h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={submitting}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition font-medium shadow-sm disabled:opacity-50"
                        >
                            {submitting ? '저장 중...' : (
                                <>
                                    <Save size={18} />
                                    발행
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* 에디터 영역: 가로 배열(flex-row)로 변경하여 설정창을 우측으로 보냄 */}
                <div className="flex-1 flex flex-row overflow-hidden bg-gray-50">
                    {/* 메인 입력창 영역: 왼쪽, 남은 공간 모두 차지 */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                        <div className="w-full space-y-8">
                            <input
                                type="text"
                                placeholder="제목을 입력하세요"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-3xl font-bold bg-transparent border-b border-gray-300 focus:border-indigo-600 px-2 py-4 focus:outline-none placeholder-gray-400 transition-colors"
                            />

                            {/* 태그 입력 */}
                            <div className="flex flex-wrap items-center gap-2 px-2">
                                <Tag size={18} className="text-gray-400" />
                                {tags.map(tag => (
                                    <span key={tag} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-sm flex items-center gap-1">
                                        {tag}
                                        <button onClick={() => removeTag(tag)} className="hover:text-indigo-900"><X size={12} /></button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder="태그 입력 (Enter)"
                                    className="bg-transparent focus:outline-none text-sm min-w-[100px]"
                                />
                            </div>

                            {/* 에디터 모드 선택 탭 */}
                            <div className="flex gap-1 border-b border-gray-200 mb-0">
                                <button
                                    onClick={() => setEditorMode('basic')}
                                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${editorMode === 'basic' ? 'bg-white border text-indigo-600 border-b-white translate-y-[1px]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                >
                                    기본 (Basic)
                                </button>
                                <button
                                    onClick={() => setEditorMode('markdown')}
                                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${editorMode === 'markdown' ? 'bg-white border text-indigo-600 border-b-white translate-y-[1px]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                >
                                    마크다운 (Markdown)
                                </button>
                                <button
                                    onClick={() => setEditorMode('html')}
                                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${editorMode === 'html' ? 'bg-white border text-indigo-600 border-b-white translate-y-[1px]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                >
                                    HTML
                                </button>
                            </div>

                            {/* 에디터 본체 */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[600px] flex flex-col focus-within:ring-2 focus-within:ring-indigo-100 transition-shadow">
                                {/* 툴바 (모드별 다름) - Sticky at the top */}
                                <div className="sticky top-0 z-[100] bg-gray-50 border-b rounded-t-xl">
                                    {editorMode === 'markdown' && (
                                        <div className="px-4 py-3 flex gap-2 text-gray-600 items-center flex-wrap">
                                            <button onClick={() => insertText('### ')} className="p-2 hover:bg-gray-200 rounded transition-colors" title="제목"><Heading size={18} /></button>
                                            <div className="w-px h-4 bg-gray-300 mx-2"></div>
                                            <button onClick={() => insertText('**', '**')} className="p-2 hover:bg-gray-200 rounded transition-colors" title="굵게"><Bold size={18} /></button>
                                            <button onClick={() => insertText('*', '*')} className="p-2 hover:bg-gray-200 rounded transition-colors" title="기울임"><Italic size={18} /></button>
                                            <div className="w-px h-4 bg-gray-300 mx-2"></div>
                                            <button onClick={() => insertText('> ')} className="p-2 hover:bg-gray-200 rounded transition-colors" title="인용구"><Quote size={18} /></button>
                                            <button onClick={() => insertText('```\n', '\n```')} className="p-2 hover:bg-gray-200 rounded transition-colors" title="코드 블록"><Code size={18} /></button>
                                            <button onClick={() => insertText('- ')} className="p-2 hover:bg-gray-200 rounded transition-colors" title="리스트"><List size={18} /></button>
                                            <div className="w-px h-4 bg-gray-300 mx-2"></div>
                                            <button onClick={() => insertText('[', '](url)')} className="p-2 hover:bg-gray-200 rounded transition-colors" title="링크"><Link size={18} /></button>
                                            <button onClick={() => insertText('![alt](', ')')} className="p-2 hover:bg-gray-200 rounded transition-colors" title="이미지 URL"><ImageIcon size={18} /></button>
                                            <button
                                                onClick={handleImageButtonClick}
                                                disabled={isUploading}
                                                className="p-2 hover:bg-indigo-100 bg-indigo-50 text-indigo-600 rounded transition-colors"
                                                title="이미지 업로드"
                                            >
                                                <Upload size={18} />
                                            </button>
                                            <div className="w-px h-4 bg-gray-300 mx-2"></div>
                                            <button onClick={() => insertText('<div class="highlight-box">\n', '\n</div>')} className="p-2 hover:bg-blue-100 text-blue-600 rounded transition-colors" title="강조 박스"><Info size={18} /></button>
                                            <button onClick={() => insertText('<div class="tip-box">\n', '\n</div>')} className="p-2 hover:bg-amber-100 text-amber-600 rounded transition-colors" title="팁 박스"><Lightbulb size={18} /></button>
                                            {uploadProgress && (
                                                <span className="text-xs text-indigo-600 ml-2">{uploadProgress}</span>
                                            )}
                                        </div>
                                    )}

                                    {editorMode === 'html' && (
                                        <div className="px-4 py-3 flex gap-2 text-gray-600 items-center flex-wrap">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">HTML Editor</span>
                                        </div>
                                    )}

                                    {editorMode === 'basic' && (
                                        <div className="px-4 py-3 flex gap-2 text-gray-600 items-center flex-wrap relative">
                                            <div className="relative">
                                                <button
                                                    onClick={() => {
                                                        setShowHeadingMenu(!showHeadingMenu);
                                                        setShowDividerMenu(false);
                                                    }}
                                                    className="p-2 hover:bg-gray-200 rounded transition-colors flex items-center gap-1"
                                                    title="제목"
                                                >
                                                    <Heading size={18} />
                                                    <ChevronDown size={12} />
                                                </button>
                                                {showHeadingMenu && (
                                                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-gray-200 py-2 z-[1000] min-w-[200px]">
                                                        <button onClick={() => { execCommand('formatBlock', 'H1'); setShowHeadingMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 font-bold text-xl border-b border-gray-50">제목 1 (H1)</button>
                                                        <button onClick={() => { execCommand('formatBlock', 'H2'); setShowHeadingMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 font-bold text-lg border-b border-gray-50">제목 2 (H2)</button>
                                                        <button onClick={() => { execCommand('formatBlock', 'H3'); setShowHeadingMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 font-semibold text-base border-b border-gray-50">제목 3 (H3)</button>
                                                        <button onClick={() => { execCommand('formatBlock', 'H4'); setShowHeadingMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 font-medium text-sm border-b border-gray-50">제목 4 (H4)</button>
                                                        <button onClick={() => { execCommand('formatBlock', 'H5'); setShowHeadingMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 font-medium text-xs border-b border-gray-50">제목 5 (H5)</button>
                                                        <button onClick={() => { execCommand('formatBlock', 'P'); setShowHeadingMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-gray-600">본문 (P)</button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                            <button onClick={() => execCommand('bold')} className="p-2 hover:bg-gray-200 rounded transition-colors" title="굵게 (Ctrl+B)"><Bold size={18} /></button>
                                            <button onClick={() => execCommand('italic')} className="p-2 hover:bg-gray-200 rounded transition-colors" title="기울임 (Ctrl+I)"><Italic size={18} /></button>
                                            <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                            <button
                                                onClick={() => {
                                                    const selection = window.getSelection();
                                                    const selectedText = selection?.toString() || '인용문을 입력하세요';
                                                    document.execCommand('insertHTML', false, `<blockquote style="border-left: 4px solid #6366f1; padding-left: 16px; margin: 16px 0; color: #4b5563; font-style: italic;">${selectedText}</blockquote><p><br></p>`);
                                                    if (contentEditableRef.current) setContent(contentEditableRef.current.innerHTML);
                                                }}
                                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                                title="인용구"
                                            >
                                                <Quote size={18} />
                                            </button>

                                            <div className="relative">
                                                <button
                                                    onClick={() => {
                                                        setShowDividerMenu(!showDividerMenu);
                                                        setShowHeadingMenu(false);
                                                    }}
                                                    className="p-2 hover:bg-gray-200 rounded transition-colors flex items-center gap-1"
                                                    title="구분선"
                                                >
                                                    <Minus size={18} />
                                                    <ChevronDown size={12} />
                                                </button>
                                                {showDividerMenu && (
                                                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-gray-200 py-2 z-[1000] min-w-[240px]">
                                                        <button onClick={() => {
                                                            document.execCommand('insertHTML', false, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" /><p><br></p>');
                                                            if (contentEditableRef.current) setContent(contentEditableRef.current.innerHTML);
                                                            setShowDividerMenu(false);
                                                        }} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3">
                                                            <div className="w-24 border-t border-gray-300"></div>
                                                            <span className="text-xs text-gray-500">가는 실선</span>
                                                        </button>
                                                        <button onClick={() => {
                                                            document.execCommand('insertHTML', false, '<hr style="border: none; border-top: 2px solid #9ca3af; margin: 24px 0;" /><p><br></p>');
                                                            if (contentEditableRef.current) setContent(contentEditableRef.current.innerHTML);
                                                            setShowDividerMenu(false);
                                                        }} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3">
                                                            <div className="w-24 border-t-2 border-gray-400"></div>
                                                            <span className="text-xs text-gray-500">굵은 실선</span>
                                                        </button>
                                                        <button onClick={() => {
                                                            document.execCommand('insertHTML', false, '<hr style="border: none; border-top: 1px dashed #9ca3af; margin: 24px 0;" /><p><br></p>');
                                                            if (contentEditableRef.current) setContent(contentEditableRef.current.innerHTML);
                                                            setShowDividerMenu(false);
                                                        }} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3">
                                                            <div className="w-24 border-t border-dashed border-gray-400"></div>
                                                            <span className="text-xs text-gray-500">점선</span>
                                                        </button>
                                                        <button onClick={() => {
                                                            document.execCommand('insertHTML', false, '<hr style="border: none; border-top: 2px dotted #6366f1; margin: 24px 0;" /><p><br></p>');
                                                            if (contentEditableRef.current) setContent(contentEditableRef.current.innerHTML);
                                                            setShowDividerMenu(false);
                                                        }} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3">
                                                            <div className="w-24 border-t-2 border-dotted border-indigo-500"></div>
                                                            <span className="text-xs text-gray-500">장식 점선</span>
                                                        </button>
                                                        <button onClick={() => {
                                                            document.execCommand('insertHTML', false, '<div style="text-align: center; margin: 24px 0; color: #9ca3af;">• • •</div><p><br></p>');
                                                            if (contentEditableRef.current) setContent(contentEditableRef.current.innerHTML);
                                                            setShowDividerMenu(false);
                                                        }} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3">
                                                            <div className="w-24 text-center text-gray-400">• • •</div>
                                                            <span className="text-xs text-gray-500">점 구분선</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                            <button onClick={() => {
                                                const url = prompt('링크 URL을 입력하세요:');
                                                if (url) execCommand('createLink', url);
                                            }} className="p-2 hover:bg-gray-200 rounded transition-colors" title="링크"><Link size={18} /></button>
                                            <button
                                                onClick={handleImageButtonClick}
                                                disabled={isUploading}
                                                className="p-2 hover:bg-indigo-100 bg-indigo-50 text-indigo-600 rounded transition-colors"
                                                title="이미지 업로드"
                                            >
                                                <Upload size={18} />
                                            </button>
                                            <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                            <button
                                                onClick={() => {
                                                    document.execCommand('insertHTML', false, '<div class="highlight-box"><p>강조할 내용을 입력하세요</p></div><p><br></p>');
                                                    if (contentEditableRef.current) setContent(contentEditableRef.current.innerHTML);
                                                }}
                                                className="p-2 hover:bg-blue-100 text-blue-600 rounded transition-colors flex items-center gap-1"
                                                title="강조 박스"
                                            >
                                                <Info size={16} />
                                                <span className="text-xs font-bold">강조</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    document.execCommand('insertHTML', false, '<div class="tip-box"><p>팁 내용을 입력하세요</p></div><p><br></p>');
                                                    if (contentEditableRef.current) setContent(contentEditableRef.current.innerHTML);
                                                }}
                                                className="p-2 hover:bg-amber-100 text-amber-600 rounded transition-colors flex items-center gap-1"
                                                title="팁 박스"
                                            >
                                                <Lightbulb size={16} />
                                                <span className="text-xs font-bold">팁</span>
                                            </button>
                                            {uploadProgress && (
                                                <span className="text-xs text-indigo-600 ml-2">{uploadProgress}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 입력 영역 - 드래그앤드롭 지원 */}
                                <div
                                    className="relative flex-1 flex flex-col"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    {/* 드래그 오버레이 */}
                                    {isDragging && (
                                        <div className="absolute inset-0 bg-indigo-50/90 border-2 border-dashed border-indigo-400 rounded flex items-center justify-center z-10">
                                            <div className="text-center">
                                                <Upload size={48} className="mx-auto text-indigo-500 mb-2" />
                                                <p className="text-indigo-700 font-medium">이미지를 여기에 놓으세요</p>
                                                <p className="text-indigo-500 text-sm">WebP로 자동 변환됩니다</p>
                                            </div>
                                        </div>
                                    )}

                                    {editorMode === 'basic' ? (
                                        <div
                                            ref={contentEditableRef}
                                            contentEditable
                                            onCompositionStart={() => {
                                                isComposing.current = true;
                                            }}
                                            onCompositionEnd={(e) => {
                                                isComposing.current = false;
                                                const html = e.currentTarget.innerHTML;
                                                lastSyncedContent.current = html;
                                                setContent(html);
                                            }}
                                            onInput={(e) => {
                                                const html = e.currentTarget.innerHTML;
                                                lastSyncedContent.current = html;
                                                // 조합 중이 아닐 때만 React 상태 업데이트 (부하 감소 및 안정성)
                                                if (!isComposing.current) {
                                                    setContent(html);
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const html = e.currentTarget.innerHTML;
                                                lastSyncedContent.current = html;
                                                setContent(html);
                                            }}
                                            className="w-full p-8 md:p-10 text-lg leading-relaxed focus:outline-none font-sans min-h-[600px] [word-break:keep-all]"
                                            suppressContentEditableWarning={true}
                                        />
                                    ) : (
                                        <textarea
                                            ref={textareaRef}
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            className={`w-full h-full p-8 md:p-10 text-lg leading-relaxed focus:outline-none resize-none min-h-[600px] ${editorMode === 'html' ? 'font-mono text-sm bg-gray-50/50' : 'font-sans'}`}
                                            placeholder={editorMode === 'html' ? 'HTML 코드를 입력하세요...' : '본문을 작성하세요...'}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 사이드바 (설정): 우측에 고정된 너비로 배치 */}
                    <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto custom-scrollbar flex-shrink-0">
                        <h3 className="font-semibold text-gray-800 mb-4">글 설정</h3>

                        <div className="space-y-6">
                            {/* 공개 여부 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">공개 설정</label>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setIsPublished(true)}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${isPublished ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Globe size={16} /> 공개
                                    </button>
                                    <button
                                        onClick={() => setIsPublished(false)}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${!isPublished ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Lock size={16} /> 비공개
                                    </button>
                                </div>
                            </div>

                            {/* 발행 일시 (예약 발행) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">발행 일시</label>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Calendar size={14} />
                                        </div>
                                        <input
                                            type="datetime-local"
                                            value={publishedAt}
                                            onChange={(e) => setPublishedAt(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        />
                                    </div>
                                    {new Date(publishedAt) > new Date() && (
                                        <p className="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
                                            <Clock size={12} /> 예약 발행 예정입니다.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* 카테고리 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">카테고리 선택</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 슬러그 설정 추가 */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">URL 슬러그 (경로)</label>
                                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">SEO</span>
                                </div>
                                <div className="text-xs text-gray-500 mb-2 bg-gray-50 p-2 rounded border border-gray-100">
                                    고정 페이지(이용약관 등)는 <code className="bg-gray-200 px-1 rounded">usage</code>, <code className="bg-gray-200 px-1 rounded">privacy</code> 등으로 입력하세요.
                                </div>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[\s]/g, '-'))}
                                    placeholder="예: usage (비워두면 자동 생성)"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                                />
                                {slug && <p className="text-[10px] text-gray-400 mt-1">최종 주소: /post/{slug}</p>}
                            </div>

                            {/* 썸네일 설정 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">썸네일</label>
                                <div className="text-xs text-gray-500 mb-2 bg-blue-50 p-2 rounded border border-blue-100">
                                    💡 <strong>자동 추출</strong>: 본문에 이미지가 있으면 첫 번째 이미지가 썸네일로 사용됩니다.
                                    <br />
                                    특정 이미지를 썸네일로 지정하려면 이미지의 <code className="bg-blue-100 px-1 rounded">alt</code>를 <code className="bg-blue-100 px-1 rounded">thumbnail</code>로 설정하세요.
                                </div>
                                <input
                                    type="text"
                                    value={thumbnailUrl}
                                    onChange={(e) => setThumbnailUrl(e.target.value)}
                                    placeholder="비워두면 본문에서 자동 추출"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                                {thumbnailUrl && (
                                    <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 aspect-video">
                                        <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 숨겨진 파일 input (이미지 업로드용) */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                />
            </div>
        </div >
    );
};

export default PostEditor;
