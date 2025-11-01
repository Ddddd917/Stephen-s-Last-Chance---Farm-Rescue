/**
 * ============================================================================
 * FILE: helpers.js
 * PURPOSE: Provide utility functions used throughout the game
 *
 * DESCRIPTION:
 * This file contains pure helper functions that perform common tasks:
 * - Formatting (money, time, percentages)
 * - Random number generation
 * - ID generation
 * - DOM manipulation utilities
 * - Mathematical operations
 * - Date/time utilities
 *
 * DESIGN PATTERN: Pure Functions
 * - No side effects
 * - Same input always produces same output (except random functions)
 * - Easy to test
 *
 * DEPENDENCIES: CONSTANTS (for format templates)
 * USED BY: All game modules
 * ============================================================================
 */

/**
 * HELPERS Object
 * Contains all utility functions organized by category
 */
const HELPERS = {

    // ========================================================================
    // FORMATTING FUNCTIONS
    // ========================================================================

    /**
     * FORMAT MONEY
     * Converts a number to a formatted currency string
     *
     * @param {number} amount - The amount of money to format
     * @returns {string} Formatted money string (e.g., "$1,234")
     *
     * EXAMPLES:
     * formatMoney(50) → "$50"
     * formatMoney(1234) → "$1,234"
     * formatMoney(5000) → "$5,000"
     * formatMoney(123456) → "$123,456"
     *
     * USED BY:
     * - UIManager.js (display money on all screens)
     * - ShopManager.js (show prices)
     * - Victory/Defeat screens (show final amount)
     */
    formatMoney(amount) {
        // Handle invalid input
        if (typeof amount !== 'number' || isNaN(amount)) {
            return '$0';
        }

        // Round to nearest dollar (no cents in this game)
        amount = Math.floor(amount);

        // Add commas for thousands separator
        // Example: 1234 → "1,234"
        const formattedNumber = amount.toLocaleString('en-US');

        // Add dollar sign
        return `$${formattedNumber}`;
    },


    /**
     * FORMAT TIME
     * Converts milliseconds to a readable time string
     *
     * @param {number} milliseconds - Time in milliseconds
     * @returns {string} Formatted time string (e.g., "2m 30s")
     *
     * EXAMPLES:
     * formatTime(120000) → "2m 0s"
     * formatTime(150000) → "2m 30s"
     * formatTime(45000) → "0m 45s"
     * formatTime(3600000) → "60m 0s"
     *
     * USED BY:
     * - TimerManager.js (display remaining growth time)
     * - UIManager.js (show timers on farm screen)
     */
    formatTime(milliseconds) {
        // Handle invalid input
        if (typeof milliseconds !== 'number' || milliseconds < 0) {
            return '0m 0s';
        }

        // Convert to seconds
        const totalSeconds = Math.floor(milliseconds / 1000);

        // Calculate minutes and remaining seconds
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        // Return formatted string
        return `${minutes}m ${seconds}s`;
    },


    /**
     * FORMAT PERCENTAGE
     * Converts a decimal to a percentage string
     *
     * @param {number} value - Decimal value (0-1)
     * @param {number} decimals - Number of decimal places (default: 0)
     * @returns {string} Formatted percentage (e.g., "75%")
     *
     * EXAMPLES:
     * formatPercentage(0.75) → "75%"
     * formatPercentage(0.333, 1) → "33.3%"
     * formatPercentage(1.0) → "100%"
     * formatPercentage(0.5) → "50%"
     *
     * USED BY:
     * - UIManager.js (show breeding chances, survival rates)
     * - Progress bars (growth progress)
     */
    formatPercentage(value, decimals = 0) {
        // Handle invalid input
        if (typeof value !== 'number' || isNaN(value)) {
            return '0%';
        }

        // Convert to percentage and round
        const percentage = (value * 100).toFixed(decimals);

        return `${percentage}%`;
    },


    /**
     * FORMAT MULTIPLIER
     * Formats a demand multiplier for display
     *
     * @param {number} multiplier - Demand multiplier value
     * @returns {string} Formatted multiplier (e.g., "2.0x")
     *
     * EXAMPLES:
     * formatMultiplier(2.0) → "2.0x"
     * formatMultiplier(1.5) → "1.5x"
     * formatMultiplier(0.8) → "0.8x"
     *
     * USED BY:
     * - ShopManager.js (show current price multiplier)
     * - UIManager.js (display demand index)
     */
    formatMultiplier(multiplier) {
        // Handle invalid input
        if (typeof multiplier !== 'number' || isNaN(multiplier)) {
            return '1.0x';
        }

        // Format to 1 decimal place
        return `${multiplier.toFixed(1)}x`;
    },


    /**
     * FORMAT DAY
     * Formats day number for display
     *
     * @param {number} day - Current day (1-10)
     * @returns {string} Formatted day string (e.g., "Day 5")
     *
     * EXAMPLES:
     * formatDay(1) → "Day 1"
     * formatDay(10) → "Day 10"
     *
     * USED BY:
     * - UIManager.js (display current day)
     */
    formatDay(day) {
        // Handle invalid input
        if (typeof day !== 'number' || day < 1) {
            return 'Day 1';
        }

        return `Day ${day}`;
    },


    // ========================================================================
    // RANDOM NUMBER GENERATION
    // ========================================================================

    /**
     * RANDOM INTEGER
     * Generates a random integer between min and max (inclusive)
     *
     * @param {number} min - Minimum value (inclusive)
     * @param {number} max - Maximum value (inclusive)
     * @returns {number} Random integer
     *
     * EXAMPLES:
     * randomInt(1, 6) → 1, 2, 3, 4, 5, or 6 (like a dice roll)
     * randomInt(0, 100) → Any integer from 0 to 100
     *
     * USED BY:
     * - Weather.js (generate random weather in specific ranges)
     * - Testing functions
     */
    randomInt(min, max) {
        // Validate inputs
        if (typeof min !== 'number' || typeof max !== 'number') {
            console.error('randomInt: Invalid arguments');
            return min;
        }

        // Ensure min is actually minimum
        if (min > max) {
            [min, max] = [max, min]; // Swap if needed
        }

        // Generate random integer
        // Math.random() gives [0, 1)
        // Multiply by range, add min, and floor
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },


    /**
     * RANDOM FLOAT
     * Generates a random float between min and max
     *
     * @param {number} min - Minimum value (inclusive)
     * @param {number} max - Maximum value (inclusive)
     * @param {number} decimals - Number of decimal places (default: 2)
     * @returns {number} Random float
     *
     * EXAMPLES:
     * randomFloat(0.1, 1.0, 2) → 0.65 (random value with 2 decimals)
     * randomFloat(0, 100, 1) → 45.7 (random value with 1 decimal)
     *
     * USED BY:
     * - Weather.js (generate weather values 0.10-1.00)
     */
    randomFloat(min, max, decimals = 2) {
        // Validate inputs
        if (typeof min !== 'number' || typeof max !== 'number') {
            console.error('randomFloat: Invalid arguments');
            return min;
        }

        // Ensure min is actually minimum
        if (min > max) {
            [min, max] = [max, min];
        }

        // Generate random float
        const random = Math.random() * (max - min) + min;

        // Round to specified decimal places
        return parseFloat(random.toFixed(decimals));
    },


    /**
     * RANDOM BOOLEAN
     * Returns true or false based on a probability
     *
     * @param {number} probability - Chance of returning true (0-1)
     * @returns {boolean} True or false
     *
     * EXAMPLES:
     * randomBoolean(0.5) → 50% chance of true
     * randomBoolean(0.35) → 35% chance of true (breeding chance)
     * randomBoolean(0.75) → 75% chance of true (survival rate)
     *
     * USED BY:
     * - Animal.js (breeding checks, survival checks)
     */
    randomBoolean(probability) {
        // Validate input
        if (typeof probability !== 'number' || probability < 0 || probability > 1) {
            console.error('randomBoolean: Invalid probability');
            return false;
        }

        // Return true if random value is less than probability
        return Math.random() < probability;
    },


    // ========================================================================
    // ID GENERATION
    // ========================================================================

    /**
     * GENERATE UNIQUE ID
     * Creates a unique identifier for game objects
     *
     * @param {string} prefix - Optional prefix for the ID
     * @returns {string} Unique ID string
     *
     * EXAMPLES:
     * generateUniqueId('crop') → "crop_1634567890123_abc123"
     * generateUniqueId('animal') → "animal_1634567890124_def456"
     * generateUniqueId() → "1634567890125_ghi789"
     *
     * HOW IT WORKS:
     * Combines timestamp + random string to ensure uniqueness
     * Even if two IDs are generated in the same millisecond,
     * the random part makes collision extremely unlikely
     *
     * USED BY:
     * - Crop.js (assign unique ID to each crop)
     * - Animal.js (assign unique ID to each animal)
     */
    generateUniqueId(prefix = '') {
        // Get current timestamp (milliseconds since 1970)
        const timestamp = Date.now();

        // Generate random string (6 characters)
        const randomStr = Math.random().toString(36).substring(2, 8);

        // Combine parts
        const id = prefix ? `${prefix}_${timestamp}_${randomStr}` : `${timestamp}_${randomStr}`;

        return id;
    },


    // ========================================================================
    // MATHEMATICAL UTILITIES
    // ========================================================================

    /**
     * CLAMP
     * Constrains a value between minimum and maximum
     *
     * @param {number} value - Value to constrain
     * @param {number} min - Minimum allowed value
     * @param {number} max - Maximum allowed value
     * @returns {number} Clamped value
     *
     * EXAMPLES:
     * clamp(5, 0, 10) → 5 (within range)
     * clamp(-5, 0, 10) → 0 (below min, returns min)
     * clamp(15, 0, 10) → 10 (above max, returns max)
     *
     * USED BY:
     * - Progress calculations (ensure 0-100%)
     * - Money validation (ensure non-negative)
     * - Day validation (ensure 1-10)
     */
    clamp(value, min, max) {
        // Validate inputs
        if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number') {
            console.error('clamp: Invalid arguments');
            return value;
        }

        // Return clamped value
        return Math.min(Math.max(value, min), max);
    },


    /**
     * CALCULATE PERCENTAGE
     * Calculates what percentage current is of total
     *
     * @param {number} current - Current value
     * @param {number} total - Total value
     * @returns {number} Percentage (0-100)
     *
     * EXAMPLES:
     * calculatePercentage(50, 100) → 50
     * calculatePercentage(2500, 5000) → 50
     * calculatePercentage(75, 100) → 75
     *
     * USED BY:
     * - Progress bars (goal progress, growth progress)
     * - UIManager.js (display completion percentage)
     */
    calculatePercentage(current, total) {
        // Handle edge cases
        if (total === 0) return 0;
        if (current >= total) return 100;

        // Calculate percentage
        const percentage = (current / total) * 100;

        // Clamp between 0 and 100
        return this.clamp(percentage, 0, 100);
    },


    /**
     * ROUND TO DECIMALS
     * Rounds a number to specified decimal places
     *
     * @param {number} value - Value to round
     * @param {number} decimals - Number of decimal places
     * @returns {number} Rounded value
     *
     * EXAMPLES:
     * roundToDecimals(3.14159, 2) → 3.14
     * roundToDecimals(2.5678, 1) → 2.6
     * roundToDecimals(10.999, 0) → 11
     *
     * USED BY:
     * - Price calculations
     * - Weather value generation
     */
    roundToDecimals(value, decimals) {
        // Validate inputs
        if (typeof value !== 'number' || typeof decimals !== 'number') {
            return value;
        }

        // Use toFixed and convert back to number
        return parseFloat(value.toFixed(decimals));
    },


    // ========================================================================
    // TIME UTILITIES
    // ========================================================================

    /**
     * MINUTES TO MILLISECONDS
     * Converts minutes to milliseconds
     *
     * @param {number} minutes - Time in minutes
     * @returns {number} Time in milliseconds
     *
     * EXAMPLES:
     * minutesToMilliseconds(1) → 60000
     * minutesToMilliseconds(2) → 120000
     * minutesToMilliseconds(5) → 300000
     *
     * USED BY:
     * - Crop.js (convert growth time to milliseconds)
     * - Animal.js (convert growth time to milliseconds)
     * - TimerManager.js (timer calculations)
     */
    minutesToMilliseconds(minutes) {
        if (typeof minutes !== 'number' || minutes < 0) {
            return 0;
        }
        return minutes * 60 * 1000;
    },


    /**
     * MILLISECONDS TO MINUTES
     * Converts milliseconds to minutes
     *
     * @param {number} milliseconds - Time in milliseconds
     * @returns {number} Time in minutes
     *
     * EXAMPLES:
     * millisecondsToMinutes(60000) → 1
     * millisecondsToMinutes(120000) → 2
     * millisecondsToMinutes(90000) → 1.5
     *
     * USED BY:
     * - Display functions
     * - Statistics calculations
     */
    millisecondsToMinutes(milliseconds) {
        if (typeof milliseconds !== 'number' || milliseconds < 0) {
            return 0;
        }
        return milliseconds / (60 * 1000);
    },


    /**
     * GET ELAPSED TIME
     * Calculates time elapsed since a starting timestamp
     *
     * @param {number} startTime - Starting timestamp (milliseconds)
     * @returns {number} Elapsed time in milliseconds
     *
     * EXAMPLES:
     * If startTime was 1000ms ago: getElapsedTime(startTime) → 1000
     *
     * USED BY:
     * - TimerManager.js (calculate growth progress)
     * - Crop.js and Animal.js (check if matured)
     */
    getElapsedTime(startTime) {
        if (typeof startTime !== 'number' || startTime < 0) {
            return 0;
        }
        return Date.now() - startTime;
    },


    /**
     * GET REMAINING TIME
     * Calculates time remaining until completion
     *
     * @param {number} startTime - Starting timestamp
     * @param {number} duration - Total duration in milliseconds
     * @returns {number} Remaining time in milliseconds (0 if complete)
     *
     * EXAMPLES:
     * If started 1min ago with 2min duration: getRemainingTime(start, 120000) → 60000
     *
     * USED BY:
     * - TimerManager.js (display countdown timers)
     * - UIManager.js (show remaining time on crops/animals)
     */
    getRemainingTime(startTime, duration) {
        const elapsed = this.getElapsedTime(startTime);
        const remaining = duration - elapsed;
        return Math.max(0, remaining); // Never return negative
    },


    // ========================================================================
    // DOM UTILITIES
    // ========================================================================

    /**
     * GET ELEMENT BY ID
     * Safely gets an element by ID with error handling
     *
     * @param {string} elementId - ID of the element
     * @returns {HTMLElement|null} The element or null if not found
     *
     * USED BY:
     * - UIManager.js (get screen containers)
     * - All rendering functions
     */
    getElementByIdSafe(elementId) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Element not found: ${elementId}`);
        }
        return element;
    },


    /**
     * ADD CLASS
     * Adds a CSS class to an element safely
     *
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to add
     *
     * USED BY:
     * - UIManager.js (add visual states)
     */
    addClass(element, className) {
        if (element && element.classList) {
            element.classList.add(className);
        }
    },


    /**
     * REMOVE CLASS
     * Removes a CSS class from an element safely
     *
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to remove
     *
     * USED BY:
     * - UIManager.js (remove visual states)
     */
    removeClass(element, className) {
        if (element && element.classList) {
            element.classList.remove(className);
        }
    },


    /**
     * TOGGLE CLASS
     * Toggles a CSS class on an element
     *
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to toggle
     *
     * USED BY:
     * - UIManager.js (toggle visibility, active states)
     */
    toggleClass(element, className) {
        if (element && element.classList) {
            element.classList.toggle(className);
        }
    },


    /**
     * CREATE ELEMENT
     * Creates an HTML element with optional class and content
     *
     * @param {string} tag - HTML tag name
     * @param {string} className - CSS class (optional)
     * @param {string} textContent - Text content (optional)
     * @returns {HTMLElement} Created element
     *
     * EXAMPLES:
     * createElement('div', 'crop-card', 'Wheat')
     * → <div class="crop-card">Wheat</div>
     *
     * USED BY:
     * - UIManager.js (dynamically create UI elements)
     */
    createElement(tag, className = '', textContent = '') {
        const element = document.createElement(tag);
        if (className) {
            element.className = className;
        }
        if (textContent) {
            element.textContent = textContent;
        }
        return element;
    },


    // ========================================================================
    // VALIDATION UTILITIES
    // ========================================================================

    /**
     * IS VALID NUMBER
     * Checks if a value is a valid number
     *
     * @param {any} value - Value to check
     * @returns {boolean} True if valid number
     *
     * USED BY:
     * - Input validation
     * - Error checking throughout code
     */
    isValidNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    },


    /**
     * IS POSITIVE NUMBER
     * Checks if a value is a positive number
     *
     * @param {any} value - Value to check
     * @returns {boolean} True if positive number
     *
     * USED BY:
     * - Money validation
     * - Price validation
     */
    isPositiveNumber(value) {
        return this.isValidNumber(value) && value > 0;
    },


    // ========================================================================
    // ARRAY UTILITIES
    // ========================================================================

    /**
     * SHUFFLE ARRAY
     * Randomly shuffles an array (Fisher-Yates algorithm)
     *
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array (new array, doesn't modify original)
     *
     * USED BY:
     * - Optional: Randomize shop display order
     */
    shuffleArray(array) {
        // Create a copy to avoid modifying original
        const shuffled = [...array];

        // Fisher-Yates shuffle
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled;
    },


    /**
     * FIND BY ID
     * Finds an object in an array by its id property
     *
     * @param {Array} array - Array to search
     * @param {string} id - ID to find
     * @returns {Object|null} Found object or null
     *
     * USED BY:
     * - GameState.js (find crops/animals by ID)
     */
    findById(array, id) {
        if (!Array.isArray(array)) {
            return null;
        }
        return array.find(item => item.id === id) || null;
    },


    // ========================================================================
    // DEBUGGING UTILITIES
    // ========================================================================

    /**
     * DEBUG LOG
     * Logs messages only if in development mode
     *
     * @param {string} message - Message to log
     * @param {any} data - Optional data to log
     *
     * USED BY:
     * - All modules (for debugging during development)
     */
    debugLog(message, data = null) {
        // Only log if TESTING_MODE is enabled in config
        if (GAME_CONFIG && GAME_CONFIG.BALANCE && GAME_CONFIG.BALANCE.TESTING_MODE) {
            console.log(`[DEBUG] ${message}`, data || '');
        }
    }
};

/**
 * ============================================================================
 * FREEZE HELPERS
 * ============================================================================
 *
 * Freeze the HELPERS object to prevent accidental modification
 */
Object.freeze(HELPERS);

/**
 * ============================================================================
 * EXPORT HELPERS
 * ============================================================================
 *
 * Make HELPERS available to other modules
 *
 * USAGE IN OTHER FILES:
 * const formattedMoney = HELPERS.formatMoney(1234);
 * const randomWeather = HELPERS.randomFloat(0.1, 1.0, 2);
 * const uniqueId = HELPERS.generateUniqueId('crop');
 */

// Export for use in other modules
// Note: If using ES6 modules, use: export default HELPERS;