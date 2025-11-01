/**
 * ============================================================================
 * FILE: ShopManager.js
 * PURPOSE: Manage all shop-related operations
 *
 * DESCRIPTION:
 * This manager handles:
 * - Tom's Seed Shop operations (buy seeds, sell crops)
 * - Henry's Animal Farm operations (buy animals, sell animals)
 * - Price calculations with weather multipliers
 * - Transaction validation and execution
 * - Shop inventory management
 *
 * ARCHITECTURE:
 * Works as intermediary between UI actions and GameState
 * Validates all transactions before executing
 * Calculates dynamic prices based on weather
 *
 * DEPENDENCIES:
 * - GameState.js (read/write money and inventory)
 * - Crop.js (create new crop instances)
 * - Animal.js (create new animal instances)
 * - Weather.js (get current weather for pricing)
 * - constants.js (error messages, event names)
 * - helpers.js (formatting, validation)
 *
 * USED BY:
 * - UIManager.js (when player clicks shop buttons)
 * - main.js (initialize shop operations)
 * ============================================================================
 */

/**
 * CLASS: ShopManager
 * Singleton class managing all shop operations
 */
class ShopManager {

    /**
     * CONSTRUCTOR
     * Initializes the shop manager
     *
     * NOTE: Use ShopManager.getInstance() instead of calling directly
     */
    constructor() {
        // Prevent multiple instances (singleton pattern)
        if (ShopManager.instance) {
            return ShopManager.instance;
        }

        // Store singleton instance
        ShopManager.instance = this;

        HELPERS.debugLog('ShopManager initialized');
    }


    // ========================================================================
    // SINGLETON PATTERN
    // ========================================================================

    /**
     * STATIC: getInstance
     * Gets or creates the single ShopManager instance
     *
     * @returns {ShopManager} The shop manager instance
     */
    static getInstance() {
        if (!ShopManager.instance) {
            ShopManager.instance = new ShopManager();
        }
        return ShopManager.instance;
    }


    /**
     * STATIC: resetInstance
     * Resets the singleton (for new game)
     */
    static resetInstance() {
        ShopManager.instance = null;
        HELPERS.debugLog('ShopManager reset');
    }


    // ========================================================================
    // TOM'S SEED SHOP - BUYING SEEDS
    // ========================================================================

