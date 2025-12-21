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

    const adClient = import.meta.env.VITE_GOOGLE_ADSENSE_ID;

    if (!adClient) {
        return (
            <div className={`ad-placeholder bg-gray-50 border border-dashed border-gray-200 rounded-lg flex items-center justify-center ${className}`} style={style}>
                <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">Advertisement</span>
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
