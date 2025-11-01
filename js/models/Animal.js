/**
 * ============================================================================
 * FILE: Animal.js
 * PURPOSE: Animal data model with breeding mechanics
 *
 * DESCRIPTION:
 * This class represents an individual animal instance in the game:
 * - Stores animal type, status, and timing information
 * - Tracks growth progress
 * - Manages animal lifecycle (young → growing → mature)
 * - Handles breeding mechanics (random offspring generation)
 * - Tracks offspring and survival rates
 *
 * ANIMAL LIFECYCLE:
 * 1. YOUNG: Purchased from Henry's shop, not yet placed on farm
 * 2. GROWING: Placed on farm, timer running, can breed during growth
 * 3. MATURE: Growth complete, ready to sell
 *
 * BREEDING MECHANICS:
 * - During growth, animals have a chance to breed
 * - Breeding chance varies by animal type (chicken: 35%, rabbit: 40%, etc.)
 * - If breeding succeeds, offspring is created
 * - Offspring has survival rate check (chicken: 75%, rabbit: 70%, etc.)
 * - Purchased animals have 100% survival (no risk)
 * - Bred offspring use their species' survival rate
 * - Surviving offspring start their own growth cycle
 *
 * DEPENDENCIES:
 * - config.js (for animal definitions and properties)
 * - constants.js (for status constants)
 * - helpers.js (for ID generation, time calculations, random checks)
 *
 * USED BY:
 * - FarmManager.js (place and sell animals)
 * - TimerManager.js (update growth progress, trigger breeding)
 * - ShopManager.js (buy animals, sell mature animals)
 * - UIManager.js (display animals on farm)
 * - GameState.js (store animals in inventory)
 * ============================================================================
 */

/**
 * CLASS: Animal
 * Represents a single animal instance with its properties and breeding state
 *
 * INSTANCE DATA:
 * - id: Unique identifier for this animal
 * - type: Animal type (chicken/rabbit/sheep/pig/cow)
 * - name: Display name
 * - status: Current lifecycle status (young/growing/mature)
 * - purchaseCost: How much was paid for the animal
 * - baseSellPrice: Base selling price (before weather multiplier)
 * - growthTime: Total growth duration in minutes
 * - growthDuration: Total growth duration in milliseconds
 * - placeTime: Timestamp when animal was placed on farm
 * - breedingChance: Probability of breeding (0-1)
 * - offspringSurvivalRate: Probability offspring survives (0-1)
 * - isPurchased: True if bought from shop (100% survival)
 * - hasOffspring: Whether this animal has produced offspring
 * - offspring: Array of offspring Animal objects
 * - breedingAttempted: Whether breeding has been attempted yet
 * - tier: Difficulty tier (1-5)
 *
 * USAGE:
 * const chicken = new Animal('chicken', true);
 * chicken.place(); // Start growing
 * chicken.attemptBreeding(); // Try to breed
 * if (chicken.isMature()) {
 *     // Ready to sell
 * }
 */
class Animal {

    /**
     * CONSTRUCTOR
     * Creates a new Animal instance
     *
     * @param {string} type - Animal type identifier (must match config.js)
     * @param {boolean} isPurchased - True if purchased (100% survival), false if bred
     *
     * VALIDATION:
     * - Checks if animal type exists in GAME_CONFIG.ANIMALS
     * - Throws error if invalid type
     *
     * CALLED BY:
     * - ShopManager.js (when player purchases animals)
     * - Animal.attemptBreeding() (when creating offspring)
     *
     * EXAMPLE:
     * const chicken = new Animal('chicken', true); // Purchased
     * const offspring = new Animal('chicken', false); // Bred offspring
     */
    constructor(type, isPurchased = true) {
        // Find animal definition in config
        const animalDef = GAME_CONFIG.ANIMALS.find(a => a.id === type);

        // Validate animal type
        if (!animalDef) {
            console.error(`Animal: Invalid animal type "${type}"`);
            throw new Error(`Invalid animal type: ${type}`);
        }

        // Generate unique ID for this animal instance
        this.id = HELPERS.generateUniqueId('animal');

        // Store animal type and properties from config
        this.type = animalDef.id;
        this.name = animalDef.name;
        this.emoji = animalDef.emoji;
        this.purchaseCost = animalDef.purchaseCost;
        this.baseSellPrice = animalDef.baseSellPrice;
        this.growthTime = animalDef.growthTime; // in minutes
        this.tier = animalDef.tier;
        this.description = animalDef.description;

        // Breeding properties
        this.breedingChance = animalDef.breedingChance; // 0-1 (e.g., 0.35 = 35%)
        this.offspringSurvivalRate = animalDef.offspringSurvivalRate; // 0-1

        // Convert growth time to milliseconds
        this.growthDuration = HELPERS.minutesToMilliseconds(this.growthTime);

        // Initialize status as YOUNG (not placed yet)
        this.status = CONSTANTS.ANIMAL_STATUS.YOUNG;

        // Initialize timing properties
        this.placeTime = null; // When animal was placed on farm

        // Breeding state
        this.isPurchased = isPurchased; // Purchased animals have 100% survival
        this.hasOffspring = false;
        this.offspring = []; // Array of offspring Animal objects
        this.breedingAttempted = false; // Track if breeding was attempted

        // Store creation timestamp
        this.createdAt = Date.now();

        // Log creation in debug mode
        HELPERS.debugLog(`Created ${this.name} (${isPurchased ? 'purchased' : 'bred'})`, {
            id: this.id,
            type: this.type,
            growthTime: `${this.growthTime}min`,
            breedingChance: HELPERS.formatPercentage(this.breedingChance)
        });
    }


