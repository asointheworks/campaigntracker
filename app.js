/**
 * D&D Campaign Tracker - Waterdeep: Dragon Heist
 * JavaScript Application
 */

// ===================================
// D20 Placeholder Image (SVG Data URL)
// ===================================

const D20_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%231a1a2e' width='100' height='100'/%3E%3Cpolygon points='50,10 85,30 85,70 50,90 15,70 15,30' fill='none' stroke='%23d4af37' stroke-width='2'/%3E%3Cpolygon points='50,10 85,30 50,50 15,30' fill='none' stroke='%23d4af37' stroke-width='1.5'/%3E%3Cpolygon points='85,30 85,70 50,50' fill='none' stroke='%23d4af37' stroke-width='1.5'/%3E%3Cpolygon points='85,70 50,90 50,50' fill='none' stroke='%23d4af37' stroke-width='1.5'/%3E%3Cpolygon points='50,90 15,70 50,50' fill='none' stroke='%23d4af37' stroke-width='1.5'/%3E%3Cpolygon points='15,70 15,30 50,50' fill='none' stroke='%23d4af37' stroke-width='1.5'/%3E%3Ctext x='50' y='58' text-anchor='middle' font-size='20' font-weight='bold' fill='%23d4af37' font-family='serif'%3E20%3C/text%3E%3C/svg%3E";

// ===================================
// Firebase Configuration & Initialization
// ===================================

let db = null;
let firebaseReady = false;
let _firestoreUpdateInProgress = false; // prevents save loops

try {
    const firebaseConfig = {
        apiKey: "AIzaSyB1UFGq5u4p_w8bsiudQykvgxZz4VHNw2w",
        authDomain: "campaign-tracker-66a70.firebaseapp.com",
        projectId: "campaign-tracker-66a70",
        storageBucket: "campaign-tracker-66a70.firebasestorage.app",
        messagingSenderId: "74145492926",
        appId: "1:74145492926:web:bf755ee94e07d1da0a13ef"
    };

    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        firebaseReady = true;
        console.log('Firebase initialized successfully');
    } else {
        console.warn('Firebase SDK not loaded - running in offline mode');
    }
} catch (e) {
    console.error('Firebase init error:', e);
}

function setSyncStatus(status) {
    const icon = document.getElementById('sync-icon');
    const text = document.getElementById('sync-text');
    if (!icon || !text) return;

    switch (status) {
        case 'connected':
            icon.style.color = '#2ecc71';
            text.textContent = 'Synced';
            break;
        case 'syncing':
            icon.style.color = '#f39c12';
            text.textContent = 'Syncing...';
            break;
        case 'offline':
            icon.style.color = '#e74c3c';
            text.textContent = 'Offline';
            break;
        case 'error':
            icon.style.color = '#e74c3c';
            text.textContent = 'Sync Error';
            break;
        default:
            icon.style.color = '#95a5a6';
            text.textContent = 'Connecting...';
    }
}

// Push local data to Firestore
async function syncToFirestore(data) {
    if (!firebaseReady || !db) return;
    setSyncStatus('syncing');
    try {
        await db.collection('campaigns').doc('main').set(data);
        setSyncStatus('connected');
    } catch (e) {
        console.error('Firestore write error:', e);
        setSyncStatus('error');
    }
}

// Start real-time listener from Firestore
function startFirestoreListener() {
    if (!firebaseReady || !db) {
        setSyncStatus('offline');
        return;
    }

    db.collection('campaigns').doc('main').onSnapshot(
        (doc) => {
            if (!doc.exists) {
                // First time: push local data to Firestore
                const local = CampaignData.get();
                syncToFirestore(local);
                return;
            }

            const remoteData = doc.data();
            const localData = CampaignData.get();

            // Only update if the remote data is actually different
            // Use a simple timestamp comparison to avoid infinite loops
            if (_firestoreUpdateInProgress) return;

            // Check if remote has newer activity (simple heuristic)
            const remoteLatest = (remoteData.activity && remoteData.activity[0]) ? remoteData.activity[0].id : 0;
            const localLatest = (localData.activity && localData.activity[0]) ? localData.activity[0].id : 0;

            // Compare campaign, characters, and other key data structures
            const campaignChanged = JSON.stringify(remoteData.campaign) !== JSON.stringify(localData.campaign);
            const charactersChanged = JSON.stringify(remoteData.characters) !== JSON.stringify(localData.characters);
            const activityChanged = remoteLatest !== localLatest;

            // Compare all deletable data structures to ensure deletions sync properly
            const talesChanged = JSON.stringify(remoteData.tales) !== JSON.stringify(localData.tales);
            const sessionSummariesChanged = JSON.stringify(remoteData.sessionSummaries) !== JSON.stringify(localData.sessionSummaries);
            const dmNotesChanged = JSON.stringify(remoteData.dmNotes) !== JSON.stringify(localData.dmNotes);
            const icNotesChanged = JSON.stringify(remoteData.icNotes) !== JSON.stringify(localData.icNotes);
            const oocNotesChanged = JSON.stringify(remoteData.oocNotes) !== JSON.stringify(localData.oocNotes);
            const encounterChanged = JSON.stringify(remoteData.encounter) !== JSON.stringify(localData.encounter);

            // Compare other data structures for completeness
            const storiesChanged = JSON.stringify(remoteData.stories) !== JSON.stringify(localData.stories);
            const npcsChanged = JSON.stringify(remoteData.npcs) !== JSON.stringify(localData.npcs);
            const locationsChanged = JSON.stringify(remoteData.locations) !== JSON.stringify(localData.locations);
            const questsChanged = JSON.stringify(remoteData.quests) !== JSON.stringify(localData.quests);
            const galleryChanged = JSON.stringify(remoteData.gallery) !== JSON.stringify(localData.gallery);
            const resourcesChanged = JSON.stringify(remoteData.resources) !== JSON.stringify(localData.resources);

            if (activityChanged || campaignChanged || charactersChanged ||
                talesChanged || sessionSummariesChanged || dmNotesChanged ||
                icNotesChanged || oocNotesChanged || encounterChanged ||
                storiesChanged || npcsChanged || locationsChanged ||
                questsChanged || galleryChanged || resourcesChanged) {
                // Remote is different - update local
                _firestoreUpdateInProgress = true;
                localStorage.setItem('campaignTrackerData', JSON.stringify(remoteData));

                // Re-render everything
                try {
                    renderCharacters();
                    renderTales();
                    renderResources();
                    renderNotes();
                    renderDMNotes();
                    renderSessionSummaries();
                    renderNPCs();
                    renderLocations();
                    renderQuests();
                    renderGallery();
                    renderStories();
                    renderRules();
                    loadSessionInfo();
                    loadSynopsis();
                    updateDashboardStats();
                    CampaignData.renderActivity();
                } catch (e) {
                    console.warn('Re-render error during sync:', e);
                }
                _firestoreUpdateInProgress = false;
            }

            setSyncStatus('connected');
        },
        (error) => {
            console.error('Firestore listener error:', error);
            setSyncStatus('error');
        }
    );
}

// ===================================
// IndexedDB File Storage
// ===================================

const FileStore = {
    DB_NAME: 'campaignTrackerFiles',
    DB_VERSION: 1,
    STORE_NAME: 'files',

    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async saveFile(fileData) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            tx.objectStore(this.STORE_NAME).put(fileData);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async getFile(id) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readonly');
            const request = tx.objectStore(this.STORE_NAME).get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getAllFiles() {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readonly');
            const request = tx.objectStore(this.STORE_NAME).getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async deleteFile(id) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            tx.objectStore(this.STORE_NAME).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async getCount() {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readonly');
            const request = tx.objectStore(this.STORE_NAME).count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
};

// ===================================
// Data Management
// ===================================

const CampaignData = {
    // Default data structure
    defaults: {
        campaign: {
            name: "Waterdeep: Dragon Heist",
            currentChapter: "Chapter 1: Along the High Road",
            sessionNumber: 1,
            currentLocation: "The High Road",
            partyLevel: 3,
            currentXP: 450,
            totalGold: 0,
            sessionsPlayed: 1,
            nextSessionDate: "",
            sessionNotes: "",
            synopsis: "",
            campaignImage: ""
        },
        characters: [
            {
                id: 1,
                type: 'npc',
                name: 'Krak',
                raceClass: 'Human Barbarian',
                player: '',
                level: 3,
                currentHp: 35,
                maxHp: 35,
                ac: 14,
                initiative: '+1',
                portrait: D20_PLACEHOLDER,
                background: '<p>Krak is a gruff but kindhearted <strong>caravan leader</strong> who has traversed the Sword Coast countless times. Despite his intimidating appearance, he has a deep love for animals - especially oxen.</p><p>He was <em>devastated</em> by the loss of <strong>Petunia the Ox</strong> during a goblin ambush on the road to Waterdeep. Petunia had been his loyal companion for over eight years, and her death has left him seeking both vengeance and purpose.</p><p>Krak now frequents the Yawning Portal, drowning his sorrows and looking for adventurers who might help him track down the goblins responsible.</p>',
                createdAt: new Date().toISOString()
            }
        ],
        stories: [
            {
                id: 0,
                title: "The Gathering Storm",
                type: "session",
                author: "Dungeon Master",
                date: "Session 0",
                content: "Five strangers arrive in Waterdeep during the tail end of summer, each drawn by their own reasons to the City of Splendors. Fate - or perhaps something more deliberate - will soon bring them together...\n\nThe streets of Waterdeep bustle with the usual energy of the greatest city on the Sword Coast. Merchants hawk their wares, nobles ride in ornate carriages, and the City Watch keeps a watchful eye on all. But beneath this veneer of civilization, shadows stir.\n\nRumors speak of hidden treasures, of ancient secrets buried beneath the cobblestones, and of powerful figures moving chess pieces in a game that spans the entire city. Our heroes, as yet unaware of their destiny, are about to be drawn into the greatest treasure hunt Waterdeep has ever seen.",
                wordCount: 1234,
                createdAt: new Date().toISOString()
            }
        ],
        icNotes: [
            {
                id: 0,
                title: "The Yawning Portal Atmosphere",
                session: "Session 1",
                content: "\"The common room buzzes with the usual crowd - adventurers nursing ales and wounds alike, merchants conducting quiet business in shadowed corners, and the ever-present rumble of Durnan's gravelly voice keeping order. The great well in the center of the room - the entrance to Undermountain itself - seems to pulse with an almost hungry energy tonight...\"",
                tags: ["atmosphere", "yawning portal"]
            }
        ],
        oocNotes: [
            {
                id: 0,
                title: "Session Planning - Chapter 1",
                session: "Pre-Session",
                content: "**Key Beats:**\n- Introduce the party at the Yawning Portal\n- Troll attack from the well\n- Volo's proposition\n- Investigation of Floon's disappearance\n\n**Potential Hooks:**\n- Connect to Tharion's missing parents subplot\n- Seraphina might know someone in the Dock Ward",
                tags: ["planning", "chapter 1"]
            }
        ],
        npcs: [],
        locations: [],
        quests: [
            {
                id: 0,
                name: "Find Floon Blagmaar",
                type: "main",
                giver: "Volothamp Geddarm",
                description: "Volo's friend Floon has gone missing after a night out in the Dock Ward. Find him and return him safely.",
                rewards: ["100 gp (promised)", "A \"property\" in Waterdeep"],
                progress: 0,
                status: "active"
            }
        ],
        gallery: [],
        files: [],
        rules: {},
        // PC Tales data
        tales: [],

        resources: {
            gold: 0,
            goldNotes: 'Track party treasury here',
            inventory: '<p><em>No shared items yet</em></p>',
            property: '<p><em>No properties acquired</em></p>',
            contacts: '<p><em>No notable contacts yet</em></p>'
        },
        // Campaign Notes data
        dmNotes: [],
        sessionSummaries: [],
        // Initiative Tracker
        encounter: {
            combatants: [],
            round: 1,
            currentTurn: 0,
            activePCs: []
        },
        activity: [
            {
                id: 0,
                icon: "🎭",
                text: "Campaign created - Waterdeep: Dragon Heist begins!",
                time: new Date().toISOString()
            }
        ]
    },

    // Load data from localStorage
    load() {
        const saved = localStorage.getItem('campaignTrackerData');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Merge with defaults to ensure all keys exist
                const merged = JSON.parse(JSON.stringify(this.defaults));
                for (const key of Object.keys(merged)) {
                    if (parsed[key] !== undefined) {
                        if (typeof merged[key] === 'object' && !Array.isArray(merged[key]) && merged[key] !== null) {
                            merged[key] = { ...merged[key], ...parsed[key] };
                        } else {
                            merged[key] = parsed[key];
                        }
                    }
                }
                return merged;
            } catch (e) {
                console.error('Error loading saved data:', e);
                return JSON.parse(JSON.stringify(this.defaults));
            }
        }
        return JSON.parse(JSON.stringify(this.defaults));
    },

    // Save data to localStorage + Firestore
    save(data) {
        try {
            localStorage.setItem('campaignTrackerData', JSON.stringify(data));
            // Sync to Firestore if not currently receiving a Firestore update
            if (!_firestoreUpdateInProgress) {
                syncToFirestore(data);
            }
            return true;
        } catch (e) {
            console.error('Error saving data:', e);
            return false;
        }
    },

    // Get current data
    get() {
        return this.load();
    },

    // Update specific section
    update(section, data) {
        const current = this.load();
        current[section] = data;
        return this.save(current);
    },

    // Add activity
    addActivity(icon, text) {
        const current = this.load();
        current.activity.unshift({
            id: Date.now(),
            icon,
            text,
            time: new Date().toISOString()
        });
        // Keep only last 50 activities
        current.activity = current.activity.slice(0, 50);
        this.save(current);
        this.renderActivity();
    },

    // Render activity list
    renderActivity() {
        const list = document.getElementById('activity-list');
        if (!list) return;

        const data = this.load();
        list.innerHTML = data.activity.map(item => `
            <li class="activity-item">
                <span class="activity-icon">${item.icon}</span>
                <span class="activity-text">${item.text}</span>
                <span class="activity-time">${this.formatTime(item.time)}</span>
            </li>
        `).join('');
    },

    // Format time relative
    formatTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

        return formatEuropeanDate(date);
    }
};

