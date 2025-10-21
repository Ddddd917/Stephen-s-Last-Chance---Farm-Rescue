/**
 * ============================================================================
 * FILE: Crop.js
 * PURPOSE: Crop data model and lifecycle management
 *
 * DESCRIPTION:
 * This class represents an individual crop instance in the game:
 * - Stores crop type, status, and timing information
 * - Tracks growth progress
 * - Manages crop lifecycle (seed → growing → mature → harvested)
 * - Calculates when crop is ready to harvest
 *
 * CROP LIFECYCLE:
 * 1. SEED: Purchased from Tom's shop, not yet planted
 * 2. GROWING: Planted on farm, timer running
 * 3. MATURE: Growth complete, ready to harvest
 * 4. HARVESTED: Picked from farm, ready to sell back to Tom
 *
 * DEPENDENCIES:
 * - config.js (for crop definitions and properties)
 * - constants.js (for status constants)
 * - helpers.js (for ID generation, time calculations)
 *
 * USED BY:
 * - FarmManager.js (plant and harvest crops)
 * - TimerManager.js (update growth progress)
 * - ShopManager.js (buy seeds, sell harvested crops)
 * - UIManager.js (display crops on farm)
 * - GameState.js (store crops in inventory)
 * ============================================================================
 */

/**
 * CLASS: Crop
 * Represents a single crop instance with its properties and state
 *
 * INSTANCE DATA:
 * - id: Unique identifier for this crop
 * - type: Crop type (wheat/carrot/corn/strawberry/watermelon)
 * - name: Display name
 * - status: Current lifecycle status (seed/growing/mature/harvested)
 * - seedCost: How much was paid for the seed
 * - baseSellPrice: Base selling price (before weather multiplier)
 * - growthTime: Total growth duration in minutes
 * - growthDuration: Total growth duration in milliseconds
 * - plantTime: Timestamp when crop was planted (null if not planted)
 * - harvestTime: Timestamp when crop was harvested (null if not harvested)
 * - tier: Difficulty tier (1-5)
 *
 * USAGE:
 * const wheat = new Crop('wheat');
 * wheat.plant(); // Start growing
 * if (wheat.isMature()) {
 *     wheat.harvest();
 * }
 */
class Crop {

    /**
     * CONSTRUCTOR
     * Creates a new Crop instance
     *
     * @param {string} type - Crop type identifier (must match config.js)
     *
     * VALIDATION:
     * - Checks if crop type exists in GAME_CONFIG.CROPS
     * - Throws error if invalid type
     *
     * CALLED BY:
     * - ShopManager.js (when player purchases seeds)
     * - FarmManager.js (when creating crop for planting)
     *
     * EXAMPLE:
     * const wheat = new Crop('wheat');
     * const corn = new Crop('corn');
     */
    constructor(type) {
        // Find crop definition in config
        const cropDef = GAME_CONFIG.CROPS.find(c => c.id === type);

        // Validate crop type
        if (!cropDef) {
            console.error(`Crop: Invalid crop type "${type}"`);
            throw new Error(`Invalid crop type: ${type}`);
        }

        // Generate unique ID for this crop instance
        this.id = HELPERS.generateUniqueId('crop');

        // Store crop type and properties from config
        this.type = cropDef.id;
        this.name = cropDef.name;
        this.seedCost = cropDef.seedCost;
        this.baseSellPrice = cropDef.baseSellPrice;
        this.growthTime = cropDef.growthTime; // in minutes
        this.tier = cropDef.tier;
        this.description = cropDef.description;

        // Convert growth time to milliseconds for timer calculations
        this.growthDuration = HELPERS.minutesToMilliseconds(this.growthTime);

        // Initialize status as SEED (not planted yet)
        this.status = CONSTANTS.CROP_STATUS.SEED;

        // Initialize timing properties (null until planted/harvested)
        this.plantTime = null;      // When crop was planted
        this.harvestTime = null;    // When crop was harvested

        // Store creation timestamp for debugging/statistics
        this.createdAt = Date.now();

        // Log creation in debug mode
        HELPERS.debugLog(`Created ${this.name} crop`, {
            id: this.id,
            type: this.type,
            growthTime: `${this.growthTime}min`
        });
    }


