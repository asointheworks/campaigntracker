/**
 * D&D Campaign Tracker - Waterdeep: Dragon Heist
 * JavaScript Application
 */

// ===================================
// Data Management
// ===================================

const CampaignData = {
    // Default data structure
    defaults: {
        campaign: {
            name: "Waterdeep: Dragon Heist",
            currentChapter: "Chapter 1: A Friend in Need",
            sessionNumber: 1,
            ingameDate: "1st of Marpenoth, 1492 DR",
            currentLocation: "The Yawning Portal",
            partyLevel: 1,
            totalGold: 0,
            sessionsPlayed: 0,
            nextSessionDate: "",
            sessionNotes: "",
            synopsis: ""
        },
        characters: [],
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
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error loading saved data:', e);
                return this.defaults;
            }
        }
        return this.defaults;
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
    document.getElementById('story-view-content').innerHTML = story.content.split('\n').map(p => `<p>${p}</p>`).join('');

    openModal('story-view-modal');
}

function initStoryForm() {
    const form = document.getElementById('story-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const newStory = {
            id: Date.now(),
            title: document.getElementById('story-title-input').value,
            type: document.getElementById('story-type-select').value,
            author: document.getElementById('story-author-input').value,
            date: new Date().toLocaleDateString(),
            content: document.getElementById('story-content-input').value,
            wordCount: document.getElementById('story-content-input').value.split(/\s+/).length,
            createdAt: new Date().toISOString()
        };

        const data = CampaignData.get();
        data.stories.push(newStory);
        CampaignData.save(data);

        renderStories();
        CampaignData.addActivity('📜', `New story added: "${newStory.title}"`);
        closeModal('story-modal');
    });
}

function renderStories() {
    const grid = document.getElementById('stories-grid');
    const data = CampaignData.get();

    grid.innerHTML = data.stories.map(story => `
        <article class="story-card" data-type="${story.type}">
            <div class="story-header">
                <span class="story-type-badge ${story.type}">${story.type.charAt(0).toUpperCase() + story.type.slice(1)}</span>
                <span class="story-date">${story.date}</span>
            </div>
            <h3 class="story-title">${story.title}</h3>
            <p class="story-author">By: ${story.author}</p>
            <p class="story-preview">${story.content.substring(0, 200)}...</p>
            <div class="story-footer">
                <button class="btn btn-small" onclick="openStoryView(${story.id})">Read More</button>
                <div class="story-stats">
                    <span>📖 ${story.wordCount || 0} words</span>
                </div>
            </div>
        </article>
    `).join('');
}

// ===================================
// Note Functions
// ===================================

function addICNote() {
    document.getElementById('note-form').reset();
    document.getElementById('note-type-hidden').value = 'ic';
    document.getElementById('note-modal-title').textContent = 'New In-Character Note';
    openModal('note-modal');
}

function addOOCNote() {
    document.getElementById('note-form').reset();
    document.getElementById('note-type-hidden').value = 'ooc';
    document.getElementById('note-modal-title').textContent = 'New Out-of-Character Note';
    openModal('note-modal');
}

function initNoteForm() {
    const form = document.getElementById('note-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const noteType = document.getElementById('note-type-hidden').value;
        const newNote = {
            id: Date.now(),
            title: document.getElementById('note-title-input').value,
            session: document.getElementById('note-session-input').value,
            content: document.getElementById('note-content-input').value,
            tags: document.getElementById('note-tags-input').value.split(',').map(t => t.trim()).filter(t => t)
        };

        const data = CampaignData.get();
        if (noteType === 'ic') {
            data.icNotes.push(newNote);
        } else {
            data.oocNotes.push(newNote);
        }
        CampaignData.save(data);

        renderNotes();
        CampaignData.addActivity(noteType === 'ic' ? '🎭' : '📋', `New ${noteType.toUpperCase()} note: "${newNote.title}"`);
        closeModal('note-modal');
    });
}

