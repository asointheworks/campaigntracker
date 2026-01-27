/**
 * D&D Campaign Tracker - Waterdeep: Dragon Heist
 * JavaScript Application
 */

// ===================================
// D20 Placeholder Image (SVG Data URL)
// ===================================

const D20_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%231a1a2e' width='100' height='100'/%3E%3Cpolygon points='50,10 85,30 85,70 50,90 15,70 15,30' fill='none' stroke='%23d4af37' stroke-width='2'/%3E%3Cpolygon points='50,10 85,30 50,50 15,30' fill='none' stroke='%23d4af37' stroke-width='1.5'/%3E%3Cpolygon points='85,30 85,70 50,50' fill='none' stroke='%23d4af37' stroke-width='1.5'/%3E%3Cpolygon points='85,70 50,90 50,50' fill='none' stroke='%23d4af37' stroke-width='1.5'/%3E%3Cpolygon points='50,90 15,70 50,50' fill='none' stroke='%23d4af37' stroke-width='1.5'/%3E%3Cpolygon points='15,70 15,30 50,50' fill='none' stroke='%23d4af37' stroke-width='1.5'/%3E%3Ctext x='50' y='58' text-anchor='middle' font-size='20' font-weight='bold' fill='%23d4af37' font-family='serif'%3E20%3C/text%3E%3C/svg%3E";

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
        evidence: [],
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

    // Save data to localStorage
    save(data) {
        try {
            localStorage.setItem('campaignTrackerData', JSON.stringify(data));
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

        return date.toLocaleDateString();
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
            date: new Date().toLocaleDateString(),
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
    const data = CampaignData.get();

    // Combine default NPCs with saved ones
    const defaultNPCs = [
        {
            id: 'durnan',
            name: 'Durnan',
            role: 'Owner of the Yawning Portal',
            image: D20_PLACEHOLDER,
            description: 'A retired adventurer and the stoic proprietor of Waterdeep\'s most famous tavern. His eyes hold secrets of Undermountain that he rarely shares.',
            status: 'friendly'
        },
        {
            id: 'volo',
            name: 'Volothamp Geddarm (Volo)',
            role: 'Famous Author & Raconteur',
            image: D20_PLACEHOLDER,
            description: 'The flamboyant author of "Volo\'s Guide to Monsters" and many other works. Currently working on a new book about Waterdeep.',
            status: 'quest-giver'
        },
        {
            id: 'floon',
            name: 'Floon Blagmaar',
            role: 'Volo\'s Friend',
            image: D20_PLACEHOLDER,
            description: 'A handsome but somewhat vapid young man who has gone missing. His disappearance kicks off the adventure.',
            status: 'missing'
        }
    ];

    const allNPCs = [...defaultNPCs, ...data.npcs];

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
// File Upload
// ===================================

function initFileUpload() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');

    if (!uploadZone || !fileInput) return;

    uploadZone.addEventListener('click', () => fileInput.click());

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const fileData = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                name: file.name,
                size: formatFileSize(file.size),
                rawSize: file.size,
                type: file.type,
                data: e.target.result,
                uploadedAt: new Date().toISOString()
            };

            // Store file data in IndexedDB (handles larger files)
            try {
                await FileStore.saveFile(fileData);

                // Store only metadata (no data blob) in localStorage for listing
                const data = CampaignData.get();
                data.files.push({
                    id: fileData.id,
                    name: fileData.name,
                    size: fileData.size,
                    rawSize: fileData.rawSize,
                    type: fileData.type,
                    uploadedAt: fileData.uploadedAt
                });
                CampaignData.save(data);

                renderUploadedFiles();
                CampaignData.addActivity('📁', `File uploaded: "${file.name}"`);
                updateStorageInfo();
            } catch (err) {
                console.error('Error saving file to IndexedDB:', err);
                alert(`Failed to save "${file.name}". The file may be too large.`);
            }
        };
        reader.readAsDataURL(file);
    });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function renderUploadedFiles() {
    const container = document.getElementById('uploaded-files');
    const data = CampaignData.get();

    if (!container) return;

    container.innerHTML = data.files.map(file => {
        const icon = getFileIcon(file.type);
        return `
            <div class="file-item">
                <span class="file-icon">${icon}</span>
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${file.size}</span>
                </div>
                <button class="btn btn-small" onclick="downloadFile(${file.id})" title="Download">⬇</button>
                <button class="file-remove" onclick="removeFile(${file.id})">×</button>
            </div>
        `;
    }).join('');
}

function getFileIcon(type) {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📎';
}

async function removeFile(fileId) {
    const data = CampaignData.get();
    data.files = data.files.filter(f => f.id !== fileId);
    CampaignData.save(data);
    try { await FileStore.deleteFile(fileId); } catch (e) { /* ignore */ }
    renderUploadedFiles();
    updateStorageInfo();
}

