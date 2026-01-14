# Rigas62 Home Documentation System

A self-contained, offline-capable home documentation web application hosted on GitHub Pages.

## Live Site

**https://krishels.github.io/Rigas62/**

## Features

- **Room Directory**: Grid/list view of all rooms with photos, videos, and equipment lists
- **Global Search**: Search by room name, description, equipment, or hashtags
- **Video Management**: Organized videos with hashtag-based filtering
- **Dark/Light Mode**: Toggle between themes with preference saved
- **Offline Support**: Service worker caches assets for offline viewing
- **Mobile Responsive**: Works on all device sizes
- **Login Protection**: Simple authentication to protect content
- **No External Dependencies**: Runs entirely on static hosting

## Folder Structure

```
/config/www/rigas62/
├── index.html          # Main application
├── login.html          # Login page
├── styles.css          # All styling
├── app.js              # Application logic
├── auth.js             # Authentication module
├── data.json           # Your content database
├── sw.js               # Service worker for offline
├── manifest.json       # PWA manifest
├── README.md           # This file
├── icons/
│   ├── home.svg
│   ├── icon-192.svg
│   └── icon-512.svg
└── media/
    ├── photos/         # Room photos (jpg, png, webp)
    ├── thumbnails/     # Video thumbnails
    └── videos/         # Room videos (mp4)
```

## Deployment

This project uses GitHub Actions to deploy to GitHub Pages automatically.

### Setup

1. Push code to the `main` branch
2. Add repository secrets in GitHub Settings → Secrets → Actions:
   - `AUTH_USER`: Login username
   - `AUTH_PASS`: Login password
3. Enable GitHub Pages with "GitHub Actions" as source
4. Access at: `https://krishels.github.io/Rigas62/`

## Adding Your Content

### Edit data.json

The `data.json` file contains all your home documentation. Structure:

```json
{
  "rooms": [
    {
      "id": "unique-room-id",
      "name": "Display Name",
      "floor": 1,
      "description": "Room description text...",
      "photos": ["photo1.jpg", "photo2.jpg"],
      "videos": [
        {
          "file": "video-filename.mp4",
          "title": "Video Title",
          "description": "What this video shows",
          "hashtags": ["#plumbing", "#repair", "#diy"],
          "thumbnail": "thumbnail.jpg"
        }
      ],
      "equipment": ["Item 1", "Item 2"]
    }
  ]
}
```

### Adding Photos

1. Place photos in `media/photos/`
2. Reference by filename in `data.json`
3. Supported formats: JPG, PNG, WebP, GIF

### Adding Videos

1. Place videos in `media/videos/`
2. Add thumbnail to `media/thumbnails/`
3. Reference by filename in `data.json`
4. Recommended format: MP4 (H.264)
5. Add relevant hashtags for filtering

### Hashtag System

Hashtags enable filtering and searching. Suggested categories:

- **Systems**: `#plumbing`, `#electrical`, `#hvac`, `#networking`
- **Actions**: `#repair`, `#maintenance`, `#installation`, `#diy`
- **Rooms**: `#kitchen`, `#bathroom`, `#garage`, `#outdoor`
- **Topics**: `#safety`, `#emergency`, `#seasonal`, `#reference`

## Customization

### Change Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --accent: #6366f1;        /* Primary accent color */
    --bg-primary: #0f0f1a;    /* Main background */
    --text-primary: #ffffff;   /* Main text color */
}
```

### Change Logo

Replace the SVG in `index.html` header or update `icons/` folder.

## Troubleshooting

### Videos not playing

- Ensure MP4 uses H.264 codec
- Check file permissions
- Verify path in `data.json` matches actual filename

### Page not loading

- Clear browser cache
- Check browser console for errors
- Verify `data.json` is valid JSON (use jsonlint.com)

### Offline mode not working

- Service worker requires HTTPS or localhost
- Check browser supports service workers
- Clear site data and reload

### Search not finding items

- Search is case-insensitive
- Searches: room names, descriptions, equipment, video titles, hashtags
- Minimum 2 characters to show suggestions

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Private use - Rigas62 Home Documentation
