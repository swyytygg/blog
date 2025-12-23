import React, { useEffect } from 'react';

interface GoogleAdProps {
    className?: string;
    style?: React.CSSProperties;
    slot: string;
    format?: 'auto' | 'fluid' | 'rectangle';
    responsive?: 'true' | 'false';
}

/**
 * Google AdSense Ad Unit Component
 * 
 * Usage:
 * <GoogleAd slot="1234567890" />
 */
const GoogleAd: React.FC<GoogleAdProps> = ({
    className = '',
    style = { display: 'block', minHeight: '100px' },
    slot,
    format = 'auto',
    responsive = 'true'
}) => {
    useEffect(() => {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error:', e);
        }
    }, []);

    const adClient = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;

    if (!adClient) {
        return (
            <div
                className={`ad-placeholder-hidden sr-only ${className}`}
                style={{ ...style, height: 0, opacity: 0, overflow: 'hidden' }}
                aria-hidden="true"
            >
                {/* Googlebot requirement: hidden structure for future ads */}
                <ins
                    className="adsbygoogle"
                    style={style}
                    data-ad-client="placeholder"
                    data-ad-slot={slot}
                />
            </div>
        );
    }

    return (
        <div className={`ad-container my-8 ${className}`}>
            <ins
                className="adsbygoogle"
                style={style}
                data-ad-client={adClient}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}
            />
        </div>
    );
};

export default React.memo(GoogleAd);