// ===================================
// Navigation
// ===================================

function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;

            // Update nav buttons
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update sections
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// ===================================
// Tabs (DM Notes)
// ===================================

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // Update tab buttons
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update tab contents
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// ===================================
// Rules Navigation
// ===================================

function initRulesNav() {
    const ruleButtons = document.querySelectorAll('.rules-nav-btn');
    const ruleSections = document.querySelectorAll('.rule-section');

    ruleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetRule = btn.dataset.rule;

            // Update buttons
            ruleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update sections
            ruleSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `rule-${targetRule}`) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// ===================================
// Filters (Stories & Gallery)
// ===================================

function initFilters() {
    // Story filters
    const storyFilters = document.querySelectorAll('.stories-container .filter-btn');
    storyFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            storyFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterStories(btn.dataset.filter);
        });
    });

    // Gallery filters
    const galleryFilters = document.querySelectorAll('.gallery-filters .filter-btn');
    galleryFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            galleryFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterGallery(btn.dataset.filter);
        });
    });
}

function filterStories(filter) {
    const stories = document.querySelectorAll('.story-card');
    stories.forEach(story => {
        if (filter === 'all' || story.dataset.type === filter) {
            story.style.display = 'block';
        } else {
            story.style.display = 'none';
        }
    });
}

function filterGallery(filter) {
    const items = document.querySelectorAll('.gallery-item');
    items.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// ===================================
// Modals
// ===================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on outside click
function initModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modals.forEach(modal => closeModal(modal.id));
            closeLightbox();
        }
    });
}

// ===================================
// Story Functions
// ===================================

function openStoryModal() {
    document.getElementById('story-form').reset();
    document.getElementById('story-modal-title').textContent = 'New Story';
    openModal('story-modal');
}

function openStoryView(storyId) {
    const data = CampaignData.get();
    const story = data.stories.find(s => s.id === storyId);

    if (!story) return;

    document.getElementById('story-view-title').textContent = story.title;
    document.getElementById('story-view-type').textContent = story.type.charAt(0).toUpperCase() + story.type.slice(1);
    document.getElementById('story-view-type').className = `story-type-badge ${story.type}`;
    document.getElementById('story-view-author').textContent = `By: ${story.author}`;
    document.getElementById('story-view-date').textContent = story.date;

    // Handle both HTML content and plain text
    if (story.content.includes('<') && story.content.includes('>')) {
        document.getElementById('story-view-content').innerHTML = story.content;
    } else {
        document.getElementById('story-view-content').innerHTML = story.content.split('\n').map(p => `<p>${p}</p>`).join('');
    }

    openModal('story-view-modal');
}

function initStoryForm() {
    const form = document.getElementById('story-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const contentEditor = document.getElementById('story-content-input');
        const contentHtml = contentEditor.innerHTML;
        const contentText = contentEditor.textContent || contentEditor.innerText;

        const newStory = {
            id: Date.now(),
            title: document.getElementById('story-title-input').value,
            type: document.getElementById('story-type-select').value,
            author: document.getElementById('story-author-input').value,
            date: formatEuropeanDate(new Date()),
            content: contentHtml,
            wordCount: contentText.split(/\s+/).filter(w => w.length > 0).length,
            createdAt: new Date().toISOString()
        };

        const data = CampaignData.get();
        data.stories.push(newStory);
        CampaignData.save(data);

        // Clear the editor
        contentEditor.innerHTML = '';

        renderStories();
        CampaignData.addActivity('📜', `New story added: "${newStory.title}"`);
        closeModal('story-modal');
    });
}

