/**
 * Template Method pattern (presentation layer): fixed skeleton for profile cards.
 *
 * The invariant structure is: photo region → name/age → meta rows → action slot.
 * Concrete callers supply the variable parts via props/render callbacks.
 * (Open/Closed: extend via props/render slots, never by copying card markup.)
 *
 * SOLID:
 *   SRP  — this component only renders the card skeleton.
 *   OCP  — new card variants add props, never modify this template.
 *   LSP  — any data object conforming to the adapter's UnifiedProfile works.
 */

import React from 'react';
import './ProfileCardTemplate.css';

const DEFAULT_COLORS = [
    'linear-gradient(135deg,#E57373,#EF5350)',
    'linear-gradient(135deg,#64B5F6,#42A5F5)',
    'linear-gradient(135deg,#81C784,#66BB6A)',
    'linear-gradient(135deg,#BA68C8,#AB47BC)',
    'linear-gradient(135deg,#FFB74D,#FFA726)',
    'linear-gradient(135deg,#4DD0E1,#26C6DA)',
];

/**
 * @param {object}   props
 * @param {object}   props.profile       - Adapted profile object
 * @param {number}   props.index         - Position in the list (for colour)
 * @param {string}   [props.className]   - Extra CSS class on the card root
 * @param {object}   [props.style]       - Extra inline styles
 * @param {Function} [props.renderBadge] - Render callback for score badge overlay
 * @param {Function} [props.renderMeta]  - Render callback for meta rows (below name)
 * @param {Function} [props.renderActions] - Render callback for action buttons
 * @param {Function} [props.onFavorite]  - Heart button handler
 * @param {boolean}  [props.isFavorite]  - Whether currently favorited
 */
export const ProfileCardTemplate = ({
    profile,
    index = 0,
    className = '',
    style = {},
    renderBadge,
    renderMeta,
    renderActions,
    onFavorite,
    isFavorite = false,
}) => {
    const bg = profile.profileImage ? undefined : DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    const initial = (profile.displayName || 'U')[0].toUpperCase();

    return (
        <div className={`pct-card ${className}`} style={{ animationDelay: `${index * 0.06}s`, ...style }}>
            {/* ── Photo region (invariant) ── */}
            <div className="pct-photo" style={{ background: bg }}>
                {profile.profileImage ? (
                    <img className="pct-photo-img" src={profile.profileImage} alt="" />
                ) : (
                    <span className="pct-initial">{initial}</span>
                )}
                {renderBadge && renderBadge(profile)}
                {onFavorite && (
                    <button
                        className="pct-heart"
                        onClick={(e) => { e.stopPropagation(); onFavorite(profile.id); }}
                        style={{ color: isFavorite ? '#E57373' : 'inherit' }}
                    >
                        {isFavorite ? '♥' : '♡'}
                    </button>
                )}
            </div>

            {/* ── Body region (invariant skeleton + variable slots) ── */}
            <div className="pct-body">
                <h4 className="pct-name">
                    {profile.displayName}{profile.age ? `, ${profile.age}` : ''}
                </h4>
                {renderMeta && renderMeta(profile)}
                {renderActions && renderActions(profile)}
            </div>
        </div>
    );
};
