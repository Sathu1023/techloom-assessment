const ICONS = {
  Fiction: '📖',
  'Non-Fiction': '📘',
  Technology: '💻',
  "Children's": '🧸',
  'Self-Development': '🌱',
  Business: '📊',
};

/**
 * Renders a real product photo when `imageUrl` is provided; falls back to a
 * soft gradient + category icon placeholder if the image is missing or fails
 * to load, so the UI never shows a broken-image icon.
 */
export default function BookCover({ imageUrl, category, alt, size = 'normal', className = '' }) {
  const icon = ICONS[category] || '📚';
  const sizeClass = size === 'mini' ? 'mini' : size === 'large' ? 'pd-cover' : '';

  if (imageUrl) {
    return (
      <div className={`book-cover has-image ${sizeClass} ${className}`}>
        <img
          src={imageUrl}
          alt={alt || category || 'Product'}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement.classList.add('img-fallback');
            e.currentTarget.parentElement.textContent = icon;
          }}
        />
      </div>
    );
  }

  return <div className={`book-cover ${sizeClass} ${className}`}>{icon}</div>;
}