    // ========================================================================
    // LIFECYCLE METHODS
    // ========================================================================

    /**
     * PUBLIC: place
     * Places the animal on farm, starting its growth timer
     *
     * STATUS CHANGE: YOUNG → GROWING
     *
     * CALLED BY:
     * - FarmManager.placeAnimal() (when player places animal on farm)
     *
     * RETURNS: {boolean} True if successfully placed, false if already placed
     *
     * EXAMPLE:
     * const chicken = new Animal('chicken', true);
     * chicken.place(); // Start growing
     */
    place() {
        // Check if already placed
        if (this.status !== CONSTANTS.ANIMAL_STATUS.YOUNG) {
            console.warn(`Animal.place: Cannot place ${this.name} - already placed or mature`);
            return false;
        }

        // Update status to GROWING
        this.status = CONSTANTS.ANIMAL_STATUS.GROWING;

        // Record place time
        this.placeTime = Date.now();

        // Log placement in debug mode
        HELPERS.debugLog(`Placed ${this.name} on farm`, {
            id: this.id,
            placeTime: this.placeTime,
            willMatureAt: this.placeTime + this.growthDuration
        });

        return true;
    }


    // ========================================================================
    // STATUS CHECK METHODS
    // ========================================================================

    /**
     * PUBLIC: isMature
     * Checks if animal has finished growing and is ready to sell
     *
     * @returns {boolean} True if animal is mature
     *
     * LOGIC:
     * 1. Animal must be in GROWING status
     * 2. Current time >= place time + growth duration
     * 3. If mature, automatically update status to MATURE
     *
     * CALLED BY:
     * - TimerManager.js (check all growing animals every second)
     * - FarmManager.js (before allowing sale)
     * - UIManager.js (determine if sell button should be enabled)
     *
     * EXAMPLE:
     * if (chicken.isMature()) {
     *     console.log('Ready to sell!');
     * }
     */
    isMature() {
        // Only growing animals can become mature
        if (this.status !== CONSTANTS.ANIMAL_STATUS.GROWING) {
            return this.status === CONSTANTS.ANIMAL_STATUS.MATURE;
        }

        // Check if enough time has passed
        const elapsed = HELPERS.getElapsedTime(this.placeTime);
        const isReady = elapsed >= this.growthDuration;

        // If ready, update status to MATURE
        if (isReady) {
            this.status = CONSTANTS.ANIMAL_STATUS.MATURE;

            HELPERS.debugLog(`${this.name} is now mature!`, {
                id: this.id,
                growthTime: HELPERS.formatTime(elapsed),
                hadOffspring: this.hasOffspring,
                offspringCount: this.offspring.length
            });
        }

        return isReady;
    }


    /**
     * PUBLIC: isPlaced
     * Checks if animal has been placed on farm
     *
     * @returns {boolean} True if animal is placed (growing or mature)
     *
     * CALLED BY:
     * - UIManager.js (determine display location)
     */
    isPlaced() {
        return this.status === CONSTANTS.ANIMAL_STATUS.GROWING ||
            this.status === CONSTANTS.ANIMAL_STATUS.MATURE;
    }


    // ========================================================================
    // BREEDING METHODS
    // ========================================================================

