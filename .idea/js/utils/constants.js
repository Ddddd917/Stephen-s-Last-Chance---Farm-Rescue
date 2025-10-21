/**
 * ============================================================================
 * FILE: constants.js
 * PURPOSE: Define constant values used throughout the game
 *
 * DESCRIPTION:
 * This file contains all constant values that don't change during gameplay.
 * These include status strings, screen identifiers, event names, and other
 * fixed values referenced by multiple modules.
 *
 * WHY SEPARATE FROM CONFIG?
 * - config.js contains GAME DATA (numbers, prices, definitions)
 * - constants.js contains CODE CONSTANTS (strings, enums, identifiers)
 *
 * DEPENDENCIES: None
 * USED BY: All game modules
 * ============================================================================
 */

/**
 * CONSTANTS Object
 * Contains all constant definitions organized by category
 */
const CONSTANTS = {

    // ========================================================================
    // GAME STATUS CONSTANTS
    // ========================================================================

    /**
     * GAME_STATUS: Possible states of the game
     *
     * USAGE:
     * Used in GameState.js to track overall game state
     * Checked before allowing player actions
     *
     * FLOW:
     * PLAYING → (reach $5,000) → WON
     * PLAYING → (exceed Day 10 without goal) → LOST
     */
    GAME_STATUS: {
        PLAYING: 'playing',    // Game is active, player can play
        WON: 'won',           // Player reached $5,000 goal
        LOST: 'lost',         // Player failed to reach goal by Day 10
        PAUSED: 'paused'      // Game is paused (optional feature)
    },


    // ========================================================================
    // ITEM STATUS CONSTANTS
    // ========================================================================

    /**
     * CROP_STATUS: Lifecycle stages of a crop
     *
     * USAGE:
     * Used in Crop.js to track crop growth state
     * Determines which actions are available (plant/harvest)
     *
     * FLOW:
     * SEED → (planted) → GROWING → (timer complete) → MATURE → (harvested) → SOLD
     */
    CROP_STATUS: {
        SEED: 'seed',         // Purchased but not planted yet
        GROWING: 'growing',   // Planted and growing
        MATURE: 'mature',     // Ready to harvest
        HARVESTED: 'harvested' // Harvested and ready to sell
    },

    /**
     * ANIMAL_STATUS: Lifecycle stages of an animal
     *
     * USAGE:
     * Used in Animal.js to track animal growth state
     * Similar to crops but includes breeding mechanics
     *
     * FLOW:
     * YOUNG → (placed on farm) → GROWING → (timer complete) → MATURE → (sold)
     * During GROWING: may trigger BREEDING event
     */
    ANIMAL_STATUS: {
        YOUNG: 'young',       // Purchased but not placed on farm yet
        GROWING: 'growing',   // Placed and growing
        MATURE: 'mature',     // Ready to sell
        BREEDING: 'breeding'  // Currently in breeding process
    },


    // ========================================================================
    // SCREEN IDENTIFIERS
    // ========================================================================

    /**
     * SCREENS: Unique identifiers for each game screen
     *
     * USAGE:
     * Used by UIManager.js for navigation and rendering
     * Passed to render functions to determine which screen to show
     *
     * CALLED BY:
     * - main.js (initial screen on load)
     * - UIManager.js (screen transitions)
     * - Navigation button handlers
     */
    SCREENS: {
        HOME: 'home',               // Main menu with weather forecast
        FARM: 'farm',               // Farm management screen
        TOM_SHOP: 'tom-shop',       // Tom's seed store
        HENRY_SHOP: 'henry-shop',   // Henry's animal farm
        VICTORY: 'victory',         // Victory screen (game won)
        DEFEAT: 'defeat'            // Defeat screen (game lost)
    },


    // ========================================================================
    // UI ELEMENT IDS
    // ========================================================================

    /**
     * ELEMENT_IDS: HTML element IDs for DOM manipulation
     *
     * USAGE:
     * Used to select HTML elements via document.getElementById()
     * Ensures consistent naming between HTML and JavaScript
     *
     * NOTE: These IDs must match the id attributes in index.html
     */
    ELEMENT_IDS: {
        // Main container
        GAME_CONTAINER: 'game-container',

        // Screen containers
        HOME_SCREEN: 'home-screen',
        FARM_SCREEN: 'farm-screen',
        TOM_SHOP_SCREEN: 'tom-shop-screen',
        HENRY_SHOP_SCREEN: 'henry-shop-screen',
        VICTORY_SCREEN: 'victory-screen',
        DEFEAT_SCREEN: 'defeat-screen',

        // Display elements (shown on multiple screens)
        MONEY_DISPLAY: 'money-display',
        DAY_DISPLAY: 'day-display',
        GOAL_PROGRESS: 'goal-progress',
        DAYS_REMAINING: 'days-remaining',

        // Weather forecast
        WEATHER_FORECAST: 'weather-forecast',
        CURRENT_WEATHER: 'current-weather',
        DEMAND_INDEX: 'demand-index',

        // Farm elements
        CROP_PLOTS: 'crop-plots',
        ANIMAL_PENS: 'animal-pens',

        // Shop elements
        SHOP_INVENTORY: 'shop-inventory',
        PLAYER_INVENTORY: 'player-inventory',

        // Notification system
        NOTIFICATION_CONTAINER: 'notification-container',

        // Statistics (end screens)
        STATISTICS_DISPLAY: 'statistics-display'
    },


    // ========================================================================
    // CSS CLASS NAMES
    // ========================================================================

    /**
     * CSS_CLASSES: CSS class names for styling
     *
     * USAGE:
     * Used when adding/removing classes to elements
     * Keeps class names consistent and prevents typos
     *
     * NOTE: These classes must be defined in CSS files
     */
    CSS_CLASSES: {
        // Item states
        GROWING: 'growing',
        MATURE: 'mature',
        DISABLED: 'disabled',
        HIDDEN: 'hidden',
        ACTIVE: 'active',

        // Visual effects
        PULSE: 'pulse',
        FADE_IN: 'fade-in',
        FADE_OUT: 'fade-out',
        SHAKE: 'shake',

        // Status indicators
        SUCCESS: 'success',
        WARNING: 'warning',
        DANGER: 'danger',
        INFO: 'info',

        // Layout
        FLEX_ROW: 'flex-row',
        FLEX_COLUMN: 'flex-column',
        CENTERED: 'centered',

        // Specific components
        CROP_CARD: 'crop-card',
        ANIMAL_CARD: 'animal-card',
        WEATHER_CARD: 'weather-card',
        SHOP_ITEM: 'shop-item',
        NOTIFICATION: 'notification',
        PROGRESS_BAR: 'progress-bar'
    },


    // ========================================================================
    // EVENT NAMES
    // ========================================================================

    /**
     * EVENTS: Custom event names for game system communication
     *
     * USAGE:
     * Used for event-driven programming between modules
     * Modules can dispatch/listen for these events
     *
     * EXAMPLE:
     * When money changes:
     * document.dispatchEvent(new CustomEvent(EVENTS.MONEY_CHANGED, {detail: {newAmount: 100}}))
     */
    EVENTS: {
        // Game state events
        GAME_STARTED: 'game-started',
        GAME_WON: 'game-won',
        GAME_LOST: 'game-lost',
        DAY_ADVANCED: 'day-advanced',

        // Money events
        MONEY_CHANGED: 'money-changed',
        MILESTONE_REACHED: 'milestone-reached',

        // Item events
        CROP_PLANTED: 'crop-planted',
        CROP_MATURED: 'crop-matured',
        CROP_HARVESTED: 'crop-harvested',
        ANIMAL_PURCHASED: 'animal-purchased',
        ANIMAL_MATURED: 'animal-matured',
        ANIMAL_BRED: 'animal-bred',

        // Shop events
        ITEM_PURCHASED: 'item-purchased',
        ITEM_SOLD: 'item-sold',

        // UI events
        SCREEN_CHANGED: 'screen-changed',
        NOTIFICATION_SHOWN: 'notification-shown'
    },


    // ========================================================================
    // TIMING CONSTANTS
    // ========================================================================

    /**
     * TIMING: Time-related constants
     *
     * USAGE:
     * Used by TimerManager.js and animation systems
     * All values in milliseconds unless specified
     */
    TIMING: {
        // Timer update frequency
        TIMER_UPDATE_INTERVAL: 1000,      // Update every 1 second (1000ms)

        // Animation durations
        ANIMATION_FAST: 200,              // Quick transitions
        ANIMATION_NORMAL: 400,            // Standard animations
        ANIMATION_SLOW: 600,              // Slow, emphasized animations

        // Notification durations
        NOTIFICATION_SHORT: 2000,         // 2 seconds
        NOTIFICATION_NORMAL: 3000,        // 3 seconds
        NOTIFICATION_LONG: 5000,          // 5 seconds

        // Auto-save interval (optional feature)
        AUTO_SAVE_INTERVAL: 30000,        // Save every 30 seconds

        // Conversion factors
        MINUTES_TO_MILLISECONDS: 60000,   // 1 minute = 60,000 milliseconds
        SECONDS_TO_MILLISECONDS: 1000     // 1 second = 1,000 milliseconds
    },


    // ========================================================================
    // WEATHER CONSTANTS
    // ========================================================================

    /**
     * WEATHER_RANGES: Weather value ranges and thresholds
     *
     * USAGE:
     * Used by Weather.js for generation and classification
     */
    WEATHER_RANGES: {
        MIN: 0.10,                        // Minimum weather value (worst)
        MAX: 1.00,                        // Maximum weather value (best)
        DECIMALS: 2,                      // Number of decimal places

        // Classification thresholds
        PERFECT: 1.00,                    // Perfect weather
        GOOD: 0.80,                       // Good weather threshold
        NEUTRAL: 0.60,                    // Neutral weather threshold
        POOR: 0.40,                       // Poor weather threshold
        TERRIBLE: 0.20                    // Terrible weather threshold
    },


    // ========================================================================
    // DISPLAY FORMATS
    // ========================================================================

    /**
     * FORMATS: String formatting templates
     *
     * USAGE:
     * Used by helpers.js and UIManager.js for consistent display
     * Placeholders will be replaced with actual values
     */
    FORMATS: {
        MONEY: '$X',                      // X will be replaced with amount
        DAY: 'Day X',                     // X will be replaced with day number
        TIME: 'Xm Ys',                    // X = minutes, Y = seconds
        PERCENTAGE: 'X%',                 // X will be replaced with percentage
        MULTIPLIER: 'Xx',                 // X will be replaced with multiplier
        GOAL_PROGRESS: '$X / $Y',         // X = current, Y = goal
        DAYS_LEFT: 'X days remaining'     // X will be replaced with days
    },


    // ========================================================================
    // VALIDATION CONSTANTS
    // ========================================================================

    /**
     * VALIDATION: Limits and validation rules
     *
     * USAGE:
     * Used for input validation and boundary checking
     */
    VALIDATION: {
        // Farm capacity
        MAX_CROP_SLOTS: 10,               // Maximum crops growing simultaneously
        MAX_ANIMAL_SLOTS: 5,              // Maximum animals growing simultaneously

        // Name lengths (if allowing custom names)
        MIN_NAME_LENGTH: 2,
        MAX_NAME_LENGTH: 20,

        // Numeric bounds
        MIN_MONEY: 0,                     // Can't go negative
        MAX_MONEY: 999999,                // Upper limit (optional)
        MIN_DAY: 1,
        MAX_DAY: 10
    },


    // ========================================================================
    // ERROR MESSAGES
    // ========================================================================

    /**
     * ERROR_MESSAGES: Standardized error message templates
     *
     * USAGE:
     * Used when displaying errors to user
     * Ensures consistent error messaging
     */
    ERROR_MESSAGES: {
        NOT_ENOUGH_MONEY: 'Not enough money! You need $X.',
        NO_SPACE_CROPS: 'No space available! Harvest some crops first.',
        NO_SPACE_ANIMALS: 'No space available! Sell some animals first.',
        NOT_MATURE: 'This item is not ready yet. Please wait.',
        ALREADY_HARVESTED: 'This item has already been harvested.',
        INVALID_ITEM: 'Invalid item selected.',
        GAME_OVER: 'Game is over. Cannot perform this action.',
        SAVE_FAILED: 'Failed to save game progress.',
        LOAD_FAILED: 'Failed to load game progress.'
    },


    // ========================================================================
    // SUCCESS MESSAGES
    // ========================================================================

    /**
     * SUCCESS_MESSAGES: Positive feedback message templates
     *
     * USAGE:
     * Used to show success notifications
     */
    SUCCESS_MESSAGES: {
        ITEM_PURCHASED: 'Purchased X for $Y!',
        ITEM_SOLD: 'Sold X for $Y!',
        CROP_PLANTED: 'X planted successfully!',
        ANIMAL_PLACED: 'X placed on farm!',
        CROP_HARVESTED: 'Harvested X!',
        ANIMAL_BRED: 'X gave birth to offspring!',
        MILESTONE_REACHED: 'Milestone reached: X!',
        GAME_SAVED: 'Game progress saved!',
        GAME_LOADED: 'Game progress loaded!'
    },


    // ========================================================================
    // KEYBOARD SHORTCUTS (OPTIONAL)
    // ========================================================================

    /**
     * KEYBOARD: Keyboard shortcut keys
     *
     * USAGE:
     * Optional feature for keyboard navigation
     * Can be used to enhance accessibility
     */
    KEYBOARD: {
        ESCAPE: 'Escape',                 // Return to home/cancel
        ENTER: 'Enter',                   // Confirm action
        SPACE: ' ',                       // Quick action
        H: 'h',                           // Go to Home
        F: 'f',                           // Go to Farm
        T: 't',                           // Go to Tom's shop
        Y: 'y'                            // Go to Henry's shop (h was taken)
    },


    // ========================================================================
    // STORAGE KEYS (IF IMPLEMENTING SAVE SYSTEM)
    // ========================================================================

    /**
     * STORAGE_KEYS: LocalStorage key names
     *
     * USAGE:
     * If implementing save/load functionality
     * Used to store game data in browser's localStorage
     */
    STORAGE_KEYS: {
        GAME_STATE: 'farmRescue_gameState',
        SETTINGS: 'farmRescue_settings',
        HIGH_SCORE: 'farmRescue_highScore',
        LAST_SAVE: 'farmRescue_lastSave'
    },


    // ========================================================================
    // AUDIO FILE NAMES (OPTIONAL)
    // ========================================================================

    /**
     * AUDIO: Sound effect file names
     *
     * USAGE:
     * If implementing audio, reference these constants
     * Files should be in assets/sounds/ folder
     */
    AUDIO: {
        PLANT: 'plant.mp3',
        HARVEST: 'harvest.mp3',
        PURCHASE: 'purchase.mp3',
        SELL: 'sell.mp3',
        MONEY: 'money.mp3',
        VICTORY: 'victory.mp3',
        DEFEAT: 'defeat.mp3',
        NOTIFICATION: 'notification.mp3',
        BREEDING: 'breeding.mp3',
        BACKGROUND_MUSIC: 'background.mp3'
    }
};

