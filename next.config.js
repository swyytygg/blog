/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'hbgjqureivofpxonvuyg.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'pixabay.com',
            },
        ],
    },
    turbopack: {
        root: 'C:\\Users\\아마존소프트\\Desktop\\blog_final_clean',
    },
};

export default nextConfig;
