import React from 'react';
import { Helmet } from 'react-helmet-async';
import { blogConfig } from '../../config/blog.config';

interface SEOProps {
    title?: string;
    siteTitleOverride?: string;
    description?: string;
    image?: string;
    url?: string;
}

const SEO: React.FC<SEOProps> = ({
    title,
    siteTitleOverride,
    description = blogConfig.description,
    image,
    url
}) => {
    const siteTitle = siteTitleOverride || blogConfig.title;
    const finalTitle = !title || title === siteTitle ? siteTitle : `${title} | ${siteTitle}`;
    const currentUrl = url || window.location.href;

    // GA4 & Naver Analytics IDs (Env or Config)
    const gaId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
    const naverId = import.meta.env.VITE_NAVER_ANALYTICS_ID;

    return (
        <Helmet>
            {/* 기본 메타 태그 */}
            <title>{finalTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:site_name" content={siteTitle} />
            {image && <meta property="og:image" content={image} />}

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={currentUrl} />
            <meta property="twitter:title" content={finalTitle} />
            <meta property="twitter:description" content={description} />
            {image && <meta property="twitter:image" content={image} />}

            {/* Google Search Console Verification */}
            {import.meta.env.VITE_GOOGLE_SITE_VERIFICATION && (
                <meta name="google-site-verification" content={import.meta.env.VITE_GOOGLE_SITE_VERIFICATION} />
            )}

            {/* Google Analytics 4 */}
            {gaId && (
                <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            )}
            {gaId && (
                <script>
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${gaId}');
                    `}
                </script>
            )}

            {/* Naver Analytics */}
            {naverId && (
                <script type="text/javascript" src="//wcs.naver.net/wcslog.js"></script>
            )}
            {naverId && (
                <script>
                    {`
                        if(!wcs_add) var wcs_add = {};
                        wcs_add["wa"] = "${naverId}";
                        if(window.wcs) {
                            wcs_do();
                        }
                    `}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