    // ========================================================================
    // LIFECYCLE METHODS
    // ========================================================================

    /**
     * PUBLIC: plant
     * Plants the crop, starting its growth timer
     *
     * STATUS CHANGE: SEED → GROWING
     *
     * CALLED BY:
     * - FarmManager.plantCrop() (when player plants seed on farm)
     *
     * RETURNS: {boolean} True if successfully planted, false if already planted
     *
     * EXAMPLE:
     * const wheat = new Crop('wheat');
     * wheat.plant(); // Start growing
     */
    plant() {
        // Check if already planted
        if (this.status !== CONSTANTS.CROP_STATUS.SEED) {
            console.warn(`Crop.plant: Cannot plant ${this.name} - already planted or harvested`);
            return false;
        }

        // Update status to GROWING
        this.status = CONSTANTS.CROP_STATUS.GROWING;

        // Record plant time
        this.plantTime = Date.now();

        // Log planting in debug mode
        HELPERS.debugLog(`Planted ${this.name}`, {
            id: this.id,
            plantTime: this.plantTime,
            willMatureAt: this.plantTime + this.growthDuration
        });

        return true;
    }


    /**
     * PUBLIC: harvest
     * Harvests the mature crop
     *
     * STATUS CHANGE: MATURE → HARVESTED
     *
     * CALLED BY:
     * - FarmManager.harvestCrop() (when player clicks harvest button)
     *
     * RETURNS: {boolean} True if successfully harvested, false if not mature
     *
     * EXAMPLE:
     * if (wheat.isMature()) {
     *     wheat.harvest();
     * }
     */
    harvest() {
        // Check if crop is mature
        if (this.status !== CONSTANTS.CROP_STATUS.MATURE) {
            console.warn(`Crop.harvest: Cannot harvest ${this.name} - not mature yet`);
            return false;
        }

        // Update status to HARVESTED
        this.status = CONSTANTS.CROP_STATUS.HARVESTED;

        // Record harvest time
        this.harvestTime = Date.now();

        // Log harvesting in debug mode
        HELPERS.debugLog(`Harvested ${this.name}`, {
            id: this.id,
            totalGrowthTime: this.harvestTime - this.plantTime
        });

        return true;
    }


    // ========================================================================
    // STATUS CHECK METHODS
    // ========================================================================

    /**
     * PUBLIC: isMature
     * Checks if crop has finished growing and is ready to harvest
     *
     * @returns {boolean} True if crop is mature
     *
     * LOGIC:
     * 1. Crop must be in GROWING status
     * 2. Current time >= plant time + growth duration
     * 3. If mature, automatically update status to MATURE
     *
     * CALLED BY:
     * - TimerManager.js (check all growing crops every second)
     * - FarmManager.js (before allowing harvest)
     * - UIManager.js (determine if harvest button should be enabled)
     *
     * EXAMPLE:
     * if (wheat.isMature()) {
     *     console.log('Ready to harvest!');
     * }
     */
    isMature() {
        // Only growing crops can become mature
        if (this.status !== CONSTANTS.CROP_STATUS.GROWING) {
            return this.status === CONSTANTS.CROP_STATUS.MATURE;
        }

        // Check if enough time has passed
        const elapsed = HELPERS.getElapsedTime(this.plantTime);
        const isReady = elapsed >= this.growthDuration;

        // If ready, update status to MATURE
        if (isReady) {
            this.status = CONSTANTS.CROP_STATUS.MATURE;

            HELPERS.debugLog(`${this.name} is now mature!`, {
                id: this.id,
                growthTime: HELPERS.formatTime(elapsed)
            });
        }

        return isReady;
    }


