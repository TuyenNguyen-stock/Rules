import React, { useRef } from 'react';

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelect: (avatar: string) => void;
}

const AVATARS = ['😎', '🤖', '🐱', '🐶', '🦊', '🐯', '🐼', '🐵', '👻', '👽', '💩', '🦄'];

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({ selectedAvatar, onSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Allow GIF up to 2.5MB to preserve animation.
    // PeerJS can handle larger payloads if sent ONCE, not in the handshake loop.
    if (file.type === 'image/gif') {
        if (file.size <= 2.5 * 1024 * 1024) { // 2.5MB limit
            const reader = new FileReader();
            reader.onload = (event) => {
                 onSelect(event.target?.result as string);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
            return;
        } else {
            alert("File GIF quá lớn (>2.5MB). Vui lòng chọn file nhỏ hơn.");
            // Fallthrough to compression if user insists? Or just return.
            // Let's try to compress it to a static image as fallback so it doesn't crash.
        }
    }

    // 2. For other images (JPG/PNG) or huge GIFs, resize/compress via Canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_SIZE = 128; // Keep dimensions small
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress heavily
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            onSelect(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isImage = (avatar: string) => avatar && avatar.startsWith('data:image');

  return (
    <div className="flex flex-col items-center gap-3">
       {/* Preview Large */}
       <div 
         className="relative w-24 h-24 rounded-full border-4 border-slate-700 bg-slate-800 flex items-center justify-center overflow-hidden cursor-pointer group shadow-xl hover:border-blue-500 transition-colors"
         onClick={() => fileInputRef.current?.click()}
       >
          {isImage(selectedAvatar) ? (
              <img src={selectedAvatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
              <span className="text-5xl">{selectedAvatar}</span>
          )}
          
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-2xl">📷</span>
              <span className="text-xs font-bold text-white">Đổi ảnh</span>
          </div>
       </div>
       <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImageUpload} />

       {/* Preset List */}
      <div className="flex flex-wrap gap-2 justify-center bg-slate-800 p-2 rounded-lg border border-slate-700 max-w-[280px]">
        {AVATARS.map((avatar) => (
          <button
            key={avatar}
            onClick={() => onSelect(avatar)}
            className={`w-9 h-9 text-lg flex items-center justify-center rounded transition-transform hover:scale-110 ${
              selectedAvatar === avatar ? 'bg-blue-600 ring-2 ring-blue-400 scale-110' : 'hover:bg-slate-700'
            }`}
          >
            {avatar}
          </button>
        ))}
        <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 text-lg flex items-center justify-center rounded hover:bg-slate-700 border border-slate-600 text-slate-400 hover:text-white"
            title="Tải ảnh lên"
        >
            +
        </button>
      </div>
    </div>
  );
};