function renderNotes() {
    const data = CampaignData.get();

    // IC Notes
    const icList = document.getElementById('ic-notes-list');
    icList.innerHTML = data.icNotes.map(note => `
        <div class="note-card ic">
            <div class="note-header">
                <h4>${note.title}</h4>
                <span class="note-date">${note.session}</span>
            </div>
            <div class="note-content">
                ${note.content.split('\n').map(p => `<p>${p}</p>`).join('')}
            </div>
            <div class="note-tags">
                ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');

    // OOC Notes
    const oocList = document.getElementById('ooc-notes-list');
    oocList.innerHTML = data.oocNotes.map(note => `
        <div class="note-card ooc">
            <div class="note-header">
                <h4>${note.title}</h4>
                <span class="note-date">${note.session}</span>
            </div>
            <div class="note-content">
                ${note.content.split('\n').map(p => `<p>${p}</p>`).join('')}
            </div>
            <div class="note-tags">
                ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');
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
            image: document.getElementById('npc-image-input').value || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
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
            image: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=200&q=80',
            description: 'A retired adventurer and the stoic proprietor of Waterdeep\'s most famous tavern. His eyes hold secrets of Undermountain that he rarely shares.',
            status: 'friendly'
        },
        {
            id: 'volo',
            name: 'Volothamp Geddarm (Volo)',
            role: 'Famous Author & Raconteur',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
            description: 'The flamboyant author of "Volo\'s Guide to Monsters" and many other works. Currently working on a new book about Waterdeep.',
            status: 'quest-giver'
        },
        {
            id: 'floon',
            name: 'Floon Blagmaar',
            role: 'Volo\'s Friend',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
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
            image: document.getElementById('location-image-input').value || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
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
            image: 'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=400&q=80',
            description: 'The most famous tavern in all of Waterdeep, built around the entrance to Undermountain. Adventurers come from across the Sword Coast to test their mettle in the depths below.',
            tags: ['Tavern', 'Dungeon Entrance', 'Known']
        },
        {
            id: 'dock-ward',
            name: 'The Dock Ward',
            ward: 'Dock Ward',
            image: 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=400&q=80',
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
        { id: 'city', url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=80', title: 'City of Waterdeep', description: 'The City of Splendors', category: 'maps' },
        { id: 'tavern', url: 'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=600&q=80', title: 'The Yawning Portal', description: 'Famous Tavern & Dungeon Entrance', category: 'locations' },
        { id: 'streets', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80', title: 'Streets of Waterdeep', description: 'The bustling city streets', category: 'locations' },
        { id: 'harbor', url: 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=600&q=80', title: 'Waterdeep Harbor', description: 'The Dock Ward', category: 'locations' },
        { id: 'noble', url: 'https://images.unsplash.com/photo-1464146072230-91cabc968266?w=600&q=80', title: 'Sea Ward', description: 'Home of Waterdeep\'s Nobility', category: 'locations' },
        { id: 'sewers', url: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600&q=80', title: 'The Sewers', description: 'Beneath the streets', category: 'locations' },
        { id: 'treasure', url: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=600&q=80', title: 'The Dragon Hoard', description: '500,000 Gold Dragons', category: 'items' },
        { id: 'magic', url: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=600&q=80', title: 'Magical Artifacts', description: 'Items of Power', category: 'items' }
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
    const data = CampaignData.get();

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileData = {
                id: Date.now(),
                name: file.name,
                size: formatFileSize(file.size),
                type: file.type,
                data: e.target.result,
                uploadedAt: new Date().toISOString()
            };

            data.files.push(fileData);
            CampaignData.save(data);
            renderUploadedFiles();
            CampaignData.addActivity('📁', `File uploaded: "${file.name}"`);
        };

        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsDataURL(file);
        }
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

function removeFile(fileId) {
    const data = CampaignData.get();
    data.files = data.files.filter(f => f.id !== fileId);
    CampaignData.save(data);
    renderUploadedFiles();
}

// ===================================
// Synopsis Editing
// ===================================

function toggleEditSynopsis() {
    const display = document.getElementById('synopsis-display');
    const edit = document.getElementById('synopsis-edit');
    const textarea = document.getElementById('synopsis-textarea');

    display.classList.toggle('hidden');
    edit.classList.toggle('hidden');

    if (!edit.classList.contains('hidden')) {
        textarea.value = display.innerHTML;
    }
}

function saveSynopsis() {
    const display = document.getElementById('synopsis-display');
    const textarea = document.getElementById('synopsis-textarea');

    display.innerHTML = textarea.value;

    const data = CampaignData.get();
    data.campaign.synopsis = textarea.value;
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
    const textarea = content.querySelector('.rule-textarea');

    display.classList.toggle('hidden');
    edit.classList.toggle('hidden');

    if (!edit.classList.contains('hidden')) {
        textarea.value = display.innerHTML;
    }
}

function saveRules(ruleId) {
    const content = document.getElementById(`${ruleId}-content`) || document.getElementById(`rule-${ruleId}`).querySelector('.rule-content');
    const display = content.querySelector('.rule-display');
    const textarea = content.querySelector('.rule-textarea');

    display.innerHTML = textarea.value;

    const data = CampaignData.get();
    if (!data.rules) data.rules = {};
    data.rules[ruleId] = textarea.value;
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
// Character Modal (placeholder)
// ===================================

function openCharacterModal(playerId) {
    // For now, just show an alert - this could be expanded to a full character sheet
    alert(`Character details for Player ${playerId} - Full character sheet feature coming soon!`);
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
// Dashboard Stats
// ===================================

function updateDashboardStats() {
    const data = CampaignData.get();

    document.getElementById('party-level').textContent = data.campaign.partyLevel || 1;
    document.getElementById('total-gold').textContent = data.campaign.totalGold || 0;
    document.getElementById('sessions-played').textContent = data.campaign.sessionsPlayed || 0;
    document.getElementById('current-chapter').textContent = data.campaign.currentChapter || 'Chapter 1: A Friend in Need';
    document.getElementById('session-number').textContent = `Session ${data.campaign.sessionNumber || 1}`;
    document.getElementById('ingame-date').textContent = data.campaign.ingameDate || '1st of Marpenoth, 1492 DR';
    document.getElementById('current-location').textContent = data.campaign.currentLocation || 'The Yawning Portal';
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

    // Initialize forms
    initStoryForm();
    initNoteForm();
    initNPCForm();
    initLocationForm();
    initQuestForm();
    initImageForm();

    // Render initial data
    renderStories();
    renderNotes();
    renderNPCs();
    renderLocations();
    renderQuests();
    renderGallery();
    renderUploadedFiles();

    // Load session info
    loadSessionInfo();

    // Update dashboard
    updateDashboardStats();
    CampaignData.renderActivity();

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