function renderStories() {
    const grid = document.getElementById('stories-grid');
    const data = CampaignData.get();

    grid.innerHTML = data.stories.map(story => {
        const plainText = stripHtml(story.content);
        return `
            <article class="story-card" data-type="${story.type}">
                <div class="story-header">
                    <span class="story-type-badge ${story.type}">${story.type.charAt(0).toUpperCase() + story.type.slice(1)}</span>
                    <span class="story-date">${story.date}</span>
                </div>
                <h3 class="story-title">${story.title}</h3>
                <p class="story-author">By: ${story.author}</p>
                <p class="story-preview">${plainText.substring(0, 200)}${plainText.length > 200 ? '...' : ''}</p>
                <div class="story-footer">
                    <button class="btn btn-small" onclick="openStoryView(${story.id})">Read More</button>
                    <div class="story-stats">
                        <span>📖 ${story.wordCount || 0} words</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// ===================================
// Note Functions
// ===================================

function addICNote() {
    document.getElementById('note-form').reset();
    document.getElementById('note-content-input').innerHTML = '';
    document.getElementById('note-edit-id').value = '';
    document.getElementById('note-type-hidden').value = 'ic';
    document.getElementById('note-modal-title').textContent = 'New In-Character Note';
    openModal('note-modal');
}

function addOOCNote() {
    document.getElementById('note-form').reset();
    document.getElementById('note-content-input').innerHTML = '';
    document.getElementById('note-edit-id').value = '';
    document.getElementById('note-type-hidden').value = 'ooc';
    document.getElementById('note-modal-title').textContent = 'New Out-of-Character Note';
    openModal('note-modal');
}

function initNoteForm() {
    const form = document.getElementById('note-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const noteType = document.getElementById('note-type-hidden').value;
        const editId = document.getElementById('note-edit-id').value;
        const contentEditor = document.getElementById('note-content-input');

        const noteData = {
            id: editId ? parseInt(editId) : Date.now(),
            title: document.getElementById('note-title-input').value,
            session: document.getElementById('note-session-input').value,
            content: contentEditor.innerHTML,
            tags: document.getElementById('note-tags-input').value.split(',').map(t => t.trim()).filter(t => t)
        };

        const data = CampaignData.get();
        const arrayKey = noteType === 'dm' ? 'dmNotes' : noteType === 'ic' ? 'icNotes' : 'oocNotes';
        if (!data[arrayKey]) data[arrayKey] = [];

        if (editId) {
            // Update existing note
            const idx = data[arrayKey].findIndex(n => n.id === parseInt(editId));
            if (idx !== -1) {
                data[arrayKey][idx] = noteData;
            }
        } else {
            data[arrayKey].push(noteData);
        }
        CampaignData.save(data);

        // Clear the editor and edit id
        contentEditor.innerHTML = '';
        document.getElementById('note-edit-id').value = '';

        renderNotes();
        renderDMNotes();
        const icons = { dm: '🎲', ic: '🎭', ooc: '📋' };
        CampaignData.addActivity(icons[noteType] || '📋', `${editId ? 'Updated' : 'New'} ${noteType.toUpperCase()} note: "${noteData.title}"`);
        closeModal('note-modal');
    });
}

function editNote(noteType, noteId) {
    const data = CampaignData.get();
    const arrayKey = noteType === 'dm' ? 'dmNotes' : noteType === 'ic' ? 'icNotes' : 'oocNotes';
    const note = (data[arrayKey] || []).find(n => n.id === noteId);
    if (!note) return;

    document.getElementById('note-type-hidden').value = noteType;
    document.getElementById('note-edit-id').value = noteId;
    document.getElementById('note-title-input').value = note.title || '';
    document.getElementById('note-session-input').value = note.session || '';
    document.getElementById('note-content-input').innerHTML = note.content || '';
    document.getElementById('note-tags-input').value = (note.tags || []).join(', ');
    document.getElementById('note-modal-title').textContent = `Edit ${noteType.toUpperCase()} Note`;
    openModal('note-modal');
}

function deleteNote(noteType, noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    const data = CampaignData.get();
    const arrayKey = noteType === 'dm' ? 'dmNotes' : noteType === 'ic' ? 'icNotes' : 'oocNotes';
    if (!data[arrayKey]) return;
    data[arrayKey] = data[arrayKey].filter(n => n.id !== noteId);
    CampaignData.save(data);
    renderNotes();
    renderDMNotes();
    CampaignData.addActivity('🗑️', `Deleted ${noteType.toUpperCase()} note`);
}

function renderNotes() {
    const data = CampaignData.get();

    function noteCardHTML(note, type) {
        return `
        <div class="note-card ${type}">
            <div class="note-header">
                <h4>${note.title}</h4>
                <div class="note-actions">
                    <button class="btn btn-small" onclick="editNote('${type}', ${note.id})">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteNote('${type}', ${note.id})">Delete</button>
                </div>
            </div>
            <span class="note-date">${note.session}</span>
            <div class="note-content">
                ${formatNoteContent(note.content)}
            </div>
            <div class="note-tags">
                ${(note.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>`;
    }

    // IC Notes
    const icList = document.getElementById('ic-notes-list');
    if (icList) {
        icList.innerHTML = (data.icNotes || []).length === 0
            ? '<div class="initiative-empty"><p>No IC notes yet.</p></div>'
            : data.icNotes.map(note => noteCardHTML(note, 'ic')).join('');
    }

    // OOC Notes
    const oocList = document.getElementById('ooc-notes-list');
    if (oocList) {
        oocList.innerHTML = (data.oocNotes || []).length === 0
            ? '<div class="initiative-empty"><p>No OOC notes yet.</p></div>'
            : data.oocNotes.map(note => noteCardHTML(note, 'ooc')).join('');
    }
}

function formatNoteContent(content) {
    // If content already has HTML tags, return as-is
    if (content.includes('<') && content.includes('>')) {
        return content;
    }
    // Otherwise, convert newlines to paragraphs
    return content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');
}

// ===================================
// NPC Functions
// ===================================

function addNPC() {
    document.getElementById('npc-form').reset();
    openModal('npc-modal');
}

function initNPCForm() {
    const form = document.getElementById('npc-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const newNPC = {
            id: Date.now(),
            name: document.getElementById('npc-name-input').value,
            role: document.getElementById('npc-role-input').value,
            image: document.getElementById('npc-image-input').value || D20_PLACEHOLDER,
            description: document.getElementById('npc-description-input').value,
            status: document.getElementById('npc-status-select').value
        };

        const data = CampaignData.get();
        data.npcs.push(newNPC);
        CampaignData.save(data);

        renderNPCs();
        CampaignData.addActivity('👥', `New NPC added: "${newNPC.name}"`);
        closeModal('npc-modal');
    });
}

function renderNPCs() {
    const grid = document.getElementById('npc-grid');
    if (!grid) return;
    const data = CampaignData.get();

    // Pull NPCs from Party tab characters
    const partyNPCs = data.characters
        .filter(c => c.type === 'npc')
        .map(c => ({
            id: c.id,
            name: c.name,
            role: c.species && c.charClass ? `${c.species} ${c.charClass}${c.subclass ? ' (' + c.subclass + ')' : ''}` : (c.raceClass || ''),
            image: c.portrait || D20_PLACEHOLDER,
            description: c.background ? c.background.replace(/<[^>]*>/g, '') : '',
            status: 'neutral'
        }));

    const allNPCs = [...partyNPCs, ...data.npcs];

    grid.innerHTML = allNPCs.map(npc => `
        <div class="npc-card">
            <div class="npc-portrait">
                <img src="${npc.image}" alt="${npc.name}">
            </div>
            <div class="npc-info">
                <h4>${npc.name}</h4>
                <p class="npc-role">${npc.role}</p>
                <p class="npc-description">${npc.description}</p>
                <div class="npc-status">
                    <span class="status-badge ${npc.status}">${npc.status.charAt(0).toUpperCase() + npc.status.slice(1).replace('-', ' ')}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ===================================
// Location Functions
// ===================================

function addLocation() {
    document.getElementById('location-form').reset();
    openModal('location-modal');
}

function initLocationForm() {
    const form = document.getElementById('location-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const newLocation = {
            id: Date.now(),
            name: document.getElementById('location-name-input').value,
            ward: document.getElementById('location-ward-input').value,
            image: document.getElementById('location-image-input').value || D20_PLACEHOLDER,
            description: document.getElementById('location-description-input').value,
            tags: document.getElementById('location-tags-input').value.split(',').map(t => t.trim()).filter(t => t)
        };

        const data = CampaignData.get();
        data.locations.push(newLocation);
        CampaignData.save(data);

        renderLocations();
        CampaignData.addActivity('🗺️', `New location added: "${newLocation.name}"`);
        closeModal('location-modal');
    });
}

function renderLocations() {
    const list = document.getElementById('locations-list');
    if (!list) return;
    const data = CampaignData.get();

    // Default locations
    const defaultLocations = [
        {
            id: 'yawning-portal',
            name: 'The Yawning Portal',
            ward: 'Castle Ward',
            image: D20_PLACEHOLDER,
            description: 'The most famous tavern in all of Waterdeep, built around the entrance to Undermountain. Adventurers come from across the Sword Coast to test their mettle in the depths below.',
            tags: ['Tavern', 'Dungeon Entrance', 'Known']
        },
        {
            id: 'dock-ward',
            name: 'The Dock Ward',
            ward: 'Dock Ward',
            image: D20_PLACEHOLDER,
            description: 'The roughest and most dangerous ward of Waterdeep. Home to sailors, warehouses, and those who prefer to conduct business away from prying eyes.',
            tags: ['Harbor', 'Dangerous', 'Known']
        }
    ];

    const allLocations = [...defaultLocations, ...data.locations];

    list.innerHTML = allLocations.map(loc => `
        <div class="location-card">
            <div class="location-image">
                <img src="${loc.image}" alt="${loc.name}">
            </div>
            <div class="location-info">
                <h4>${loc.name}</h4>
                <p class="location-ward">${loc.ward}</p>
                <p class="location-description">${loc.description}</p>
                <div class="location-details">
                    ${loc.tags.map(tag => `<span class="detail">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// ===================================
// Quest Functions
// ===================================

function addQuest() {
    document.getElementById('quest-form').reset();
    openModal('quest-modal');
}

function initQuestForm() {
    const form = document.getElementById('quest-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const newQuest = {
            id: Date.now(),
            name: document.getElementById('quest-name-input').value,
            type: document.getElementById('quest-type-select').value,
            giver: document.getElementById('quest-giver-input').value,
            description: document.getElementById('quest-description-input').value,
            rewards: document.getElementById('quest-rewards-input').value.split(',').map(r => r.trim()).filter(r => r),
            progress: 0,
            status: 'active'
        };

        const data = CampaignData.get();
        data.quests.push(newQuest);
        CampaignData.save(data);

        renderQuests();
        CampaignData.addActivity('⚔️', `New quest added: "${newQuest.name}"`);
        closeModal('quest-modal');
    });
}

function renderQuests() {
    const list = document.getElementById('quests-list');
    if (!list) return;
    const data = CampaignData.get();

    list.innerHTML = data.quests.map(quest => `
        <div class="quest-card ${quest.type}">
            <div class="quest-status-indicator ${quest.status}"></div>
            <div class="quest-info">
                <div class="quest-header">
                    <h4>${quest.name}</h4>
                    <span class="quest-type ${quest.type}-quest">${quest.type.charAt(0).toUpperCase() + quest.type.slice(1)} Quest</span>
                </div>
                <p class="quest-giver">Quest Giver: ${quest.giver}</p>
                <p class="quest-description">${quest.description}</p>
                <div class="quest-rewards">
                    ${quest.rewards.map(r => `<span class="reward">${r}</span>`).join('')}
                </div>
                <div class="quest-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${quest.progress}%"></div>
                    </div>
                    <span class="progress-text">${quest.progress === 0 ? 'Not Started' : quest.progress === 100 ? 'Complete' : `${quest.progress}%`}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ===================================
// Gallery Functions
// ===================================

function openImageUpload() {
    document.getElementById('image-form').reset();
    openModal('image-modal');
}

function initImageForm() {
    const form = document.getElementById('image-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const newImage = {
            id: Date.now(),
            url: document.getElementById('image-url-input').value,
            title: document.getElementById('image-title-input').value,
            description: document.getElementById('image-description-input').value,
            category: document.getElementById('image-category-select').value
        };

        const data = CampaignData.get();
        data.gallery.push(newImage);
        CampaignData.save(data);

        renderGallery();
        CampaignData.addActivity('🎨', `New image added to gallery: "${newImage.title}"`);
        closeModal('image-modal');
    });
}

function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    const data = CampaignData.get();

    // Default gallery items
    const defaultItems = [
        { id: 'city', url: D20_PLACEHOLDER, title: 'City of Waterdeep', description: 'The City of Splendors', category: 'maps' },
        { id: 'tavern', url: D20_PLACEHOLDER, title: 'The Yawning Portal', description: 'Famous Tavern & Dungeon Entrance', category: 'locations' },
        { id: 'streets', url: D20_PLACEHOLDER, title: 'Streets of Waterdeep', description: 'The bustling city streets', category: 'locations' },
        { id: 'harbor', url: D20_PLACEHOLDER, title: 'Waterdeep Harbor', description: 'The Dock Ward', category: 'locations' },
        { id: 'noble', url: D20_PLACEHOLDER, title: 'Sea Ward', description: 'Home of Waterdeep\'s Nobility', category: 'locations' },
        { id: 'sewers', url: D20_PLACEHOLDER, title: 'The Sewers', description: 'Beneath the streets', category: 'locations' },
        { id: 'treasure', url: D20_PLACEHOLDER, title: 'The Dragon Hoard', description: '500,000 Gold Dragons', category: 'items' },
        { id: 'magic', url: D20_PLACEHOLDER, title: 'Magical Artifacts', description: 'Items of Power', category: 'items' }
    ];

    const allItems = [...defaultItems, ...data.gallery];

    grid.innerHTML = allItems.map(item => `
        <div class="gallery-item" data-category="${item.category}" onclick="openLightbox('${item.url}', '${item.title}', '${item.description}')">
            <img src="${item.url}" alt="${item.title}">
            <div class="gallery-overlay">
                <h4>${item.title}</h4>
                <p>${item.description}</p>
            </div>
        </div>
    `).join('');
}

// ===================================
// Lightbox
// ===================================

function openLightbox(url, title, description) {
    document.getElementById('lightbox-img').src = url;
    document.getElementById('lightbox-title').textContent = title;
    document.getElementById('lightbox-description').textContent = description;
    document.getElementById('lightbox').classList.add('active');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
}


// ===================================
// Synopsis Editing
// ===================================

function toggleEditSynopsis() {
    const display = document.getElementById('synopsis-display');
    const edit = document.getElementById('synopsis-edit');
    const editor = document.getElementById('synopsis-textarea');

    display.classList.toggle('hidden');
    edit.classList.toggle('hidden');

    if (!edit.classList.contains('hidden')) {
        editor.innerHTML = display.innerHTML;
        editor.focus();
    }
}

function saveSynopsis() {
    const display = document.getElementById('synopsis-display');
    const editor = document.getElementById('synopsis-textarea');

    display.innerHTML = editor.innerHTML;

    const data = CampaignData.get();
    data.campaign.synopsis = editor.innerHTML;
    CampaignData.save(data);

    CampaignData.addActivity('📚', 'Campaign synopsis updated');
    cancelEditSynopsis();
}

function cancelEditSynopsis() {
    document.getElementById('synopsis-display').classList.remove('hidden');
    document.getElementById('synopsis-edit').classList.add('hidden');
}

function loadSynopsis() {
    const data = CampaignData.get();
    if (data.campaign && data.campaign.synopsis) {
        document.getElementById('synopsis-display').innerHTML = data.campaign.synopsis;
    }
}

// ===================================
// Rules Editing
// ===================================

function renderRules() {
    const data = CampaignData.get();
    if (!data.rules) return;
    Object.keys(data.rules).forEach(ruleId => {
        const content = document.getElementById(`${ruleId}-content`) || (document.getElementById(`rule-${ruleId}`) ? document.getElementById(`rule-${ruleId}`).querySelector('.rule-content') : null);
        if (content) {
            const display = content.querySelector('.rule-display');
            if (display && data.rules[ruleId]) {
                display.innerHTML = data.rules[ruleId];
            }
        }
    });
}

function toggleEditRules(ruleId) {
    const content = document.getElementById(`${ruleId}-content`) || document.getElementById(`rule-${ruleId}`).querySelector('.rule-content');
    const display = content.querySelector('.rule-display');
    const edit = content.querySelector('.rule-edit');
    const editor = content.querySelector('.editor-content');

    display.classList.toggle('hidden');
    edit.classList.toggle('hidden');

    if (!edit.classList.contains('hidden')) {
        const data = CampaignData.get();
        editor.innerHTML = (data.rules && data.rules[ruleId]) ? data.rules[ruleId] : display.innerHTML;
        editor.focus();
    }
}

function saveRules(ruleId) {
    const content = document.getElementById(`${ruleId}-content`) || document.getElementById(`rule-${ruleId}`).querySelector('.rule-content');
    const display = content.querySelector('.rule-display');
    const editor = content.querySelector('.editor-content');

    display.innerHTML = editor.innerHTML;

    const data = CampaignData.get();
    if (!data.rules) data.rules = {};
    data.rules[ruleId] = editor.innerHTML;
    CampaignData.save(data);

    CampaignData.addActivity('⚖️', `Rules updated: ${ruleId}`);
    cancelEditRules(ruleId);
}

function cancelEditRules(ruleId) {
    const content = document.getElementById(`${ruleId}-content`) || document.getElementById(`rule-${ruleId}`).querySelector('.rule-content');
    const display = content.querySelector('.rule-display');
    const edit = content.querySelector('.rule-edit');

    display.classList.remove('hidden');
    edit.classList.add('hidden');
}

// ===================================
// Session Info
// ===================================

function toggleSessionEdit() {
    const display = document.getElementById('session-display');
    const edit = document.getElementById('session-edit');

    if (!display || !edit) {
        console.error('Session display/edit elements not found');
        return;
    }

    if (display.classList.contains('hidden')) {
        // Switch to display mode
        display.classList.remove('hidden');
        edit.classList.add('hidden');
    } else {
        // Switch to edit mode
        display.classList.add('hidden');
        edit.classList.remove('hidden');
    }
}

// Helper function to format date as DD-MM-YY (European format)
function formatEuropeanDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

// Helper function to format date and time as DD-MM-YY HH:MM (European format)
function formatEuropeanDateTime(date) {
    const d = date instanceof Date ? date : new Date(date);
    const dateStr = formatEuropeanDate(d);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}`;
}

function formatSessionDateTime(dateTimeString) {
    if (!dateTimeString) return 'Not scheduled';

    const date = new Date(dateTimeString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[date.getDay()];

    return `${dayName}, ${formatEuropeanDateTime(date)}`;
}

function updateSessionDateDisplayInput() {
    const dateInput = document.getElementById('next-session-date');
    const displayInput = document.getElementById('next-session-date-display-input');
    if (dateInput.value) {
        const date = new Date(dateInput.value);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        displayInput.value = `${day}/${month}/${year}, ${hours}:${minutes}`;
    } else {
        displayInput.value = '';
    }
}

// Attach change listener once DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('next-session-date');
    if (dateInput) {
        dateInput.addEventListener('change', updateSessionDateDisplayInput);
        dateInput.addEventListener('input', updateSessionDateDisplayInput);
    }
});

function updateSessionDisplay() {
    const data = CampaignData.get();

    const dateDisplay = document.getElementById('session-date-display');
    const locationDisplay = document.getElementById('session-location-display');
    const notesDisplay = document.getElementById('session-notes-display');

    dateDisplay.textContent = formatSessionDateTime(data.campaign.nextSessionDate);
    locationDisplay.textContent = data.campaign.nextSessionLocation || 'Not set';
    notesDisplay.textContent = data.campaign.sessionNotes || 'No notes yet';
}

function saveSessionInfo() {
    const date = document.getElementById('next-session-date').value;
    const location = document.getElementById('next-session-location').value;
    const notes = document.getElementById('session-notes').value;

    const data = CampaignData.get();
    data.campaign.nextSessionDate = date;
    data.campaign.nextSessionLocation = location;
    data.campaign.sessionNotes = notes;
    CampaignData.save(data);

    CampaignData.addActivity('📅', 'Session info updated');

    // Update display and switch to display mode
    updateSessionDisplay();
    toggleSessionEdit();
}

function loadSessionInfo() {
    const data = CampaignData.get();

    if (data.campaign.nextSessionDate) {
        document.getElementById('next-session-date').value = data.campaign.nextSessionDate;
        updateSessionDateDisplayInput();
    }
    if (data.campaign.nextSessionLocation) {
        document.getElementById('next-session-location').value = data.campaign.nextSessionLocation;
    }
    if (data.campaign.sessionNotes) {
        document.getElementById('session-notes').value = data.campaign.sessionNotes;
    }

    // Also update the display view
    updateSessionDisplay();
}

// ===================================
// Rich Text Editor
// ===================================

function formatText(command, value = null) {
    document.execCommand(command, false, value);
}

// ===================================
// Character Management
// ===================================

let currentEditingCharacterId = null;

function openCharacterModal(characterId = null) {
    const form = document.getElementById('character-form');
    const title = document.getElementById('character-modal-title');
    const deleteBtn = document.getElementById('delete-character-btn');
    const backgroundEditor = document.getElementById('character-background-content');

    // Reset form
    form.reset();
    backgroundEditor.innerHTML = '';
    currentEditingCharacterId = null;

    // Reset type toggle
    document.querySelectorAll('.type-toggle .toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === 'pc') btn.classList.add('active');
    });
    document.getElementById('character-type-input').value = 'pc';
    document.getElementById('player-name-row').style.display = 'flex';

    if (characterId) {
        // Editing existing character
        const data = CampaignData.get();
        const character = data.characters.find(c => c.id === characterId);

        if (character) {
            currentEditingCharacterId = characterId;
            title.textContent = 'Edit Character';
            deleteBtn.style.display = 'block';

            // Populate form
            document.getElementById('character-edit-id').value = characterId;
            document.getElementById('character-name-input').value = character.name;
            document.getElementById('character-species-input').value = character.species || '';
            document.getElementById('character-class-input').value = character.charClass || '';
            document.getElementById('character-subclass-input').value = character.subclass || '';
            document.getElementById('character-player-input').value = character.player || '';
            document.getElementById('character-level-input').value = character.level || 1;
            document.getElementById('character-ac-input').value = character.ac || 10;
            document.getElementById('character-init-input').value = character.initiative || '+0';
            document.getElementById('character-deceased-input').checked = !!character.deceased;
            resetPortraitState();
            if (character.portrait && character.portrait.startsWith('data:')) {
                _portraitDataUrl = character.portrait;
                document.getElementById('portrait-preview-img').src = character.portrait;
                document.getElementById('portrait-preview').style.display = 'flex';
                document.getElementById('character-portrait-input').value = '';
            } else {
                document.getElementById('character-portrait-input').value = character.portrait || '';
            }
            backgroundEditor.innerHTML = character.background || '';

            // Set type toggle
            setCharacterType(character.type || 'pc');
        }
    } else {
        // New character
        title.textContent = 'Add Character';
        deleteBtn.style.display = 'none';
        resetPortraitState();
    }

    openModal('character-modal');
    initPortraitUpload();
}

function setCharacterType(type) {
    document.querySelectorAll('.type-toggle .toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === type) btn.classList.add('active');
    });
    document.getElementById('character-type-input').value = type;

    // Show/hide player name field based on type
    const playerRow = document.getElementById('player-name-row');
    if (type === 'npc') {
        playerRow.querySelector('label[for="character-player-input"]').textContent = 'Controlled By (optional)';
    } else {
        playerRow.querySelector('label[for="character-player-input"]').textContent = 'Player Name';
    }
}

function viewCharacter(characterId) {
    const data = CampaignData.get();
    const char = data.characters.find(c => c.id === characterId);
    if (!char) return;

    document.getElementById('story-view-title').textContent = char.name;
    document.getElementById('story-view-type').textContent = char.type.toUpperCase();
    document.getElementById('story-view-type').className = `tale-type-badge ${char.type}`;
    document.getElementById('story-view-author').textContent = char.player ? (char.type === 'pc' ? `Player: ${char.player}` : `Controlled by: ${char.player}`) : '';
    document.getElementById('story-view-date').textContent = `Level ${char.level}`;
    document.getElementById('story-view-content').innerHTML = `
        <p><strong>${char.raceClass}</strong></p>
        <div class="stat-row" style="margin: 1rem 0; gap: 1.5rem; display: flex;">
            <span class="mini-stat">AC: ${char.ac}</span>
            <span class="mini-stat">Initiative: ${char.initiative}</span>
        </div>
        <hr style="border-color: rgba(212,175,55,0.2); margin: 1rem 0;">
        ${char.background || '<em>No background notes yet.</em>'}
    `;
    openModal('story-view-modal');
}

// Portrait upload handling
let _portraitDataUrl = null;

function switchPortraitTab(tab) {
    document.querySelectorAll('.portrait-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.portrait-tab-content').forEach(t => t.classList.remove('active'));
    if (tab === 'url') {
        document.querySelector('.portrait-tab:first-child').classList.add('active');
        document.getElementById('portrait-url-tab').classList.add('active');
    } else {
        document.querySelector('.portrait-tab:last-child').classList.add('active');
        document.getElementById('portrait-upload-tab').classList.add('active');
    }
}

function handlePortraitFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        _portraitDataUrl = e.target.result;
        document.getElementById('character-portrait-input').value = '';
        const preview = document.getElementById('portrait-preview');
        document.getElementById('portrait-preview-img').src = _portraitDataUrl;
        preview.style.display = 'flex';
    };
    reader.readAsDataURL(file);
}