    /**
     * PUBLIC: isPlanted
     * Checks if crop has been planted
     *
     * @returns {boolean} True if crop is planted (growing or mature)
     *
     * CALLED BY:
     * - UIManager.js (determine display location)
     *
     * EXAMPLE:
     * if (wheat.isPlanted()) {
     *     // Show on farm
     * } else {
     *     // Show in inventory
     * }
     */
    isPlanted() {
        return this.status === CONSTANTS.CROP_STATUS.GROWING ||
            this.status === CONSTANTS.CROP_STATUS.MATURE;
    }


    /**
     * PUBLIC: isHarvested
     * Checks if crop has been harvested
     *
     * @returns {boolean} True if crop is harvested
     *
     * CALLED BY:
     * - ShopManager.js (check if crop can be sold)
     *
     * EXAMPLE:
     * if (wheat.isHarvested()) {
     *     // Can sell to Tom's shop
     * }
     */
    isHarvested() {
        return this.status === CONSTANTS.CROP_STATUS.HARVESTED;
    }


    // ========================================================================
    // PROGRESS CALCULATION METHODS
    // ========================================================================

    /**
     * PUBLIC: getGrowthProgress
     * Calculates growth completion percentage
     *
     * @returns {number} Progress percentage (0-100)
     *
     * LOGIC:
     * - Returns 0 if not planted
     * - Returns 100 if mature or harvested
     * - Otherwise: (elapsed time / total duration) × 100
     *
     * CALLED BY:
     * - UIManager.js (display progress bars)
     * - TimerManager.js (update progress display)
     *
     * EXAMPLE:
     * const progress = wheat.getGrowthProgress();
     * console.log(`${progress}% complete`); // "45% complete"
     */
    getGrowthProgress() {
        // Not planted yet
        if (this.status === CONSTANTS.CROP_STATUS.SEED) {
            return 0;
        }

        // Already mature or harvested
        if (this.status === CONSTANTS.CROP_STATUS.MATURE ||
            this.status === CONSTANTS.CROP_STATUS.HARVESTED) {
            return 100;
        }

        // Calculate progress for growing crops
        const elapsed = HELPERS.getElapsedTime(this.plantTime);
        const progress = HELPERS.calculatePercentage(elapsed, this.growthDuration);

        return Math.min(100, progress); // Cap at 100%
    }


    /**
     * PUBLIC: getRemainingTime
     * Calculates time remaining until crop is mature
     *
     * @returns {number} Remaining time in milliseconds (0 if mature)
     *
     * CALLED BY:
     * - UIManager.js (display countdown timer)
     *
     * EXAMPLE:
     * const remaining = wheat.getRemainingTime();
     * console.log(HELPERS.formatTime(remaining)); // "1m 30s"
     */
    getRemainingTime() {
        // Not growing
        if (this.status !== CONSTANTS.CROP_STATUS.GROWING) {
            return 0;
        }

        // Calculate remaining time
        return HELPERS.getRemainingTime(this.plantTime, this.growthDuration);
    }


    /**
     * PUBLIC: getFormattedRemainingTime
     * Returns remaining time as formatted string
     *
     * @returns {string} Formatted time (e.g., "2m 30s")
     *
     * CALLED BY:
     * - UIManager.js (display timer text)
     *
     * EXAMPLE:
     * wheat.getFormattedRemainingTime() → "1m 45s"
     */
    getFormattedRemainingTime() {
        const remaining = this.getRemainingTime();
        return HELPERS.formatTime(remaining);
    }


    // ========================================================================
    // PRICE CALCULATION METHODS
    // ========================================================================

