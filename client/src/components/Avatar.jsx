import { useState } from 'react';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3B82F6, #2563EB)',
  'linear-gradient(135deg, #8B5CF6, #7C3AED)',
  'linear-gradient(135deg, #10B981, #059669)',
  'linear-gradient(135deg, #F59E0B, #D97706)',
];

const getAvatarGradient = (name = '') => {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
};

const Avatar = ({ name = '', avatarUrl = '', className = '', size = 'w-8 h-8' }) => {
  const [hasError, setHasError] = useState(false);
  const initials = name ? name[0].toUpperCase() : '?';
  const background = getAvatarGradient(name);

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white shrink-0 overflow-hidden ${size} ${className}`}
      style={{ background }}
    >
      {avatarUrl && !hasError ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
};

export default Avatar;