function clearPortraitUpload() {
    _portraitDataUrl = null;
    document.getElementById('portrait-preview').style.display = 'none';
    document.getElementById('portrait-preview-img').src = '';
    document.getElementById('portrait-file-input').value = '';
}

function initPortraitUpload() {
    const zone = document.getElementById('portrait-upload-zone');
    const fileInput = document.getElementById('portrait-file-input');
    if (!zone || !fileInput) return;

    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handlePortraitFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handlePortraitFile(e.target.files[0]);
    });
}

function getPortraitValue() {
    if (_portraitDataUrl) return _portraitDataUrl;
    return document.getElementById('character-portrait-input').value || '';
}

function resetPortraitState() {
    _portraitDataUrl = null;
    const preview = document.getElementById('portrait-preview');
    if (preview) preview.style.display = 'none';
    const fileInput = document.getElementById('portrait-file-input');
    if (fileInput) fileInput.value = '';
    switchPortraitTab('url');
}

function validateCharacterData(characterData) {
    // Validate required fields
    if (!characterData.name || characterData.name.trim() === '') {
        alert('Character name is required.');
        return false;
    }

    if (!characterData.type || (characterData.type !== 'pc' && characterData.type !== 'npc')) {
        alert('Character type must be either PC or NPC.');
        return false;
    }

    // Validate numeric fields
    if (typeof characterData.level !== 'number' || characterData.level < 1 || characterData.level > 20) {
        alert('Character level must be between 1 and 20.');
        return false;
    }

    if (typeof characterData.ac !== 'number' || characterData.ac < 0) {
        alert('Character AC must be a positive number.');
        return false;
    }

    // Validate initiative format (should be like +3, -1, etc.)
    if (!characterData.initiative || !/^[+-]?\d+$/.test(characterData.initiative)) {
        alert('Character initiative must be a number with optional +/- sign (e.g., +3, -1, 0).');
        return false;
    }

    // Ensure all required fields exist
    if (!characterData.id || !characterData.raceClass || characterData.portrait === undefined) {
        alert('Some required character fields are missing. Please try again.');
        return false;
    }

    return true;
}

function sanitizeCharacterData(characterData) {
    // Trim string fields and ensure they exist
    return {
        ...characterData,
        name: (characterData.name || '').trim(),
        species: (characterData.species || '').trim(),
        charClass: (characterData.charClass || '').trim(),
        subclass: (characterData.subclass || '').trim(),
        player: (characterData.player || '').trim(),
        raceClass: (characterData.raceClass || '').trim(),
        background: characterData.background || '',
        deceased: Boolean(characterData.deceased),
        level: parseInt(characterData.level) || 1,
        ac: parseInt(characterData.ac) || 10
    };
}

function initCharacterForm() {
    const form = document.getElementById('character-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const backgroundEditor = document.getElementById('character-background-content');
        const species = document.getElementById('character-species-input').value;
        const charClass = document.getElementById('character-class-input').value;
        const subclass = document.getElementById('character-subclass-input').value;
        const raceClass = [species, subclass ? `${charClass} (${subclass})` : charClass].filter(Boolean).join(' ');

        let characterData = {
            id: currentEditingCharacterId || Date.now(),
            type: document.getElementById('character-type-input').value,
            name: document.getElementById('character-name-input').value,
            raceClass: raceClass,
            species: species,
            charClass: charClass,
            subclass: subclass,
            player: document.getElementById('character-player-input').value,
            level: parseInt(document.getElementById('character-level-input').value) || 1,
            ac: parseInt(document.getElementById('character-ac-input').value) || 10,
            initiative: document.getElementById('character-init-input').value || '+0',
            deceased: document.getElementById('character-deceased-input').checked,
            portrait: getPortraitValue() || getDefaultPortrait(document.getElementById('character-type-input').value),
            background: backgroundEditor.innerHTML,
            createdAt: currentEditingCharacterId ? undefined : new Date().toISOString()
        };

        // Sanitize and validate character data
        characterData = sanitizeCharacterData(characterData);

        if (!validateCharacterData(characterData)) {
            return; // Stop submission if validation fails
        }

        const data = CampaignData.get();

        if (currentEditingCharacterId) {
            // Update existing character
            const index = data.characters.findIndex(c => c.id === currentEditingCharacterId);
            if (index !== -1) {
                characterData.createdAt = data.characters[index].createdAt;
                data.characters[index] = characterData;
            }
            CampaignData.save(data);
            CampaignData.addActivity('⚔️', `Updated character: "${characterData.name}"`);
        } else {
            // Add new character
            data.characters.push(characterData);
            CampaignData.save(data);
            CampaignData.addActivity('⚔️', `Added new ${characterData.type.toUpperCase()}: "${characterData.name}"`);
        }
        renderCharacters();
        loadPCsForInitiative(); // Refresh initiative tracker PC list
        loadNPCsForInitiative(); // Refresh initiative tracker NPC list
        closeModal('character-modal');
    });
}

function deleteCharacter() {
    if (!currentEditingCharacterId) return;

    const data = CampaignData.get();
    const character = data.characters.find(c => c.id === currentEditingCharacterId);

    if (confirm(`Are you sure you want to delete "${character?.name}"? This cannot be undone.`)) {
        data.characters = data.characters.filter(c => c.id !== currentEditingCharacterId);
        CampaignData.save(data);
        CampaignData.addActivity('🗑️', `Deleted character: "${character?.name}"`);
        renderCharacters();
        loadPCsForInitiative(); // Refresh initiative tracker PC list
        loadNPCsForInitiative(); // Refresh initiative tracker NPC list
        closeModal('character-modal');
    }
}

