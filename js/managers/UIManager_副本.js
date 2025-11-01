/**
 * ============================================================================
 * FILE: UIManager.js
 * PURPOSE: Manage all user interface operations and rendering
 *
 * DESCRIPTION:
 * This is the most complex manager, handling:
 * - Screen navigation and transitions
 * - Rendering all game elements (farm, shops, weather, etc.)
 * - Event listeners for all buttons and interactions
 * - Real-time UI updates (timers, progress bars)
 * - Notification system
 * - Dynamic content generation
 *
 * ARCHITECTURE:
 * Central hub connecting user actions to game logic
 * Listens to game events and updates UI accordingly
 * Uses other managers to execute actions
 *
 * DEPENDENCIES:
 * - All Manager classes (Farm, Shop, Timer)
 * - GameState (read current state)
 * - All Model classes (Crop, Animal, Weather)
 * - constants.js (element IDs, CSS classes, events)
 * - helpers.js (formatting, DOM manipulation)
 *
 * USED BY:
 * - main.js (initialize UI system)
 * ============================================================================
 */

/**
 * CLASS: UIManager
 * Singleton class managing all UI operations
 */
class UIManager {

    /**
     * CONSTRUCTOR
     * Initializes the UI manager
     *
     * NOTE: Use UIManager.getInstance() instead of calling directly
     */
    constructor() {
        // Prevent multiple instances (singleton pattern)
        if (UIManager.instance) {
            return UIManager.instance;
        }

        // Store references to other managers
        this.gameState = null;
        this.farmManager = null;
        this.shopManager = null;
        this.timerManager = null;

        // Track current screen
        this.currentScreen = CONSTANTS.SCREENS.HOME;

        // Store singleton instance
        UIManager.instance = this;

        HELPERS.debugLog('UIManager initialized');
    }


    // ========================================================================
    // SINGLETON PATTERN
    // ========================================================================

    /**
     * STATIC: getInstance
     * Gets or creates the single UIManager instance
     *
     * @returns {UIManager} The UI manager instance
     */
    static getInstance() {
        if (!UIManager.instance) {
            UIManager.instance = new UIManager();
        }
        return UIManager.instance;
    }


    /**
     * STATIC: resetInstance
     * Resets the singleton (for new game)
     */
    static resetInstance() {
        if (UIManager.instance) {
            UIManager.instance.cleanup();
        }
        UIManager.instance = null;
        HELPERS.debugLog('UIManager reset');
    }


    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /**
     * PUBLIC: initialize
     * Sets up the UI system
     *
     * @param {Object} managers - Object containing all manager instances
     *
     * CALLED BY:
     * - main.js (after creating all managers)
     */
    initialize(managers) {
        // Store manager references
        this.gameState = managers.gameState || GameState.getInstance();
        this.farmManager = managers.farmManager || FarmManager.getInstance();
        this.shopManager = managers.shopManager || ShopManager.getInstance();
        this.timerManager = managers.timerManager || TimerManager.getInstance();

        // Set up event listeners
        this._setupEventListeners();

        // Set up game event listeners
        this._setupGameEventListeners();

        // Initial render
        this.showScreen(CONSTANTS.SCREENS.HOME);
        this.updateHeader();

        HELPERS.debugLog('UIManager initialized with managers');
    }


    /**
     * PRIVATE: _setupEventListeners
     * Attaches event listeners to all UI elements
     *
     * CALLED BY: initialize()
     */
    _setupEventListeners() {
        // Navigation buttons - Home Screen
        this._attachListener('btn-go-to-farm', 'click', () => {
            this.showScreen(CONSTANTS.SCREENS.FARM);
        });

        this._attachListener('btn-go-to-tom-shop', 'click', () => {
            this.showScreen(CONSTANTS.SCREENS.TOM_SHOP);
        });

        this._attachListener('btn-go-to-henry-shop', 'click', () => {
            this.showScreen(CONSTANTS.SCREENS.HENRY_SHOP);
        });

        // Back to home buttons
        this._attachListener('btn-farm-to-home', 'click', () => {
            this.showScreen(CONSTANTS.SCREENS.HOME);
        });

        this._attachListener('btn-tom-to-home', 'click', () => {
            this.showScreen(CONSTANTS.SCREENS.HOME);
        });

        this._attachListener('btn-henry-to-home', 'click', () => {
            this.showScreen(CONSTANTS.SCREENS.HOME);
        });

        // End screen buttons
        this._attachListener('btn-play-again-victory', 'click', () => {
            this._restartGame();
        });

        this._attachListener('btn-main-menu-victory', 'click', () => {
            this._restartGame();
        });

        this._attachListener('btn-try-again-defeat', 'click', () => {
            this._restartGame();
        });

        this._attachListener('btn-main-menu-defeat', 'click', () => {
            this._restartGame();
        });

        HELPERS.debugLog('Event listeners attached');
    }


    /**
     * PRIVATE: _setupGameEventListeners
     * Listens for game events to update UI
     *
     * CALLED BY: initialize()
     */
    _setupGameEventListeners() {
        // Money changed
        document.addEventListener(CONSTANTS.EVENTS.MONEY_CHANGED, () => {
            this.updateHeader();
            this._refreshCurrentScreen();
        });

        // Day advanced
        document.addEventListener(CONSTANTS.EVENTS.DAY_ADVANCED, () => {
            this.updateHeader();
            this.updateWeatherDisplay();
            this._refreshCurrentScreen();
            this.showNotification('info', `Day ${this.gameState.currentDay} started!`);
        });

        // Crop matured
        document.addEventListener(CONSTANTS.EVENTS.CROP_MATURED, (e) => {
            this.showNotification('success', e.detail.message);
            if (this.currentScreen === CONSTANTS.SCREENS.FARM) {
                this.renderFarmScreen();
            }
        });

        // Animal matured
        document.addEventListener(CONSTANTS.EVENTS.ANIMAL_MATURED, (e) => {
            this.showNotification('success', e.detail.message);
            if (this.currentScreen === CONSTANTS.SCREENS.FARM) {
                this.renderFarmScreen();
            }
        });

        // Animal bred
        document.addEventListener(CONSTANTS.EVENTS.ANIMAL_BRED, (e) => {
            this.showNotification('success', e.detail.message);
            if (this.currentScreen === CONSTANTS.SCREENS.FARM) {
                this.renderFarmScreen();
            }
        });

        // Milestone reached
        document.addEventListener(CONSTANTS.EVENTS.MILESTONE_REACHED, (e) => {
            this.showNotification('success', `🎉 ${e.detail.milestone.title}: ${e.detail.milestone.message}`);
        });

        // Game won
        document.addEventListener(CONSTANTS.EVENTS.GAME_WON, () => {
            this.showScreen(CONSTANTS.SCREENS.VICTORY);
        });

        // Game lost
        document.addEventListener(CONSTANTS.EVENTS.GAME_LOST, () => {
            this.showScreen(CONSTANTS.SCREENS.DEFEAT);
        });

        // Timer updates (every second)
        document.addEventListener('timer-update', () => {
            if (this.currentScreen === CONSTANTS.SCREENS.FARM) {
                this._updateFarmTimers();
            }
        });

        HELPERS.debugLog('Game event listeners attached');
    }


