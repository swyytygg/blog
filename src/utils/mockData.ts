export interface BlogPost {
    id: string;
    title: string;
    subtitle?: string;
    excerpt: string;
    content?: string; // 상세 내용을 위한 필드 추가
    category: string;
    image: string;
    date: string;
    views: number;
    author?: string;
}

export const featuredPost: BlogPost = {
    id: 'featured',
    title: 'TRAVEL VLOG: GREECE',
    subtitle: 'Santorini & Mykonos. A journey through the blue and white paradise.',
    excerpt: 'Santorini & Mykonos. A journey through the blue and white paradise.',
    category: 'TRAVEL',
    image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1600&h=900&fit=crop',
    date: '2025-01-10',
    views: 1205,
    author: 'Editor',
    content: `
        <p>Greece is a country that has been on my bucket list for as long as I can remember. The history, the culture, the food, and of course, the stunning islands. I finally had the chance to visit this beautiful country and it did not disappoint.</p>
        <p>Santorini is famous for its breathtaking sunsets and white-washed buildings with blue domes. Walking through the streets of Oia felt like a dream.</p>
        <h2>Mykonos: The Island of Winds</h2>
        <p>After a few days in Santorini, we took a ferry to Mykonos. The vibe here is different - more energetic, with a vibrant nightlife and beautiful beaches.</p>
    `
};

export const posts: BlogPost[] = [
    {
        id: '1',
        title: 'Modern Architecture in Seoul',
        excerpt: 'Exploring the stunning contemporary buildings that define Seoul\'s skyline...',
        content: '<p>Seoul appears to be a city of contrasts...</p>',
        category: 'DESIGN',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
        date: '2025-01-09',
        views: 234
    },
    {
        id: '2',
        title: 'Essential SEO for React Apps',
        excerpt: 'A comprehensive guide to optimizing your React applications for search engines...',
        content: '<p>SEO is crucial for any website...</p>',
        category: 'TECH',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
        date: '2025-01-08',
        views: 567
    },
    {
        id: '3',
        title: 'Morning Routine for Productivity',
        excerpt: 'Start your day right with these simple habits that boost your efficiency...',
        content: '<p>How you start your day determines...</p>',
        category: 'LIFESTYLE',
        image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&h=400&fit=crop',
        date: '2025-01-07',
        views: 189
    },
    {
        id: '4',
        title: 'Minimalist Interior Design Trends',
        excerpt: 'Less is more: discovering the beauty of simplicity in home decoration...',
        content: '<p>Minimalism is not just about having less...</p>',
        category: 'DESIGN',
        image: 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=600&h=400&fit=crop',
        date: '2025-01-06',
        views: 421
    },
    {
        id: '5',
        title: 'Tokyo Street Photography Guide',
        excerpt: 'Capturing the essence of Tokyo through the lens of street photography...',
        content: '<p>Tokyo is a photographer\'s paradise...</p>',
        category: 'TRAVEL',
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop',
        date: '2025-01-05',
        views: 678
    },
    {
        id: '6',
        title: 'Building Scalable Web Apps',
        excerpt: 'Best practices for creating web applications that grow with your business...',
        content: '<p>Scalability must be considered from day one...</p>',
        category: 'TECH',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop',
        date: '2025-01-04',
        views: 345
    }
];

export const getPostById = (id: string): BlogPost | undefined => {
    if (id === 'featured') return featuredPost;
    return posts.find(post => post.id === id);
};