    /**
     * PUBLIC: calculateSellPrice
     * Calculates selling price with weather demand multiplier
     *
     * @param {number} demandIndex - Current demand multiplier (0.8-2.0)
     * @returns {number} Final selling price
     *
     * FORMULA:
     * Final Price = Base Sell Price × Demand Index
     *
     * EXAMPLES:
     * wheat.calculateSellPrice(1.0) → $18 (normal weather)
     * wheat.calculateSellPrice(2.0) → $36 (terrible weather, best time!)
     * wheat.calculateSellPrice(0.8) → $14.40 (perfect weather, worst time)
     *
     * CALLED BY:
     * - ShopManager.js (display and calculate selling prices)
     *
     * EXAMPLE:
     * const todayPrice = wheat.calculateSellPrice(currentDemand);
     * console.log(HELPERS.formatMoney(todayPrice));
     */
    calculateSellPrice(demandIndex) {
        // Validate demand index
        if (!HELPERS.isValidNumber(demandIndex) || demandIndex <= 0) {
            console.warn('Crop.calculateSellPrice: Invalid demand index', demandIndex);
            demandIndex = 1.0; // Use neutral multiplier as fallback
        }

        // Calculate final price
        const finalPrice = this.baseSellPrice * demandIndex;

        // Round to nearest dollar
        return Math.floor(finalPrice);
    }