    /**
     * PRIVATE: _attachListener
     * Safely attaches an event listener to an element
     *
     * @param {string} elementId - Element ID
     * @param {string} event - Event type
     * @param {Function} handler - Event handler function
     */
    _attachListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`UIManager: Element not found: ${elementId}`);
        }
    }


    // ========================================================================
    // SCREEN NAVIGATION
    // ========================================================================

    /**
     * PUBLIC: showScreen
     * Displays a specific screen and hides all others
     *
     * @param {string} screenName - Name of screen to show
     *
     * CALLED BY:
     * - Navigation button handlers
     * - Game event handlers (victory/defeat)
     */
    showScreen(screenName) {
        // Hide all screens
        const allScreens = [
            'home-screen',
            'farm-screen',
            'tom-shop-screen',
            'henry-shop-screen',
            'victory-screen',
            'defeat-screen'
        ];

        allScreens.forEach(screenId => {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.classList.remove('active');
            }
        });

        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;

            // Render screen content
            this._renderScreen(screenName);

            HELPERS.debugLog(`Showing screen: ${screenName}`);

            // Dispatch screen changed event
            document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.SCREEN_CHANGED, {
                detail: { screen: screenName }
            }));
        }
    }


    /**
     * PRIVATE: _renderScreen
     * Renders content for a specific screen
     *
     * @param {string} screenName - Name of screen to render
     */
    _renderScreen(screenName) {
        switch (screenName) {
            case CONSTANTS.SCREENS.HOME:
                this.renderHomeScreen();
                break;
            case CONSTANTS.SCREENS.FARM:
                this.renderFarmScreen();
                break;
            case CONSTANTS.SCREENS.TOM_SHOP:
                this.renderTomShopScreen();
                break;
            case CONSTANTS.SCREENS.HENRY_SHOP:
                this.renderHenryShopScreen();
                break;
            case CONSTANTS.SCREENS.VICTORY:
                this.renderVictoryScreen();
                break;
            case CONSTANTS.SCREENS.DEFEAT:
                this.renderDefeatScreen();
                break;
        }
    }


    /**
     * PRIVATE: _refreshCurrentScreen
     * Refreshes the currently displayed screen
     */
    _refreshCurrentScreen() {
        this._renderScreen(this.currentScreen);
    }


    // ========================================================================
    // HEADER UPDATES
    // ========================================================================

    /**
     * PUBLIC: updateHeader
     * Updates the game header with current stats
     *
     * CALLED BY:
     * - Event handlers (money changed, day advanced)
     * - Screen rendering
     */
    updateHeader() {
        const info = this.gameState.getGameInfo();

        // Update money display
        const moneyDisplay = document.getElementById('money-display');
        if (moneyDisplay) {
            moneyDisplay.textContent = info.formattedMoney;
        }

        // Update day display
        const dayDisplay = document.getElementById('day-display');
        if (dayDisplay) {
            dayDisplay.textContent = info.currentDay;
        }

        // Update days remaining
        const daysRemaining = document.getElementById('days-remaining');
        if (daysRemaining) {
            daysRemaining.textContent = info.daysRemaining;
        }

        // Update goal progress
        const goalProgress = document.getElementById('goal-progress');
        if (goalProgress) {
            goalProgress.textContent = `${info.formattedMoney} / ${info.formattedGoal}`;
        }
    }


    // ========================================================================
    // HOME SCREEN RENDERING
    // ========================================================================

    /**
     * PUBLIC: renderHomeScreen
     * Renders the home screen with story and weather forecast
     */
    renderHomeScreen() {
        this.updateWeatherDisplay();
        HELPERS.debugLog('Home screen rendered');
    }


    /**
     * PUBLIC: updateWeatherDisplay
     * Updates the 7-day weather forecast display
     */
    updateWeatherDisplay() {
        const weatherContainer = document.getElementById('weather-forecast');
        if (!weatherContainer) return;

        // Clear existing content
        weatherContainer.innerHTML = '';

        // Get weather forecast
        const forecast = this.gameState.getWeatherForecast();

        // Create weather cards
        forecast.forEach(weather => {
            const card = this._createWeatherCard(weather);
            weatherContainer.appendChild(card);
        });
    }


    /**
     * PRIVATE: _createWeatherCard
     * Creates a weather card element
     *
     * @param {Weather} weather - Weather object
     * @returns {HTMLElement} Weather card element
     */
    _createWeatherCard(weather) {
        const card = document.createElement('div');
        card.className = 'weather-card';

        // Highlight current day
        if (weather.day === this.gameState.currentDay) {
            card.classList.add('today');
        }

        // Day label
        const dayLabel = document.createElement('div');
        dayLabel.className = 'weather-day';
        dayLabel.textContent = weather.day === this.gameState.currentDay
            ? 'Today'
            : `Day ${weather.day}`;
        card.appendChild(dayLabel);

        // Weather icon
        const icon = document.createElement('div');
        icon.className = 'weather-icon';
        icon.textContent = weather.getWeatherIcon();
        card.appendChild(icon);

        // Weather value
        const value = document.createElement('div');
        value.className = 'weather-value';
        value.textContent = weather.weatherValue.toFixed(2);
        card.appendChild(value);

        // Demand multiplier
        const demand = document.createElement('div');
        demand.className = 'weather-demand';
        demand.textContent = HELPERS.formatMultiplier(weather.demandIndex);

        // Color code by demand
        if (weather.demandIndex >= 2.0) {
            demand.classList.add('demand-best');
        } else if (weather.demandIndex >= 1.5) {
            demand.classList.add('demand-great');
        } else if (weather.demandIndex >= 1.2) {
            demand.classList.add('demand-good');
        } else {
            demand.classList.add('demand-poor');
        }

        card.appendChild(demand);

        return card;
    }


    // ========================================================================
    // FARM SCREEN RENDERING
    // ========================================================================

    /**
     * PUBLIC: renderFarmScreen
     * Renders the farm screen with crops and animals
     */
    renderFarmScreen() {
        this._renderCurrentWeather();
        this._renderCropPlots();
        this._renderAnimalPens();
        HELPERS.debugLog('Farm screen rendered');
    }


    /**
     * PRIVATE: _renderCurrentWeather
     * Renders current weather display on farm screen
     */
    _renderCurrentWeather() {
        const currentWeather = this.gameState.getCurrentWeather();
        if (!currentWeather) return;

        // Update weather icon
        const weatherIcon = document.getElementById('current-weather-icon');
        if (weatherIcon) {
            weatherIcon.textContent = currentWeather.getWeatherIcon();
        }

        // Update weather description
        const weatherDesc = document.getElementById('current-weather-desc');
        if (weatherDesc) {
            weatherDesc.textContent = currentWeather.getWeatherDescription();
        }

        // Update demand index
        const demandIndex = document.getElementById('demand-index');
        if (demandIndex) {
            demandIndex.textContent = HELPERS.formatMultiplier(currentWeather.demandIndex);
        }

        // Update recommendation
        const recommendation = document.getElementById('sell-recommendation');
        if (recommendation) {
            recommendation.textContent = currentWeather.getSellRecommendation();
        }
    }


    /**
     * PRIVATE: _renderCropPlots
     * Renders all crops on the farm
     */
    _renderCropPlots() {
        const container = document.getElementById('crop-plots');
        if (!container) return;

        container.innerHTML = '';

        // ✅ 获取种子和作物
        const seeds = this.gameState.inventory.seeds;
        const crops = this.farmManager.getCropsOnFarm();
        const totalItems = seeds.length + crops.length;

        // Update slot counter
        const slotsUsed = document.getElementById('crop-slots-used');
        const slotsTotal = document.getElementById('crop-slots-total');
        if (slotsUsed) slotsUsed.textContent = crops.length;
        if (slotsTotal) slotsTotal.textContent = CONSTANTS.VALIDATION.MAX_CROP_SLOTS;

        // 如果什么都没有
        if (totalItems === 0) {
            const emptyState = this._createEmptyState(
                'No crops or seeds',
                'Visit Tom\'s shop to buy seeds',
                () => this.showScreen(CONSTANTS.SCREENS.TOM_SHOP)
            );
            container.appendChild(emptyState);
            return;
        }

        // ✅ 显示种子区域
        if (seeds.length > 0) {
            const seedsHeader = document.createElement('div');
            seedsHeader.className = 'farm-section-header';
            seedsHeader.innerHTML = `
            <h4>🌱 Seeds Inventory (${seeds.length})</h4>
            <p class="hint">Click "Plant" to move seeds to your farm</p>
        `;
            container.appendChild(seedsHeader);

            seeds.forEach(seed => {
                const card = this._createSeedCard(seed);
                container.appendChild(card);
            });
        }

        // ✅ 显示作物区域
        if (crops.length > 0) {
            const cropsHeader = document.createElement('div');
            cropsHeader.className = 'farm-section-header';
            cropsHeader.innerHTML = `
            <h4>🌾 Growing Crops (${crops.length}/${CONSTANTS.VALIDATION.MAX_CROP_SLOTS})</h4>
        `;
            container.appendChild(cropsHeader);

            crops.forEach(crop => {
                const card = this._createCropCard(crop);
                container.appendChild(card);
            });
        }
    }


    /**
     * PRIVATE: _createCropCard
     * Creates a crop card element for farm display
     *
     * @param {Crop} crop - Crop object
     * @returns {HTMLElement} Crop card element
     */
    _createCropCard(crop) {
        const card = document.createElement('div');
        card.className = 'crop-card item-card';
        card.dataset.cropId = crop.id;

        if (crop.isMature()) {
            card.classList.add('mature');
        }

        // Item header
        const header = document.createElement('div');
        header.className = 'item-header';

        const nameSection = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'item-name-large';
        name.innerHTML = `<span class="item-emoji">🌾</span> ${crop.name}`;
        nameSection.appendChild(name);
        header.appendChild(nameSection);

        const tierBadge = document.createElement('div');
        tierBadge.className = `tier-badge tier-${crop.tier}`;
        tierBadge.textContent = '⭐'.repeat(crop.tier);
        header.appendChild(tierBadge);

        card.appendChild(header);

        // Status badge
        const statusBadge = document.createElement('div');
        statusBadge.className = `status-badge ${crop.isMature() ? 'mature' : 'growing'}`;
        statusBadge.textContent = crop.isMature() ? 'Ready!' : 'Growing...';
        card.appendChild(statusBadge);

        // Progress section
        if (!crop.isMature()) {
            const progressSection = this._createProgressSection(crop);
            card.appendChild(progressSection);
        }

        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'item-actions';

        if (crop.isMature()) {
            const harvestBtn = document.createElement('button');
            harvestBtn.className = 'btn btn-harvest';
            harvestBtn.textContent = '✨ Harvest';
            harvestBtn.onclick = () => this._handleHarvestCrop(crop.id);
            actions.appendChild(harvestBtn);
        }

        card.appendChild(actions);

        return card;
    }

    /**
     * PRIVATE: _createSeedCard
     * Creates a seed card element with PLANT button
     */
    _createSeedCard(seed) {
        const card = document.createElement('div');
        card.className = 'seed-card item-card';
        card.dataset.seedId = seed.id;
        card.classList.add('seed-status');

        // Header
        const header = document.createElement('div');
        header.className = 'item-header';

        const nameSection = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'item-name-large';
        name.innerHTML = `<span class="item-emoji">🌱</span> ${seed.name} Seed`;
        nameSection.appendChild(name);
        header.appendChild(nameSection);

        const tierBadge = document.createElement('div');
        tierBadge.className = `tier-badge tier-${seed.tier}`;
        tierBadge.textContent = '⭐'.repeat(seed.tier);
        header.appendChild(tierBadge);

        card.appendChild(header);

        // Status badge
        const statusBadge = document.createElement('div');
        statusBadge.className = 'status-badge seed';
        statusBadge.textContent = 'Not Planted';
        card.appendChild(statusBadge);

        // Info
        const infoSection = document.createElement('div');
        infoSection.className = 'item-info';
        infoSection.innerHTML = `
        <div class="info-row">
            <span class="info-label">Growth Time:</span>
            <span class="info-value">${seed.growthTime} min</span>
        </div>
        <div class="info-row">
            <span class="info-label">Base Sell Price:</span>
            <span class="info-value">${HELPERS.formatMoney(seed.baseSellPrice)}</span>
        </div>
    `;
        card.appendChild(infoSection);

        // Plant button
        const actions = document.createElement('div');
        actions.className = 'item-actions';

        const plantBtn = document.createElement('button');
        plantBtn.className = 'btn btn-plant btn-primary';
        plantBtn.innerHTML = '🌱 Plant This Seed';

        const hasSpace = this.gameState.canPlantMoreCrops();

        if (!hasSpace) {
            plantBtn.disabled = true;
            plantBtn.textContent = '❌ Farm Full';
        } else {
            plantBtn.onclick = () => this._handlePlantSeed(seed.id);
        }

        actions.appendChild(plantBtn);
        card.appendChild(actions);

        return card;
    }
    /**
     * PRIVATE: _handlePlantSeed
     * Handles planting a seed on the farm
     */
    _handlePlantSeed(seedId) {
        HELPERS.debugLog('Attempting to plant seed', { seedId });

        const result = this.farmManager.plantCrop(seedId);

        if (result.success) {
            this.showNotification('success', result.message, 3000);
            this.renderFarmScreen();

            HELPERS.debugLog('Seed planted successfully', {
                cropId: result.crop.id,
                cropName: result.crop.name
            });
        } else {
            this.showNotification('error', result.message, 3000);
            HELPERS.debugLog('Failed to plant seed', { reason: result.message });
        }
    }


    /**
     * PRIVATE: _renderAnimalPens
     * Renders all animals on the farm
     */
    _renderAnimalPens() {
        const container = document.getElementById('animal-pens');
        if (!container) return;

        container.innerHTML = '';

        const youngAnimals = this.gameState.inventory.youngAnimals;
        const animals = this.farmManager.getAnimalsOnFarm();
        const totalItems = youngAnimals.length + animals.length;

        // Update slot counter
        const slotsUsed = document.getElementById('animal-slots-used');
        const slotsTotal = document.getElementById('animal-slots-total');
        if (slotsUsed) slotsUsed.textContent = animals.length;
        if (slotsTotal) slotsTotal.textContent = CONSTANTS.VALIDATION.MAX_ANIMAL_SLOTS;

        if (totalItems === 0) {
            const emptyState = this._createEmptyState(
                'No animals',
                'Visit Henry\'s shop to buy animals',
                () => this.showScreen(CONSTANTS.SCREENS.HENRY_SHOP)
            );
            container.appendChild(emptyState);
            return;
        }

        // 显示年幼动物
        if (youngAnimals.length > 0) {
            const youngHeader = document.createElement('div');
            youngHeader.className = 'farm-section-header';
            youngHeader.innerHTML = `
            <h4>🐣 Young Animals Inventory (${youngAnimals.length})</h4>
            <p class="hint">Click "Place" to move animals to your farm</p>
        `;
            container.appendChild(youngHeader);

            youngAnimals.forEach(animal => {
                const card = this._createYoungAnimalCard(animal);
                container.appendChild(card);
            });
        }

        // 显示已放置的动物
        if (animals.length > 0) {
            const animalsHeader = document.createElement('div');
            animalsHeader.className = 'farm-section-header';
            animalsHeader.innerHTML = `
            <h4>🐄 Animals on Farm (${animals.length}/${CONSTANTS.VALIDATION.MAX_ANIMAL_SLOTS})</h4>
        `;
            container.appendChild(animalsHeader);

            animals.forEach(animal => {
                const card = this._createAnimalCard(animal);
                container.appendChild(card);
            });
        }
    }


    /**
     * PRIVATE: _createAnimalCard
     * Creates an animal card element for farm display
     *
     * @param {Animal} animal - Animal object
     * @returns {HTMLElement} Animal card element
     */
    _createAnimalCard(animal) {
        const card = document.createElement('div');
        card.className = 'animal-card item-card';
        card.dataset.animalId = animal.id;

        if (animal.isMature()) {
            card.classList.add('mature');
        }

        if (animal.hasOffspring) {
            card.classList.add('has-offspring');
        }

        // Item header
        const header = document.createElement('div');
        header.className = 'item-header';

        const nameSection = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'item-name-large';
        name.innerHTML = `<span class="item-emoji">🐔</span> ${animal.name}`;
        nameSection.appendChild(name);
        header.appendChild(nameSection);

        const tierBadge = document.createElement('div');
        tierBadge.className = `tier-badge tier-${animal.tier}`;
        tierBadge.textContent = '⭐'.repeat(animal.tier);
        header.appendChild(tierBadge);

        card.appendChild(header);

        // Status badge
        const statusBadge = document.createElement('div');
        statusBadge.className = `status-badge ${animal.isMature() ? 'mature' : 'growing'}`;
        statusBadge.textContent = animal.isMature() ? 'Ready to Sell!' : 'Growing...';
        card.appendChild(statusBadge);

        // Progress section
        if (!animal.isMature()) {
            const progressSection = this._createProgressSection(animal);
            card.appendChild(progressSection);
        }

        // Breeding info
        if (animal.hasOffspring) {
            const breedingSection = document.createElement('div');
            breedingSection.className = 'breeding-section';
            breedingSection.innerHTML = `
                <div class="offspring-count">
                    Has ${animal.offspring.length} offspring!
                </div>
            `;
            card.appendChild(breedingSection);
        }

        // Action buttons (only show for mature animals)
        if (animal.isMature()) {
            const actions = document.createElement('div');
            actions.className = 'item-actions';

            const sellBtn = document.createElement('button');
            sellBtn.className = 'btn btn-sell';
            sellBtn.textContent = '💵 Sell';
            sellBtn.onclick = () => this._handleSellAnimalDirect(animal.id);
            actions.appendChild(sellBtn);

            card.appendChild(actions);
        }

        return card;
    }
    /**
     * PRIVATE: _createYoungAnimalCard
     * Creates a young animal card with PLACE button
     */
    _createYoungAnimalCard(animal) {
        const card = document.createElement('div');
        card.className = 'young-animal-card item-card';
        card.dataset.animalId = animal.id;
        card.classList.add('young-status');

        // Header
        const header = document.createElement('div');
        header.className = 'item-header';

        const nameSection = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'item-name-large';
        name.innerHTML = `<span class="item-emoji">🐣</span> Young ${animal.name}`;
        nameSection.appendChild(name);
        header.appendChild(nameSection);

        const tierBadge = document.createElement('div');
        tierBadge.className = `tier-badge tier-${animal.tier}`;
        tierBadge.textContent = '⭐'.repeat(animal.tier);
        header.appendChild(tierBadge);

        card.appendChild(header);

        // Status
        const statusBadge = document.createElement('div');
        statusBadge.className = 'status-badge young';
        statusBadge.textContent = 'Not Placed';
        card.appendChild(statusBadge);

        // Info
        const infoSection = document.createElement('div');
        infoSection.className = 'item-info';
        infoSection.innerHTML = `
        <div class="info-row">
            <span class="info-label">Growth Time:</span>
            <span class="info-value">${animal.growthTime} min</span>
        </div>
        <div class="info-row">
            <span class="info-label">Base Sell Price:</span>
            <span class="info-value">${HELPERS.formatMoney(animal.baseSellPrice)}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Breeding Chance:</span>
            <span class="info-value">${animal.breedingChance}%</span>
        </div>
    `;
        card.appendChild(infoSection);

        // Place button
        const actions = document.createElement('div');
        actions.className = 'item-actions';

        const placeBtn = document.createElement('button');
        placeBtn.className = 'btn btn-place btn-primary';
        placeBtn.innerHTML = '🏡 Place on Farm';

        const hasSpace = this.gameState.canPlaceMoreAnimals();

        if (!hasSpace) {
            placeBtn.disabled = true;
            placeBtn.textContent = '❌ Farm Full';
        } else {
            placeBtn.onclick = () => this._handlePlaceAnimal(animal.id);
        }

        actions.appendChild(placeBtn);/**
         * ============================================================================
         * FILE: UIManager.js
         * PURPOSE: Manage all user interface operations and rendering
         *
         * DESCRIPTION:
         * This is the most complex manager, handling:
         * - Screen navigation and transitions
         * - Rendering all game elements (farm, shops, weather, etc.)
         * - Event listeners for all buttons and interactions
         * - Real-time UI updates (timers, progress bars)
         * - Notification system
         * - Dynamic content generation
         *
         * ARCHITECTURE:
         * Central hub connecting user actions to game logic
         * Listens to game events and updates UI accordingly
         * Uses other managers to execute actions
         *
         * DEPENDENCIES:
         * - All Manager classes (Farm, Shop, Timer)
         * - GameState (read current state)
         * - All Model classes (Crop, Animal, Weather)
         * - constants.js (element IDs, CSS classes, events)
         * - helpers.js (formatting, DOM manipulation)
         *
         * USED BY:
         * - main.js (initialize UI system)
         * ============================================================================
         */

        /**
         * CLASS: UIManager
         * Singleton class managing all UI operations
         */
        class UIManager {

            /**
             * CONSTRUCTOR
             * Initializes the UI manager
             *
             * NOTE: Use UIManager.getInstance() instead of calling directly
             */
            constructor() {
                // Prevent multiple instances (singleton pattern)
                if (UIManager.instance) {
                    return UIManager.instance;
                }

                // Store references to other managers
                this.gameState = null;
                this.farmManager = null;
                this.shopManager = null;
                this.timerManager = null;

                // Track current screen
                this.currentScreen = CONSTANTS.SCREENS.HOME;

                // Store singleton instance
                UIManager.instance = this;

                HELPERS.debugLog('UIManager initialized');
            }


            // ========================================================================
            // SINGLETON PATTERN
            // ========================================================================

            /**
             * STATIC: getInstance
             * Gets or creates the single UIManager instance
             *
             * @returns {UIManager} The UI manager instance
             */
            static getInstance() {
                if (!UIManager.instance) {
                    UIManager.instance = new UIManager();
                }
                return UIManager.instance;
            }


            /**
             * STATIC: resetInstance
             * Resets the singleton (for new game)
             */
            static resetInstance() {
                if (UIManager.instance) {
                    UIManager.instance.cleanup();
                }
                UIManager.instance = null;
                HELPERS.debugLog('UIManager reset');
            }


            // ========================================================================
            // INITIALIZATION
            // ========================================================================

            /**
             * PUBLIC: initialize
             * Sets up the UI system
             *
             * @param {Object} managers - Object containing all manager instances
             *
             * CALLED BY:
             * - main.js (after creating all managers)
             */
            initialize(managers) {
                // Store manager references
                this.gameState = managers.gameState || GameState.getInstance();
                this.farmManager = managers.farmManager || FarmManager.getInstance();
                this.shopManager = managers.shopManager || ShopManager.getInstance();
                this.timerManager = managers.timerManager || TimerManager.getInstance();

                // Set up event listeners
                this._setupEventListeners();

                // Set up game event listeners
                this._setupGameEventListeners();

                // Initial render
                this.showScreen(CONSTANTS.SCREENS.HOME);
                this.updateHeader();

                HELPERS.debugLog('UIManager initialized with managers');
            }


            /**
             * PRIVATE: _setupEventListeners
             * Attaches event listeners to all UI elements
             *
             * CALLED BY: initialize()
             */
            _setupEventListeners() {
                // Navigation buttons - Home Screen
                this._attachListener('btn-go-to-farm', 'click', () => {
                    this.showScreen(CONSTANTS.SCREENS.FARM);
                });

                this._attachListener('btn-go-to-tom-shop', 'click', () => {
                    this.showScreen(CONSTANTS.SCREENS.TOM_SHOP);
                });

                this._attachListener('btn-go-to-henry-shop', 'click', () => {
                    this.showScreen(CONSTANTS.SCREENS.HENRY_SHOP);
                });

                // Back to home buttons
                this._attachListener('btn-farm-to-home', 'click', () => {
                    this.showScreen(CONSTANTS.SCREENS.HOME);
                });

                this._attachListener('btn-tom-to-home', 'click', () => {
                    this.showScreen(CONSTANTS.SCREENS.HOME);
                });

                this._attachListener('btn-henry-to-home', 'click', () => {
                    this.showScreen(CONSTANTS.SCREENS.HOME);
                });

                // End screen buttons
                this._attachListener('btn-play-again-victory', 'click', () => {
                    this._restartGame();
                });

                this._attachListener('btn-main-menu-victory', 'click', () => {
                    this._restartGame();
                });

                this._attachListener('btn-try-again-defeat', 'click', () => {
                    this._restartGame();
                });

                this._attachListener('btn-main-menu-defeat', 'click', () => {
                    this._restartGame();
                });

                HELPERS.debugLog('Event listeners attached');
            }


            /**
             * PRIVATE: _setupGameEventListeners
             * Listens for game events to update UI
             *
             * CALLED BY: initialize()
             */
            _setupGameEventListeners() {
                // Money changed
                document.addEventListener(CONSTANTS.EVENTS.MONEY_CHANGED, () => {
                    this.updateHeader();
                    this._refreshCurrentScreen();
                });

                // Day advanced
                document.addEventListener(CONSTANTS.EVENTS.DAY_ADVANCED, () => {
                    this.updateHeader();
                    this.updateWeatherDisplay();
                    this._refreshCurrentScreen();
                    this.showNotification('info', `Day ${this.gameState.currentDay} started!`);
                });

                // Crop matured
                document.addEventListener(CONSTANTS.EVENTS.CROP_MATURED, (e) => {
                    this.showNotification('success', e.detail.message);
                    if (this.currentScreen === CONSTANTS.SCREENS.FARM) {
                        this.renderFarmScreen();
                    }
                });

                // Animal matured
                document.addEventListener(CONSTANTS.EVENTS.ANIMAL_MATURED, (e) => {
                    this.showNotification('success', e.detail.message);
                    if (this.currentScreen === CONSTANTS.SCREENS.FARM) {
                        this.renderFarmScreen();
                    }
                });

                // Animal bred
                document.addEventListener(CONSTANTS.EVENTS.ANIMAL_BRED, (e) => {
                    this.showNotification('success', e.detail.message);
                    if (this.currentScreen === CONSTANTS.SCREENS.FARM) {
                        this.renderFarmScreen();
                    }
                });

                // Milestone reached
                document.addEventListener(CONSTANTS.EVENTS.MILESTONE_REACHED, (e) => {
                    this.showNotification('success', `🎉 ${e.detail.milestone.title}: ${e.detail.milestone.message}`);
                });

                // Game won
                document.addEventListener(CONSTANTS.EVENTS.GAME_WON, () => {
                    this.showScreen(CONSTANTS.SCREENS.VICTORY);
                });

                // Game lost
                document.addEventListener(CONSTANTS.EVENTS.GAME_LOST, () => {
                    this.showScreen(CONSTANTS.SCREENS.DEFEAT);
                });

                // Timer updates (every second)
                document.addEventListener('timer-update', () => {
                    if (this.currentScreen === CONSTANTS.SCREENS.FARM) {
                        this._updateFarmTimers();
                    }
                });

                HELPERS.debugLog('Game event listeners attached');
            }


            /**
             * PRIVATE: _attachListener
             * Safely attaches an event listener to an element
             *
             * @param {string} elementId - Element ID
             * @param {string} event - Event type
             * @param {Function} handler - Event handler function
             */
            _attachListener(elementId, event, handler) {
                const element = document.getElementById(elementId);
                if (element) {
                    element.addEventListener(event, handler);
                } else {
                    console.warn(`UIManager: Element not found: ${elementId}`);
                }
            }


            // ========================================================================
            // SCREEN NAVIGATION
            // ========================================================================

            /**
             * PUBLIC: showScreen
             * Displays a specific screen and hides all others
             *
             * @param {string} screenName - Name of screen to show
             *
             * CALLED BY:
             * - Navigation button handlers
             * - Game event handlers (victory/defeat)
             */
            showScreen(screenName) {
                // Hide all screens
                const allScreens = [
                    'home-screen',
                    'farm-screen',
                    'tom-shop-screen',
                    'henry-shop-screen',
                    'victory-screen',
                    'defeat-screen'
                ];

                allScreens.forEach(screenId => {
                    const screen = document.getElementById(screenId);
                    if (screen) {
                        screen.classList.remove('active');
                    }
                });

                // Show target screen
                const targetScreen = document.getElementById(`${screenName}-screen`);
                if (targetScreen) {
                    targetScreen.classList.add('active');
                    this.currentScreen = screenName;

                    // Render screen content
                    this._renderScreen(screenName);

                    HELPERS.debugLog(`Showing screen: ${screenName}`);

                    // Dispatch screen changed event
                    document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.SCREEN_CHANGED, {
                        detail: { screen: screenName }
                    }));
                }
            }


            /**
             * PRIVATE: _renderScreen
             * Renders content for a specific screen
             *
             * @param {string} screenName - Name of screen to render
             */
            _renderScreen(screenName) {
                switch (screenName) {
                    case CONSTANTS.SCREENS.HOME:
                        this.renderHomeScreen();
                        break;
                    case CONSTANTS.SCREENS.FARM:
                        this.renderFarmScreen();
                        break;
                    case CONSTANTS.SCREENS.TOM_SHOP:
                        this.renderTomShopScreen();
                        break;
                    case CONSTANTS.SCREENS.HENRY_SHOP:
                        this.renderHenryShopScreen();
                        break;
                    case CONSTANTS.SCREENS.VICTORY:
                        this.renderVictoryScreen();
                        break;
                    case CONSTANTS.SCREENS.DEFEAT:
                        this.renderDefeatScreen();
                        break;
                }
            }


            /**
             * PRIVATE: _refreshCurrentScreen
             * Refreshes the currently displayed screen
             */
            _refreshCurrentScreen() {
                this._renderScreen(this.currentScreen);
            }


            // ========================================================================
            // HEADER UPDATES
            // ========================================================================

            /**
             * PUBLIC: updateHeader
             * Updates the game header with current stats
             *
             * CALLED BY:
             * - Event handlers (money changed, day advanced)
             * - Screen rendering
             */
            updateHeader() {
                const info = this.gameState.getGameInfo();

                // Update money display
                const moneyDisplay = document.getElementById('money-display');
                if (moneyDisplay) {
                    moneyDisplay.textContent = info.formattedMoney;
                }

                // Update day display
                const dayDisplay = document.getElementById('day-display');
                if (dayDisplay) {
                    dayDisplay.textContent = info.currentDay;
                }

                // Update days remaining
                const daysRemaining = document.getElementById('days-remaining');
                if (daysRemaining) {
                    daysRemaining.textContent = info.daysRemaining;
                }

                // Update goal progress
                const goalProgress = document.getElementById('goal-progress');
                if (goalProgress) {
                    goalProgress.textContent = `${info.formattedMoney} / ${info.formattedGoal}`;
                }
            }


            // ========================================================================
            // HOME SCREEN RENDERING
            // ========================================================================

            /**
             * PUBLIC: renderHomeScreen
             * Renders the home screen with story and weather forecast
             */
            renderHomeScreen() {
                this.updateWeatherDisplay();
                HELPERS.debugLog('Home screen rendered');
            }


            /**
             * PUBLIC: updateWeatherDisplay
             * Updates the 7-day weather forecast display
             */
            updateWeatherDisplay() {
                const weatherContainer = document.getElementById('weather-forecast');
                if (!weatherContainer) return;

                // Clear existing content
                weatherContainer.innerHTML = '';

                // Get weather forecast
                const forecast = this.gameState.getWeatherForecast();

                // Create weather cards
                forecast.forEach(weather => {
                    const card = this._createWeatherCard(weather);
                    weatherContainer.appendChild(card);
                });
            }


            /**
             * PRIVATE: _createWeatherCard
             * Creates a weather card element
             *
             * @param {Weather} weather - Weather object
             * @returns {HTMLElement} Weather card element
             */
            _createWeatherCard(weather) {
                const card = document.createElement('div');
                card.className = 'weather-card';

                // Highlight current day
                if (weather.day === this.gameState.currentDay) {
                    card.classList.add('today');
                }

                // Day label
                const dayLabel = document.createElement('div');
                dayLabel.className = 'weather-day';
                dayLabel.textContent = weather.day === this.gameState.currentDay
                    ? 'Today'
                    : `Day ${weather.day}`;
                card.appendChild(dayLabel);

                // Weather icon
                const icon = document.createElement('div');
                icon.className = 'weather-icon';
                icon.textContent = weather.getWeatherIcon();
                card.appendChild(icon);

                // Weather value
                const value = document.createElement('div');
                value.className = 'weather-value';
                value.textContent = weather.weatherValue.toFixed(2);
                card.appendChild(value);

                // Demand multiplier
                const demand = document.createElement('div');
                demand.className = 'weather-demand';
                demand.textContent = HELPERS.formatMultiplier(weather.demandIndex);

                // Color code by demand
                if (weather.demandIndex >= 2.0) {
                    demand.classList.add('demand-best');
                } else if (weather.demandIndex >= 1.5) {
                    demand.classList.add('demand-great');
                } else if (weather.demandIndex >= 1.2) {
                    demand.classList.add('demand-good');
                } else {
                    demand.classList.add('demand-poor');
                }

                card.appendChild(demand);

                return card;
            }


            // ========================================================================
            // FARM SCREEN RENDERING
            // ========================================================================

            /**
             * PUBLIC: renderFarmScreen
             * Renders the farm screen with crops and animals
             */
            renderFarmScreen() {
                this._renderCurrentWeather();
                this._renderCropPlots();
                this._renderAnimalPens();
                HELPERS.debugLog('Farm screen rendered');
            }


            /**
             * PRIVATE: _renderCurrentWeather
             * Renders current weather display on farm screen
             */
            _renderCurrentWeather() {
                const currentWeather = this.gameState.getCurrentWeather();
                if (!currentWeather) return;

                // Update weather icon
                const weatherIcon = document.getElementById('current-weather-icon');
                if (weatherIcon) {
                    weatherIcon.textContent = currentWeather.getWeatherIcon();
                }

                // Update weather description
                const weatherDesc = document.getElementById('current-weather-desc');
                if (weatherDesc) {
                    weatherDesc.textContent = currentWeather.getWeatherDescription();
                }

                // Update demand index
                const demandIndex = document.getElementById('demand-index');
                if (demandIndex) {
                    demandIndex.textContent = HELPERS.formatMultiplier(currentWeather.demandIndex);
                }

                // Update recommendation
                const recommendation = document.getElementById('sell-recommendation');
                if (recommendation) {
                    recommendation.textContent = currentWeather.getSellRecommendation();
                }
            }


            /**
             * PRIVATE: _renderCropPlots
             * Renders all crops on the farm
             */
            _renderCropPlots() {
                const container = document.getElementById('crop-plots');
                if (!container) return;

                container.innerHTML = '';

                // ✅ 获取种子和作物
                const seeds = this.gameState.inventory.seeds;
                const crops = this.farmManager.getCropsOnFarm();
                const totalItems = seeds.length + crops.length;

                // Update slot counter
                const slotsUsed = document.getElementById('crop-slots-used');
                const slotsTotal = document.getElementById('crop-slots-total');
                if (slotsUsed) slotsUsed.textContent = crops.length;
                if (slotsTotal) slotsTotal.textContent = CONSTANTS.VALIDATION.MAX_CROP_SLOTS;

                // 如果什么都没有
                if (totalItems === 0) {
                    const emptyState = this._createEmptyState(
                        'No crops or seeds',
                        'Visit Tom\'s shop to buy seeds',
                        () => this.showScreen(CONSTANTS.SCREENS.TOM_SHOP)
                    );
                    container.appendChild(emptyState);
                    return;
                }

                // ✅ 显示种子区域
                if (seeds.length > 0) {
                    const seedsHeader = document.createElement('div');
                    seedsHeader.className = 'farm-section-header';
                    seedsHeader.innerHTML = `
            <h4>🌱 Seeds Inventory (${seeds.length})</h4>
            <p class="hint">Click "Plant" to move seeds to your farm</p>
        `;
                    container.appendChild(seedsHeader);

                    seeds.forEach(seed => {
                        const card = this._createSeedCard(seed);
                        container.appendChild(card);
                    });
                }

                // ✅ 显示作物区域
                if (crops.length > 0) {
                    const cropsHeader = document.createElement('div');
                    cropsHeader.className = 'farm-section-header';
                    cropsHeader.innerHTML = `
            <h4>🌾 Growing Crops (${crops.length}/${CONSTANTS.VALIDATION.MAX_CROP_SLOTS})</h4>
        `;
                    container.appendChild(cropsHeader);

                    crops.forEach(crop => {
                        const card = this._createCropCard(crop);
                        container.appendChild(card);
                    });
                }
            }


            /**
             * PRIVATE: _createCropCard
             * Creates a crop card element for farm display
             *
             * @param {Crop} crop - Crop object
             * @returns {HTMLElement} Crop card element
             */
            _createCropCard(crop) {
                const card = document.createElement('div');
                card.className = 'crop-card item-card';
                card.dataset.cropId = crop.id;

                if (crop.isMature()) {
                    card.classList.add('mature');
                }

                // Item header
                const header = document.createElement('div');
                header.className = 'item-header';

                const nameSection = document.createElement('div');
                const name = document.createElement('div');
                name.className = 'item-name-large';
                name.innerHTML = `<span class="item-emoji">🌾</span> ${crop.name}`;
                nameSection.appendChild(name);
                header.appendChild(nameSection);

                const tierBadge = document.createElement('div');
                tierBadge.className = `tier-badge tier-${crop.tier}`;
                tierBadge.textContent = '⭐'.repeat(crop.tier);
                header.appendChild(tierBadge);

                card.appendChild(header);

                // Status badge
                const statusBadge = document.createElement('div');
                statusBadge.className = `status-badge ${crop.isMature() ? 'mature' : 'growing'}`;
                statusBadge.textContent = crop.isMature() ? 'Ready!' : 'Growing...';
                card.appendChild(statusBadge);

                // Progress section
                if (!crop.isMature()) {
                    const progressSection = this._createProgressSection(crop);
                    card.appendChild(progressSection);
                }

                // Action buttons
                const actions = document.createElement('div');
                actions.className = 'item-actions';

                if (crop.isMature()) {
                    const harvestBtn = document.createElement('button');
                    harvestBtn.className = 'btn btn-harvest';
                    harvestBtn.textContent = '✨ Harvest';
                    harvestBtn.onclick = () => this._handleHarvestCrop(crop.id);
                    actions.appendChild(harvestBtn);
                }

                card.appendChild(actions);

                return card;
            }

            /**
             * PRIVATE: _createSeedCard
             * Creates a seed card element with PLANT button
             */
            _createSeedCard(seed) {
                const card = document.createElement('div');
                card.className = 'seed-card item-card';
                card.dataset.seedId = seed.id;
                card.classList.add('seed-status');

                // Header
                const header = document.createElement('div');
                header.className = 'item-header';

                const nameSection = document.createElement('div');
                const name = document.createElement('div');
                name.className = 'item-name-large';
                name.innerHTML = `<span class="item-emoji">🌱</span> ${seed.name} Seed`;
                nameSection.appendChild(name);
                header.appendChild(nameSection);

                const tierBadge = document.createElement('div');
                tierBadge.className = `tier-badge tier-${seed.tier}`;
                tierBadge.textContent = '⭐'.repeat(seed.tier);
                header.appendChild(tierBadge);

                card.appendChild(header);

                // Status badge
                const statusBadge = document.createElement('div');
                statusBadge.className = 'status-badge seed';
                statusBadge.textContent = 'Not Planted';
                card.appendChild(statusBadge);

                // Info
                const infoSection = document.createElement('div');
                infoSection.className = 'item-info';
                infoSection.innerHTML = `
        <div class="info-row">
            <span class="info-label">Growth Time:</span>
            <span class="info-value">${seed.growthTime} min</span>
        </div>
        <div class="info-row">
            <span class="info-label">Base Sell Price:</span>
            <span class="info-value">${HELPERS.formatMoney(seed.baseSellPrice)}</span>
        </div>
    `;
                card.appendChild(infoSection);

                // Plant button
                const actions = document.createElement('div');
                actions.className = 'item-actions';

                const plantBtn = document.createElement('button');
                plantBtn.className = 'btn btn-plant btn-primary';
                plantBtn.innerHTML = '🌱 Plant This Seed';

                const hasSpace = this.gameState.canPlantMoreCrops();

                if (!hasSpace) {
                    plantBtn.disabled = true;
                    plantBtn.textContent = '❌ Farm Full';
                } else {
                    plantBtn.onclick = () => this._handlePlantSeed(seed.id);
                }

                actions.appendChild(plantBtn);
                card.appendChild(actions);

                return card;
            }
            /**
             * PRIVATE: _handlePlantSeed
             * Handles planting a seed on the farm
             */
            _handlePlantSeed(seedId) {
                HELPERS.debugLog('Attempting to plant seed', { seedId });

                const result = this.farmManager.plantCrop(seedId);

                if (result.success) {
                    this.showNotification('success', result.message, 3000);
                    this.renderFarmScreen();

                    HELPERS.debugLog('Seed planted successfully', {
                        cropId: result.crop.id,
                        cropName: result.crop.name
                    });
                } else {
                    this.showNotification('error', result.message, 3000);
                    HELPERS.debugLog('Failed to plant seed', { reason: result.message });
                }
            }


            /**
             * PRIVATE: _renderAnimalPens
             * Renders all animals on the farm
             */
            _renderAnimalPens() {
                const container = document.getElementById('animal-pens');
                if (!container) return;

                container.innerHTML = '';

                const youngAnimals = this.gameState.inventory.youngAnimals;
                const animals = this.farmManager.getAnimalsOnFarm();
                const totalItems = youngAnimals.length + animals.length;

                // Update slot counter
                const slotsUsed = document.getElementById('animal-slots-used');
                const slotsTotal = document.getElementById('animal-slots-total');
                if (slotsUsed) slotsUsed.textContent = animals.length;
                if (slotsTotal) slotsTotal.textContent = CONSTANTS.VALIDATION.MAX_ANIMAL_SLOTS;

                if (totalItems === 0) {
                    const emptyState = this._createEmptyState(
                        'No animals',
                        'Visit Henry\'s shop to buy animals',
                        () => this.showScreen(CONSTANTS.SCREENS.HENRY_SHOP)
                    );
                    container.appendChild(emptyState);
                    return;
                }

                // 显示年幼动物
                if (youngAnimals.length > 0) {
                    const youngHeader = document.createElement('div');
                    youngHeader.className = 'farm-section-header';
                    youngHeader.innerHTML = `
            <h4>🐣 Young Animals Inventory (${youngAnimals.length})</h4>
            <p class="hint">Click "Place" to move animals to your farm</p>
        `;
                    container.appendChild(youngHeader);

                    youngAnimals.forEach(animal => {
                        const card = this._createYoungAnimalCard(animal);
                        container.appendChild(card);
                    });
                }

                // 显示已放置的动物
                if (animals.length > 0) {
                    const animalsHeader = document.createElement('div');
                    animalsHeader.className = 'farm-section-header';
                    animalsHeader.innerHTML = `
            <h4>🐄 Animals on Farm (${animals.length}/${CONSTANTS.VALIDATION.MAX_ANIMAL_SLOTS})</h4>
        `;
                    container.appendChild(animalsHeader);

                    animals.forEach(animal => {
                        const card = this._createAnimalCard(animal);
                        container.appendChild(card);
                    });
                }
            }


            /**
             * PRIVATE: _createAnimalCard
             * Creates an animal card element for farm display
             *
             * @param {Animal} animal - Animal object
             * @returns {HTMLElement} Animal card element
             */
            _createAnimalCard(animal) {
                const card = document.createElement('div');
                card.className = 'animal-card item-card';
                card.dataset.animalId = animal.id;

                if (animal.isMature()) {
                    card.classList.add('mature');
                }

                if (animal.hasOffspring) {
                    card.classList.add('has-offspring');
                }

                // Item header
                const header = document.createElement('div');
                header.className = 'item-header';

                const nameSection = document.createElement('div');
                const name = document.createElement('div');
                name.className = 'item-name-large';
                name.innerHTML = `<span class="item-emoji">🐔</span> ${animal.name}`;
                nameSection.appendChild(name);
                header.appendChild(nameSection);

                const tierBadge = document.createElement('div');
                tierBadge.className = `tier-badge tier-${animal.tier}`;
                tierBadge.textContent = '⭐'.repeat(animal.tier);
                header.appendChild(tierBadge);

                card.appendChild(header);

                // Status badge
                const statusBadge = document.createElement('div');
                statusBadge.className = `status-badge ${animal.isMature() ? 'mature' : 'growing'}`;
                statusBadge.textContent = animal.isMature() ? 'Ready to Sell!' : 'Growing...';
                card.appendChild(statusBadge);

                // Progress section
                if (!animal.isMature()) {
                    const progressSection = this._createProgressSection(animal);
                    card.appendChild(progressSection);
                }

                // Breeding info
                if (animal.hasOffspring) {
                    const breedingSection = document.createElement('div');
                    breedingSection.className = 'breeding-section';
                    breedingSection.innerHTML = `
                <div class="offspring-count">
                    Has ${animal.offspring.length} offspring!
                </div>
            `;
                    card.appendChild(breedingSection);
                }

                // Action buttons (only show for mature animals)
                if (animal.isMature()) {
                    const actions = document.createElement('div');
                    actions.className = 'item-actions';

                    const sellBtn = document.createElement('button');
                    sellBtn.className = 'btn btn-sell';
                    sellBtn.textContent = '💵 Sell';
                    sellBtn.onclick = () => this._handleSellAnimalDirect(animal.id);
                    actions.appendChild(sellBtn);

                    card.appendChild(actions);
                }

                return card;
            }
            /**
             * PRIVATE: _createYoungAnimalCard
             * Creates a young animal card with PLACE button
             */
            _createYoungAnimalCard(animal) {
                const card = document.createElement('div');
                card.className = 'young-animal-card item-card';
                card.dataset.animalId = animal.id;
                card.classList.add('young-status');

                // Header
                const header = document.createElement('div');
                header.className = 'item-header';

                const nameSection = document.createElement('div');
                const name = document.createElement('div');
                name.className = 'item-name-large';
                name.innerHTML = `<span class="item-emoji">🐣</span> Young ${animal.name}`;
                nameSection.appendChild(name);
                header.appendChild(nameSection);

                const tierBadge = document.createElement('div');
                tierBadge.className = `tier-badge tier-${animal.tier}`;
                tierBadge.textContent = '⭐'.repeat(animal.tier);
                header.appendChild(tierBadge);

                card.appendChild(header);

                // Status
                const statusBadge = document.createElement('div');
                statusBadge.className = 'status-badge young';
                statusBadge.textContent = 'Not Placed';
                card.appendChild(statusBadge);

                // Info
                const infoSection = document.createElement('div');
                infoSection.className = 'item-info';
                infoSection.innerHTML = `
        <div class="info-row">
            <span class="info-label">Growth Time:</span>
            <span class="info-value">${animal.growthTime} min</span>
        </div>
        <div class="info-row">
            <span class="info-label">Base Sell Price:</span>
            <span class="info-value">${HELPERS.formatMoney(animal.baseSellPrice)}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Breeding Chance:</span>
            <span class="info-value">${animal.breedingChance}%</span>
        </div>
    `;
                card.appendChild(infoSection);

                // Place button
                const actions = document.createElement('div');
                actions.className = 'item-actions';

                const placeBtn = document.createElement('button');
                placeBtn.className = 'btn btn-place btn-primary';
                placeBtn.innerHTML = '🏡 Place on Farm';

                const hasSpace = this.gameState.canPlaceMoreAnimals();

                if (!hasSpace) {
                    placeBtn.disabled = true;
                    placeBtn.textContent = '❌ Farm Full';
                } else {
                    placeBtn.onclick = () => this._handlePlaceAnimal(animal.id);
                }

                actions.appendChild(placeBtn);
                card.appendChild(actions);

                return card;
            }

            /**
             * PRIVATE: _handlePlaceAnimal
             * Handles placing a young animal on the farm
             */
            _handlePlaceAnimal(animalId) {
                HELPERS.debugLog('Attempting to place animal', { animalId });

                const result = this.farmManager.placeAnimal(animalId);

                if (result.success) {
                    this.showNotification('success', result.message, 3000);
                    this.renderFarmScreen();

                    HELPERS.debugLog('Animal placed successfully', {
                        animalId: result.animal.id,
                        animalName: result.animal.name
                    });
                } else {
                    this.showNotification('error', result.message, 3000);
                    HELPERS.debugLog('Failed to place animal', { reason: result.message });
                }
            }
            /**
             * PRIVATE: _createProgressSection
             * Creates progress bar section for growing items
             *
             * @param {Crop|Animal} item - Item with growth progress
             * @returns {HTMLElement} Progress section element
             */
            _createProgressSection(item) {
                const section = document.createElement('div');
                section.className = 'growth-section';

                const progress = item.getGrowthProgress();
                const remaining = item.getFormattedRemainingTime();

                // Progress label
                const label = document.createElement('div');
                label.className = 'progress-label';
                label.innerHTML = `
            <span class="progress-percentage">${Math.floor(progress)}%</span>
            <span class="time-remaining">${remaining}</span>
        `;
                section.appendChild(label);

                // Progress bar
                const barContainer = document.createElement('div');
                barContainer.className = 'progress-bar-container';

                const bar = document.createElement('div');
                bar.className = 'progress-bar';
                bar.style.width = `${progress}%`;
                barContainer.appendChild(bar);

                section.appendChild(barContainer);

                return section;
            }


            /**
             * PRIVATE: _updateFarmTimers
             * Updates all progress bars on farm screen
             */
            _updateFarmTimers() {
                // Update crop timers
                const crops = this.farmManager.getCropsOnFarm();
                crops.forEach(crop => {
                    const card = document.querySelector(`.crop-card[data-crop-id="${crop.id}"]`);
                    if (card && !crop.isMature()) {
                        const progressBar = card.querySelector('.progress-bar');
                        const progressPercentage = card.querySelector('.progress-percentage');
                        const timeRemaining = card.querySelector('.time-remaining');

                        if (progressBar) {
                            const progress = crop.getGrowthProgress();
                            progressBar.style.width = `${progress}%`;
                        }

                        if (progressPercentage) {
                            progressPercentage.textContent = `${Math.floor(crop.getGrowthProgress())}%`;
                        }

                        if (timeRemaining) {
                            timeRemaining.textContent = crop.getFormattedRemainingTime();
                        }
                    }
                });

                // Update animal timers
                const animals = this.farmManager.getAnimalsOnFarm();
                animals.forEach(animal => {
                    const card = document.querySelector(`.animal-card[data-animal-id="${animal.id}"]`);
                    if (card && !animal.isMature()) {
                        const progressBar = card.querySelector('.progress-bar');
                        const progressPercentage = card.querySelector('.progress-percentage');
                        const timeRemaining = card.querySelector('.time-remaining');

                        if (progressBar) {
                            const progress = animal.getGrowthProgress();
                            progressBar.style.width = `${progress}%`;
                        }

                        if (progressPercentage) {
                            progressPercentage.textContent = `${Math.floor(animal.getGrowthProgress())}%`;
                        }

                        if (timeRemaining) {
                            timeRemaining.textContent = animal.getFormattedRemainingTime();
                        }
                    }
                });
            }


            // ========================================================================
            // TOM'S SHOP SCREEN RENDERING
            // ========================================================================

            /**
             * PUBLIC: renderTomShopScreen
             * Renders Tom's seed shop
             */
            renderTomShopScreen() {
                this._updateShopDemandDisplay('tom-demand-display');
                this._renderTomShopInventory();
                this._renderPlayerCropInventory();
                HELPERS.debugLog('Tom shop screen rendered');
            }


            /**
             * PRIVATE: _renderTomShopInventory
             * Renders available seeds in Tom's shop
             */
            _renderTomShopInventory() {
                const container = document.getElementById('tom-shop-inventory');
                if (!container) return;

                // Clear existing content
                container.innerHTML = '';

                // Get available seeds
                const seeds = this.shopManager.getAvailableSeeds();

                // Create seed cards
                seeds.forEach(seedDef => {
                    const card = this._createShopItemCard('seed', seedDef);
                    container.appendChild(card);
                });
            }


            /**
             * PRIVATE: _renderPlayerCropInventory
             * Renders player's harvested crops for selling
             */
            _renderPlayerCropInventory() {
                const container = document.getElementById('player-crop-inventory');
                if (!container) return;

                // Clear existing content
                container.innerHTML = '';

                // Get harvested crops
                const crops = this.shopManager.getPlayerHarvestedCrops();

                // If no crops, show empty state
                if (crops.length === 0) {
                    const emptyState = this._createEmptyState(
                        'No crops to sell yet',
                        'Harvest crops from your farm first!',
                        () => this.showScreen(CONSTANTS.SCREENS.FARM)
                    );
                    container.appendChild(emptyState);
                    return;
                }

                // Create crop sell cards
                crops.forEach(crop => {
                    const card = this._createSellItemCard('crop', crop);
                    container.appendChild(card);
                });
            }


            // ========================================================================
            // HENRY'S SHOP SCREEN RENDERING
            // ========================================================================

            /**
             * PUBLIC: renderHenryShopScreen
             * Renders Henry's animal shop
             */
            renderHenryShopScreen() {
                this._updateShopDemandDisplay('henry-demand-display');
                this._renderHenryShopInventory();
                this._renderPlayerAnimalInventory();
                HELPERS.debugLog('Henry shop screen rendered');
            }


            /**
             * PRIVATE: _renderHenryShopInventory
             * Renders available animals in Henry's shop
             */
            _renderHenryShopInventory() {
                const container = document.getElementById('henry-shop-inventory');
                if (!container) return;

                // Clear existing content
                container.innerHTML = '';

                // Get available animals
                const animals = this.shopManager.getAvailableAnimals();

                // Create animal cards
                animals.forEach(animalDef => {
                    const card = this._createShopItemCard('animal', animalDef);
                    container.appendChild(card);
                });
            }


            /**
             * PRIVATE: _renderPlayerAnimalInventory
             * Renders player's mature animals for selling
             */
            _renderPlayerAnimalInventory() {
                const container = document.getElementById('player-animal-inventory');
                if (!container) return;

                // Clear existing content
                container.innerHTML = '';

                // Get mature animals
                const animals = this.shopManager.getPlayerMatureAnimals();

                // If no animals, show empty state
                if (animals.length === 0) {
                    const emptyState = this._createEmptyState(
                        'No animals to sell yet',
                        'Raise animals on your farm first!',
                        () => this.showScreen(CONSTANTS.SCREENS.FARM)
                    );
                    container.appendChild(emptyState);
                    return;
                }

                // Create animal sell cards
                animals.forEach(animal => {
                    const card = this._createSellItemCard('animal', animal);
                    container.appendChild(card);
                });
            }


            /**
             * PRIVATE: _updateShopDemandDisplay
             * Updates current demand multiplier display
             *
             * @param {string} elementId - ID of demand display element
             */
            _updateShopDemandDisplay(elementId) {
                const element = document.getElementById(elementId);
                if (!element) return;

                const demandIndex = this.shopManager.getCurrentDemandIndex();
                element.textContent = HELPERS.formatMultiplier(demandIndex);
            }


            /**
             * PRIVATE: _createShopItemCard
             * Creates a shop item card for buying
             *
             * @param {string} itemType - 'seed' or 'animal'
             * @param {Object} itemDef - Item definition object
             * @returns {HTMLElement} Shop item card
             */
            _createShopItemCard(itemType, itemDef) {
                const card = document.createElement('div');
                card.className = 'shop-item-card';
                card.dataset.tier = itemDef.tier;

                // Header
                const header = document.createElement('div');
                header.className = 'shop-item-header';
                header.innerHTML = `
            <div class="shop-item-icon">${itemType === 'seed' ? '🌱' : '🐔'}</div>
            <div class="shop-item-title">
                <div class="shop-item-name">${itemDef.name}</div>
                <div class="shop-item-description">${itemDef.description}</div>
            </div>
        `;
                card.appendChild(header);

                // Price section
                const priceSection = document.createElement('div');
                priceSection.className = 'price-section';

                const purchasePrice = itemType === 'seed' ? itemDef.seedCost : itemDef.purchaseCost;
                priceSection.innerHTML = `
            <div class="shop-price">
                <span class="price-label">Purchase:</span>
                <span class="price-amount buy-price">${HELPERS.formatMoney(purchasePrice)}</span>
            </div>
            <div class="shop-price">
                <span class="price-label">Current Sell Price:</span>
                <span class="price-amount sell-price">${HELPERS.formatMoney(itemDef.currentSellPrice)}</span>
            </div>
            <div class="multiplier-info">
                <span class="multiplier-label">Today's Multiplier:</span>
                <span class="multiplier-value ${this._getDemandClass()}">${HELPERS.formatMultiplier(this.shopManager.getCurrentDemandIndex())}</span>
            </div>
        `;
                card.appendChild(priceSection);

                // Stats
                const stats = document.createElement('div');
                stats.className = 'item-stats';
                stats.innerHTML = `
            <div class="stat-row">
                <span class="stat-name">Growth Time:</span>
                <span class="stat-value">${itemDef.growthTime} min</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Potential Profit:</span>
                <span class="stat-value highlight">${HELPERS.formatMoney(itemDef.potentialProfit)}</span>
            </div>
            ${itemType === 'animal' ? `
                <div class="stat-row">
                    <span class="stat-name">Breeding Chance:</span>
                    <span class="stat-value">${HELPERS.formatPercentage(itemDef.breedingChance)}</span>
                </div>
            ` : ''}
        `;
                card.appendChild(stats);

                // Buy button
                const actions = document.createElement('div');
                actions.className = 'shop-actions';

                const buyBtn = document.createElement('button');
                buyBtn.className = 'btn btn-buy';
                buyBtn.textContent = `Buy ${itemDef.name}`;
                buyBtn.disabled = !itemDef.canAfford;
                buyBtn.onclick = () => {
                    if (itemType === 'seed') {
                        this._handleBuySeed(itemDef.id);
                    } else {
                        this._handleBuyAnimal(itemDef.id);
                    }
                };
                actions.appendChild(buyBtn);

                card.appendChild(actions);

                return card;
            }


            /**
             * PRIVATE: _createSellItemCard
             * Creates a card for selling items
             *
             * @param {string} itemType - 'crop' or 'animal'
             * @param {Crop|Animal} item - Item to sell
             * @returns {HTMLElement} Sell item card
             */
            _createSellItemCard(itemType, item) {
                const card = document.createElement('div');
                card.className = 'inventory-item-card';

                const demandIndex = this.shopManager.getCurrentDemandIndex();
                const sellPrice = item.calculateSellPrice(demandIndex);
                const profit = item.calculateProfit(demandIndex);

                // Header
                const header = document.createElement('div');
                header.className = 'shop-item-header';
                header.innerHTML = `
            <div class="shop-item-icon">${itemType === 'crop' ? '🌾' : '🐔'}</div>
            <div class="shop-item-title">
                <div class="shop-item-name">${item.name}</div>
            </div>
        `;
                card.appendChild(header);

                // Price info
                const priceSection = document.createElement('div');
                priceSection.className = 'price-section';
                priceSection.innerHTML = `
            <div class="shop-price">
                <span class="price-label">Sell Price:</span>
                <span class="price-amount sell-price">${HELPERS.formatMoney(sellPrice)}</span>
            </div>
            <div class="profit-info">
                <span class="profit-label">Profit:</span>
                <span class="profit-amount">${HELPERS.formatMoney(profit)}</span>
            </div>
        `;
                card.appendChild(priceSection);

                // Sell button
                const actions = document.createElement('div');
                actions.className = 'shop-actions';

                const sellBtn = document.createElement('button');
                sellBtn.className = 'btn btn-sell';
                sellBtn.textContent = `Sell for ${HELPERS.formatMoney(sellPrice)}`;
                sellBtn.onclick = () => {
                    if (itemType === 'crop') {
                        this._handleSellCrop(item.id);
                    } else {
                        this._handleSellAnimal(item.id);
                    }
                };
                actions.appendChild(sellBtn);

                card.appendChild(actions);

                return card;
            }


            /**
             * PRIVATE: _getDemandClass
             * Gets CSS class for demand indicator
             *
             * @returns {string} CSS class name
             */
            _getDemandClass() {
                const demand = this.shopManager.getCurrentDemandIndex();
                if (demand >= 2.0) return 'best';
                if (demand >= 1.5) return 'great';
                if (demand >= 1.2) return 'good';
                return 'poor';
            }


            // ========================================================================
            // END SCREENS RENDERING
            // ========================================================================

            /**
             * PUBLIC: renderVictoryScreen
             * Renders the victory screen
             */
            renderVictoryScreen() {
                const container = document.getElementById('victory-statistics');
                if (!container) return;

                const stats = this.gameState.getStatistics();

                container.innerHTML = `
            <div class="stat-row">
                <span class="stat-name">Final Money:</span>
                <span class="stat-value-display">${stats.formattedFinalMoney}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Days Played:</span>
                <span class="stat-value-display">${stats.daysPlayed} / 10</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Total Crops Sold:</span>
                <span class="stat-value-display">${stats.totalCropsSold}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Total Animals Sold:</span>
                <span class="stat-value-display">${stats.totalAnimalsSold}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Total Offspring Born:</span>
                <span class="stat-value-display">${stats.totalOffspringBorn}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Net Profit:</span>
                <span class="stat-value-display">${stats.formattedNetProfit}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Best Single Sale:</span>
                <span class="stat-value-display">${HELPERS.formatMoney(stats.bestSingleSale)}</span>
            </div>
        `;

                HELPERS.debugLog('Victory screen rendered', stats);
            }


            /**
             * PUBLIC: renderDefeatScreen
             * Renders the defeat screen
             */
            renderDefeatScreen() {
                const container = document.getElementById('defeat-statistics');
                if (!container) return;

                const stats = this.gameState.getStatistics();
                const shortfall = this.gameState.goalMoney - this.gameState.currentMoney;

                container.innerHTML = `
            <div class="stat-row">
                <span class="stat-name">Final Money:</span>
                <span class="stat-value-display">${stats.formattedFinalMoney}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Money Needed:</span>
                <span class="stat-value-display">${HELPERS.formatMoney(shortfall)}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Total Crops Sold:</span>
                <span class="stat-value-display">${stats.totalCropsSold}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Total Animals Sold:</span>
                <span class="stat-value-display">${stats.totalAnimalsSold}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Total Offspring Born:</span>
                <span class="stat-value-display">${stats.totalOffspringBorn}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Best Single Sale:</span>
                <span class="stat-value-display">${HELPERS.formatMoney(stats.bestSingleSale)}</span>
            </div>
        `;

                HELPERS.debugLog('Defeat screen rendered', stats);
            }


            // ========================================================================
            // ACTION HANDLERS
            // ========================================================================

            /**
             * PRIVATE: _handleBuySeed
             * Handles buying a seed from Tom's shop
             */
            _handleBuySeed(cropType) {
                const result = this.shopManager.buySeed(cropType);

                if (result.success) {
                    this.showNotification('success', result.message);
                    this.renderTomShopScreen();
                } else {
                    this.showNotification('danger', result.message);
                }
            }


            /**
             * PRIVATE: _handleSellCrop
             * Handles selling a crop to Tom's shop
             */
            _handleSellCrop(cropId) {
                const result = this.shopManager.sellCrop(cropId);

                if (result.success) {
                    this.showNotification('success', result.message);
                    this.renderTomShopScreen();
                } else {
                    this.showNotification('danger', result.message);
                }
            }


            /**
             * PRIVATE: _handleBuyAnimal
             * Handles buying an animal from Henry's shop
             */
            _handleBuyAnimal(animalType) {
                const result = this.shopManager.buyAnimal(animalType);

                if (result.success) {
                    this.showNotification('success', result.message);
                    this.renderHenryShopScreen();
                } else {
                    this.showNotification('danger', result.message);
                }
            }


            /**
             * PRIVATE: _handleSellAnimal
             * Handles selling an animal to Henry's shop
             */
            _handleSellAnimal(animalId) {
                const result = this.shopManager.sellAnimal(animalId);

                if (result.success) {
                    this.showNotification('success', result.message);
                    this.renderHenryShopScreen();
                } else {
                    this.showNotification('danger', result.message);
                }
            }


            /**
             * PRIVATE: _handleSellAnimalDirect
             * Handles selling an animal directly from farm (navigates to shop)
             */
            _handleSellAnimalDirect(animalId) {
                // Navigate to shop first
                this.showScreen(CONSTANTS.SCREENS.HENRY_SHOP);

                // Then sell the animal
                setTimeout(() => {
                    this._handleSellAnimal(animalId);
                }, 100);
            }


            /**
             * PRIVATE: _handleHarvestCrop
             * Handles harvesting a crop on farm
             */
            _handleHarvestCrop(cropId) {
                const result = this.farmManager.harvestCrop(cropId);

                if (result.success) {
                    this.showNotification('success', result.message);
                    this.renderFarmScreen();
                } else {
                    this.showNotification('danger', result.message);
                }
            }


            // ========================================================================
            // NOTIFICATION SYSTEM
            // ========================================================================

            /**
             * PUBLIC: showNotification
             * Displays a notification message
             *
             * @param {string} type - Type of notification ('success', 'danger', 'warning', 'info')
             * @param {string} message - Message to display
             * @param {number} duration - Display duration in ms (default: 3000)
             */
            showNotification(type, message, duration = 3000) {
                const container = document.getElementById('notification-container');
                if (!container) return;

                // Create notification element
                const notification = document.createElement('div');
                notification.className = `notification ${type}`;

                const messageElement = document.createElement('div');
                messageElement.className = 'notification-message';
                messageElement.textContent = message;
                notification.appendChild(messageElement);

                // Add to container
                container.appendChild(notification);

                // Remove after duration
                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        container.removeChild(notification);
                    }, 300);
                }, duration);
            }


            // ========================================================================
            // UTILITY METHODS
            // ========================================================================

            /**
             * PRIVATE: _createEmptyState
             * Creates an empty state element
             *
             * @param {string} message - Main message
             * @param {string} hint - Hint text
             * @param {Function} actionCallback - Optional action callback
             * @returns {HTMLElement} Empty state element
             */
            _createEmptyState(message, hint, actionCallback) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-slot';

                const messageEl = document.createElement('p');
                messageEl.textContent = message;
                emptyState.appendChild(messageEl);

                const hintEl = document.createElement('p');
                hintEl.className = 'hint';
                hintEl.textContent = hint;
                emptyState.appendChild(hintEl);

                if (actionCallback) {
                    const actionBtn = document.createElement('button');
                    actionBtn.className = 'btn btn-small';
                    actionBtn.textContent = 'Go There';
                    actionBtn.onclick = actionCallback;
                    emptyState.appendChild(actionBtn);
                }

                return emptyState;
            }


            /**
             * PRIVATE: _restartGame
             * Restarts the game
             */
            _restartGame() {
                // This will be called from main.js
                window.location.reload();
            }


            /**
             * PUBLIC: cleanup
             * Cleans up the UI manager
             */
            cleanup() {
                // Remove event listeners if needed
                this.currentScreen = CONSTANTS.SCREENS.HOME;
                HELPERS.debugLog('UIManager cleaned up');
            }
        }

        /**
         * ============================================================================
         * USAGE EXAMPLES
         * ============================================================================
         *
         * // Initialize UI Manager
         * const uiManager = UIManager.getInstance();
         * uiManager.initialize({
         *     gameState: GameState.getInstance(),
         *     farmManager: FarmManager.getInstance(),
         *     shopManager: ShopManager.getInstance(),
         *     timerManager: TimerManager.getInstance()
         * });
         *
         * // Navigate to different screens
         * uiManager.showScreen(CONSTANTS.SCREENS.FARM);
         * uiManager.showScreen(CONSTANTS.SCREENS.TOM_SHOP);
         *
         * // Show notifications
         * uiManager.showNotification('success', 'Crop harvested!');
         * uiManager.showNotification('danger', 'Not enough money!');
         *
         * // Update specific components
         * uiManager.updateHeader();
         * uiManager.updateWeatherDisplay();
         *
         * ============================================================================
         */
        card.appendChild(actions);

        return card;
    }

    /**
     * PRIVATE: _handlePlaceAnimal
     * Handles placing a young animal on the farm
     */
    _handlePlaceAnimal(animalId) {
        HELPERS.debugLog('Attempting to place animal', { animalId });

        const result = this.farmManager.placeAnimal(animalId);

        if (result.success) {
            this.showNotification('success', result.message, 3000);
            this.renderFarmScreen();

            HELPERS.debugLog('Animal placed successfully', {
                animalId: result.animal.id,
                animalName: result.animal.name
            });
        } else {
            this.showNotification('error', result.message, 3000);
            HELPERS.debugLog('Failed to place animal', { reason: result.message });
        }
    }
    /**
     * PRIVATE: _createProgressSection
     * Creates progress bar section for growing items
     *
     * @param {Crop|Animal} item - Item with growth progress
     * @returns {HTMLElement} Progress section element
     */
    _createProgressSection(item) {
        const section = document.createElement('div');
        section.className = 'growth-section';

        const progress = item.getGrowthProgress();
        const remaining = item.getFormattedRemainingTime();

        // Progress label
        const label = document.createElement('div');
        label.className = 'progress-label';
        label.innerHTML = `
            <span class="progress-percentage">${Math.floor(progress)}%</span>
            <span class="time-remaining">${remaining}</span>
        `;
        section.appendChild(label);

        // Progress bar
        const barContainer = document.createElement('div');
        barContainer.className = 'progress-bar-container';

        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        bar.style.width = `${progress}%`;
        barContainer.appendChild(bar);

        section.appendChild(barContainer);

        return section;
    }


    /**
     * PRIVATE: _updateFarmTimers
     * Updates all progress bars on farm screen
     */
    _updateFarmTimers() {
        // Update crop timers
        const crops = this.farmManager.getCropsOnFarm();
        crops.forEach(crop => {
            const card = document.querySelector(`.crop-card[data-crop-id="${crop.id}"]`);
            if (card && !crop.isMature()) {
                const progressBar = card.querySelector('.progress-bar');
                const progressPercentage = card.querySelector('.progress-percentage');
                const timeRemaining = card.querySelector('.time-remaining');

                if (progressBar) {
                    const progress = crop.getGrowthProgress();
                    progressBar.style.width = `${progress}%`;
                }

                if (progressPercentage) {
                    progressPercentage.textContent = `${Math.floor(crop.getGrowthProgress())}%`;
                }

                if (timeRemaining) {
                    timeRemaining.textContent = crop.getFormattedRemainingTime();
                }
            }
        });

        // Update animal timers
        const animals = this.farmManager.getAnimalsOnFarm();
        animals.forEach(animal => {
            const card = document.querySelector(`.animal-card[data-animal-id="${animal.id}"]`);
            if (card && !animal.isMature()) {
                const progressBar = card.querySelector('.progress-bar');
                const progressPercentage = card.querySelector('.progress-percentage');
                const timeRemaining = card.querySelector('.time-remaining');

                if (progressBar) {
                    const progress = animal.getGrowthProgress();
                    progressBar.style.width = `${progress}%`;
                }

                if (progressPercentage) {
                    progressPercentage.textContent = `${Math.floor(animal.getGrowthProgress())}%`;
                }

                if (timeRemaining) {
                    timeRemaining.textContent = animal.getFormattedRemainingTime();
                }
            }
        });
    }


    // ========================================================================
    // TOM'S SHOP SCREEN RENDERING
    // ========================================================================

    /**
     * PUBLIC: renderTomShopScreen
     * Renders Tom's seed shop
     */
    renderTomShopScreen() {
        this._updateShopDemandDisplay('tom-demand-display');
        this._renderTomShopInventory();
        this._renderPlayerCropInventory();
        HELPERS.debugLog('Tom shop screen rendered');
    }


    /**
     * PRIVATE: _renderTomShopInventory
     * Renders available seeds in Tom's shop
     */
    _renderTomShopInventory() {
        const container = document.getElementById('tom-shop-inventory');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Get available seeds
        const seeds = this.shopManager.getAvailableSeeds();

        // Create seed cards
        seeds.forEach(seedDef => {
            const card = this._createShopItemCard('seed', seedDef);
            container.appendChild(card);
        });
    }


    /**
     * PRIVATE: _renderPlayerCropInventory
     * Renders player's harvested crops for selling
     */
    _renderPlayerCropInventory() {
        const container = document.getElementById('player-crop-inventory');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Get harvested crops
        const crops = this.shopManager.getPlayerHarvestedCrops();

        // If no crops, show empty state
        if (crops.length === 0) {
            const emptyState = this._createEmptyState(
                'No crops to sell yet',
                'Harvest crops from your farm first!',
                () => this.showScreen(CONSTANTS.SCREENS.FARM)
            );
            container.appendChild(emptyState);
            return;
        }

        // Create crop sell cards
        crops.forEach(crop => {
            const card = this._createSellItemCard('crop', crop);
            container.appendChild(card);
        });
    }


    // ========================================================================
    // HENRY'S SHOP SCREEN RENDERING
    // ========================================================================

    /**
     * PUBLIC: renderHenryShopScreen
     * Renders Henry's animal shop
     */
    renderHenryShopScreen() {
        this._updateShopDemandDisplay('henry-demand-display');
        this._renderHenryShopInventory();
        this._renderPlayerAnimalInventory();
        HELPERS.debugLog('Henry shop screen rendered');
    }


    /**
     * PRIVATE: _renderHenryShopInventory
     * Renders available animals in Henry's shop
     */
    _renderHenryShopInventory() {
        const container = document.getElementById('henry-shop-inventory');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Get available animals
        const animals = this.shopManager.getAvailableAnimals();

        // Create animal cards
        animals.forEach(animalDef => {
            const card = this._createShopItemCard('animal', animalDef);
            container.appendChild(card);
        });
    }


    /**
     * PRIVATE: _renderPlayerAnimalInventory
     * Renders player's mature animals for selling
     */
    _renderPlayerAnimalInventory() {
        const container = document.getElementById('player-animal-inventory');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Get mature animals
        const animals = this.shopManager.getPlayerMatureAnimals();

        // If no animals, show empty state
        if (animals.length === 0) {
            const emptyState = this._createEmptyState(
                'No animals to sell yet',
                'Raise animals on your farm first!',
                () => this.showScreen(CONSTANTS.SCREENS.FARM)
            );
            container.appendChild(emptyState);
            return;
        }

        // Create animal sell cards
        animals.forEach(animal => {
            const card = this._createSellItemCard('animal', animal);
            container.appendChild(card);
        });
    }


    /**
     * PRIVATE: _updateShopDemandDisplay
     * Updates current demand multiplier display
     *
     * @param {string} elementId - ID of demand display element
     */
    _updateShopDemandDisplay(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const demandIndex = this.shopManager.getCurrentDemandIndex();
        element.textContent = HELPERS.formatMultiplier(demandIndex);
    }


    /**
     * PRIVATE: _createShopItemCard
     * Creates a shop item card for buying
     *
     * @param {string} itemType - 'seed' or 'animal'
     * @param {Object} itemDef - Item definition object
     * @returns {HTMLElement} Shop item card
     */
    _createShopItemCard(itemType, itemDef) {
        const card = document.createElement('div');
        card.className = 'shop-item-card';
        card.dataset.tier = itemDef.tier;

        // Header
        const header = document.createElement('div');
        header.className = 'shop-item-header';
        header.innerHTML = `
            <div class="shop-item-icon">${itemType === 'seed' ? '🌱' : '🐔'}</div>
            <div class="shop-item-title">
                <div class="shop-item-name">${itemDef.name}</div>
                <div class="shop-item-description">${itemDef.description}</div>
            </div>
        `;
        card.appendChild(header);

        // Price section
        const priceSection = document.createElement('div');
        priceSection.className = 'price-section';

        const purchasePrice = itemType === 'seed' ? itemDef.seedCost : itemDef.purchaseCost;
        priceSection.innerHTML = `
            <div class="shop-price">
                <span class="price-label">Purchase:</span>
                <span class="price-amount buy-price">${HELPERS.formatMoney(purchasePrice)}</span>
            </div>
            <div class="shop-price">
                <span class="price-label">Current Sell Price:</span>
                <span class="price-amount sell-price">${HELPERS.formatMoney(itemDef.currentSellPrice)}</span>
            </div>
            <div class="multiplier-info">
                <span class="multiplier-label">Today's Multiplier:</span>
                <span class="multiplier-value ${this._getDemandClass()}">${HELPERS.formatMultiplier(this.shopManager.getCurrentDemandIndex())}</span>
            </div>
        `;
        card.appendChild(priceSection);

        // Stats
        const stats = document.createElement('div');
        stats.className = 'item-stats';
        stats.innerHTML = `
            <div class="stat-row">
                <span class="stat-name">Growth Time:</span>
                <span class="stat-value">${itemDef.growthTime} min</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Potential Profit:</span>
                <span class="stat-value highlight">${HELPERS.formatMoney(itemDef.potentialProfit)}</span>
            </div>
            ${itemType === 'animal' ? `
                <div class="stat-row">
                    <span class="stat-name">Breeding Chance:</span>
                    <span class="stat-value">${HELPERS.formatPercentage(itemDef.breedingChance)}</span>
                </div>
            ` : ''}
        `;
        card.appendChild(stats);

        // Buy button
        const actions = document.createElement('div');
        actions.className = 'shop-actions';

        const buyBtn = document.createElement('button');
        buyBtn.className = 'btn btn-buy';
        buyBtn.textContent = `Buy ${itemDef.name}`;
        buyBtn.disabled = !itemDef.canAfford;
        buyBtn.onclick = () => {
            if (itemType === 'seed') {
                this._handleBuySeed(itemDef.id);
            } else {
                this._handleBuyAnimal(itemDef.id);
            }
        };
        actions.appendChild(buyBtn);

        card.appendChild(actions);

        return card;
    }


    /**
     * PRIVATE: _createSellItemCard
     * Creates a card for selling items
     *
     * @param {string} itemType - 'crop' or 'animal'
     * @param {Crop|Animal} item - Item to sell
     * @returns {HTMLElement} Sell item card
     */
    _createSellItemCard(itemType, item) {
        const card = document.createElement('div');
        card.className = 'inventory-item-card';

        const demandIndex = this.shopManager.getCurrentDemandIndex();
        const sellPrice = item.calculateSellPrice(demandIndex);
        const profit = item.calculateProfit(demandIndex);

        // Header
        const header = document.createElement('div');
        header.className = 'shop-item-header';
        header.innerHTML = `
            <div class="shop-item-icon">${itemType === 'crop' ? '🌾' : '🐔'}</div>
            <div class="shop-item-title">
                <div class="shop-item-name">${item.name}</div>
            </div>
        `;
        card.appendChild(header);

        // Price info
        const priceSection = document.createElement('div');
        priceSection.className = 'price-section';
        priceSection.innerHTML = `
            <div class="shop-price">
                <span class="price-label">Sell Price:</span>
                <span class="price-amount sell-price">${HELPERS.formatMoney(sellPrice)}</span>
            </div>
            <div class="profit-info">
                <span class="profit-label">Profit:</span>
                <span class="profit-amount">${HELPERS.formatMoney(profit)}</span>
            </div>
        `;
        card.appendChild(priceSection);

        // Sell button
        const actions = document.createElement('div');
        actions.className = 'shop-actions';

        const sellBtn = document.createElement('button');
        sellBtn.className = 'btn btn-sell';
        sellBtn.textContent = `Sell for ${HELPERS.formatMoney(sellPrice)}`;
        sellBtn.onclick = () => {
            if (itemType === 'crop') {
                this._handleSellCrop(item.id);
            } else {
                this._handleSellAnimal(item.id);
            }
        };
        actions.appendChild(sellBtn);

        card.appendChild(actions);

        return card;
    }


    /**
     * PRIVATE: _getDemandClass
     * Gets CSS class for demand indicator
     *
     * @returns {string} CSS class name
     */
    _getDemandClass() {
        const demand = this.shopManager.getCurrentDemandIndex();
        if (demand >= 2.0) return 'best';
        if (demand >= 1.5) return 'great';
        if (demand >= 1.2) return 'good';
        return 'poor';
    }


    // ========================================================================
    // END SCREENS RENDERING
    // ========================================================================

    /**
     * PUBLIC: renderVictoryScreen
     * Renders the victory screen
     */
    renderVictoryScreen() {
        const container = document.getElementById('victory-statistics');
        if (!container) return;

        const stats = this.gameState.getStatistics();

        container.innerHTML = `
            <div class="stat-row">
                <span class="stat-name">Final Money:</span>
                <span class="stat-value-display">${stats.formattedFinalMoney}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Days Played:</span>
                <span class="stat-value-display">${stats.daysPlayed} / 10</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Total Crops Sold:</span>
                <span class="stat-value-display">${stats.totalCropsSold}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Total Animals Sold:</span>
                <span class="stat-value-display">${stats.totalAnimalsSold}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Total Offspring Born:</span>
                <span class="stat-value-display">${stats.totalOffspringBorn}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Net Profit:</span>
                <span class="stat-value-display">${stats.formattedNetProfit}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Best Single Sale:</span>
                <span class="stat-value-display">${HELPERS.formatMoney(stats.bestSingleSale)}</span>
            </div>
        `;

        HELPERS.debugLog('Victory screen rendered', stats);
    }


    /**
     * PUBLIC: renderDefeatScreen
     * Renders the defeat screen
     */
    renderDefeatScreen() {
        const container = document.getElementById('defeat-statistics');
        if (!container) return;

        const stats = this.gameState.getStatistics();
        const shortfall = this.gameState.goalMoney - this.gameState.currentMoney;

        container.innerHTML = `
            <div class="stat-row">
                <span class="stat-name">Final Money:</span>
                <span class="stat-value-display">${stats.formattedFinalMoney}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Money Needed:</span>
                <span class="stat-value-display">${HELPERS.formatMoney(shortfall)}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Total Crops Sold:</span>
                <span class="stat-value-display">${stats.totalCropsSold}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Total Animals Sold:</span>
                <span class="stat-value-display">${stats.totalAnimalsSold}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Total Offspring Born:</span>
                <span class="stat-value-display">${stats.totalOffspringBorn}</span>
            </div>
            <div class="stat-row">
                <span class="stat-name">Best Single Sale:</span>
                <span class="stat-value-display">${HELPERS.formatMoney(stats.bestSingleSale)}</span>
            </div>
        `;

        HELPERS.debugLog('Defeat screen rendered', stats);
    }


    // ========================================================================
    // ACTION HANDLERS
    // ========================================================================

    /**
     * PRIVATE: _handleBuySeed
     * Handles buying a seed from Tom's shop
     */
    _handleBuySeed(cropType) {
        const result = this.shopManager.buySeed(cropType);

        if (result.success) {
            this.showNotification('success', result.message);
            this.renderTomShopScreen();
        } else {
            this.showNotification('danger', result.message);
        }
    }


    /**
     * PRIVATE: _handleSellCrop
     * Handles selling a crop to Tom's shop
     */
    _handleSellCrop(cropId) {
        const result = this.shopManager.sellCrop(cropId);

        if (result.success) {
            this.showNotification('success', result.message);
            this.renderTomShopScreen();
        } else {
            this.showNotification('danger', result.message);
        }
    }


    /**
     * PRIVATE: _handleBuyAnimal
     * Handles buying an animal from Henry's shop
     */
    _handleBuyAnimal(animalType) {
        const result = this.shopManager.buyAnimal(animalType);

        if (result.success) {
            this.showNotification('success', result.message);
            this.renderHenryShopScreen();
        } else {
            this.showNotification('danger', result.message);
        }
    }


    /**
     * PRIVATE: _handleSellAnimal
     * Handles selling an animal to Henry's shop
     */
    _handleSellAnimal(animalId) {
        const result = this.shopManager.sellAnimal(animalId);

        if (result.success) {
            this.showNotification('success', result.message);
            this.renderHenryShopScreen();
        } else {
            this.showNotification('danger', result.message);
        }
    }


    /**
     * PRIVATE: _handleSellAnimalDirect
     * Handles selling an animal directly from farm (navigates to shop)
     */
    _handleSellAnimalDirect(animalId) {
        // Navigate to shop first
        this.showScreen(CONSTANTS.SCREENS.HENRY_SHOP);

        // Then sell the animal
        setTimeout(() => {
            this._handleSellAnimal(animalId);
        }, 100);
    }


    /**
     * PRIVATE: _handleHarvestCrop
     * Handles harvesting a crop on farm
     */
    _handleHarvestCrop(cropId) {
        const result = this.farmManager.harvestCrop(cropId);

        if (result.success) {
            this.showNotification('success', result.message);
            this.renderFarmScreen();
        } else {
            this.showNotification('danger', result.message);
        }
    }


    // ========================================================================
    // NOTIFICATION SYSTEM
    // ========================================================================

    /**
     * PUBLIC: showNotification
     * Displays a notification message
     *
     * @param {string} type - Type of notification ('success', 'danger', 'warning', 'info')
     * @param {string} message - Message to display
     * @param {number} duration - Display duration in ms (default: 3000)
     */
    showNotification(type, message, duration = 3000) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const messageElement = document.createElement('div');
        messageElement.className = 'notification-message';
        messageElement.textContent = message;
        notification.appendChild(messageElement);

        // Add to container
        container.appendChild(notification);

        // Remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                container.removeChild(notification);
            }, 300);
        }, duration);
    }


    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    /**
     * PRIVATE: _createEmptyState
     * Creates an empty state element
     *
     * @param {string} message - Main message
     * @param {string} hint - Hint text
     * @param {Function} actionCallback - Optional action callback
     * @returns {HTMLElement} Empty state element
     */
    _createEmptyState(message, hint, actionCallback) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-slot';

        const messageEl = document.createElement('p');
        messageEl.textContent = message;
        emptyState.appendChild(messageEl);

        const hintEl = document.createElement('p');
        hintEl.className = 'hint';
        hintEl.textContent = hint;
        emptyState.appendChild(hintEl);

        if (actionCallback) {
            const actionBtn = document.createElement('button');
            actionBtn.className = 'btn btn-small';
            actionBtn.textContent = 'Go There';
            actionBtn.onclick = actionCallback;
            emptyState.appendChild(actionBtn);
        }

        return emptyState;
    }


    /**
     * PRIVATE: _restartGame
     * Restarts the game
     */
    _restartGame() {
        // This will be called from main.js
        window.location.reload();
    }


    /**
     * PUBLIC: cleanup
     * Cleans up the UI manager
     */
    cleanup() {
        // Remove event listeners if needed
        this.currentScreen = CONSTANTS.SCREENS.HOME;
        HELPERS.debugLog('UIManager cleaned up');
    }
}

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 *
 * // Initialize UI Manager
 * const uiManager = UIManager.getInstance();
 * uiManager.initialize({
 *     gameState: GameState.getInstance(),
 *     farmManager: FarmManager.getInstance(),
 *     shopManager: ShopManager.getInstance(),
 *     timerManager: TimerManager.getInstance()
 * });
 *
 * // Navigate to different screens
 * uiManager.showScreen(CONSTANTS.SCREENS.FARM);
 * uiManager.showScreen(CONSTANTS.SCREENS.TOM_SHOP);
 *
 * // Show notifications
 * uiManager.showNotification('success', 'Crop harvested!');
 * uiManager.showNotification('danger', 'Not enough money!');
 *
 * // Update specific components
 * uiManager.updateHeader();
 * uiManager.updateWeatherDisplay();
 *
 * ============================================================================
 */