async function downloadFile(fileId) {
    try {
        const file = await FileStore.getFile(fileId);
        if (!file || !file.data) {
            alert('File data not found. It may have been stored in an older format.');
            return;
        }
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error('Error downloading file:', e);
        alert('Could not download file.');
    }
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

// ===================================
// Rules Editing
// ===================================

function toggleEditRules(ruleId) {
    const content = document.getElementById(`${ruleId}-content`) || document.getElementById(`rule-${ruleId}`).querySelector('.rule-content');
    const display = content.querySelector('.rule-display');
    const edit = content.querySelector('.rule-edit');
    const editor = content.querySelector('.editor-content');

    display.classList.toggle('hidden');
    edit.classList.toggle('hidden');

    if (!edit.classList.contains('hidden')) {
        editor.innerHTML = display.innerHTML;
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

function saveSessionInfo() {
    const date = document.getElementById('next-session-date').value;
    const notes = document.getElementById('session-notes').value;

    const data = CampaignData.get();
    data.campaign.nextSessionDate = date;
    data.campaign.sessionNotes = notes;
    CampaignData.save(data);

    CampaignData.addActivity('📅', 'Session info updated');
}

function loadSessionInfo() {
    const data = CampaignData.get();

    if (data.campaign.nextSessionDate) {
        document.getElementById('next-session-date').value = data.campaign.nextSessionDate;
    }
    if (data.campaign.sessionNotes) {
        document.getElementById('session-notes').value = data.campaign.sessionNotes;
    }
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
            document.getElementById('character-race-class-input').value = character.raceClass;
            document.getElementById('character-player-input').value = character.player || '';
            document.getElementById('character-level-input').value = character.level || 1;
            document.getElementById('character-hp-current').value = character.currentHp || 10;
            document.getElementById('character-hp-max').value = character.maxHp || 10;
            document.getElementById('character-ac-input').value = character.ac || 10;
            document.getElementById('character-init-input').value = character.initiative || '+0';
            document.getElementById('character-portrait-input').value = character.portrait || '';
            backgroundEditor.innerHTML = character.background || '';

            // Set type toggle
            setCharacterType(character.type || 'pc');
        }
    } else {
        // New character
        title.textContent = 'Add Character';
        deleteBtn.style.display = 'none';
    }

    openModal('character-modal');
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

function initCharacterForm() {
    const form = document.getElementById('character-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const backgroundEditor = document.getElementById('character-background-content');
        const characterData = {
            id: currentEditingCharacterId || Date.now(),
            type: document.getElementById('character-type-input').value,
            name: document.getElementById('character-name-input').value,
            raceClass: document.getElementById('character-race-class-input').value,
            player: document.getElementById('character-player-input').value,
            level: parseInt(document.getElementById('character-level-input').value) || 1,
            currentHp: parseInt(document.getElementById('character-hp-current').value) || 10,
            maxHp: parseInt(document.getElementById('character-hp-max').value) || 10,
            ac: parseInt(document.getElementById('character-ac-input').value) || 10,
            initiative: document.getElementById('character-init-input').value || '+0',
            portrait: document.getElementById('character-portrait-input').value || getDefaultPortrait(document.getElementById('character-type-input').value),
            background: backgroundEditor.innerHTML,
            createdAt: currentEditingCharacterId ? undefined : new Date().toISOString()
        };

        const data = CampaignData.get();

        if (currentEditingCharacterId) {
            // Update existing character
            const index = data.characters.findIndex(c => c.id === currentEditingCharacterId);
            if (index !== -1) {
                characterData.createdAt = data.characters[index].createdAt;
                data.characters[index] = characterData;
            }
            CampaignData.addActivity('⚔️', `Updated character: "${characterData.name}"`);
        } else {
            // Add new character
            data.characters.push(characterData);
            CampaignData.addActivity('⚔️', `Added new ${characterData.type.toUpperCase()}: "${characterData.name}"`);
        }

        CampaignData.save(data);
        renderCharacters();
        loadPCsForInitiative(); // Refresh initiative tracker PC list
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
        closeModal('character-modal');
    }
}

function getDefaultPortrait(type) {
    return D20_PLACEHOLDER;
}

function renderCharacters(filter = 'all') {
    const grid = document.getElementById('party-grid');
    const data = CampaignData.get();

    let characters = data.characters;

    // Apply filter
    if (filter !== 'all') {
        characters = characters.filter(c => c.type === filter);
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

    grid.innerHTML = characters.map(char => {
        const hpPercent = Math.round((char.currentHp / char.maxHp) * 100);
        const hpColor = hpPercent > 50 ? '#27ae60' : hpPercent > 25 ? '#f39c12' : '#e74c3c';

        return `
            <div class="character-card" data-character-id="${char.id}" data-type="${char.type}">
                <span class="character-type-badge ${char.type}">${char.type.toUpperCase()}</span>
                <div class="character-portrait">
                    <img src="${char.portrait || getDefaultPortrait(char.type)}" alt="${char.name}" class="portrait-img" onerror="this.src='${getDefaultPortrait(char.type)}'">
                    <div class="level-badge">Lvl ${char.level}</div>
                </div>
                <div class="character-info">
                    <h3 class="char-name">${char.name}</h3>
                    <p class="char-race-class">${char.raceClass}</p>
                    ${char.player ? `<p class="char-player">${char.type === 'pc' ? 'Player' : 'Controlled by'}: ${char.player}</p>` : ''}
                    <div class="char-stats">
                        <div class="hp-bar">
                            <div class="hp-fill" style="width: ${hpPercent}%; background: linear-gradient(90deg, ${hpColor}, ${hpColor}dd)"></div>
                            <span class="hp-text">HP: ${char.currentHp}/${char.maxHp}</span>
                        </div>
                        <div class="stat-row">
                            <span class="mini-stat">AC: ${char.ac}</span>
                            <span class="mini-stat">Init: ${char.initiative}</span>
                        </div>
                    </div>
                    <div class="char-background">
                        <p class="background-text">${stripHtml(char.background).substring(0, 150)}${char.background && char.background.length > 150 ? '...' : ''}</p>
                    </div>
                </div>
                <div class="char-actions">
                    <button class="btn btn-small" onclick="openCharacterModal(${char.id})">Edit</button>
                </div>
            </div>
        `;
    }).join('');
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

    // Evidence
    const evidenceList = document.getElementById('evidence-list');
    if (evidenceList) {
        const evidence = data.tales.filter(t => t.type === 'evidence');
        if (evidence.length === 0) {
            evidenceList.innerHTML = '<div class="initiative-empty"><p>No evidence or documents collected yet.</p></div>';
        } else {
            evidenceList.innerHTML = evidence.map(e => `
                <div class="evidence-card">
                    <div class="evidence-icon">📜</div>
                    <div class="evidence-info">
                        <h4 class="evidence-title">${e.title}</h4>
                        <p class="evidence-source">${e.author || 'Unknown source'} • ${e.session || ''}</p>
                        <div class="tale-preview">${stripHtml(e.content).substring(0, 150)}...</div>
                    </div>
                    <button class="btn btn-small" onclick="viewTale(${e.id})">View</button>
                </div>
            `).join('');
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

    const pcs = data.characters.filter(c => c.type === 'pc');

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
    if (!data.encounter) data.encounter = { combatants: [], round: 1, currentTurn: 0, activePCs: [] };

    // Reset encounter
    data.encounter.combatants = [];
    data.encounter.round = 1;
    data.encounter.currentTurn = 0;

    // Add active PCs to combatants
    const pcs = data.characters.filter(c => c.type === 'pc');
    const activePCs = data.encounter.activePCs || pcs.map(pc => pc.id);

    pcs.filter(pc => activePCs.includes(pc.id)).forEach(pc => {
        const initMod = parseInt(pc.initiative) || 0;
        data.encounter.combatants.push({
            id: Date.now() + Math.random(),
            pcId: pc.id,
            name: pc.name,
            type: 'pc',
            raceClass: pc.raceClass,
            initiative: 0, // To be rolled
            currentHp: pc.currentHp,
            maxHp: pc.maxHp,
            ac: pc.ac,
            initMod: initMod
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

        return `
            <div class="initiative-item ${isActive ? 'active-turn' : ''} is-${combatant.type} ${isDead ? 'is-dead' : ''}"
                 onclick="selectCombatant('${combatant.id}')">
                <div class="init-order">${combatant.initiative || '?'}</div>
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

function selectCombatant(combatantId) {
    const data = CampaignData.get();
    const combatant = data.encounter?.combatants.find(c => c.id == combatantId);
    if (!combatant) return;

    selectedCombatantId = combatantId;

    document.getElementById('detail-name').textContent = combatant.name;
    document.getElementById('detail-hp').textContent = `${combatant.currentHp}/${combatant.maxHp}`;
    document.getElementById('detail-ac').textContent = combatant.ac;
    document.getElementById('detail-init').textContent = combatant.initiative;
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

    data.encounter.combatants.sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
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
                evidence: data.evidence || [],
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
            <p><strong>Exported:</strong> ${new Date(bundle.exportedAt).toLocaleString()}</p>
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
        const arrayKeys = ['tales', 'evidence', 'stories', 'files', 'characters', 'npcs', 'locations', 'quests',
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
        renderUploadedFiles();
        renderStories();
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
    initFileUpload();
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
    renderUploadedFiles();
    loadPCsForInitiative();
    renderInitiativeList();

    // Initialize import zone
    initImportZone();

    // Load session info
    loadSessionInfo();

    // Update dashboard
    updateDashboardStats();
    CampaignData.renderActivity();

    // Migrate old file data and update storage info
    migrateFilesToIndexedDB().then(() => updateStorageInfo());

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
window.toggleEditRules = toggleEditRules;
window.saveRules = saveRules;
window.cancelEditRules = cancelEditRules;
window.saveSessionInfo = saveSessionInfo;
window.openCharacterModal = openCharacterModal;
window.setCharacterType = setCharacterType;
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