function getDefaultPortrait(type) {
    return D20_PLACEHOLDER;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

function renderCharacters(filter = 'all') {
    const grid = document.getElementById('party-grid');

    try {
        const data = CampaignData.get();

        if (!data || !Array.isArray(data.characters)) {
            console.error('Invalid data structure: characters array not found');
            grid.innerHTML = '<div class="party-empty-state"><p>Error loading characters. Please refresh the page.</p></div>';
            return;
        }

        let characters = data.characters;

        // Apply filter
        if (filter !== 'all') {
            characters = characters.filter(c => c && c.type === filter);
        }

        if (characters.length === 0) {
            grid.innerHTML = `
                <div class="party-empty-state">
                    <div class="empty-icon">⚔️</div>
                    <h3>No Characters Yet</h3>
                    <p>Add your first character to get started!</p>
                    <button class="btn btn-primary" onclick="openCharacterModal()">+ Add Character</button>
                </div>
            `;
            return;
        }

        const renderedCharacters = [];

        characters.forEach((char, index) => {
            try {
                // Validate character has required fields
                if (!char || !char.id) {
                    console.warn(`Character at index ${index} is missing required fields:`, char);
                    return;
                }

                // Provide defaults for missing fields
                const safeChar = {
                    id: char.id,
                    type: char.type || 'npc',
                    name: char.name || 'Unknown Character',
                    raceClass: char.raceClass || 'Unknown',
                    player: char.player || '',
                    level: char.level || 1,
                    ac: char.ac || 10,
                    initiative: char.initiative || '+0',
                    deceased: Boolean(char.deceased),
                    portrait: char.portrait || getDefaultPortrait(char.type || 'npc'),
                    background: char.background || ''
                };

                // Escape HTML in user-provided fields to prevent injection
                const safeName = escapeHtml(safeChar.name);
                const safePlayer = escapeHtml(safeChar.player);
                const safeRaceClass = escapeHtml(safeChar.raceClass);
                const safeType = escapeHtml(safeChar.type);

                renderedCharacters.push(`
                    <div class="character-card${safeChar.deceased ? ' deceased' : ''}" data-character-id="${safeChar.id}" data-type="${safeType}">
                        <span class="character-type-badge ${safeType}">${safeType.toUpperCase()}</span>
                        <div class="character-portrait">
                            <img src="${escapeHtml(safeChar.portrait)}" alt="${safeName}" class="portrait-img" onerror="this.src='${getDefaultPortrait(safeChar.type)}'">
                            <div class="level-badge">Lvl ${safeChar.level}</div>
                        </div>
                        <div class="character-info">
                            <h3 class="char-name">${safeName}${safeChar.deceased ? ' <span class="deceased-tag">Deceased</span>' : ''}</h3>
                            <p class="char-race-class">${safeRaceClass}</p>
                            ${safePlayer ? `<p class="char-player">${safeType === 'pc' ? 'Player' : 'Controlled by'}: ${safePlayer}</p>` : ''}
                            <div class="char-stats">
                                <div class="stat-row">
                                    <span class="mini-stat">AC: ${safeChar.ac}</span>
                                    <span class="mini-stat">Init: ${escapeHtml(safeChar.initiative)}</span>
                                </div>
                            </div>
                            <div class="char-background">
                                <p class="background-text">${escapeHtml(stripHtml(safeChar.background)).substring(0, 150)}${safeChar.background && safeChar.background.length > 150 ? '...' : ''}</p>
                            </div>
                        </div>
                        <div class="char-actions">
                            <button class="btn btn-small" onclick="viewCharacter(${safeChar.id})">View</button>
                            <button class="btn btn-small" onclick="openCharacterModal(${safeChar.id})">Edit</button>
                        </div>
                    </div>
                `);
            } catch (charError) {
                console.error(`Error rendering character at index ${index}:`, char, charError);
                // Skip this character but continue rendering others
            }
        });

        grid.innerHTML = renderedCharacters.join('');

        if (renderedCharacters.length === 0 && characters.length > 0) {
            console.error('All characters failed to render. Check console for details.');
            grid.innerHTML = '<div class="party-empty-state"><p>Error rendering characters. Please check the console for details.</p></div>';
        }

    } catch (error) {
        console.error('Critical error in renderCharacters:', error);
        grid.innerHTML = '<div class="party-empty-state"><p>Critical error loading characters. Please refresh the page.</p></div>';
    }
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
}

function initCharacterFilters() {
    const filters = document.querySelectorAll('.character-filters .filter-btn');
    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCharacters(btn.dataset.filter);
        });
    });
}

// ===================================
// Auto-save contenteditable fields
// ===================================

function initContentEditable() {
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        el.addEventListener('blur', () => {
            // Save character data when editing
            const charCard = el.closest('.character-card');
            if (charCard) {
                saveCharacterData();
            }
        });
    });
}

function saveCharacterData() {
    // This would save all character data - can be expanded later
    CampaignData.addActivity('⚔️', 'Character information updated');
}

// ===================================
// PC Tales Functions
// ===================================

function editTale(taleId) {
    const data = CampaignData.get();
    const tale = data.tales.find(t => t.id === taleId);
    if (!tale) return;

    document.getElementById('tale-edit-id').value = taleId;
    document.getElementById('tale-title-input').value = tale.title || '';
    document.getElementById('tale-type-select').value = tale.type;
    document.getElementById('tale-author-input').value = tale.author || '';
    document.getElementById('tale-session-input').value = tale.session || '';
    document.getElementById('tale-content-input').innerHTML = tale.content || '';
    document.getElementById('tale-modal-title').textContent = 'Edit Entry';
    openModal('tale-modal');
}

function deleteTale(taleId) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    const data = CampaignData.get();
    if (!data.tales) return;
    data.tales = data.tales.filter(t => t.id !== taleId);
    CampaignData.save(data);
    renderTales();
    CampaignData.addActivity('🗑️', 'Deleted PC Tales entry');
}

function openTaleModal(type = 'journal') {
    document.getElementById('tale-form').reset();
    document.getElementById('tale-edit-id').value = '';
    document.getElementById('tale-type-select').value = type;
    document.getElementById('tale-content-input').innerHTML = '';
    document.getElementById('tale-modal-title').textContent = 'New Entry';
    openModal('tale-modal');
}

function initTaleForm() {
    const form = document.getElementById('tale-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const contentEditor = document.getElementById('tale-content-input');
        const editId = document.getElementById('tale-edit-id').value;

        const taleData = {
            id: editId ? parseInt(editId) : Date.now(),
            title: document.getElementById('tale-title-input').value,
            type: document.getElementById('tale-type-select').value,
            author: document.getElementById('tale-author-input').value,
            session: document.getElementById('tale-session-input').value,
            content: contentEditor.innerHTML,
            createdAt: editId ? undefined : new Date().toISOString()
        };

        const data = CampaignData.get();

        if (editId) {
            const index = data.tales.findIndex(t => t.id === parseInt(editId));
            if (index !== -1) {
                taleData.createdAt = data.tales[index].createdAt;
                data.tales[index] = taleData;
            }
        } else {
            data.tales.push(taleData);
        }

        CampaignData.save(data);
        renderTales();
        CampaignData.addActivity('📔', `Added new entry: "${taleData.title}"`);
        closeModal('tale-modal');
    });
}

function renderTales() {
    const data = CampaignData.get();

    // Journals
    const journalsGrid = document.getElementById('journals-grid');
    if (journalsGrid) {
        const journals = data.tales.filter(t => t.type === 'journal');
        if (journals.length === 0) {
            journalsGrid.innerHTML = '<div class="initiative-empty"><p>No journal entries yet. Add your first IC log!</p></div>';
        } else {
            journalsGrid.innerHTML = journals.map(tale => renderTaleCard(tale)).join('');
        }
    }

    // Relationship Snippets
    const relationshipsGrid = document.getElementById('relationships-grid');
    if (relationshipsGrid) {
        const relationships = data.tales.filter(t => t.type === 'relationship');
        if (relationships.length === 0) {
            relationshipsGrid.innerHTML = '<div class="initiative-empty"><p>No relationship snippets yet. Add your first one!</p></div>';
        } else {
            relationshipsGrid.innerHTML = relationships.map(tale => renderTaleCard(tale)).join('');
        }
    }

    // Background Stories
    const backgroundsGrid = document.getElementById('backgrounds-grid');
    if (backgroundsGrid) {
        const backgrounds = data.tales.filter(t => t.type === 'background');
        if (backgrounds.length === 0) {
            backgroundsGrid.innerHTML = '<div class="initiative-empty"><p>No background stories yet. Add your first one!</p></div>';
        } else {
            backgroundsGrid.innerHTML = backgrounds.map(tale => renderTaleCard(tale)).join('');
        }
    }

    // Misc
    const miscList = document.getElementById('misc-list');
    if (miscList) {
        const misc = data.tales.filter(t => t.type === 'misc');
        if (misc.length === 0) {
            miscList.innerHTML = '<div class="initiative-empty"><p>No other entries yet.</p></div>';
        } else {
            miscList.innerHTML = misc.map(tale => renderTaleCard(tale)).join('');
        }
    }
}

function renderTaleCard(tale) {
    return `
        <div class="tale-card">
            <div class="tale-header">
                <span class="tale-type-badge ${tale.type}">${tale.type}</span>
                <span class="tale-session">${tale.session || ''}</span>
            </div>
            <div class="tale-content">
                <h4 class="tale-title">${tale.title}</h4>
                <p class="tale-meta">${tale.author || 'Unknown'}</p>
                <div class="tale-preview">${stripHtml(tale.content).substring(0, 150)}...</div>
            </div>
            <div class="tale-footer">
                <button class="btn btn-small" onclick="viewTale(${tale.id})">Read</button>
                <button class="btn btn-small" onclick="editTale(${tale.id})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteTale(${tale.id})">Delete</button>
            </div>
        </div>
    `;
}

function viewTale(taleId) {
    const data = CampaignData.get();
    const tale = data.tales.find(t => t.id === taleId);
    if (!tale) return;

    document.getElementById('story-view-title').textContent = tale.title;
    document.getElementById('story-view-type').textContent = tale.type;
    document.getElementById('story-view-type').className = `tale-type-badge ${tale.type}`;
    document.getElementById('story-view-author').textContent = tale.author || 'Unknown';
    document.getElementById('story-view-date').textContent = tale.session || '';
    document.getElementById('story-view-content').innerHTML = tale.content;
    openModal('story-view-modal');
}

// ===================================
// Resource Functions
// ===================================

function editResource(resourceType) {
    const data = CampaignData.get();
    document.getElementById('resource-type-input').value = resourceType;

    const valueGroup = document.getElementById('resource-value-group');
    const contentEditor = document.getElementById('resource-content-input');

    if (resourceType === 'gold') {
        valueGroup.style.display = 'block';
        document.getElementById('resource-value-input').value = data.resources?.gold || 0;
        contentEditor.innerHTML = data.resources?.goldNotes || '';
        document.getElementById('resource-modal-title').textContent = 'Edit Party Gold';
    } else {
        valueGroup.style.display = 'none';
        contentEditor.innerHTML = data.resources?.[resourceType] || '';
        const titles = {
            inventory: 'Edit Party Inventory',
            property: 'Edit Party Property',
            contacts: 'Edit Contacts & Allies'
        };
        document.getElementById('resource-modal-title').textContent = titles[resourceType] || 'Edit Resource';
    }

    openModal('resource-modal');
}

function initResourceForm() {
    const form = document.getElementById('resource-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const resourceType = document.getElementById('resource-type-input').value;
        const contentEditor = document.getElementById('resource-content-input');
        const data = CampaignData.get();

        if (!data.resources) data.resources = {};

        if (resourceType === 'gold') {
            data.resources.gold = parseInt(document.getElementById('resource-value-input').value) || 0;
            data.resources.goldNotes = contentEditor.innerHTML;
        } else {
            data.resources[resourceType] = contentEditor.innerHTML;
        }

        CampaignData.save(data);
        renderResources();
        CampaignData.addActivity('💰', `Updated party ${resourceType}`);
        closeModal('resource-modal');
    });
}

function renderResources() {
    const data = CampaignData.get();
    const resources = data.resources || {};

    const goldResource = document.getElementById('party-gold-resource');
    if (goldResource) goldResource.textContent = `${resources.gold || 0} gp`;

    const goldNotes = document.getElementById('gold-notes');
    if (goldNotes) goldNotes.innerHTML = resources.goldNotes || 'Track party treasury here';

    const inventory = document.getElementById('party-inventory');
    if (inventory) inventory.innerHTML = resources.inventory || '<p><em>No shared items yet</em></p>';

    const property = document.getElementById('party-property');
    if (property) property.innerHTML = resources.property || '<p><em>No properties acquired</em></p>';

    const contacts = document.getElementById('party-contacts');
    if (contacts) contacts.innerHTML = resources.contacts || '<p><em>No notable contacts yet</em></p>';
}

