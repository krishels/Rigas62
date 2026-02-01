/**
 * Rigas62 Mājas Dokumentācijas Sistēma
 * Main Application JavaScript
 */

(function() {
    'use strict';

    // ========================================
    // Application State
    // ========================================
    const state = {
        data: null,
        currentView: 'home',
        currentRoom: null,
        activeHashtag: 'all',
        searchQuery: '',
        viewMode: 'grid',
        theme: 'dark',
        allHashtags: new Set(),
        filteredRooms: []
    };

    // ========================================
    // DOM Elements
    // ========================================
    const elements = {
        globalSearch: document.getElementById('globalSearch'),
        searchSuggestions: document.getElementById('searchSuggestions'),
        hashtagFilters: document.getElementById('hashtagFilters'),
        floorNav: document.getElementById('floorNav'),
        roomsContainer: document.getElementById('roomsContainer'),
        roomDetail: document.getElementById('roomDetail'),
        breadcrumb: document.getElementById('breadcrumb'),
        videoModal: document.getElementById('videoModal'),
        videoPlayer: document.getElementById('videoPlayer'),
        videoTitle: document.getElementById('videoTitle'),
        videoDescription: document.getElementById('videoDescription'),
        videoHashtags: document.getElementById('videoHashtags'),
        closeModal: document.getElementById('closeModal'),
        themeToggle: document.getElementById('themeToggle'),
        noResults: document.getElementById('noResults'),
        offlineIndicator: document.getElementById('offlineIndicator'),
        recentVideosSection: document.getElementById('recentVideosSection'),
        recentVideosContainer: document.getElementById('recentVideosContainer')
    };

    // ========================================
    // Data Loading
    // ========================================
    async function loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Failed to load data');
            state.data = await response.json();
            extractHashtags();
            initializeApp();
        } catch (error) {
            console.error('Error loading data:', error);
            showError('Neizdevās ielādēt datus. Pārbaudiet, vai data.json eksistē.');
        }
    }

    function extractHashtags() {
        state.allHashtags.clear();

        // Add room names as tags (without #)
        state.data.rooms.forEach(room => {
            state.allHashtags.add(room.id);
        });

        // Add video hashtags (remove # prefix if present)
        state.data.rooms.forEach(room => {
            room.videos?.forEach(video => {
                video.hashtags?.forEach(tag => {
                    // Remove # prefix if present
                    const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
                    state.allHashtags.add(cleanTag.toLowerCase());
                });
            });
        });
    }

    // ========================================
    // Initialization
    // ========================================
    function initializeApp() {
        loadPreferences();
        renderHashtagFilters();
        // Hide floor nav since there are no floors
        if (elements.floorNav) {
            elements.floorNav.style.display = 'none';
        }
        renderRooms();
        renderRecentVideos();
        setupEventListeners();
        handleUrlHash();
    }

    function loadPreferences() {
        const savedTheme = localStorage.getItem('rigas62-theme');
        const savedView = localStorage.getItem('rigas62-view');

        if (savedTheme) {
            state.theme = savedTheme;
            applyTheme();
        }

        if (savedView) {
            state.viewMode = savedView;
            applyViewMode();
        }
    }

    // ========================================
    // Rendering Functions
    // ========================================
    function renderHashtagFilters() {
        const container = elements.hashtagFilters;
        container.innerHTML = '<button class="hashtag-chip active" data-tag="all">Visi</button>';

        const sortedTags = Array.from(state.allHashtags).sort();
        sortedTags.forEach(tag => {
            const chip = document.createElement('button');
            chip.className = 'hashtag-chip';
            chip.dataset.tag = tag;
            chip.textContent = tag;
            container.appendChild(chip);
        });
    }

    function renderRooms() {
        const filtered = filterRooms();
        state.filteredRooms = filtered;

        if (filtered.length === 0) {
            elements.roomsContainer.innerHTML = '';
            elements.noResults.classList.remove('hidden');
            return;
        }

        elements.noResults.classList.add('hidden');
        elements.roomsContainer.innerHTML = filtered.map(room => createRoomCard(room)).join('');
    }

    function getAllVideos() {
        if (!state.data?.rooms) return [];
        const videos = [];
        state.data.rooms.forEach(room => {
            if (room.videos) {
                room.videos.forEach((video, index) => {
                    videos.push({
                        ...video,
                        roomId: room.id,
                        roomName: room.name,
                        videoIndex: index
                    });
                });
            }
        });
        return videos;
    }

    function renderRecentVideos() {
        if (!elements.recentVideosContainer || !elements.recentVideosSection) return;

        const allVideos = getAllVideos();

        if (allVideos.length === 0) {
            elements.recentVideosSection.classList.add('hidden');
            return;
        }

        elements.recentVideosSection.classList.remove('hidden');
        elements.recentVideosContainer.innerHTML = allVideos.map(video => createRecentVideoCard(video)).join('');
    }

    function createRecentVideoCard(video) {
        const thumbnailUrl = video.thumbnail
            ? `media/thumbnails/${video.thumbnail}`
            : 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" fill="none">
                    <rect width="400" height="225" fill="#252542"/>
                    <polygon points="175,90 175,135 215,112.5" fill="#6c5ce7"/>
                </svg>
            `);

        return `
            <article class="video-card" data-room-id="${video.roomId}" data-video-index="${video.videoIndex}">
                <div class="video-card-image" style="background-image: url('${thumbnailUrl}')">
                    <div class="video-card-play">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                    </div>
                </div>
                <div class="video-card-info">
                    <div class="video-card-title">${escapeHtml(video.title)}</div>
                    <div class="video-card-room">${escapeHtml(video.roomName)}</div>
                </div>
            </article>
        `;
    }

    function getRoomIcon(roomId) {
        const icons = {
            'virtuve': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',
            'ieeja': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
            'gaitenis': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
            'viesistaba': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/><path d="M4 18v2"/><path d="M20 18v2"/></svg>',
            'vannas-istaba-bernu': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M7 19v2"/><path d="M17 19v2"/></svg>',
            'vannas-istaba-vecaku': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M7 19v2"/><path d="M17 19v2"/></svg>',
            'tehniska-telpa': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
            'dzivojama-istaba': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
        };
        return icons[roomId] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
    }

    function getRoomImage(roomId) {
        const images = {
            'virtuve': 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=400&h=300&fit=crop',
            'ieeja': 'https://images.unsplash.com/photo-1600494448868-9fbd1ac2d9f5?w=400&h=300&fit=crop',
            'gaitenis': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
            'viesistaba': 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400&h=300&fit=crop',
            'vannas-istaba-bernu': 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop',
            'vannas-istaba-vecaku': 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400&h=300&fit=crop',
            'tehniska-telpa': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=300&fit=crop',
            'dzivojama-istaba': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'
        };
        return images[roomId] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop';
    }

    function createRoomCard(room) {
        const videoCount = room.videos?.length || 0;
        const photoCount = room.photos?.length || 0;
        const imageUrl = getRoomImage(room.id);

        return `
            <article class="room-card" data-room-id="${room.id}">
                <div class="room-card-image" style="background-image: url('${imageUrl}')">
                    <div class="room-card-icon">
                        ${getRoomIcon(room.id)}
                    </div>
                    <div class="room-card-overlay">
                        <h3>${escapeHtml(room.name)}</h3>
                        <div class="room-meta">
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="23 7 16 12 23 17 23 7"/>
                                    <rect x="1" y="5" width="15" height="14" rx="2"/>
                                </svg>
                                ${videoCount}
                            </span>
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21 15 16 10 5 21"/>
                                </svg>
                                ${photoCount}
                            </span>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    function renderRoomDetail(room) {
        state.currentRoom = room;
        state.currentView = 'room';

        elements.roomsContainer.classList.add('hidden');
        if (elements.recentVideosSection) {
            elements.recentVideosSection.classList.add('hidden');
        }
        if (elements.floorNav) {
            elements.floorNav.classList.add('hidden');
        }
        elements.roomDetail.classList.remove('hidden');

        updateBreadcrumb(room);

        const mainPhoto = room.photos?.[0]
            ? `media/photos/${room.photos[0]}`
            : 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" fill="none">
                    <rect width="800" height="500" fill="#252542"/>
                    <path d="M400 150l120 90v150h-80v-100h-80v100h-80v-150z" fill="#6366f1" opacity="0.5"/>
                </svg>
            `);

        elements.roomDetail.innerHTML = `
            <div class="room-detail-header">
                <button class="back-btn" id="backToRooms">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Atpakaļ
                </button>
                <div class="room-title-bar">
                    <h1>${escapeHtml(room.name)}</h1>
                    ${room.description ? `<p>${escapeHtml(room.description)}</p>` : ''}
                </div>
            </div>

            ${room.videos && room.videos.length > 0 ? `
                <div class="videos-section">
                    <h2>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="23 7 16 12 23 17 23 7"/>
                            <rect x="1" y="5" width="15" height="14" rx="2"/>
                        </svg>
                        Video (${room.videos.length})
                    </h2>
                    <div class="videos-grid">
                        ${room.videos.map((video, index) => createVideoCard(video, index)).join('')}
                    </div>
                </div>
            ` : '<p class="no-videos">Nav video šajā istabā</p>'}

            ${room.photos && room.photos.length > 0 ? `
                <div class="photos-section">
                    <h2>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        Foto (${room.photos.length})
                    </h2>
                    <div class="photos-grid">
                        ${room.photos.map((photo, index) => `
                            <img class="photo-thumb" src="media/photos/${photo}" alt="${room.name} foto ${index + 1}">
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${room.equipment && room.equipment.length > 0 ? `
                <div class="equipment-section">
                    <h2>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                        </svg>
                        Aprīkojums
                    </h2>
                    <ul class="equipment-list">
                        ${room.equipment.map(item => `
                            <li class="equipment-item">${escapeHtml(item)}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;

        // Setup thumbnail clicks
        const thumbs = elements.roomDetail.querySelectorAll('.room-thumb');
        thumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const index = parseInt(thumb.dataset.index);
                const mainImage = document.getElementById('mainImage');
                mainImage.src = `media/photos/${room.photos[index]}`;
                thumbs.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
        });

        // Setup video card clicks
        const videoCards = elements.roomDetail.querySelectorAll('.video-card');
        videoCards.forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.videoIndex);
                openVideoModal(room.videos[index]);
            });
        });

        // Setup back button
        const backBtn = document.getElementById('backToRooms');
        if (backBtn) {
            backBtn.addEventListener('click', navigateHome);
        }

        window.scrollTo(0, 0);
    }

    function createVideoCard(video, index) {
        // Support for thumbnail: video.thumbnail or generate from video filename
        const thumbnailUrl = video.thumbnail
            ? `media/thumbnails/${video.thumbnail}`
            : null;

        return `
            <div class="video-card" data-video-index="${index}">
                <div class="video-thumbnail" ${thumbnailUrl ? `style="background-image: url('${thumbnailUrl}')"` : ''}>
                    <div class="video-play-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                    </div>
                </div>
                <div class="video-card-content">
                    <h4>${escapeHtml(video.title)}</h4>
                    <div class="video-hashtags">
                        ${video.hashtags?.map(tag => {
                            const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
                            return `<span class="video-hashtag">${escapeHtml(cleanTag)}</span>`;
                        }).join('') || ''}
                    </div>
                </div>
            </div>
        `;
    }

    function updateBreadcrumb(room = null) {
        if (room) {
            elements.breadcrumb.classList.remove('hidden');
            elements.breadcrumb.innerHTML = `
                <a href="#" data-view="home">Sākums</a>
                <span>/</span>
                <span>${escapeHtml(room.name)}</span>
            `;
        } else {
            elements.breadcrumb.classList.add('hidden');
        }
    }

    // ========================================
    // Filtering Functions
    // ========================================
    function filterRooms() {
        let rooms = state.data.rooms;

        // Filter by tag (including room names and video tags)
        if (state.activeHashtag !== 'all') {
            const activeTag = state.activeHashtag.toLowerCase();
            rooms = rooms.filter(room => {
                // Check if tag matches room id
                if (room.id.toLowerCase() === activeTag) {
                    return true;
                }
                // Check video hashtags (compare without # prefix)
                return room.videos?.some(video =>
                    video.hashtags?.some(tag => {
                        const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
                        return cleanTag.toLowerCase() === activeTag;
                    })
                );
            });
        }

        // Filter by search query
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            rooms = rooms.filter(room => {
                // Search in room name
                if (room.name.toLowerCase().includes(query)) return true;

                // Search in description
                if (room.description?.toLowerCase().includes(query)) return true;

                // Search in equipment
                if (room.equipment?.some(e => e.toLowerCase().includes(query))) return true;

                // Search in video titles and hashtags
                if (room.videos?.some(video => {
                    if (video.title?.toLowerCase().includes(query)) return true;
                    if (video.description?.toLowerCase().includes(query)) return true;
                    if (video.hashtags?.some(tag => tag.toLowerCase().includes(query))) return true;
                    return false;
                })) return true;

                return false;
            });
        }

        return rooms;
    }

    function generateSearchSuggestions(query) {
        if (!query || query.length < 2) {
            elements.searchSuggestions.classList.add('hidden');
            return;
        }

        const suggestions = [];
        const lowerQuery = query.toLowerCase();

        // Search videos first (by title and hashtags) - most useful
        state.data.rooms.forEach(room => {
            room.videos?.forEach((video, videoIndex) => {
                const matchesTitle = video.title?.toLowerCase().includes(lowerQuery);
                const matchesHashtag = video.hashtags?.some(tag => tag.toLowerCase().includes(lowerQuery));

                if (matchesTitle || matchesHashtag) {
                    suggestions.push({
                        type: 'video',
                        text: video.title,
                        roomId: room.id,
                        videoIndex: videoIndex,
                        roomName: room.name
                    });
                }
            });
        });

        // Search rooms
        state.data.rooms.forEach(room => {
            if (room.name.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    type: 'istaba',
                    text: room.name,
                    id: room.id
                });
            }
        });

        // Search equipment
        state.data.rooms.forEach(room => {
            room.equipment?.forEach(equip => {
                if (equip.toLowerCase().includes(lowerQuery)) {
                    const exists = suggestions.find(s => s.type === 'aprīkojums' && s.text === equip);
                    if (!exists) {
                        suggestions.push({
                            type: 'aprīkojums',
                            text: equip,
                            roomId: room.id
                        });
                    }
                }
            });
        });

        // Search tags
        state.allHashtags.forEach(tag => {
            if (tag.includes(lowerQuery)) {
                suggestions.push({
                    type: 'tags',
                    text: tag
                });
            }
        });

        // Limit suggestions
        const limited = suggestions.slice(0, 10);

        if (limited.length === 0) {
            elements.searchSuggestions.classList.add('hidden');
            return;
        }

        elements.searchSuggestions.innerHTML = limited.map(s => `
            <div class="suggestion-item" data-type="${s.type}" data-id="${s.id || s.roomId || ''}" data-video-index="${s.videoIndex !== undefined ? s.videoIndex : ''}" data-text="${escapeHtml(s.text)}">
                <span class="type-badge">${s.type}</span>
                <span>${escapeHtml(s.text)}${s.roomName ? ` <small>(${s.roomName})</small>` : ''}</span>
            </div>
        `).join('');

        elements.searchSuggestions.classList.remove('hidden');
    }

    // ========================================
    // Video Modal
    // ========================================
    function isExternalUrl(url) {
        return url.startsWith('http://') || url.startsWith('https://');
    }

    function openVideoModal(video) {
        const videoContainer = document.getElementById('videoContainer');

        if (isExternalUrl(video.file)) {
            // External URL (Google Drive, YouTube, etc.) - use iframe
            videoContainer.innerHTML = `
                <iframe
                    src="${video.file}"
                    width="100%"
                    height="100%"
                    frameborder="0"
                    allow="autoplay; encrypted-media"
                    allowfullscreen>
                </iframe>
            `;
        } else {
            // Local file - use video element
            videoContainer.innerHTML = `
                <video id="videoPlayer" controls>
                    <source src="media/videos/${video.file}" type="video/mp4">
                </video>
            `;
        }

        elements.videoTitle.textContent = video.title;
        elements.videoDescription.textContent = video.description || '';
        elements.videoHashtags.innerHTML = video.hashtags?.map(tag => {
            const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
            return `<span class="video-hashtag">${escapeHtml(cleanTag)}</span>`;
        }).join('') || '';

        elements.videoModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeVideoModal() {
        elements.videoModal.classList.add('hidden');
        const videoContainer = document.getElementById('videoContainer');
        const videoPlayer = videoContainer.querySelector('video');
        if (videoPlayer) {
            videoPlayer.pause();
        }
        videoContainer.innerHTML = '';
        document.body.style.overflow = '';
    }

    // ========================================
    // Theme & View Mode
    // ========================================
    function applyTheme() {
        document.documentElement.dataset.theme = state.theme;
        const sunIcon = elements.themeToggle.querySelector('.sun-icon');
        const moonIcon = elements.themeToggle.querySelector('.moon-icon');

        if (state.theme === 'dark') {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        } else {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        }
    }

    function toggleTheme() {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('rigas62-theme', state.theme);
        applyTheme();
    }

    function applyViewMode() {
        const container = elements.roomsContainer;
        if (state.viewMode === 'grid') {
            container.classList.remove('list-view');
            container.classList.add('grid-view');
        } else {
            container.classList.remove('grid-view');
            container.classList.add('list-view');
        }
    }

    // ========================================
    // Navigation
    // ========================================
    function navigateToRoom(roomId) {
        const room = state.data.rooms.find(r => r.id === roomId);
        if (room) {
            // Reset hashtag filter to 'all' and clear highlighting
            state.activeHashtag = 'all';
            elements.hashtagFilters.querySelectorAll('.hashtag-chip').forEach(chip => {
                chip.classList.toggle('active', chip.dataset.tag === 'all');
            });
            window.location.hash = `room/${roomId}`;
            renderRoomDetail(room);
        }
    }

    function navigateToRoomKeepHighlight(roomId) {
        const room = state.data.rooms.find(r => r.id === roomId);
        if (room) {
            // Keep current hashtag highlighting
            window.location.hash = `room/${roomId}`;
            renderRoomDetail(room);
        }
    }

    function navigateHome() {
        state.currentView = 'home';
        state.currentRoom = null;
        state.activeHashtag = 'all';
        window.location.hash = '';

        // Reset hashtag highlighting to 'all'
        elements.hashtagFilters.querySelectorAll('.hashtag-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.tag === 'all');
        });

        elements.roomDetail.classList.add('hidden');
        elements.roomsContainer.classList.remove('hidden');
        if (elements.recentVideosSection) {
            elements.recentVideosSection.classList.remove('hidden');
        }

        updateBreadcrumb();
        renderRooms();
    }

    function handleUrlHash() {
        const hash = window.location.hash.slice(1);
        if (hash.startsWith('room/')) {
            const roomId = hash.split('/')[1];
            const room = state.data.rooms.find(r => r.id === roomId);
            if (room) {
                renderRoomDetail(room);
                return;
            }
        }
        navigateHome();
    }

    // ========================================
    // Event Listeners
    // ========================================
    function setupEventListeners() {
        // Search input
        let searchTimeout;
        elements.globalSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                state.searchQuery = e.target.value;
                generateSearchSuggestions(e.target.value);

                if (state.currentView === 'home') {
                    renderRooms();
                }
            }, 200);
        });

        // Search suggestions click
        elements.searchSuggestions.addEventListener('click', (e) => {
            const item = e.target.closest('.suggestion-item');
            if (!item) return;

            const type = item.dataset.type;
            const text = item.dataset.text;
            const id = item.dataset.id;
            const videoIndex = item.dataset.videoIndex;

            elements.searchSuggestions.classList.add('hidden');
            elements.globalSearch.value = '';
            state.searchQuery = '';

            if (type === 'video' && id && videoIndex !== '') {
                // Navigate to room and open video
                const room = state.data.rooms.find(r => r.id === id);
                if (room && room.videos[videoIndex]) {
                    openVideoModal(room.videos[videoIndex]);
                }
            } else if ((type === 'istaba' || type === 'room') && id) {
                navigateToRoom(id);
            } else if (type === 'hashtag' || type === 'tags') {
                setActiveHashtag(text);
            } else if ((type === 'aprīkojums' || type === 'equipment') && id) {
                navigateToRoom(id);
            }
        });

        // Close suggestions on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                elements.searchSuggestions.classList.add('hidden');
            }
        });

        // Hashtag filter clicks
        elements.hashtagFilters.addEventListener('click', (e) => {
            const chip = e.target.closest('.hashtag-chip');
            if (!chip) return;
            setActiveHashtag(chip.dataset.tag);
        });

        // Room card clicks
        elements.roomsContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.room-card');
            if (!card) return;
            navigateToRoom(card.dataset.roomId);
        });

        // Video card click handler (for recent videos section)
        const recentVideosContainer = document.getElementById('recentVideosContainer');
        if (recentVideosContainer) {
            recentVideosContainer.addEventListener('click', (e) => {
                const card = e.target.closest('.video-card');
                if (!card) return;
                e.preventDefault();
                e.stopPropagation();
                const roomId = card.dataset.roomId;
                const videoIndex = parseInt(card.dataset.videoIndex, 10);
                if (state.data && state.data.rooms) {
                    const room = state.data.rooms.find(r => r.id === roomId);
                    if (room && room.videos && room.videos[videoIndex]) {
                        openVideoModal(room.videos[videoIndex]);
                    }
                }
            });
        }

        // Breadcrumb navigation
        elements.breadcrumb.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            e.preventDefault();
            if (link.dataset.view === 'home') {
                navigateHome();
            }
        });

        // Logo click - navigate home
        const logoHome = document.getElementById('logoHome');
        if (logoHome) {
            logoHome.addEventListener('click', (e) => {
                e.preventDefault();
                setActiveHashtag('all');
                navigateHome();
            });
        }

        // Modal close
        elements.closeModal.addEventListener('click', closeVideoModal);
        elements.videoModal.addEventListener('click', (e) => {
            if (e.target === elements.videoModal) {
                closeVideoModal();
            }
        });

        // Theme toggle
        elements.themeToggle.addEventListener('click', toggleTheme);

        // URL hash change
        window.addEventListener('hashchange', handleUrlHash);

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !elements.videoModal.classList.contains('hidden')) {
                closeVideoModal();
            }
        });

        // Offline detection
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
    }

    function setActiveHashtag(tag) {
        // Handle "all" tag - show home view
        if (tag === 'all') {
            state.activeHashtag = 'all';
            elements.hashtagFilters.querySelectorAll('.hashtag-chip').forEach(chip => {
                chip.classList.toggle('active', chip.dataset.tag === 'all');
            });
            if (state.currentView !== 'home') {
                navigateHome();
            } else {
                renderRooms();
            }
            return;
        }

        // Update active hashtag chip for the clicked tag (compare lowercase)
        const tagLower = tag.toLowerCase();
        elements.hashtagFilters.querySelectorAll('.hashtag-chip').forEach(chip => {
            chip.classList.remove('active');
            if (chip.dataset.tag.toLowerCase() === tagLower) {
                chip.classList.add('active');
            }
        });

        // Check if tag matches a room id - if so, navigate to room
        const matchingRoom = state.data.rooms.find(room => room.id.toLowerCase() === tag.toLowerCase());
        if (matchingRoom) {
            navigateToRoomKeepHighlight(matchingRoom.id);
            return;
        }

        // Find all rooms and videos with this tag
        const cleanTag = tag.toLowerCase();
        const matchingVideos = [];
        const matchingRooms = new Set();

        for (const room of state.data.rooms) {
            if (room.videos) {
                for (const video of room.videos) {
                    const hasTag = video.hashtags?.some(t => {
                        const videoTag = t.startsWith('#') ? t.substring(1) : t;
                        return videoTag.toLowerCase() === cleanTag;
                    });
                    if (hasTag) {
                        matchingVideos.push({ video, room });
                        matchingRooms.add(room);
                    }
                }
            }
        }

        // If we found matching content, show filtered view with both rooms and videos
        if (matchingVideos.length > 0 || matchingRooms.size > 0) {
            renderFilteredContent(tag, Array.from(matchingRooms), matchingVideos);
            return;
        }

        // Fallback: set filter and render rooms
        state.activeHashtag = tag;

        // If in room detail view, go back to home and show filtered results
        if (state.currentView === 'room') {
            state.currentView = 'home';
            state.currentRoom = null;
            window.location.hash = '';
            elements.roomDetail.classList.add('hidden');
            elements.roomsContainer.classList.remove('hidden');
            if (elements.recentVideosSection) {
                elements.recentVideosSection.classList.remove('hidden');
            }
            updateBreadcrumb();
        }

        renderRooms();
    }

    function renderFilteredContent(tag, matchingRooms, matchingVideos) {
        state.currentView = 'filtered-content';
        state.currentRoom = null;

        elements.roomsContainer.classList.add('hidden');
        if (elements.floorNav) {
            elements.floorNav.classList.add('hidden');
        }
        elements.roomDetail.classList.remove('hidden');
        elements.noResults.classList.add('hidden');

        // Update breadcrumb
        elements.breadcrumb.classList.remove('hidden');
        elements.breadcrumb.innerHTML = `
            <a href="#" data-view="home">Sākums</a>
            <span>/</span>
            <span>Filtrs: ${escapeHtml(tag)}</span>
        `;

        const totalItems = matchingRooms.length + matchingVideos.length;

        elements.roomDetail.innerHTML = `
            <div class="room-detail-header">
                <button class="back-btn" id="backToRooms">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Atpakaļ
                </button>
                <div class="room-title-bar">
                    <h1>Filtrs: ${escapeHtml(tag)}</h1>
                    <p>Atrasti ${totalItems} rezultāti</p>
                </div>
            </div>

            <div class="filtered-content-grid">
                ${matchingRooms.map(room => createFilteredRoomCard(room)).join('')}
                ${matchingVideos.map(({ video, room }, index) => createFilteredVideoCard(video, room, index)).join('')}
            </div>
        `;

        // Setup room card clicks
        const roomCards = elements.roomDetail.querySelectorAll('.filtered-room-card');
        roomCards.forEach(card => {
            card.addEventListener('click', () => {
                navigateToRoom(card.dataset.roomId);
            });
        });

        // Setup video card clicks
        const videoCards = elements.roomDetail.querySelectorAll('.video-card');
        videoCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                openVideoModal(matchingVideos[index].video);
            });
        });

        // Setup back button
        const backBtn = document.getElementById('backToRooms');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                setActiveHashtag('all');
                navigateHome();
            });
        }

        window.scrollTo(0, 0);
    }

    function createFilteredRoomCard(room) {
        const videoCount = room.videos?.length || 0;
        const photoCount = room.photos?.length || 0;
        const imageUrl = getRoomImage(room.id);

        return `
            <article class="filtered-room-card" data-room-id="${room.id}">
                <div class="room-card-image" style="background-image: url('${imageUrl}')">
                    <div class="room-card-icon">
                        ${getRoomIcon(room.id)}
                    </div>
                    <div class="room-card-overlay">
                        <h3>${escapeHtml(room.name)}</h3>
                        <div class="room-meta">
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="23 7 16 12 23 17 23 7"/>
                                    <rect x="1" y="5" width="15" height="14" rx="2"/>
                                </svg>
                                ${videoCount}
                            </span>
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21 15 16 10 5 21"/>
                                </svg>
                                ${photoCount}
                            </span>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    function createFilteredVideoCard(video, room, index) {
        const thumbnailUrl = video.thumbnail
            ? `media/thumbnails/${video.thumbnail}`
            : null;

        return `
            <div class="video-card" data-video-index="${index}">
                <div class="video-thumbnail" ${thumbnailUrl ? `style="background-image: url('${thumbnailUrl}')"` : ''}>
                    <div class="video-play-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                    </div>
                </div>
                <div class="video-card-content">
                    <h4>${escapeHtml(video.title)}</h4>
                    <small class="video-room-name">${escapeHtml(room.name)}</small>
                    <div class="video-hashtags">
                        ${video.hashtags?.map(tag => {
                            const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
                            return `<span class="video-hashtag">${escapeHtml(cleanTag)}</span>`;
                        }).join('') || ''}
                    </div>
                </div>
            </div>
        `;
    }

    function updateOnlineStatus() {
        const indicator = elements.offlineIndicator;
        const statusText = indicator.querySelector('.status-text');

        if (navigator.onLine) {
            indicator.classList.remove('offline');
            statusText.textContent = 'Tiešsaistē';
        } else {
            indicator.classList.add('offline');
            statusText.textContent = 'Bezsaistē';
        }
    }

    // ========================================
    // Utility Functions
    // ========================================
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showError(message) {
        elements.roomsContainer.innerHTML = `
            <div class="no-results">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3>Kļūda</h3>
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }

    // ========================================
    // Service Worker Registration
    // ========================================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        });
    }

    // ========================================
    // Initialize Application
    // ========================================
    document.addEventListener('DOMContentLoaded', loadData);

})();