    /**
     * PUBLIC: calculateProfit
     * Calculates profit/loss from selling crop
     *
     * @param {number} demandIndex - Current demand multiplier
     * @returns {number} Profit (positive) or loss (negative)
     *
     * FORMULA:
     * Profit = Sell Price - Seed Cost
     *
     * EXAMPLES:
     * wheat.calculateProfit(1.0) → $8 (bought for $10, sell for $18)
     * wheat.calculateProfit(2.0) → $26 (bought for $10, sell for $36)
     * wheat.calculateProfit(0.8) → $4.40 (bought for $10, sell for $14.40)
     *
     * CALLED BY:
     * - UIManager.js (show profit information)
     * - Statistics calculations
     *
     * EXAMPLE:
     * const profit = wheat.calculateProfit(2.0);
     * console.log(`Profit: ${HELPERS.formatMoney(profit)}`); // "Profit: $26"
     */
    calculateProfit(demandIndex) {
        const sellPrice = this.calculateSellPrice(demandIndex);
        return sellPrice - this.seedCost;
    }


    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    /**
     * PUBLIC: getDisplayInfo
     * Returns formatted information for UI display
     *
     * @returns {Object} Display information object
     *
     * RETURNS:
     * {
     *   name: "Wheat",
     *   status: "Growing",
     *   progress: 45,
     *   remainingTime: "1m 15s",
     *   tier: 1
     * }
     *
     * CALLED BY:
     * - UIManager.js (render crop cards)
     *
     * EXAMPLE:
     * const info = wheat.getDisplayInfo();
     * console.log(`${info.name}: ${info.progress}% - ${info.remainingTime}`);
     */
    getDisplayInfo() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            status: this._getStatusText(),
            progress: this.getGrowthProgress(),
            remainingTime: this.getFormattedRemainingTime(),
            tier: this.tier,
            seedCost: this.seedCost,
            baseSellPrice: this.baseSellPrice
        };
    }


    /**
     * PRIVATE: _getStatusText
     * Converts status constant to readable text
     *
     * @returns {string} Human-readable status
     *
     * CALLED BY: getDisplayInfo()
     */
    _getStatusText() {
        switch (this.status) {
            case CONSTANTS.CROP_STATUS.SEED:
                return 'Not Planted';
            case CONSTANTS.CROP_STATUS.GROWING:
                return 'Growing';
            case CONSTANTS.CROP_STATUS.MATURE:
                return 'Ready to Harvest';
            case CONSTANTS.CROP_STATUS.HARVESTED:
                return 'Harvested';
            default:
                return 'Unknown';
        }
    }


    /**
     * PUBLIC: toJSON
     * Converts Crop object to plain JSON for storage
     *
     * @returns {Object} JSON representation
     *
     * USED BY:
     * - GameState.js (when saving game)
     *
     * EXAMPLE:
     * const json = wheat.toJSON();
     * localStorage.setItem('crop', JSON.stringify(json));
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            status: this.status,
            seedCost: this.seedCost,
            baseSellPrice: this.baseSellPrice,
            growthTime: this.growthTime,
            growthDuration: this.growthDuration,
            plantTime: this.plantTime,
            harvestTime: this.harvestTime,
            tier: this.tier,
            createdAt: this.createdAt
        };
    }


    // ========================================================================
    // STATIC METHODS
    // ========================================================================

    /**
     * STATIC: fromJSON
     * Recreates a Crop object from JSON data
     *
     * @param {Object} json - JSON representation of crop
     * @returns {Crop} Restored Crop object
     *
     * USED BY:
     * - GameState.js (when loading saved game)
     *
     * EXAMPLE:
     * const json = JSON.parse(localStorage.getItem('crop'));
     * const wheat = Crop.fromJSON(json);
     */
    static fromJSON(json) {
        // Validate JSON
        if (!json || typeof json !== 'object' || !json.type) {
            console.error('Crop.fromJSON: Invalid JSON', json);
            throw new Error('Invalid crop JSON data');
        }

        // Create new crop instance
        const crop = new Crop(json.type);

        // Restore properties
        crop.id = json.id || crop.id;
        crop.status = json.status || CONSTANTS.CROP_STATUS.SEED;
        crop.plantTime = json.plantTime || null;
        crop.harvestTime = json.harvestTime || null;
        crop.createdAt = json.createdAt || crop.createdAt;

        return crop;
    }


    /**
     * STATIC: getCropDefinition
     * Gets crop definition from config by type
     *
     * @param {string} type - Crop type identifier
     * @returns {Object|null} Crop definition or null if not found
     *
     * CALLED BY:
     * - ShopManager.js (display available crops)
     * - UIManager.js (show crop information)
     *
     * EXAMPLE:
     * const wheatDef = Crop.getCropDefinition('wheat');
     * console.log(wheatDef.seedCost); // 10
     */
    static getCropDefinition(type) {
        return GAME_CONFIG.CROPS.find(c => c.id === type) || null;
    }


    /**
     * STATIC: getAllCropTypes
     * Returns array of all available crop types
     *
     * @returns {string[]} Array of crop type IDs
     *
     * CALLED BY:
     * - ShopManager.js (list all available crops)
     *
     * EXAMPLE:
     * Crop.getAllCropTypes() → ['wheat', 'carrot', 'corn', 'strawberry', 'watermelon']
     */
    static getAllCropTypes() {
        return GAME_CONFIG.CROPS.map(c => c.id);
    }


    /**
     * STATIC: getCropsByTier
     * Returns crops filtered by tier level
     *
     * @param {number} tier - Tier level (1-5)
     * @returns {Object[]} Array of crop definitions
     *
     * CALLED BY:
     * - UIManager.js (organize shop display by tier)
     *
     * EXAMPLE:
     * const starterCrops = Crop.getCropsByTier(1); // [wheat]
     * const premiumCrops = Crop.getCropsByTier(5); // [watermelon]
     */
    static getCropsByTier(tier) {
        return GAME_CONFIG.CROPS.filter(c => c.tier === tier);
    }
}

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 *
 * // Create and plant a crop
 * const wheat = new Crop('wheat');
 * wheat.plant();
 *
 * // Check if mature (call this every second)
 * if (wheat.isMature()) {
 *     wheat.harvest();
 * }
 *
 * // Get progress for UI
 * const progress = wheat.getGrowthProgress(); // 45
 * const remaining = wheat.getFormattedRemainingTime(); // "1m 15s"
 *
 * // Calculate selling price
 * const price = wheat.calculateSellPrice(2.0); // $36 (with 2.0x multiplier)
 * const profit = wheat.calculateProfit(2.0); // $26 profit
 *
 * // Get display info
 * const info = wheat.getDisplayInfo();
 * console.log(info);
 * // {name: "Wheat", status: "Growing", progress: 45, ...}
 *
 * // Save and load
 * const json = wheat.toJSON();
 * const restored = Crop.fromJSON(json);
 *
 * ============================================================================
 */