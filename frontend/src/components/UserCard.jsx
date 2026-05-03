import { getFirstProfileImageSrc } from '../utils/profileImageSrc';
import './UserCard.css';

/**
 * Feed/search match tile photo area: uses stored data URL / URL / base64 via resolver, else gradient + initial.
 */
export function UserCardPhoto({ profile, gradient, children, className = '', tall }) {
    const src = getFirstProfileImageSrc(profile?.images);
    const initial = (profile?.fullName || profile?.username || 'U').slice(0, 1).toUpperCase();

    return (
        <div
            className={`uc-photo ${tall ? 'uc-photo--tall' : ''} ${src ? 'uc-photo--has-img' : ''} ${className}`.trim()}
            style={{ background: src ? 'linear-gradient(180deg,#2d2a2e,#1a1819)' : gradient }}
        >
            {src ? <img src={src} alt="" className="uc-photo-img" loading="lazy" decoding="async" /> : null}
            {!src ? <span className="uc-photo-initial">{initial}</span> : null}
            {children}
        </div>
    );
}