function openResourceModal() {
    // Generic resource add - not used currently but can be extended
    openModal('resource-modal');
}

// ===================================
// DM Notes Functions
// ===================================

function addDMNote() {
    document.getElementById('note-form').reset();
    document.getElementById('note-content-input').innerHTML = '';
    document.getElementById('note-edit-id').value = '';
    document.getElementById('note-type-hidden').value = 'dm';
    document.getElementById('note-modal-title').textContent = 'New DM Note';
    openModal('note-modal');
}

function renderDMNotes() {
    const data = CampaignData.get();
    const dmNotesList = document.getElementById('dm-notes-list');
    if (!dmNotesList) return;

    const dmNotes = data.dmNotes || [];

    if (dmNotes.length === 0) {
        dmNotesList.innerHTML = '<div class="initiative-empty"><p>No DM notes yet.</p></div>';
        return;
    }

    dmNotesList.innerHTML = dmNotes.map(note => `
        <div class="note-card dm">
            <div class="note-header">
                <h4>${note.title}</h4>
                <div class="note-actions">
                    <button class="btn btn-small" onclick="editNote('dm', ${note.id})">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteNote('dm', ${note.id})">Delete</button>
                </div>
            </div>
            <span class="note-date">${note.session}</span>
            <div class="note-content">
                ${formatNoteContent(note.content)}
            </div>
            <div class="note-tags">
                ${(note.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

// ===================================
// Session Summary Functions
// ===================================

function addSessionSummary() {
    document.getElementById('session-summary-form').reset();
    document.getElementById('summary-content-input').innerHTML = '';
    const data = CampaignData.get();
    document.getElementById('summary-session-input').value = (data.campaign.sessionNumber || 1);
    openModal('session-summary-modal');
}

function initSessionSummaryForm() {
    const form = document.getElementById('session-summary-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const contentEditor = document.getElementById('summary-content-input');

        const summaryData = {
            id: Date.now(),
            sessionNumber: parseInt(document.getElementById('summary-session-input').value) || 1,
            datePlayed: document.getElementById('summary-date-input').value,
            title: document.getElementById('summary-title-input').value,
            content: contentEditor.innerHTML,
            xpEarned: parseInt(document.getElementById('summary-xp-input').value) || 0,
            createdAt: new Date().toISOString()
        };

        const data = CampaignData.get();
        if (!data.sessionSummaries) data.sessionSummaries = [];
        data.sessionSummaries.push(summaryData);

        // Update XP if earned
        if (summaryData.xpEarned > 0) {
            data.campaign.currentXP = (data.campaign.currentXP || 0) + summaryData.xpEarned;
        }

        CampaignData.save(data);
        renderSessionSummaries();
        updateDashboardStats();
        CampaignData.addActivity('📝', `Added session ${summaryData.sessionNumber} summary`);
        closeModal('session-summary-modal');
    });
}

function renderSessionSummaries() {
    const data = CampaignData.get();
    const summariesList = document.getElementById('session-summaries-list');
    if (!summariesList) return;

    const summaries = data.sessionSummaries || [];

    if (summaries.length === 0) {
        summariesList.innerHTML = '<div class="initiative-empty"><p>No session summaries yet. Add your first recap!</p></div>';
        return;
    }

    // Sort by session number descending
    const sorted = [...summaries].sort((a, b) => b.sessionNumber - a.sessionNumber);

    summariesList.innerHTML = sorted.map(summary => `
        <div class="session-summary-card">
            <div class="summary-header">
                <span class="summary-session">Session ${summary.sessionNumber}</span>
                <div class="note-actions">
                    <button class="btn btn-small btn-danger" onclick="deleteSessionSummary(${summary.id})">Delete</button>
                </div>
            </div>
            <span class="summary-date">${summary.datePlayed || ''}</span>
            <div class="summary-content">
                <h4 class="summary-title">${summary.title || 'Untitled Session'}</h4>
                <div>${summary.content}</div>
                ${summary.xpEarned > 0 ? `<span class="summary-xp">+${summary.xpEarned} XP earned</span>` : ''}
            </div>
        </div>
    `).join('');
}

function deleteSessionSummary(summaryId) {
    if (!confirm('Are you sure you want to delete this session summary?')) return;
    const data = CampaignData.get();
    if (!data.sessionSummaries) return;
    data.sessionSummaries = data.sessionSummaries.filter(s => s.id !== summaryId);
    CampaignData.save(data);
    renderSessionSummaries();
    CampaignData.addActivity('🗑️', 'Deleted session summary');
}

// ===================================
// Initiative Tracker Functions
// ===================================

let selectedCombatantId = null;

function loadPCsForInitiative() {
    const data = CampaignData.get();
    const pcSelection = document.getElementById('pc-selection');
    if (!pcSelection) return;

    // Filter PCs that are not deceased
    const pcs = data.characters.filter(c => c.type === 'pc' && !c.deceased);

    if (pcs.length === 0) {
        pcSelection.innerHTML = '<p class="initiative-empty" style="padding: 1rem;">No PCs found. Add Player Characters in the Party tab.</p>';
        return;
    }

    // Get active PCs from encounter data
    const activePCs = data.encounter?.activePCs || pcs.map(pc => pc.id);

    pcSelection.innerHTML = pcs.map(pc => {
        const isActive = activePCs.includes(pc.id);
        return `
            <label class="pc-toggle ${isActive ? 'active' : 'inactive'}">
                <input type="checkbox" class="pc-toggle-checkbox"
                       data-pc-id="${pc.id}"
                       ${isActive ? 'checked' : ''}
                       onchange="togglePCInEncounter(${pc.id})">
                <div class="pc-toggle-info">
                    <div class="pc-toggle-name">${pc.name}</div>
                    <div class="pc-toggle-class">${pc.raceClass}</div>
                </div>
                <div class="pc-toggle-init">${pc.initiative || '+0'}</div>
            </label>
        `;
    }).join('');
}

function loadNPCsForInitiative() {
    const data = CampaignData.get();
    const npcSelection = document.getElementById('npc-selection');
    if (!npcSelection) return;

    // Filter NPCs that are not deceased
    const npcs = data.characters.filter(c => c.type === 'npc' && !c.deceased);

    if (npcs.length === 0) {
        npcSelection.innerHTML = '<p class="initiative-empty" style="padding: 1rem;">No NPCs found. Add NPCs in the Characters tab or use the quick-add form below.</p>';
        return;
    }

    // Get active NPCs from encounter data
    const activeNPCs = data.encounter?.activeNPCs || [];

    npcSelection.innerHTML = npcs.map(npc => {
        const isActive = activeNPCs.includes(npc.id);
        return `
            <label class="pc-toggle ${isActive ? 'active' : 'inactive'}">
                <input type="checkbox" class="pc-toggle-checkbox"
                       data-npc-id="${npc.id}"
                       ${isActive ? 'checked' : ''}
                       onchange="toggleNPCInEncounter(${npc.id})">
                <div class="pc-toggle-info">
                    <div class="pc-toggle-name">${npc.name}</div>
                    <div class="pc-toggle-class">${npc.raceClass || 'NPC'}</div>
                </div>
                <div class="pc-toggle-init">${npc.initiative || '+0'}</div>
            </label>
        `;
    }).join('');
}

function toggleNPCInEncounter(npcId) {
    const data = CampaignData.get();
    if (!data.encounter) data.encounter = { combatants: [], round: 1, currentTurn: 0, activePCs: [], activeNPCs: [] };

    if (!data.encounter.activeNPCs) {
        data.encounter.activeNPCs = [];
    }

    const index = data.encounter.activeNPCs.indexOf(npcId);
    if (index > -1) {
        data.encounter.activeNPCs.splice(index, 1);
        // Remove from combatants if present
        data.encounter.combatants = data.encounter.combatants.filter(c => c.npcId !== npcId);
    } else {
        data.encounter.activeNPCs.push(npcId);
    }

    CampaignData.save(data);
    loadNPCsForInitiative();
    renderInitiativeList();
}

function togglePCInEncounter(pcId) {
    const data = CampaignData.get();
    if (!data.encounter) data.encounter = { combatants: [], round: 1, currentTurn: 0, activePCs: [] };

    const pcs = data.characters.filter(c => c.type === 'pc');
    if (!data.encounter.activePCs) {
        data.encounter.activePCs = pcs.map(pc => pc.id);
    }

    const index = data.encounter.activePCs.indexOf(pcId);
    if (index > -1) {
        data.encounter.activePCs.splice(index, 1);
        // Remove from combatants if present
        data.encounter.combatants = data.encounter.combatants.filter(c => c.pcId !== pcId);
    } else {
        data.encounter.activePCs.push(pcId);
    }

    CampaignData.save(data);
    loadPCsForInitiative();
    renderInitiativeList();
}

function startNewEncounter() {
    const data = CampaignData.get();
    if (!data.encounter) data.encounter = { combatants: [], round: 1, currentTurn: 0, activePCs: [], activeNPCs: [] };

    // Reset encounter
    data.encounter.combatants = [];
    data.encounter.round = 1;
    data.encounter.currentTurn = 0;

    // Add active PCs to combatants (exclude deceased)
    const pcs = data.characters.filter(c => c.type === 'pc' && !c.deceased);
    const activePCs = data.encounter.activePCs || pcs.map(pc => pc.id);

    pcs.filter(pc => activePCs.includes(pc.id)).forEach(pc => {
        const initMod = parseInt(pc.initiative) || 0;
        data.encounter.combatants.push({
            id: Date.now() + Math.random(),
            pcId: pc.id,
            name: pc.name,
            type: 'pc',
            raceClass: pc.raceClass,
            initiative: null, // To be entered
            currentHp: pc.currentHp,
            maxHp: pc.maxHp,
            ac: pc.ac,
            initMod: initMod
        });
    });

    // Add active NPCs to combatants (exclude deceased)
    const npcs = data.characters.filter(c => c.type === 'npc' && !c.deceased);
    const activeNPCs = data.encounter.activeNPCs || [];

    npcs.filter(npc => activeNPCs.includes(npc.id)).forEach(npc => {
        const initMod = parseInt(npc.initiative) || 0;
        data.encounter.combatants.push({
            id: Date.now() + Math.random(),
            npcId: npc.id,
            name: npc.name,
            type: 'npc',
            raceClass: npc.raceClass || '',
            initiative: null, // To be entered
            currentHp: npc.currentHp || 10,
            maxHp: npc.maxHp || 10,
            ac: npc.ac || 10,
            initMod: initMod,
            saves: npc.saves || '',
            skills: npc.skills || '',
            spells: npc.spells || '',
            notes: npc.notes || ''
        });
    });

    CampaignData.save(data);
    renderInitiativeList();
    CampaignData.addActivity('⚡', 'New encounter started');
}

function initCombatNPCForm() {
    const form = document.getElementById('combat-npc-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const npcData = {
            id: Date.now() + Math.random(),
            name: document.getElementById('combat-npc-name').value,
            type: 'npc',
            initiative: parseInt(document.getElementById('combat-npc-init').value) || 0,
            currentHp: parseInt(document.getElementById('combat-npc-hp').value) || 1,
            maxHp: parseInt(document.getElementById('combat-npc-hp').value) || 1,
            ac: parseInt(document.getElementById('combat-npc-ac').value) || 10,
            saves: document.getElementById('combat-npc-saves').value,
            skills: document.getElementById('combat-npc-skills').value,
            spells: document.getElementById('combat-npc-spells').value,
            notes: document.getElementById('combat-npc-notes').value
        };

        const data = CampaignData.get();
        if (!data.encounter) data.encounter = { combatants: [], round: 1, currentTurn: 0, activePCs: [] };
        data.encounter.combatants.push(npcData);
        CampaignData.save(data);

        form.reset();
        renderInitiativeList();
        CampaignData.addActivity('👹', `Added ${npcData.name} to combat`);
    });
}

function renderInitiativeList() {
    const data = CampaignData.get();
    const initiativeList = document.getElementById('initiative-list');
    const roundCounter = document.getElementById('round-counter');
    if (!initiativeList) return;

    const encounter = data.encounter || { combatants: [], round: 1, currentTurn: 0 };

    if (roundCounter) {
        roundCounter.textContent = `Round ${encounter.round}`;
    }

    if (encounter.combatants.length === 0) {
        initiativeList.innerHTML = '<div class="initiative-empty"><p>No combatants yet. Add PCs and NPCs to begin!</p></div>';
        return;
    }

    initiativeList.innerHTML = encounter.combatants.map((combatant, index) => {
        const isActive = index === encounter.currentTurn;
        const isDead = combatant.currentHp <= 0;
        const hpPercent = (combatant.currentHp / combatant.maxHp) * 100;
        let hpClass = 'hp-good';
        if (hpPercent <= 25) hpClass = 'hp-critical';
        else if (hpPercent <= 50) hpClass = 'hp-warning';

        // Display initiative value - show '?' only if null/undefined, otherwise show the number (including 0)
        const initDisplay = combatant.initiative !== null && combatant.initiative !== undefined
            ? combatant.initiative
            : '';
        const initPlaceholder = combatant.initiative === null || combatant.initiative === undefined ? '?' : '';

        return `
            <div class="initiative-item ${isActive ? 'active-turn' : ''} is-${combatant.type} ${isDead ? 'is-dead' : ''}"
                 onclick="selectCombatant('${combatant.id}')">
                <div class="init-order">
                    <input type="number"
                           class="init-input"
                           value="${initDisplay}"
                           placeholder="${initPlaceholder}"
                           onclick="event.stopPropagation()"
                           onchange="updateCombatantInitiative('${combatant.id}', this.value)"
                           onkeydown="if(event.key === 'Enter') { this.blur(); }">
                </div>
                <div class="init-info">
                    <div class="init-name">
                        ${combatant.name}
                        <span class="init-type-badge ${combatant.type}">${combatant.type.toUpperCase()}</span>
                    </div>
                    <div class="init-class">${combatant.raceClass || ''}</div>
                </div>
                <div class="init-stats">
                    <div class="init-stat">
                        <span class="init-stat-label">HP</span>
                        <span class="init-stat-value ${hpClass}">${combatant.currentHp}/${combatant.maxHp}</span>
                    </div>
                    <div class="init-stat">
                        <span class="init-stat-label">AC</span>
                        <span class="init-stat-value">${combatant.ac}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateCombatantInitiative(combatantId, value) {
    const data = CampaignData.get();
    const combatant = data.encounter?.combatants.find(c => c.id == combatantId);
    if (!combatant) return;

    // Parse the value - allow 0 as a valid initiative
    const initValue = value === '' ? null : parseInt(value);
    combatant.initiative = isNaN(initValue) ? null : initValue;

    CampaignData.save(data);

    // Update the details panel if this combatant is selected
    if (selectedCombatantId == combatantId) {
        const initDisplay = combatant.initiative !== null ? combatant.initiative : '-';
        document.getElementById('detail-init').textContent = initDisplay;
    }
}

function selectCombatant(combatantId) {
    const data = CampaignData.get();
    const combatant = data.encounter?.combatants.find(c => c.id == combatantId);
    if (!combatant) return;

    selectedCombatantId = combatantId;

    document.getElementById('detail-name').textContent = combatant.name;
    document.getElementById('detail-hp').textContent = `${combatant.currentHp}/${combatant.maxHp}`;
    document.getElementById('detail-ac').textContent = combatant.ac;
    // Show initiative value properly - display '-' only if null/undefined, otherwise show the number
    const initDisplay = combatant.initiative !== null && combatant.initiative !== undefined
        ? combatant.initiative
        : '-';
    document.getElementById('detail-init').textContent = initDisplay;
    document.getElementById('detail-saves').textContent = combatant.saves || '-';
    document.getElementById('detail-skills').textContent = combatant.skills || '-';
    document.getElementById('detail-spells').textContent = combatant.spells || '-';
    document.getElementById('detail-notes').textContent = combatant.notes || '-';

    document.getElementById('combatant-details').style.display = 'block';
}

function closeCombatantDetails() {
    document.getElementById('combatant-details').style.display = 'none';
    selectedCombatantId = null;
}

function adjustHP(amount) {
    if (!selectedCombatantId) return;

    const data = CampaignData.get();
    const combatant = data.encounter?.combatants.find(c => c.id == selectedCombatantId);
    if (!combatant) return;

    combatant.currentHp = Math.max(0, Math.min(combatant.maxHp, combatant.currentHp + amount));
    CampaignData.save(data);

    document.getElementById('detail-hp').textContent = `${combatant.currentHp}/${combatant.maxHp}`;
    renderInitiativeList();
}

function removeCombatant() {
    if (!selectedCombatantId) return;

    const data = CampaignData.get();
    data.encounter.combatants = data.encounter.combatants.filter(c => c.id != selectedCombatantId);
    CampaignData.save(data);

    closeCombatantDetails();
    renderInitiativeList();
}

function sortByInitiative() {
    const data = CampaignData.get();
    if (!data.encounter?.combatants) return;

    // Sort by initiative value, placing null/undefined values at the end
    data.encounter.combatants.sort((a, b) => {
        const aInit = a.initiative !== null && a.initiative !== undefined ? a.initiative : -Infinity;
        const bInit = b.initiative !== null && b.initiative !== undefined ? b.initiative : -Infinity;
        return bInit - aInit;
    });
    data.encounter.currentTurn = 0;
    CampaignData.save(data);
    renderInitiativeList();
}

function nextTurn() {
    const data = CampaignData.get();
    if (!data.encounter?.combatants?.length) return;

    data.encounter.currentTurn++;
    if (data.encounter.currentTurn >= data.encounter.combatants.length) {
        data.encounter.currentTurn = 0;
        data.encounter.round++;
    }

    CampaignData.save(data);
    renderInitiativeList();
}

function clearEncounter() {
    if (!confirm('Clear all combatants and reset the encounter?')) return;

    const data = CampaignData.get();
    data.encounter = { combatants: [], round: 1, currentTurn: 0, activePCs: data.encounter?.activePCs || [] };
    CampaignData.save(data);
    renderInitiativeList();
    closeCombatantDetails();
}

// ===================================
// PC Tales Tab Navigation
// ===================================

function initPCTalesTabs() {
    const tabButtons = document.querySelectorAll('.pc-tales-container .tab-btn');
    const tabContents = document.querySelectorAll('.pc-tales-container .tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// ===================================
// Campaign Notes Tab Navigation
// ===================================

function initCampaignNotesTabs() {
    const tabButtons = document.querySelectorAll('.campaign-notes-container .tab-btn');
    const tabContents = document.querySelectorAll('.campaign-notes-container .tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// ===================================
// XP Thresholds (D&D 2024e)
// ===================================

const XP_THRESHOLDS = {
    1: 0,
    2: 300,
    3: 900,
    4: 2700,
    5: 6500,
    6: 14000,
    7: 23000,
    8: 34000,
    9: 48000,
    10: 64000,
    11: 85000,
    12: 100000,
    13: 120000,
    14: 140000,
    15: 165000,
    16: 195000,
    17: 225000,
    18: 265000,
    19: 305000,
    20: 355000
};

function getXPForLevel(level) {
    return XP_THRESHOLDS[level] || 0;
}

function getXPForNextLevel(level) {
    if (level >= 20) return XP_THRESHOLDS[20];
    return XP_THRESHOLDS[level + 1] || 0;
}

function calculateXPProgress(currentXP, level) {
    const currentLevelXP = getXPForLevel(level);
    const nextLevelXP = getXPForNextLevel(level);
    const xpIntoLevel = currentXP - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;

    if (level >= 20) return 100;
    return Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100));
}

// ===================================
// Dashboard Stats
// ===================================

function updateDashboardStats() {
    const data = CampaignData.get();
    const level = data.campaign.partyLevel || 3;
    const currentXP = data.campaign.currentXP || 450;
    const nextLevelXP = getXPForNextLevel(level);
    const xpNeeded = nextLevelXP - currentXP;
    const xpProgress = calculateXPProgress(currentXP, level);

    document.getElementById('party-level').textContent = level;
    document.getElementById('total-gold').textContent = data.campaign.totalGold || 0;
    document.getElementById('sessions-played').textContent = data.campaign.sessionsPlayed || 1;
    document.getElementById('current-chapter').textContent = data.campaign.currentChapter || 'Chapter 1: Along the High Road';
    document.getElementById('session-number').textContent = `Session ${data.campaign.sessionNumber || 1}`;
    document.getElementById('current-location').textContent = data.campaign.currentLocation || 'The High Road';
    document.getElementById('party-level-display').textContent = `Level ${level}`;

    // Update location badge
    const locationBadge = document.getElementById('location-badge');
    if (locationBadge) {
        locationBadge.textContent = data.campaign.currentLocation || 'The High Road';
    }

    // Update XP display
    const xpDisplay = document.getElementById('xp-display');
    const xpFill = document.getElementById('xp-fill');
    const xpHint = document.getElementById('xp-hint');

    if (xpDisplay) {
        xpDisplay.textContent = `${currentXP.toLocaleString()} / ${nextLevelXP.toLocaleString()} XP`;
    }
    if (xpFill) {
        xpFill.style.width = `${xpProgress}%`;
    }
    if (xpHint) {
        if (level >= 20) {
            xpHint.textContent = 'Maximum level reached!';
        } else {
            xpHint.textContent = `${xpNeeded.toLocaleString()} XP needed for Level ${level + 1}`;
        }
    }

    // Update campaign name
    const nameDisplay = document.getElementById('campaign-name-display');
    if (nameDisplay) {
        nameDisplay.textContent = `📍 ${data.campaign.name || 'Campaign Overview'}`;
    }

    // Update campaign image
    const campaignImg = document.getElementById('campaign-image');
    const d20Placeholder = document.getElementById('campaign-d20-placeholder');
    if (campaignImg && d20Placeholder) {
        if (data.campaign.campaignImage) {
            campaignImg.src = data.campaign.campaignImage;
            campaignImg.style.display = 'block';
            d20Placeholder.style.display = 'none';
        } else {
            campaignImg.style.display = 'none';
            d20Placeholder.style.display = '';
        }
    }
}

// ===================================
// Campaign Edit Modal
// ===================================

function openCampaignEditModal() {
    const data = CampaignData.get();

    document.getElementById('campaign-name-input').value = data.campaign.name || 'Waterdeep: Dragon Heist';
    document.getElementById('campaign-chapter-input').value = data.campaign.currentChapter || 'Chapter 1: Along the High Road';
    document.getElementById('campaign-session-input').value = data.campaign.sessionNumber || 1;
    document.getElementById('campaign-location-input').value = data.campaign.currentLocation || 'The High Road';
    document.getElementById('campaign-level-input').value = data.campaign.partyLevel || 3;
    document.getElementById('campaign-xp-input').value = data.campaign.currentXP || 450;
    document.getElementById('campaign-gold-input').value = data.campaign.totalGold || 0;

    // Show image preview if exists
    const preview = document.getElementById('campaign-image-preview');
    const removeBtn = document.getElementById('campaign-image-remove-btn');
    if (data.campaign.campaignImage) {
        preview.innerHTML = `<img src="${data.campaign.campaignImage}" style="max-width:200px; max-height:150px; border-radius:var(--border-radius);">`;
        removeBtn.style.display = '';
    } else {
        preview.innerHTML = '';
        removeBtn.style.display = 'none';
    }
    // Reset file input
    document.getElementById('campaign-image-input').value = '';

    openModal('campaign-modal');
}

function removeCampaignImage() {
    const data = CampaignData.get();
    data.campaign.campaignImage = '';
    CampaignData.save(data);
    document.getElementById('campaign-image-preview').innerHTML = '';
    document.getElementById('campaign-image-remove-btn').style.display = 'none';
    updateDashboardStats();
}

function initCampaignForm() {
    const form = document.getElementById('campaign-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const data = CampaignData.get();

        data.campaign.name = document.getElementById('campaign-name-input').value;
        data.campaign.currentChapter = document.getElementById('campaign-chapter-input').value;
        data.campaign.sessionNumber = parseInt(document.getElementById('campaign-session-input').value) || 1;
        data.campaign.currentLocation = document.getElementById('campaign-location-input').value;
        data.campaign.partyLevel = parseInt(document.getElementById('campaign-level-input').value) || 1;
        data.campaign.currentXP = parseInt(document.getElementById('campaign-xp-input').value) || 0;
        data.campaign.totalGold = parseInt(document.getElementById('campaign-gold-input').value) || 0;
        data.campaign.sessionsPlayed = data.campaign.sessionNumber;

        // Handle image upload
        const fileInput = document.getElementById('campaign-image-input');
        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                data.campaign.campaignImage = ev.target.result;
                CampaignData.save(data);
                updateDashboardStats();
                CampaignData.addActivity('📍', 'Campaign overview updated');
                closeModal('campaign-modal');
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            CampaignData.save(data);
            updateDashboardStats();
            CampaignData.addActivity('📍', 'Campaign overview updated');
            closeModal('campaign-modal');
        }
    });
}

// ===================================
// Export / Import / Data Management
// ===================================

async function exportAllData() {
    try {
        const data = CampaignData.get();
        const files = await FileStore.getAllFiles();

        const exportBundle = {
            version: 1,
            exportType: 'full',
            exportedAt: new Date().toISOString(),
            campaignData: data,
            fileBlobs: files
        };

        downloadJSON(exportBundle, `campaign-full-backup-${formatDateForFile()}.json`);
        CampaignData.addActivity('💾', 'Full campaign data exported');
    } catch (e) {
        console.error('Export error:', e);
        alert('Failed to export data. See console for details.');
    }
}

async function exportPlayerData() {
    try {
        const data = CampaignData.get();
        const files = await FileStore.getAllFiles();

        // Player-relevant data only (no DM notes)
        const exportBundle = {
            version: 1,
            exportType: 'player',
            exportedAt: new Date().toISOString(),
            campaignData: {
                tales: data.tales || [],

                files: data.files || [],
                stories: data.stories || []
            },
            fileBlobs: files
        };

        downloadJSON(exportBundle, `player-data-${formatDateForFile()}.json`);
        CampaignData.addActivity('💾', 'Player data exported');
    } catch (e) {
        console.error('Export error:', e);
        alert('Failed to export data. See console for details.');
    }
}

function downloadJSON(obj, filename) {
    const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function formatDateForFile() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function initImportZone() {
    const importZone = document.getElementById('import-zone');
    const importInput = document.getElementById('import-file-input');
    if (!importZone || !importInput) return;

    importZone.addEventListener('click', () => importInput.click());
    importZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        importZone.classList.add('dragover');
    });
    importZone.addEventListener('dragleave', () => {
        importZone.classList.remove('dragover');
    });
    importZone.addEventListener('drop', (e) => {
        e.preventDefault();
        importZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleImportFile(e.dataTransfer.files[0]);
    });
    importInput.addEventListener('change', () => {
        if (importInput.files.length) handleImportFile(importInput.files[0]);
    });
}

function handleImportFile(file) {
    if (!file.name.endsWith('.json')) {
        alert('Please select a .json export file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const bundle = JSON.parse(e.target.result);
            if (!bundle.version || !bundle.campaignData) {
                alert('This does not appear to be a valid campaign export file.');
                return;
            }
            showImportPreview(bundle);
        } catch (err) {
            alert('Failed to read import file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function showImportPreview(bundle) {
    const preview = document.getElementById('import-preview');
    if (!preview) return;

    const cd = bundle.campaignData;
    const talesCount = (cd.tales || []).length;
    const storiesCount = (cd.stories || []).length;
    const filesCount = (cd.files || []).length;
    const blobsCount = (bundle.fileBlobs || []).length;
    const hasFullData = bundle.exportType === 'full';

    preview.classList.remove('hidden');
    preview.innerHTML = `
        <div class="import-summary">
            <h4>Import Preview</h4>
            <p><strong>Type:</strong> ${hasFullData ? 'Full Backup' : 'Player Data'}</p>
            <p><strong>Exported:</strong> ${formatEuropeanDateTime(bundle.exportedAt)}</p>
            <ul>
                ${talesCount ? `<li>${talesCount} PC Tales entries</li>` : ''}
                ${storiesCount ? `<li>${storiesCount} stories</li>` : ''}
                ${filesCount ? `<li>${filesCount} file references</li>` : ''}
                ${blobsCount ? `<li>${blobsCount} file blobs to restore</li>` : ''}
                ${hasFullData && cd.characters ? `<li>${cd.characters.length} characters</li>` : ''}
                ${hasFullData && cd.quests ? `<li>${cd.quests.length} quests</li>` : ''}
                ${hasFullData && cd.npcs ? `<li>${(cd.npcs || []).length} NPCs</li>` : ''}
                ${hasFullData && cd.locations ? `<li>${(cd.locations || []).length} locations</li>` : ''}
            </ul>
            <p class="import-warning">Importing will <strong>merge</strong> this data with your existing data. Duplicates are skipped by ID.</p>
            <div class="import-actions">
                <button class="btn btn-primary" onclick="confirmImport()">Import Data</button>
                <button class="btn btn-secondary" onclick="cancelImport()">Cancel</button>
            </div>
        </div>
    `;

    // Stash the bundle for confirmation
    window._pendingImport = bundle;
}

async function confirmImport() {
    const bundle = window._pendingImport;
    if (!bundle) return;

    try {
        const current = CampaignData.get();
        const imported = bundle.campaignData;

        // Merge arrays by ID (skip duplicates)
        const arrayKeys = ['tales', 'stories', 'files', 'characters', 'npcs', 'locations', 'quests',
                          'icNotes', 'oocNotes', 'dmNotes', 'sessionSummaries', 'gallery', 'activity'];

        for (const key of arrayKeys) {
            if (Array.isArray(imported[key]) && imported[key].length > 0) {
                if (!Array.isArray(current[key])) current[key] = [];
                const existingIds = new Set(current[key].map(item => item.id));
                for (const item of imported[key]) {
                    if (!existingIds.has(item.id)) {
                        current[key].push(item);
                    }
                }
            }
        }

        // Merge objects (resources, campaign, rules) - only for full backups
        if (bundle.exportType === 'full') {
            if (imported.resources) {
                current.resources = { ...current.resources, ...imported.resources };
            }
            if (imported.rules) {
                current.rules = { ...current.rules, ...imported.rules };
            }
            // Don't overwrite campaign settings - those are DM-controlled
        }

        CampaignData.save(current);

        // Import file blobs into IndexedDB
        if (Array.isArray(bundle.fileBlobs)) {
            for (const fileBlob of bundle.fileBlobs) {
                try {
                    await FileStore.saveFile(fileBlob);
                } catch (e) {
                    console.warn('Could not import file blob:', fileBlob.name, e);
                }
            }
        }

        // Re-render everything
        renderCharacters();
        renderTales();
        renderResources();
        renderNotes();
        renderDMNotes();
        renderSessionSummaries();
        renderNPCs();
        renderLocations();
        renderQuests();
        renderGallery();
        renderStories();
        renderRules();
        updateDashboardStats();
        CampaignData.renderActivity();
        updateStorageInfo();

        CampaignData.addActivity('📥', `Data imported (${bundle.exportType} bundle)`);
        alert('Import successful! Data has been merged.');
        cancelImport();
    } catch (e) {
        console.error('Import error:', e);
        alert('Import failed: ' + e.message);
    }
}

function cancelImport() {
    const preview = document.getElementById('import-preview');
    if (preview) {
        preview.classList.add('hidden');
        preview.innerHTML = '';
    }
    window._pendingImport = null;
    const importInput = document.getElementById('import-file-input');
    if (importInput) importInput.value = '';
}

async function updateStorageInfo() {
    const infoEl = document.getElementById('storage-info');
    if (!infoEl) return;

    // localStorage size
    let lsSize = 0;
    try {
        const lsData = localStorage.getItem('campaignTrackerData');
        if (lsData) lsSize = new Blob([lsData]).size;
    } catch (e) { /* ignore */ }

    // IndexedDB file count
    let fileCount = 0;
    try {
        fileCount = await FileStore.getCount();
    } catch (e) { /* ignore */ }

    infoEl.innerHTML = `
        <span class="storage-badge">localStorage: ${formatFileSize(lsSize)}</span>
        <span class="storage-badge">IndexedDB files: ${fileCount}</span>
    `;
}

// Migrate old localStorage file data to IndexedDB on first load
async function migrateFilesToIndexedDB() {
    const data = CampaignData.get();
    if (!data.files || data.files.length === 0) return;

    let migrated = false;
    for (const file of data.files) {
        if (file.data) {
            // This file has inline data - migrate to IndexedDB
            try {
                await FileStore.saveFile({
                    id: file.id,
                    name: file.name,
                    size: file.size,
                    rawSize: file.rawSize || 0,
                    type: file.type,
                    data: file.data,
                    uploadedAt: file.uploadedAt
                });
                // Remove inline data from localStorage entry
                delete file.data;
                migrated = true;
            } catch (e) {
                console.warn('Could not migrate file:', file.name, e);
            }
        }
    }

    if (migrated) {
        CampaignData.save(data);
        console.log('Migrated file data from localStorage to IndexedDB');
    }
}

// ===================================
// Initialize Application
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initNavigation();
    initTabs();
    initRulesNav();
    initFilters();
    initModals();
    initContentEditable();
    initCharacterFilters();

    // Initialize forms
    initTaleForm();
    initNoteForm();
    initNPCForm();
    initLocationForm();
    initQuestForm();
    initImageForm();
    initCharacterForm();
    initCampaignForm();
    initResourceForm();
    initSessionSummaryForm();
    initCombatNPCForm();
    initPCTalesTabs();
    initCampaignNotesTabs();

    // Render initial data
    renderCharacters();
    renderTales();
    renderResources();
    renderNotes();
    renderDMNotes();
    renderSessionSummaries();
    renderNPCs();
    renderLocations();
    renderQuests();
    renderGallery();
    renderRules();
    loadPCsForInitiative();
    loadNPCsForInitiative();
    renderInitiativeList();

    // Initialize import zone
    initImportZone();

    // Load session info and synopsis
    loadSessionInfo();
    loadSynopsis();

    // Update dashboard
    updateDashboardStats();
    CampaignData.renderActivity();

    // Migrate old file data and update storage info
    migrateFilesToIndexedDB().then(() => updateStorageInfo());

    // Start Firebase real-time sync
    startFirestoreListener();

    console.log('🐉 Waterdeep: Dragon Heist Campaign Tracker initialized!');
});

// ===================================
// Export for global access
// ===================================

window.openModal = openModal;
window.closeModal = closeModal;
window.openStoryModal = openStoryModal;
window.openStoryView = openStoryView;
window.addICNote = addICNote;
window.addOOCNote = addOOCNote;
window.addNPC = addNPC;
window.addLocation = addLocation;
window.addQuest = addQuest;
window.openImageUpload = openImageUpload;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.removeFile = removeFile;
window.toggleEditSynopsis = toggleEditSynopsis;
window.saveSynopsis = saveSynopsis;
window.cancelEditSynopsis = cancelEditSynopsis;
window.loadSynopsis = loadSynopsis;
window.toggleEditRules = toggleEditRules;
window.saveRules = saveRules;
window.cancelEditRules = cancelEditRules;
window.saveSessionInfo = saveSessionInfo;
window.openCharacterModal = openCharacterModal;
window.setCharacterType = setCharacterType;
window.switchPortraitTab = switchPortraitTab;
window.clearPortraitUpload = clearPortraitUpload;
window.deleteCharacter = deleteCharacter;
window.formatText = formatText;
window.openCampaignEditModal = openCampaignEditModal;

// PC Tales exports
window.openTaleModal = openTaleModal;
window.viewTale = viewTale;
window.editResource = editResource;
window.openResourceModal = openResourceModal;

// Campaign Notes exports
window.addDMNote = addDMNote;
window.addSessionSummary = addSessionSummary;
window.editNote = editNote;
window.deleteNote = deleteNote;
window.deleteSessionSummary = deleteSessionSummary;
window.removeCampaignImage = removeCampaignImage;

// Initiative Tracker exports
window.togglePCInEncounter = togglePCInEncounter;
window.startNewEncounter = startNewEncounter;
window.selectCombatant = selectCombatant;
window.closeCombatantDetails = closeCombatantDetails;
window.adjustHP = adjustHP;
window.removeCombatant = removeCombatant;
window.sortByInitiative = sortByInitiative;
window.nextTurn = nextTurn;
window.clearEncounter = clearEncounter;

// Data Management exports
window.exportAllData = exportAllData;
window.exportPlayerData = exportPlayerData;
window.confirmImport = confirmImport;
window.cancelImport = cancelImport;
window.downloadFile = downloadFile;