    /**
     * PUBLIC: buySeed
     * Purchases a seed from Tom's shop
     *
     * @param {string} cropType - Type of crop to buy (e.g., 'wheat')
     * @returns {Object} Result object {success, message, crop?}
     *
     * VALIDATION:
     * - Crop type must be valid
     * - Player must have enough money
     * - Game must not be over
     *
     * CALLED BY:
     * - UIManager.js (when player clicks buy button)
     *
     * SIDE EFFECTS:
     * - Deducts money from GameState
     * - Adds seed to GameState inventory
     * - Dispatches ITEM_PURCHASED event
     *
     * EXAMPLE:
     * const result = shopManager.buySeed('wheat');
     * if (result.success) {
     *     console.log('Bought wheat seed!');
     * }
     */
    buySeed(cropType) {
        const gameState = GameState.getInstance();

        // Validate game state
        if (gameState.isGameOver()) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.GAME_OVER
            };
        }

        // Get crop definition
        const cropDef = Crop.getCropDefinition(cropType);
        if (!cropDef) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.INVALID_ITEM
            };
        }

        // Check if player can afford
        if (!gameState.canAfford(cropDef.seedCost)) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.NOT_ENOUGH_MONEY
                    .replace('X', HELPERS.formatMoney(cropDef.seedCost))
            };
        }

        // Deduct money
        const deducted = gameState.deductMoney(
            cropDef.seedCost,
            `Bought ${cropDef.name} seed`
        );

        if (!deducted) {
            return {
                success: false,
                message: 'Failed to complete purchase'
            };
        }

        // Create new crop (in SEED status)
        const crop = new Crop(cropType);

        // Add to inventory
        gameState.addSeed(crop);

        HELPERS.debugLog(`Purchased ${cropDef.name} seed`, {
            cost: cropDef.seedCost,
            cropId: crop.id
        });

        // Dispatch event
        document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.ITEM_PURCHASED, {
            detail: {
                itemType: 'seed',
                item: crop,
                cost: cropDef.seedCost,
                message: `Purchased ${cropDef.name} seed for ${HELPERS.formatMoney(cropDef.seedCost)}`
            }
        }));

        return {
            success: true,
            message: CONSTANTS.SUCCESS_MESSAGES.ITEM_PURCHASED
                .replace('X', cropDef.name)
                .replace('Y', HELPERS.formatMoney(cropDef.seedCost)),
            crop: crop
        };
    }


    /**
     * PUBLIC: canBuySeed
     * Checks if player can buy a seed
     *
     * @param {string} cropType - Type of crop to check
     * @returns {Object} {canBuy: boolean, reason?: string}
     *
     * CALLED BY:
     * - UIManager.js (enable/disable buy buttons)
     */
    canBuySeed(cropType) {
        const gameState = GameState.getInstance();

        // Check game over
        if (gameState.isGameOver()) {
            return {
                canBuy: false,
                reason: CONSTANTS.ERROR_MESSAGES.GAME_OVER
            };
        }

        // Get crop definition
        const cropDef = Crop.getCropDefinition(cropType);
        if (!cropDef) {
            return {
                canBuy: false,
                reason: 'Invalid crop type'
            };
        }

        // Check if can afford
        if (!gameState.canAfford(cropDef.seedCost)) {
            return {
                canBuy: false,
                reason: CONSTANTS.ERROR_MESSAGES.NOT_ENOUGH_MONEY
                    .replace('X', HELPERS.formatMoney(cropDef.seedCost))
            };
        }

        return {
            canBuy: true
        };
    }


    // ========================================================================
    // TOM'S SEED SHOP - SELLING CROPS
    // ========================================================================

    /**
     * PUBLIC: sellCrop
     * Sells a harvested crop to Tom's shop
     *
     * @param {string} cropId - ID of crop to sell
     * @returns {Object} Result object {success, message, profit?}
     *
     * VALIDATION:
     * - Crop must exist in harvested crops inventory
     * - Crop must be harvested status
     * - Game must not be over
     *
     * CALLED BY:
     * - UIManager.js (when player clicks sell button)
     *
     * SIDE EFFECTS:
     * - Adds money to GameState (with weather multiplier)
     * - Removes crop from GameState inventory
     * - Dispatches ITEM_SOLD event
     *
     * EXAMPLE:
     * const result = shopManager.sellCrop(cropId);
     * if (result.success) {
     *     console.log(`Earned ${result.profit}!`);
     * }
     */
    sellCrop(cropId) {
        const gameState = GameState.getInstance();

        // Validate game state
        if (gameState.isGameOver()) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.GAME_OVER
            };
        }

        // Find harvested crop
        const crop = gameState.getHarvestedCrops().find(c => c.id === cropId);
        if (!crop) {
            return {
                success: false,
                message: 'Crop not found in inventory'
            };
        }

        // Check if harvested
        if (!crop.isHarvested()) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.ALREADY_HARVESTED
            };
        }

        // Get current weather for price calculation
        const currentWeather = gameState.getCurrentWeather();
        if (!currentWeather) {
            return {
                success: false,
                message: 'Unable to determine current weather'
            };
        }

        // Calculate selling price with weather multiplier
        const sellPrice = crop.calculateSellPrice(currentWeather.demandIndex);
        const profit = crop.calculateProfit(currentWeather.demandIndex);

        // Remove crop from inventory
        const sold = gameState.sellCrop(cropId);
        if (!sold) {
            return {
                success: false,
                message: 'Failed to sell crop'
            };
        }

        // Add money
        gameState.addMoney(
            sellPrice,
            `Sold ${crop.name} (${HELPERS.formatMultiplier(currentWeather.demandIndex)})`
        );

        HELPERS.debugLog(`Sold ${crop.name}`, {
            cropId: crop.id,
            sellPrice: sellPrice,
            profit: profit,
            demandIndex: currentWeather.demandIndex
        });

        // Dispatch event
        document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.ITEM_SOLD, {
            detail: {
                itemType: 'crop',
                item: crop,
                sellPrice: sellPrice,
                profit: profit,
                demandIndex: currentWeather.demandIndex,
                message: `Sold ${crop.name} for ${HELPERS.formatMoney(sellPrice)}!`
            }
        }));

        return {
            success: true,
            message: CONSTANTS.SUCCESS_MESSAGES.ITEM_SOLD
                .replace('X', crop.name)
                .replace('Y', HELPERS.formatMoney(sellPrice)),
            sellPrice: sellPrice,
            profit: profit,
            crop: crop
        };
    }


    /**
     * PUBLIC: canSellCrop
     * Checks if a crop can be sold
     *
     * @param {string} cropId - ID of crop to check
     * @returns {Object} {canSell: boolean, reason?: string}
     *
     * CALLED BY:
     * - UIManager.js (enable/disable sell buttons)
     */
    canSellCrop(cropId) {
        const gameState = GameState.getInstance();

        // Find crop
        const crop = gameState.getHarvestedCrops().find(c => c.id === cropId);
        if (!crop) {
            return {
                canSell: false,
                reason: 'Crop not found'
            };
        }

        // Check if harvested
        if (!crop.isHarvested()) {
            return {
                canSell: false,
                reason: 'Crop not harvested yet'
            };
        }

        return {
            canSell: true
        };
    }


    // ========================================================================
    // HENRY'S ANIMAL FARM - BUYING ANIMALS
    // ========================================================================

    /**
     * PUBLIC: buyAnimal
     * Purchases an animal from Henry's shop
     *
     * @param {string} animalType - Type of animal to buy (e.g., 'chicken')
     * @returns {Object} Result object {success, message, animal?}
     *
     * VALIDATION:
     * - Animal type must be valid
     * - Player must have enough money
     * - Game must not be over
     *
     * CALLED BY:
     * - UIManager.js (when player clicks buy button)
     *
     * SIDE EFFECTS:
     * - Deducts money from GameState
     * - Adds young animal to GameState inventory
     * - Dispatches ITEM_PURCHASED event
     *
     * EXAMPLE:
     * const result = shopManager.buyAnimal('chicken');
     * if (result.success) {
     *     console.log('Bought a chicken!');
     * }
     */
    buyAnimal(animalType) {
        const gameState = GameState.getInstance();

        // Validate game state
        if (gameState.isGameOver()) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.GAME_OVER
            };
        }

        // Get animal definition
        const animalDef = Animal.getAnimalDefinition(animalType);
        if (!animalDef) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.INVALID_ITEM
            };
        }

        // Check if player can afford
        if (!gameState.canAfford(animalDef.purchaseCost)) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.NOT_ENOUGH_MONEY
                    .replace('X', HELPERS.formatMoney(animalDef.purchaseCost))
            };
        }

        // Deduct money
        const deducted = gameState.deductMoney(
            animalDef.purchaseCost,
            `Bought ${animalDef.name}`
        );

        if (!deducted) {
            return {
                success: false,
                message: 'Failed to complete purchase'
            };
        }

        // Create new animal (in YOUNG status, isPurchased = true)
        const animal = new Animal(animalType, true);

        // Add to inventory
        gameState.addYoungAnimal(animal);

        HELPERS.debugLog(`Purchased ${animalDef.name}`, {
            cost: animalDef.purchaseCost,
            animalId: animal.id
        });

        // Dispatch event
        document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.ITEM_PURCHASED, {
            detail: {
                itemType: 'animal',
                item: animal,
                cost: animalDef.purchaseCost,
                message: `Purchased ${animalDef.name} for ${HELPERS.formatMoney(animalDef.purchaseCost)}`
            }
        }));

        return {
            success: true,
            message: CONSTANTS.SUCCESS_MESSAGES.ITEM_PURCHASED
                .replace('X', animalDef.name)
                .replace('Y', HELPERS.formatMoney(animalDef.purchaseCost)),
            animal: animal
        };
    }


    /**
     * PUBLIC: canBuyAnimal
     * Checks if player can buy an animal
     *
     * @param {string} animalType - Type of animal to check
     * @returns {Object} {canBuy: boolean, reason?: string}
     *
     * CALLED BY:
     * - UIManager.js (enable/disable buy buttons)
     */
    canBuyAnimal(animalType) {
        const gameState = GameState.getInstance();

        // Check game over
        if (gameState.isGameOver()) {
            return {
                canBuy: false,
                reason: CONSTANTS.ERROR_MESSAGES.GAME_OVER
            };
        }

        // Get animal definition
        const animalDef = Animal.getAnimalDefinition(animalType);
        if (!animalDef) {
            return {
                canBuy: false,
                reason: 'Invalid animal type'
            };
        }

        // Check if can afford
        if (!gameState.canAfford(animalDef.purchaseCost)) {
            return {
                canBuy: false,
                reason: CONSTANTS.ERROR_MESSAGES.NOT_ENOUGH_MONEY
                    .replace('X', HELPERS.formatMoney(animalDef.purchaseCost))
            };
        }

        return {
            canBuy: true
        };
    }


    // ========================================================================
    // HENRY'S ANIMAL FARM - SELLING ANIMALS
    // ========================================================================

    /**
     * PUBLIC: sellAnimal
     * Sells a mature animal to Henry's shop
     *
     * @param {string} animalId - ID of animal to sell
     * @returns {Object} Result object {success, message, profit?}
     *
     * VALIDATION:
     * - Animal must exist in animals inventory
     * - Animal must be mature
     * - Game must not be over
     *
     * CALLED BY:
     * - UIManager.js (when player clicks sell button)
     *
     * SIDE EFFECTS:
     * - Adds money to GameState (with weather multiplier)
     * - Removes animal from GameState inventory
     * - Dispatches ITEM_SOLD event
     *
     * EXAMPLE:
     * const result = shopManager.sellAnimal(animalId);
     * if (result.success) {
     *     console.log(`Earned ${result.profit}!`);
     * }
     */
    sellAnimal(animalId) {
        const gameState = GameState.getInstance();

        // Validate game state
        if (gameState.isGameOver()) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.GAME_OVER
            };
        }

        // Find animal on farm
        const animal = gameState.getAnimalsOnFarm().find(a => a.id === animalId);
        if (!animal) {
            return {
                success: false,
                message: 'Animal not found on farm'
            };
        }

        // Check if mature
        if (!animal.isMature()) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.NOT_MATURE
            };
        }

        // Get current weather for price calculation
        const currentWeather = gameState.getCurrentWeather();
        if (!currentWeather) {
            return {
                success: false,
                message: 'Unable to determine current weather'
            };
        }

        // Calculate selling price with weather multiplier
        const sellPrice = animal.calculateSellPrice(currentWeather.demandIndex);
        const profit = animal.calculateProfit(currentWeather.demandIndex);

        // Remove animal from inventory
        const sold = gameState.sellAnimal(animalId);
        if (!sold) {
            return {
                success: false,
                message: 'Failed to sell animal'
            };
        }

        // Add money
        gameState.addMoney(
            sellPrice,
            `Sold ${animal.name} (${HELPERS.formatMultiplier(currentWeather.demandIndex)})`
        );

        HELPERS.debugLog(`Sold ${animal.name}`, {
            animalId: animal.id,
            sellPrice: sellPrice,
            profit: profit,
            demandIndex: currentWeather.demandIndex,
            hadOffspring: animal.hasOffspring
        });

        // Dispatch event
        document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.ITEM_SOLD, {
            detail: {
                itemType: 'animal',
                item: animal,
                sellPrice: sellPrice,
                profit: profit,
                demandIndex: currentWeather.demandIndex,
                message: `Sold ${animal.name} for ${HELPERS.formatMoney(sellPrice)}!`
            }
        }));

        return {
            success: true,
            message: CONSTANTS.SUCCESS_MESSAGES.ITEM_SOLD
                .replace('X', animal.name)
                .replace('Y', HELPERS.formatMoney(sellPrice)),
            sellPrice: sellPrice,
            profit: profit,
            animal: animal
        };
    }


    /**
     * PUBLIC: canSellAnimal
     * Checks if an animal can be sold
     *
     * @param {string} animalId - ID of animal to check
     * @returns {Object} {canSell: boolean, reason?: string}
     *
     * CALLED BY:
     * - UIManager.js (enable/disable sell buttons)
     */
    canSellAnimal(animalId) {
        const gameState = GameState.getInstance();

        // Find animal
        const animal = gameState.getAnimalsOnFarm().find(a => a.id === animalId);
        if (!animal) {
            return {
                canSell: false,
                reason: 'Animal not found'
            };
        }

        // Check if mature
        if (!animal.isMature()) {
            return {
                canSell: false,
                reason: CONSTANTS.ERROR_MESSAGES.NOT_MATURE
            };
        }

        return {
            canSell: true
        };
    }


    // ========================================================================
    // SHOP INVENTORY QUERIES
    // ========================================================================

    /**
     * PUBLIC: getAvailableSeeds
     * Gets all available seed types from config
     *
     * @returns {Object[]} Array of crop definitions
     *
     * CALLED BY:
     * - UIManager.js (display Tom's shop inventory)
     *
     * RETURNS:
     * Array of crop definition objects with pricing info
     */
    getAvailableSeeds() {
        const gameState = GameState.getInstance();
        const currentWeather = gameState.getCurrentWeather();
        const demandIndex = currentWeather ? currentWeather.demandIndex : 1.0;

        // Get all crops from config
        return GAME_CONFIG.CROPS.map(cropDef => {
            // Calculate what player would get if they bought and sold
            const baseSellPrice = cropDef.baseSellPrice;
            const currentSellPrice = Math.floor(baseSellPrice * demandIndex);
            const potentialProfit = currentSellPrice - cropDef.seedCost;

            return {
                ...cropDef,
                currentSellPrice: currentSellPrice,
                potentialProfit: potentialProfit,
                canAfford: gameState.canAfford(cropDef.seedCost)
            };
        });
    }


    /**
     * PUBLIC: getAvailableAnimals
     * Gets all available animal types from config
     *
     * @returns {Object[]} Array of animal definitions
     *
     * CALLED BY:
     * - UIManager.js (display Henry's shop inventory)
     *
     * RETURNS:
     * Array of animal definition objects with pricing info
     */
    getAvailableAnimals() {
        const gameState = GameState.getInstance();
        const currentWeather = gameState.getCurrentWeather();
        const demandIndex = currentWeather ? currentWeather.demandIndex : 1.0;

        // Get all animals from config
        return GAME_CONFIG.ANIMALS.map(animalDef => {
            // Calculate what player would get if they bought and sold
            const baseSellPrice = animalDef.baseSellPrice;
            const currentSellPrice = Math.floor(baseSellPrice * demandIndex);
            const potentialProfit = currentSellPrice - animalDef.purchaseCost;

            return {
                ...animalDef,
                currentSellPrice: currentSellPrice,
                potentialProfit: potentialProfit,
                canAfford: gameState.canAfford(animalDef.purchaseCost)
            };
        });
    }


    /**
     * PUBLIC: getPlayerHarvestedCrops
     * Gets player's harvested crops ready to sell
     *
     * @returns {Crop[]} Array of harvested crop objects
     *
     * CALLED BY:
     * - UIManager.js (display player's inventory in Tom's shop)
     */
    getPlayerHarvestedCrops() {
        const gameState = GameState.getInstance();
        return gameState.getHarvestedCrops();
    }


    /**
     * PUBLIC: getPlayerMatureAnimals
     * Gets player's mature animals ready to sell
     *
     * @returns {Animal[]} Array of mature animal objects
     *
     * CALLED BY:
     * - UIManager.js (display player's inventory in Henry's shop)
     */
    getPlayerMatureAnimals() {
        const gameState = GameState.getInstance();
        return gameState.getAnimalsOnFarm().filter(a => a.isMature());
    }


    // ========================================================================
    // PRICE CALCULATION UTILITIES
    // ========================================================================

    /**
     * PUBLIC: getCurrentDemandIndex
     * Gets current demand multiplier from weather
     *
     * @returns {number} Demand index (0.8-2.0)
     *
     * CALLED BY:
     * - UIManager.js (display current multiplier)
     */
    getCurrentDemandIndex() {
        const gameState = GameState.getInstance();
        const currentWeather = gameState.getCurrentWeather();
        return currentWeather ? currentWeather.demandIndex : 1.0;
    }


    /**
     * PUBLIC: calculateCropSellPrice
     * Calculates current selling price for a crop
     *
     * @param {string} cropType - Type of crop
     * @returns {number} Current selling price
     *
     * CALLED BY:
     * - UIManager.js (display prices)
     */
    calculateCropSellPrice(cropType) {
        const cropDef = Crop.getCropDefinition(cropType);
        if (!cropDef) return 0;

        const demandIndex = this.getCurrentDemandIndex();
        return Math.floor(cropDef.baseSellPrice * demandIndex);
    }


    /**
     * PUBLIC: calculateAnimalSellPrice
     * Calculates current selling price for an animal
     *
     * @param {string} animalType - Type of animal
     * @returns {number} Current selling price
     *
     * CALLED BY:
     * - UIManager.js (display prices)
     */
    calculateAnimalSellPrice(animalType) {
        const animalDef = Animal.getAnimalDefinition(animalType);
        if (!animalDef) return 0;

        const demandIndex = this.getCurrentDemandIndex();
        return Math.floor(animalDef.baseSellPrice * demandIndex);
    }


    /**
     * PUBLIC: getPriceInfo
     * Gets detailed price information for an item
     *
     * @param {string} itemType - 'crop' or 'animal'
     * @param {string} type - Specific type (e.g., 'wheat', 'chicken')
     * @returns {Object} Price information
     *
     * CALLED BY:
     * - UIManager.js (display detailed price info)
     */
    getPriceInfo(itemType, type) {
        const gameState = GameState.getInstance();
        const currentWeather = gameState.getCurrentWeather();
        const demandIndex = currentWeather ? currentWeather.demandIndex : 1.0;

        if (itemType === 'crop') {
            const cropDef = Crop.getCropDefinition(type);
            if (!cropDef) return null;

            const currentSellPrice = Math.floor(cropDef.baseSellPrice * demandIndex);
            const potentialProfit = currentSellPrice - cropDef.seedCost;

            return {
                purchasePrice: cropDef.seedCost,
                baseSellPrice: cropDef.baseSellPrice,
                currentSellPrice: currentSellPrice,
                demandIndex: demandIndex,
                potentialProfit: potentialProfit,
                profitPercentage: HELPERS.calculatePercentage(potentialProfit, cropDef.seedCost)
            };
        } else if (itemType === 'animal') {
            const animalDef = Animal.getAnimalDefinition(type);
            if (!animalDef) return null;

            const currentSellPrice = Math.floor(animalDef.baseSellPrice * demandIndex);
            const potentialProfit = currentSellPrice - animalDef.purchaseCost;

            return {
                purchasePrice: animalDef.purchaseCost,
                baseSellPrice: animalDef.baseSellPrice,
                currentSellPrice: currentSellPrice,
                demandIndex: demandIndex,
                potentialProfit: potentialProfit,
                profitPercentage: HELPERS.calculatePercentage(potentialProfit, animalDef.purchaseCost)
            };
        }

        return null;
    }


    // ========================================================================
    // SHOP STATUS QUERIES
    // ========================================================================

    /**
     * PUBLIC: getShopStatus
     * Gets overall shop status information
     *
     * @returns {Object} Shop status
     *
     * CALLED BY:
     * - UIManager.js (display shop overview)
     */
    getShopStatus() {
        const gameState = GameState.getInstance();

        return {
            currentMoney: gameState.currentMoney,
            formattedMoney: HELPERS.formatMoney(gameState.currentMoney),
            demandIndex: this.getCurrentDemandIndex(),
            harvestedCropsCount: gameState.getHarvestedCrops().length,
            matureAnimalsCount: gameState.getAnimalsOnFarm().filter(a => a.isMature()).length,
            availableSeedsCount: GAME_CONFIG.CROPS.length,
            availableAnimalsCount: GAME_CONFIG.ANIMALS.length
        };
    }


    // ========================================================================
    // BATCH OPERATIONS
    // ========================================================================

    /**
     * PUBLIC: sellAllHarvestedCrops
     * Sells all harvested crops at once
     *
     * @returns {Object} Result with total earnings
     *
     * CALLED BY:
     * - UIManager.js (sell all button)
     */
    sellAllHarvestedCrops() {
        const gameState = GameState.getInstance();
        const harvestedCrops = gameState.getHarvestedCrops();

        if (harvestedCrops.length === 0) {
            return {
                success: false,
                message: 'No crops to sell',
                count: 0,
                totalEarnings: 0
            };
        }

        let totalEarnings = 0;
        let soldCount = 0;
        const soldCrops = [];

        // Sell each crop
        harvestedCrops.forEach(crop => {
            const result = this.sellCrop(crop.id);
            if (result.success) {
                totalEarnings += result.sellPrice;
                soldCount++;
                soldCrops.push(crop);
            }
        });

        HELPERS.debugLog(`Sold all crops`, {
            count: soldCount,
            totalEarnings: totalEarnings
        });

        return {
            success: soldCount > 0,
            message: `Sold ${soldCount} crop${soldCount !== 1 ? 's' : ''} for ${HELPERS.formatMoney(totalEarnings)}!`,
            count: soldCount,
            totalEarnings: totalEarnings,
            crops: soldCrops
        };
    }


    /**
     * PUBLIC: sellAllMatureAnimals
     * Sells all mature animals at once
     *
     * @returns {Object} Result with total earnings
     *
     * CALLED BY:
     * - UIManager.js (sell all button)
     */
    sellAllMatureAnimals() {
        const gameState = GameState.getInstance();
        const matureAnimals = gameState.getAnimalsOnFarm().filter(a => a.isMature());

        if (matureAnimals.length === 0) {
            return {
                success: false,
                message: 'No animals to sell',
                count: 0,
                totalEarnings: 0
            };
        }

        let totalEarnings = 0;
        let soldCount = 0;
        const soldAnimals = [];

        // Sell each animal
        matureAnimals.forEach(animal => {
            const result = this.sellAnimal(animal.id);
            if (result.success) {
                totalEarnings += result.sellPrice;
                soldCount++;
                soldAnimals.push(animal);
            }
        });

        HELPERS.debugLog(`Sold all animals`, {
            count: soldCount,
            totalEarnings: totalEarnings
        });

        return {
            success: soldCount > 0,
            message: `Sold ${soldCount} animal${soldCount !== 1 ? 's' : ''} for ${HELPERS.formatMoney(totalEarnings)}!`,
            count: soldCount,
            totalEarnings: totalEarnings,
            animals: soldAnimals
        };
    }


    // ========================================================================
    // RECOMMENDATION SYSTEM
    // ========================================================================

    /**
     * PUBLIC: getSellingRecommendation
     * Provides recommendation on whether to sell now
     *
     * @returns {Object} Recommendation info
     *
     * CALLED BY:
     * - UIManager.js (show strategic advice)
     */
    getSellingRecommendation() {
        const gameState = GameState.getInstance();
        const currentWeather = gameState.getCurrentWeather();

        if (!currentWeather) {
            return {
                shouldSell: true,
                reason: 'Weather data unavailable',
                urgency: 'normal'
            };
        }

        const demandIndex = currentWeather.demandIndex;

        // Best time to sell (2.0x)
        if (demandIndex >= 2.0) {
            return {
                shouldSell: true,
                reason: 'BEST TIME TO SELL! Prices are DOUBLED!',
                urgency: 'excellent',
                icon: '🔥'
            };
        }

        // Great time (1.5x - 1.7x)
        if (demandIndex >= 1.5) {
            return {
                shouldSell: true,
                reason: 'Excellent prices! Strong demand.',
                urgency: 'great',
                icon: '✅'
            };
        }

        // Good time (1.2x - 1.4x)
        if (demandIndex >= 1.2) {
            return {
                shouldSell: true,
                reason: 'Good prices. Worth selling.',
                urgency: 'good',
                icon: '👍'
            };
        }

        // Normal (1.0x)
        if (demandIndex === 1.0) {
            return {
                shouldSell: false,
                reason: 'Normal prices. Consider waiting for bad weather.',
                urgency: 'normal',
                icon: '➡️'
            };
        }

        // Poor time (0.8x - 0.9x)
        return {
            shouldSell: false,
            reason: 'Poor prices! Wait for bad weather to get better prices.',
            urgency: 'poor',
            icon: '❌'
        };
    }


    /**
     * PUBLIC: getBestItemToBuy
     * Recommends best item to buy based on current conditions
     *
     * @param {string} shopType - 'tom' or 'henry'
     * @returns {Object|null} Recommended item or null
     *
     * CALLED BY:
     * - UIManager.js (show recommendation)
     */
    getBestItemToBuy(shopType) {
        const gameState = GameState.getInstance();
        const currentMoney = gameState.currentMoney;
        const daysRemaining = gameState.getDaysRemaining();

        if (shopType === 'tom') {
            const seeds = this.getAvailableSeeds();

            // Filter affordable seeds
            const affordableSeeds = seeds.filter(s => s.seedCost <= currentMoney);

            if (affordableSeeds.length === 0) return null;

            // If few days left, prioritize fast crops
            if (daysRemaining <= 2) {
                return affordableSeeds.reduce((best, seed) =>
                    seed.growthTime < best.growthTime ? seed : best
                );
            }

            // Otherwise, prioritize best profit margin
            return affordableSeeds.reduce((best, seed) =>
                seed.potentialProfit > best.potentialProfit ? seed : best
            );
        } else if (shopType === 'henry') {
            const animals = this.getAvailableAnimals();

            // Filter affordable animals
            const affordableAnimals = animals.filter(a => a.purchaseCost <= currentMoney);

            if (affordableAnimals.length === 0) return null;

            // If few days left, prioritize fast-growing
            if (daysRemaining <= 2) {
                return affordableAnimals.reduce((best, animal) =>
                    animal.growthTime < best.growthTime ? animal : best
                );
            }

            // Prioritize animals with good breeding chance
            return affordableAnimals.reduce((best, animal) =>
                animal.breedingChance > best.breedingChance ? animal : best
            );
        }

        return null;
    }
}

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 *
 * // Get shop manager instance
 * const shopManager = ShopManager.getInstance();
 *
 * // Buy a seed
 * const buyResult = shopManager.buySeed('wheat');
 * if (buyResult.success) {
 *     console.log('Bought wheat seed!', buyResult.crop);
 * }
 *
 * // Sell a harvested crop
 * const sellResult = shopManager.sellCrop(cropId);
 * if (sellResult.success) {
 *     console.log(`Earned ${sellResult.sellPrice}!`);
 * }
 *
 * // Buy an animal
 * const animalResult = shopManager.buyAnimal('chicken');
 * if (animalResult.success) {
 *     console.log('Bought a chicken!', animalResult.animal);
 * }
 *
 * // Sell a mature animal
 * const sellAnimalResult = shopManager.sellAnimal(animalId);
 * if (sellAnimalResult.success) {
 *     console.log(`Earned ${sellAnimalResult.sellPrice}!`);
 * }
 *
 * // Get available seeds for display
 * const seeds = shopManager.getAvailableSeeds();
 * seeds.forEach(seed => {
 *     console.log(`${seed.name}: Buy $${seed.seedCost}, Sell $${seed.currentSellPrice}`);
 * });
 *
 * // Get selling recommendation
 * const recommendation = shopManager.getSellingRecommendation();
 * console.log(recommendation.reason); // "BEST TIME TO SELL!"
 *
 * // Sell all harvested crops
 * const sellAllResult = shopManager.sellAllHarvestedCrops();
 * console.log(`Sold ${sellAllResult.count} crops for ${sellAllResult.totalEarnings}`);
 *
 * // Get price info
 * const priceInfo = shopManager.getPriceInfo('crop', 'wheat');
 * console.log(priceInfo);
 *
 * ============================================================================
 */