    /**
     * PUBLIC: attemptBreeding
     * Attempts to breed and create offspring
     *
     * BREEDING LOGIC:
     * 1. Can only breed once during growth period
     * 2. Random check against breedingChance (e.g., 35% for chicken)
     * 3. If successful, create offspring Animal object
     * 4. Offspring has survival rate check (e.g., 75% for chicken)
     * 5. If survives, offspring is added to this.offspring array
     * 6. Surviving offspring automatically placed and starts growing
     *
     * CALLED BY:
     * - TimerManager.js (called once during mid-growth period)
     *
     * RETURNS: {Object} Breeding result
     * {
     *   attempted: true,
     *   bred: true/false,
     *   survived: true/false,
     *   offspring: Animal object or null
     * }
     *
     * EXAMPLE:
     * const result = chicken.attemptBreeding();
     * if (result.bred && result.survived) {
     *     console.log('New chick born!', result.offspring);
     * }
     */
    attemptBreeding() {
        // Result object
        const result = {
            attempted: false,
            bred: false,
            survived: false,
            offspring: null
        };

        // Can only breed once
        if (this.breedingAttempted) {
            HELPERS.debugLog(`${this.name} already attempted breeding`, {id: this.id});
            return result;
        }

        // Must be growing
        if (this.status !== CONSTANTS.ANIMAL_STATUS.GROWING) {
            HELPERS.debugLog(`${this.name} not in GROWING status`, {id: this.id});
            return result;
        }

        // Mark as attempted
        this.breedingAttempted = true;
        result.attempted = true;

        // Random breeding check
        const breedingSuccess = HELPERS.randomBoolean(this.breedingChance);

        if (!breedingSuccess) {
            HELPERS.debugLog(`${this.name} breeding failed`, {
                id: this.id,
                chance: HELPERS.formatPercentage(this.breedingChance)
            });
            return result;
        }

        // Breeding succeeded!
        result.bred = true;
        this.hasOffspring = true;

        HELPERS.debugLog(`${this.name} breeding succeeded!`, {
            id: this.id,
            chance: HELPERS.formatPercentage(this.breedingChance)
        });

        // Create offspring (not purchased, so subject to survival rate)
        const offspring = new Animal(this.type, false);

        // Survival check for offspring
        const survivalSuccess = HELPERS.randomBoolean(this.offspringSurvivalRate);

        if (!survivalSuccess) {
            HELPERS.debugLog(`Offspring did not survive`, {
                parentId: this.id,
                survivalRate: HELPERS.formatPercentage(this.offspringSurvivalRate)
            });
            return result;
        }

        // Offspring survived!
        result.survived = true;
        result.offspring = offspring;

        // Add to offspring array
        this.offspring.push(offspring);

        // Automatically place offspring on farm (start growing)
        offspring.place();

        HELPERS.debugLog(`${this.name} gave birth to surviving offspring!`, {
            parentId: this.id,
            offspringId: offspring.id,
            survivalRate: HELPERS.formatPercentage(this.offspringSurvivalRate)
        });

        return result;
    }