/**
 * ============================================================================
 * FREEZE CONSTANTS
 * ============================================================================
 *
 * Object.freeze() prevents accidental modification of constants
 * This ensures constants remain constant throughout execution
 *
 * NOTE: This is optional but recommended for code safety
 */
Object.freeze(CONSTANTS.GAME_STATUS);
Object.freeze(CONSTANTS.CROP_STATUS);
Object.freeze(CONSTANTS.ANIMAL_STATUS);
Object.freeze(CONSTANTS.SCREENS);
Object.freeze(CONSTANTS.ELEMENT_IDS);
Object.freeze(CONSTANTS.CSS_CLASSES);
Object.freeze(CONSTANTS.EVENTS);
Object.freeze(CONSTANTS.TIMING);
Object.freeze(CONSTANTS.WEATHER_RANGES);
Object.freeze(CONSTANTS.FORMATS);
Object.freeze(CONSTANTS.VALIDATION);
Object.freeze(CONSTANTS.ERROR_MESSAGES);
Object.freeze(CONSTANTS.SUCCESS_MESSAGES);
Object.freeze(CONSTANTS.KEYBOARD);
Object.freeze(CONSTANTS.STORAGE_KEYS);
Object.freeze(CONSTANTS.AUDIO);
Object.freeze(CONSTANTS); // Freeze the main object

/**
 * ============================================================================
 * EXPORT CONSTANTS
 * ============================================================================
 *
 * Make CONSTANTS available to other modules
 *
 * USAGE IN OTHER FILES:
 * Access constants like:
 * - CONSTANTS.GAME_STATUS.PLAYING
 * - CONSTANTS.SCREENS.HOME
 * - CONSTANTS.EVENTS.MONEY_CHANGED
 *
 * BENEFITS:
 * - Prevents typos (IDE autocomplete)
 * - Single source of truth for string values
 * - Easy to update all references at once
 * - Self-documenting code
 */

// Export for use in other modules
// Note: If using ES6 modules, use: export default CONSTANTS;
// For now, we're using it as a global variable accessible to all scripts