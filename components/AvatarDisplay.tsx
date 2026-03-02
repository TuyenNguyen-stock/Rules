import React from 'react';

interface AvatarDisplayProps {
  avatar: string;
  size?: string; // Expect styling classes like "w-16 h-16"
  fontSize?: string; // Expect styling classes like "text-4xl"
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ avatar, size = "w-16 h-16", fontSize = "text-4xl" }) => {
  const isImg = avatar && avatar.startsWith('data:image');

  return (
    <div className={`${size} rounded-full border-2 border-slate-600 bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-md`}>
      {isImg ? (
        <img 
            src={avatar} 
            alt="avt" 
            className="w-full h-full object-cover" 
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerText = '👤';
                    e.currentTarget.parentElement.classList.add('text-2xl');
                }
            }}
        />
      ) : (
        <span className={fontSize} role="img" aria-label="avatar">{avatar || '👤'}</span>
      )}
    </div>
  );
};