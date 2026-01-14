# Rigas62 Home Documentation System

A self-contained, offline-capable home documentation web application designed for Home Assistant.

## Features

- **Room Directory**: Grid/list view of all rooms with photos, videos, and equipment lists
- **Global Search**: Search by room name, description, equipment, or hashtags
- **Video Management**: Organized videos with hashtag-based filtering
- **Dark/Light Mode**: Toggle between themes with preference saved
- **Offline Support**: Service worker caches assets for offline viewing
- **Mobile Responsive**: Works on all device sizes
- **No External Dependencies**: Runs entirely locally

## Folder Structure

```
/config/www/rigas62/
├── index.html          # Main application
├── styles.css          # All styling
├── app.js              # Application logic
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
    └── videos/         # Room videos (mp4)
```

## Home Assistant Integration

### Option 1: Direct www Folder Access (Simplest)

1. Copy the `rigas62` folder to your Home Assistant's `/config/www/` directory
2. Access at: `http://your-ha-ip:8123/local/rigas62/index.html`

### Option 2: Panel Iframe (Sidebar Integration)

Add to your `configuration.yaml`:

```yaml
panel_iframe:
  rigas62:
    title: "Home Docs"
    icon: mdi:home-search
    url: "/local/rigas62/index.html"
```

Restart Home Assistant, and "Home Docs" will appear in your sidebar.

### Option 3: Lovelace Card

Add a webpage card to any dashboard:

```yaml
type: iframe
url: /local/rigas62/index.html
aspect_ratio: 16:9
```

### Option 4: Custom Domain (rigas62.lv)

If you want to access via `rigas62.lv`:

#### Using Nginx Proxy Manager:

1. Create a new proxy host:
   - Domain: `rigas62.lv`
   - Scheme: `http`
   - Forward Hostname: `your-ha-internal-ip`
   - Forward Port: `8123`
   - Custom Location: `/` → `/local/rigas62/`

2. Add SSL certificate (Let's Encrypt)

#### Using Home Assistant Nginx Add-on:

```nginx
server {
    listen 80;
    server_name rigas62.lv;

    location / {
        proxy_pass http://homeassistant:8123/local/rigas62/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### DNS Configuration:

Point `rigas62.lv` to your Home Assistant server's IP address in your local DNS (Pi-hole, router, or hosts file).

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
          "hashtags": ["#plumbing", "#repair", "#diy"]
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
2. Reference by filename in `data.json`
3. Recommended format: MP4 (H.264)
4. Add relevant hashtags for filtering

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
