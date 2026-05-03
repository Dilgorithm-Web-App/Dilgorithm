import { getProfilePhotoImgSrc } from '../utils/profileImageSrc';
import './UserCard.css';

/** Feed/search match tile photo area: always an <img> (stored photo or neutral placeholder). */
export function UserCardPhoto({ profile, children, className = '', tall }) {
    const src = getProfilePhotoImgSrc(profile?.images);

    return (
        <div className={`uc-photo ${tall ? 'uc-photo--tall' : ''} ${className}`.trim()}>
            <img src={src} alt="" className="uc-photo-img" loading="lazy" decoding="async" />
            {children}
        </div>
    );
}
