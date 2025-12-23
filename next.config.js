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
        root: '.',
    },
};

export default nextConfig;