    /**
     * PUBLIC: canBreed
     * Checks if animal is eligible for breeding attempt
     *
     * @returns {boolean} True if can attempt breeding
     *
     * CONDITIONS:
     * - Must be in GROWING status
     * - Must not have already attempted breeding
     * - Must be past halfway point in growth (to avoid instant breeding)
     *
     * CALLED BY:
     * - TimerManager.js (check if should attempt breeding)
     */
    canBreed() {
        // Must be growing
        if (this.status !== CONSTANTS.ANIMAL_STATUS.GROWING) {
            return false;
        }

        // Can't breed twice
        if (this.breedingAttempted) {
            return false;
        }

        // Must be at least halfway through growth
        // This prevents instant breeding and makes it more realistic
        const progress = this.getGrowthProgress();
        return progress >= 50;
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
     * - Returns 0 if not placed
     * - Returns 100 if mature
     * - Otherwise: (elapsed time / total duration) × 100
     *
     * CALLED BY:
     * - UIManager.js (display progress bars)
     * - TimerManager.js (update progress display)
     * - canBreed() (check if past 50%)
     */
    getGrowthProgress() {
        // Not placed yet
        if (this.status === CONSTANTS.ANIMAL_STATUS.YOUNG) {
            return 0;
        }

        // Already mature
        if (this.status === CONSTANTS.ANIMAL_STATUS.MATURE) {
            return 100;
        }

        // Calculate progress for growing animals
        const elapsed = HELPERS.getElapsedTime(this.placeTime);
        const progress = HELPERS.calculatePercentage(elapsed, this.growthDuration);

        return Math.min(100, progress);
    }


    /**
     * PUBLIC: getRemainingTime
     * Calculates time remaining until animal is mature
     *
     * @returns {number} Remaining time in milliseconds (0 if mature)
     *
     * CALLED BY:
     * - UIManager.js (display countdown timer)
     */
    getRemainingTime() {
        // Not growing
        if (this.status !== CONSTANTS.ANIMAL_STATUS.GROWING) {
            return 0;
        }

        // Calculate remaining time
        return HELPERS.getRemainingTime(this.placeTime, this.growthDuration);
    }


    /**
     * PUBLIC: getFormattedRemainingTime
     * Returns remaining time as formatted string
     *
     * @returns {string} Formatted time (e.g., "3m 45s")
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
     * chicken.calculateSellPrice(1.0) → $75 (normal weather)
     * chicken.calculateSellPrice(2.0) → $150 (terrible weather)
     * chicken.calculateSellPrice(0.8) → $60 (perfect weather)
     *
     * CALLED BY:
     * - ShopManager.js (display and calculate selling prices)
     */
    calculateSellPrice(demandIndex) {
        // Validate demand index
        if (!HELPERS.isValidNumber(demandIndex) || demandIndex <= 0) {
            console.warn('Animal.calculateSellPrice: Invalid demand index', demandIndex);
            demandIndex = 1.0;
        }

        // Calculate final price
        const finalPrice = this.baseSellPrice * demandIndex;

        // Round to nearest dollar
        return Math.floor(finalPrice);
    }


    /**
     * PUBLIC: calculateProfit
     * Calculates profit/loss from selling animal
     *
     * @param {number} demandIndex - Current demand multiplier
     * @returns {number} Profit (positive) or loss (negative)
     *
     * NOTE: Bred offspring have $0 cost (free!), so all sale = pure profit
     *
     * EXAMPLES:
     * Purchased chicken.calculateProfit(1.0) → $35 (bought $40, sell $75)
     * Bred chicken.calculateProfit(1.0) → $75 (free, sell $75)
     *
     * CALLED BY:
     * - UIManager.js (show profit information)
     * - Statistics calculations
     */
    calculateProfit(demandIndex) {
        const sellPrice = this.calculateSellPrice(demandIndex);

        // If bred (not purchased), cost is 0 - all sale is profit!
        const cost = this.isPurchased ? this.purchaseCost : 0;

        return sellPrice - cost;
    }


    // ========================================================================
    // OFFSPRING MANAGEMENT
    // ========================================================================

    /**
     * PUBLIC: getTotalOffspringCount
     * Returns total count of all offspring (including offspring's offspring)
     *
     * @returns {number} Total offspring count
     *
     * RECURSIVE:
     * Counts direct offspring + their offspring + their offspring's offspring...
     *
     * CALLED BY:
     * - Statistics display
     * - UIManager.js (show breeding success)
     */
    getTotalOffspringCount() {
        let count = this.offspring.length;

        // Recursively count offspring's offspring
        for (const child of this.offspring) {
            count += child.getTotalOffspringCount();
        }

        return count;
    }


    /**
     * PUBLIC: getAllOffspring
     * Returns flat array of all offspring (including nested generations)
     *
     * @returns {Animal[]} Array of all offspring
     *
     * CALLED BY:
     * - GameState.js (get all animals for saving/processing)
     */
    getAllOffspring() {
        const allOffspring = [...this.offspring];

        // Recursively collect offspring's offspring
        for (const child of this.offspring) {
            allOffspring.push(...child.getAllOffspring());
        }

        return allOffspring;
    }


    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    /**
     * PUBLIC: getDisplayInfo
     * Returns formatted information for UI display
     *
     * @returns {Object} Display information object
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
            purchaseCost: this.purchaseCost,
            baseSellPrice: this.baseSellPrice,
            isPurchased: this.isPurchased,
            hasOffspring: this.hasOffspring,
            offspringCount: this.offspring.length,
            breedingChance: this.breedingChance,
            canBreed: this.canBreed()
        };
    }


    /**
     * PRIVATE: _getStatusText
     * Converts status constant to readable text
     *
     * @returns {string} Human-readable status
     */
    _getStatusText() {
        switch (this.status) {
            case CONSTANTS.ANIMAL_STATUS.YOUNG:
                return 'Not Placed';
            case CONSTANTS.ANIMAL_STATUS.GROWING:
                return 'Growing';
            case CONSTANTS.ANIMAL_STATUS.MATURE:
                return 'Ready to Sell';
            default:
                return 'Unknown';
        }
    }


    /**
     * PUBLIC: toJSON
     * Converts Animal object to plain JSON for storage
     *
     * @returns {Object} JSON representation
     *
     * NOTE: Does NOT include offspring (they are stored separately)
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            status: this.status,
            purchaseCost: this.purchaseCost,
            baseSellPrice: this.baseSellPrice,
            growthTime: this.growthTime,
            growthDuration: this.growthDuration,
            placeTime: this.placeTime,
            breedingChance: this.breedingChance,
            offspringSurvivalRate: this.offspringSurvivalRate,
            isPurchased: this.isPurchased,
            hasOffspring: this.hasOffspring,
            breedingAttempted: this.breedingAttempted,
            tier: this.tier,
            createdAt: this.createdAt,
            // Store offspring IDs (not full objects to avoid circular references)
            offspringIds: this.offspring.map(o => o.id)
        };
    }


    // ========================================================================
    // STATIC METHODS
    // ========================================================================

    /**
     * STATIC: fromJSON
     * Recreates an Animal object from JSON data
     *
     * @param {Object} json - JSON representation of animal
     * @returns {Animal} Restored Animal object
     *
     * NOTE: Offspring must be restored separately and linked
     */
    static fromJSON(json) {
        // Validate JSON
        if (!json || typeof json !== 'object' || !json.type) {
            console.error('Animal.fromJSON: Invalid JSON', json);
            throw new Error('Invalid animal JSON data');
        }

        // Create new animal instance
        const animal = new Animal(json.type, json.isPurchased !== false);

        // Restore properties
        animal.id = json.id || animal.id;
        animal.status = json.status || CONSTANTS.ANIMAL_STATUS.YOUNG;
        animal.placeTime = json.placeTime || null;
        animal.hasOffspring = json.hasOffspring || false;
        animal.breedingAttempted = json.breedingAttempted || false;
        animal.createdAt = json.createdAt || animal.createdAt;

        // Note: offspring array will be populated separately by GameState

        return animal;
    }


    /**
     * STATIC: getAnimalDefinition
     * Gets animal definition from config by type
     *
     * @param {string} type - Animal type identifier
     * @returns {Object|null} Animal definition or null if not found
     */
    static getAnimalDefinition(type) {
        return GAME_CONFIG.ANIMALS.find(a => a.id === type) || null;
    }


    /**
     * STATIC: getAllAnimalTypes
     * Returns array of all available animal types
     *
     * @returns {string[]} Array of animal type IDs
     */
    static getAllAnimalTypes() {
        return GAME_CONFIG.ANIMALS.map(a => a.id);
    }


    /**
     * STATIC: getAnimalsByTier
     * Returns animals filtered by tier level
     *
     * @param {number} tier - Tier level (1-5)
     * @returns {Object[]} Array of animal definitions
     */
    static getAnimalsByTier(tier) {
        return GAME_CONFIG.ANIMALS.filter(a => a.tier === tier);
    }
}

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 *
 * // Create and place an animal
 * const chicken = new Animal('chicken', true); // Purchased
 * chicken.place(); // Start growing
 *
 * // Attempt breeding (called by TimerManager)
 * if (chicken.canBreed()) {
 *     const result = chicken.attemptBreeding();
 *     if (result.bred && result.survived) {
 *         console.log('New chick born!', result.offspring);
 *         // Offspring is automatically placed and growing
 *     }
 * }
 *
 * // Check if mature
 * if (chicken.isMature()) {
 *     // Ready to sell
 * }
 *
 * // Get progress for UI
 * const progress = chicken.getGrowthProgress(); // 65
 * const remaining = chicken.getFormattedRemainingTime(); // "1m 30s"
 *
 * // Calculate selling price
 * const price = chicken.calculateSellPrice(2.0); // $150 (with 2.0x multiplier)
 * const profit = chicken.calculateProfit(2.0); // $110 profit
 *
 * // Get offspring information
 * console.log(chicken.hasOffspring); // true
 * console.log(chicken.offspring.length); // 1
 * console.log(chicken.getTotalOffspringCount()); // 3 (including nested)
 *
 * // Get display info
 * const info = chicken.getDisplayInfo();
 * console.log(info);
 *
 * ============================================================================
 */