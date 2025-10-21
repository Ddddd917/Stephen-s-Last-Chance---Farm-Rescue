/**
 * ============================================================================
 * FILE: FarmManager.js
 * PURPOSE: Manage all farm-related operations
 *
 * DESCRIPTION:
 * This manager handles:
 * - Planting crops on farm
 * - Harvesting mature crops
 * - Placing animals on farm
 * - Selling mature animals
 * - Farm capacity management
 * - Validation of farm operations
 *
 * ARCHITECTURE:
 * Works as an intermediary between UI actions and GameState
 * Validates all operations before executing
 * Provides user-friendly error messages
 *
 * DEPENDENCIES:
 * - GameState.js (read/write game state)
 * - Crop.js (crop operations)
 * - Animal.js (animal operations)
 * - constants.js (status constants, error messages)
 * - helpers.js (utility functions)
 *
 * USED BY:
 * - UIManager.js (when player clicks farm buttons)
 * - main.js (initialize farm operations)
 * ============================================================================
 */

/**
 * CLASS: FarmManager
 * Singleton class managing all farm operations
 */
class FarmManager {

    /**
     * CONSTRUCTOR
     * Initializes the farm manager
     *
     * NOTE: Use FarmManager.getInstance() instead of calling directly
     */
    constructor() {
        // Prevent multiple instances (singleton pattern)
        if (FarmManager.instance) {
            return FarmManager.instance;
        }

        // Store singleton instance
        FarmManager.instance = this;

        HELPERS.debugLog('FarmManager initialized');
    }


    // ========================================================================
    // SINGLETON PATTERN
    // ========================================================================

    /**
     * STATIC: getInstance
     * Gets or creates the single FarmManager instance
     *
     * @returns {FarmManager} The farm manager instance
     */
    static getInstance() {
        if (!FarmManager.instance) {
            FarmManager.instance = new FarmManager();
        }
        return FarmManager.instance;
    }


    /**
     * STATIC: resetInstance
     * Resets the singleton (for new game)
     */
    static resetInstance() {
        FarmManager.instance = null;
        HELPERS.debugLog('FarmManager reset');
    }


    // ========================================================================
    // CROP OPERATIONS
    // ========================================================================

    /**
     * PUBLIC: plantCrop
     * Plants a crop from seeds inventory onto the farm
     *
     * @param {string} cropId - ID of seed to plant
     * @returns {Object} Result object {success, message, crop?}
     *
     * VALIDATION:
     * - Seed must exist in inventory
     * - Farm must have available crop slots
     * - Game must not be over
     *
     * CALLED BY:
     * - UIManager.js (when player clicks plant button)
     *
     * SIDE EFFECTS:
     * - Moves crop from seeds to crops in GameState
     * - Starts crop growth timer
     * - Dispatches CROP_PLANTED event
     *
     * EXAMPLE:
     * const result = farmManager.plantCrop(cropId);
     * if (result.success) {
     *     console.log('Planted successfully!');
     * }
     */
    plantCrop(cropId) {
        const gameState = GameState.getInstance();

        // Validate game state
        if (gameState.isGameOver()) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.GAME_OVER
            };
        }

        // Check if farm has space
        if (!gameState.canPlantMoreCrops()) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.NO_SPACE_CROPS
            };
        }

        // Find seed in inventory
        const seed = gameState.inventory.seeds.find(s => s.id === cropId);
        if (!seed) {
            return {
                success: false,
                message: 'Seed not found in inventory'
            };
        }

        // Plant the crop (GameState handles moving from seeds to crops)
        const planted = gameState.plantCrop(cropId);

        if (!planted) {
            return {
                success: false,
                message: 'Failed to plant crop'
            };
        }

        HELPERS.debugLog(`Planted ${seed.name}`, {cropId: seed.id});

        // Dispatch event
        document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.CROP_PLANTED, {
            detail: {
                crop: seed,
                message: `Planted ${seed.name}!`
            }
        }));

        return {
            success: true,
            message: CONSTANTS.SUCCESS_MESSAGES.CROP_PLANTED
                .replace('X', seed.name),
            crop: seed
        };
    }


    /**
     * PUBLIC: harvestCrop
     * Harvests a mature crop from the farm
     *
     * @param {string} cropId - ID of crop to harvest
     * @returns {Object} Result object {success, message, crop?}
     *
     * VALIDATION:
     * - Crop must exist on farm
     * - Crop must be mature
     * - Game must not be over
     *
     * CALLED BY:
     * - UIManager.js (when player clicks harvest button)
     *
     * SIDE EFFECTS:
     * - Moves crop from crops to harvestedCrops in GameState
     * - Makes crop available for selling
     * - Dispatches CROP_HARVESTED event
     *
     * EXAMPLE:
     * const result = farmManager.harvestCrop(cropId);
     * if (result.success) {
     *     console.log('Harvested!', result.crop.name);
     * }
     */
    harvestCrop(cropId) {
        const gameState = GameState.getInstance();

        // Validate game state
        if (gameState.isGameOver()) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.GAME_OVER
            };
        }

        // Find crop on farm
        const crop = gameState.inventory.crops.find(c => c.id === cropId);
        if (!crop) {
            return {
                success: false,
                message: 'Crop not found on farm'
            };
        }

        // Check if mature
        if (!crop.isMature()) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.NOT_MATURE
            };
        }

        // Harvest the crop
        const harvested = gameState.harvestCrop(cropId);

        if (!harvested) {
            return {
                success: false,
                message: 'Failed to harvest crop'
            };
        }

        HELPERS.debugLog(`Harvested ${crop.name}`, {cropId: crop.id});

        // Dispatch event
        document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.CROP_HARVESTED, {
            detail: {
                crop: crop,
                message: `Harvested ${crop.name}!`
            }
        }));

        return {
            success: true,
            message: CONSTANTS.SUCCESS_MESSAGES.CROP_HARVESTED
                .replace('X', crop.name),
            crop: crop
        };
    }


    /**
     * PUBLIC: canPlantCrop
     * Checks if a crop can be planted
     *
     * @param {string} cropId - ID of seed to check
     * @returns {Object} {canPlant: boolean, reason?: string}
     *
     * CALLED BY:
     * - UIManager.js (enable/disable plant button)
     */
    canPlantCrop(cropId) {
        const gameState = GameState.getInstance();

        // Check game over
        if (gameState.isGameOver()) {
            return {
                canPlant: false,
                reason: CONSTANTS.ERROR_MESSAGES.GAME_OVER
            };
        }

        // Check space
        if (!gameState.canPlantMoreCrops()) {
            return {
                canPlant: false,
                reason: CONSTANTS.ERROR_MESSAGES.NO_SPACE_CROPS
            };
        }

        // Check if seed exists
        const seed = gameState.inventory.seeds.find(s => s.id === cropId);
        if (!seed) {
            return {
                canPlant: false,
                reason: 'Seed not in inventory'
            };
        }

        return {
            canPlant: true
        };
    }


    /**
     * PUBLIC: canHarvestCrop
     * Checks if a crop can be harvested
     *
     * @param {string} cropId - ID of crop to check
     * @returns {Object} {canHarvest: boolean, reason?: string}
     *
     * CALLED BY:
     * - UIManager.js (enable/disable harvest button)
     */
    canHarvestCrop(cropId) {
        const gameState = GameState.getInstance();

        // Find crop
        const crop = gameState.inventory.crops.find(c => c.id === cropId);
        if (!crop) {
            return {
                canHarvest: false,
                reason: 'Crop not found'
            };
        }

        // Check maturity
        if (!crop.isMature()) {
            return {
                canHarvest: false,
                reason: CONSTANTS.ERROR_MESSAGES.NOT_MATURE
            };
        }

        return {
            canHarvest: true
        };
    }


    // ========================================================================
    // ANIMAL OPERATIONS
    // ========================================================================

    /**
     * PUBLIC: placeAnimal
     * Places an animal from young animals inventory onto the farm
     *
     * @param {string} animalId - ID of young animal to place
     * @returns {Object} Result object {success, message, animal?}
     *
     * VALIDATION:
     * - Animal must exist in young animals inventory
     * - Farm must have available animal slots
     * - Game must not be over
     *
     * CALLED BY:
     * - UIManager.js (when player clicks place button)
     *
     * SIDE EFFECTS:
     * - Moves animal from youngAnimals to animals in GameState
     * - Starts animal growth timer
     * - Dispatches ANIMAL_PLACED event
     *
     * EXAMPLE:
     * const result = farmManager.placeAnimal(animalId);
     * if (result.success) {
     *     console.log('Placed on farm!');
     * }
     */
    placeAnimal(animalId) {
        const gameState = GameState.getInstance();

        // Validate game state
        if (gameState.isGameOver()) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.GAME_OVER
            };
        }

        // Check if farm has space
        if (!gameState.canPlaceMoreAnimals()) {
            return {
                success: false,
                message: CONSTANTS.ERROR_MESSAGES.NO_SPACE_ANIMALS
            };
        }

        // Find young animal in inventory
        const animal = gameState.inventory.youngAnimals.find(a => a.id === animalId);
        if (!animal) {
            return {
                success: false,
                message: 'Animal not found in inventory'
            };
        }

        // Place the animal
        const placed = gameState.placeAnimal(animalId);

        if (!placed) {
            return {
                success: false,
                message: 'Failed to place animal'
            };
        }

        HELPERS.debugLog(`Placed ${animal.name} on farm`, {animalId: animal.id});

        // Dispatch event
        document.dispatchEvent(new CustomEvent('animal-placed', {
            detail: {
                animal: animal,
                message: `${animal.name} placed on farm!`
            }
        }));

        return {
            success: true,
            message: CONSTANTS.SUCCESS_MESSAGES.ANIMAL_PLACED
                .replace('X', animal.name),
            animal: animal
        };
    }


    /**
     * PUBLIC: canPlaceAnimal
     * Checks if an animal can be placed
     *
     * @param {string} animalId - ID of animal to check
     * @returns {Object} {canPlace: boolean, reason?: string}
     *
     * CALLED BY:
     * - UIManager.js (enable/disable place button)
     */
    canPlaceAnimal(animalId) {
        const gameState = GameState.getInstance();

        // Check game over
        if (gameState.isGameOver()) {
            return {
                canPlace: false,
                reason: CONSTANTS.ERROR_MESSAGES.GAME_OVER
            };
        }

        // Check space
        if (!gameState.canPlaceMoreAnimals()) {
            return {
                canPlace: false,
                reason: CONSTANTS.ERROR_MESSAGES.NO_SPACE_ANIMALS
            };
        }

        // Check if animal exists
        const animal = gameState.inventory.youngAnimals.find(a => a.id === animalId);
        if (!animal) {
            return {
                canPlace: false,
                reason: 'Animal not in inventory'
            };
        }

        return {
            canPlace: true
        };
    }


    // ========================================================================
    // FARM STATUS QUERIES
    // ========================================================================

    /**
     * PUBLIC: getFarmStatus
     * Gets current status of the farm
     *
     * @returns {Object} Farm status information
     *
     * CALLED BY:
     * - UIManager.js (display farm overview)
     *
     * RETURNS:
     * {
     *   cropSlots: {used, total, available},
     *   animalSlots: {used, total, available},
     *   crops: {growing, mature},
     *   animals: {growing, mature, withOffspring}
     * }
     */
    getFarmStatus() {
        const gameState = GameState.getInstance();
        const crops = gameState.getGrowingCrops();
        const animals = gameState.getAnimalsOnFarm();

        // Count mature items
        const matureCrops = crops.filter(c => c.isMature()).length;
        const matureAnimals = animals.filter(a => a.isMature()).length;
        const animalsWithOffspring = animals.filter(a => a.hasOffspring).length;

        return {
            cropSlots: {
                used: crops.length,
                total: CONSTANTS.VALIDATION.MAX_CROP_SLOTS,
                available: gameState.getAvailableCropSlots()
            },
            animalSlots: {
                used: animals.length,
                total: CONSTANTS.VALIDATION.MAX_ANIMAL_SLOTS,
                available: gameState.getAvailableAnimalSlots()
            },
            crops: {
                growing: crops.length - matureCrops,
                mature: matureCrops,
                total: crops.length
            },
            animals: {
                growing: animals.length - matureAnimals,
                mature: matureAnimals,
                withOffspring: animalsWithOffspring,
                total: animals.length
            }
        };
    }


    /**
     * PUBLIC: getCropsOnFarm
     * Gets all crops currently on the farm
     *
     * @returns {Crop[]} Array of crop objects
     *
     * CALLED BY:
     * - UIManager.js (render farm display)
     */
    getCropsOnFarm() {
        const gameState = GameState.getInstance();
        return gameState.getGrowingCrops();
    }


    /**
     * PUBLIC: getAnimalsOnFarm
     * Gets all animals currently on the farm
     *
     * @returns {Animal[]} Array of animal objects
     *
     * CALLED BY:
     * - UIManager.js (render farm display)
     */
    getAnimalsOnFarm() {
        const gameState = GameState.getInstance();
        return gameState.getAnimalsOnFarm();
    }


    /**
     * PUBLIC: getMatureItems
     * Gets all mature items ready for action
     *
     * @returns {Object} {crops: Crop[], animals: Animal[]}
     *
     * CALLED BY:
     * - UIManager.js (highlight mature items)
     */
    getMatureItems() {
        const gameState = GameState.getInstance();
        const crops = gameState.getGrowingCrops().filter(c => c.isMature());
        const animals = gameState.getAnimalsOnFarm().filter(a => a.isMature());

        return {
            crops: crops,
            animals: animals,
            totalCount: crops.length + animals.length
        };
    }


    /**
     * PUBLIC: hasSpaceForCrops
     * Checks if farm has space for more crops
     *
     * @returns {boolean} True if space available
     *
     * CALLED BY:
     * - UIManager.js (show/hide plant options)
     */
    hasSpaceForCrops() {
        const gameState = GameState.getInstance();
        return gameState.canPlantMoreCrops();
    }


    /**
     * PUBLIC: hasSpaceForAnimals
     * Checks if farm has space for more animals
     *
     * @returns {boolean} True if space available
     *
     * CALLED BY:
     * - UIManager.js (show/hide place options)
     */
    hasSpaceForAnimals() {
        const gameState = GameState.getInstance();
        return gameState.canPlaceMoreAnimals();
    }


    // ========================================================================
    // QUICK ACTIONS
    // ========================================================================

    /**
     * PUBLIC: harvestAllMature
     * Harvests all mature crops at once
     *
     * @returns {Object} Result with count of harvested crops
     *
     * CALLED BY:
     * - UIManager.js (harvest all button)
     *
     * EXAMPLE:
     * const result = farmManager.harvestAllMature();
     * console.log(`Harvested ${result.count} crops`);
     */
    harvestAllMature() {
        const gameState = GameState.getInstance();
        const matureCrops = gameState.getGrowingCrops().filter(c => c.isMature());

        let harvestedCount = 0;
        const harvestedCrops = [];

        matureCrops.forEach(crop => {
            const result = this.harvestCrop(crop.id);
            if (result.success) {
                harvestedCount++;
                harvestedCrops.push(crop);
            }
        });

        HELPERS.debugLog(`Harvested ${harvestedCount} crops`, {
            cropIds: harvestedCrops.map(c => c.id)
        });

        return {
            success: harvestedCount > 0,
            count: harvestedCount,
            crops: harvestedCrops,
            message: harvestedCount > 0
                ? `Harvested ${harvestedCount} crop${harvestedCount > 1 ? 's' : ''}!`
                : 'No mature crops to harvest'
        };
    }


    /**
     * PUBLIC: getCropById
     * Gets a specific crop by ID
     *
     * @param {string} cropId - Crop ID
     * @returns {Crop|null} Crop object or null
     *
     * CALLED BY:
     * - UIManager.js (get crop details)
     */
    getCropById(cropId) {
        const gameState = GameState.getInstance();
        return gameState.inventory.crops.find(c => c.id === cropId) || null;
    }


    /**
     * PUBLIC: getAnimalById
     * Gets a specific animal by ID
     *
     * @param {string} animalId - Animal ID
     * @returns {Animal|null} Animal object or null
     *
     * CALLED BY:
     * - UIManager.js (get animal details)
     */
    getAnimalById(animalId) {
        const gameState = GameState.getInstance();
        return gameState.inventory.animals.find(a => a.id === animalId) || null;
    }


    // ========================================================================
    // FARM STATISTICS
    // ========================================================================

    /**
     * PUBLIC: getFarmStatistics
     * Gets detailed farm statistics
     *
     * @returns {Object} Statistics object
     *
     * CALLED BY:
     * - UIManager.js (display farm info panel)
     */
    getFarmStatistics() {
        const gameState = GameState.getInstance();
        const crops = gameState.getGrowingCrops();
        const animals = gameState.getAnimalsOnFarm();

        // Calculate total potential value
        const currentWeather = gameState.getCurrentWeather();
        const demandIndex = currentWeather ? currentWeather.demandIndex : 1.0;

        let totalCropValue = 0;
        crops.filter(c => c.isMature()).forEach(c => {
            totalCropValue += c.calculateSellPrice(demandIndex);
        });

        let totalAnimalValue = 0;
        animals.filter(a => a.isMature()).forEach(a => {
            totalAnimalValue += a.calculateSellPrice(demandIndex);
        });

        return {
            crops: {
                total: crops.length,
                growing: crops.filter(c => !c.isMature()).length,
                mature: crops.filter(c => c.isMature()).length,
                potentialValue: totalCropValue
            },
            animals: {
                total: animals.length,
                growing: animals.filter(a => !a.isMature()).length,
                mature: animals.filter(a => a.isMature()).length,
                withOffspring: animals.filter(a => a.hasOffspring).length,
                totalOffspring: animals.reduce((sum, a) => sum + a.offspring.length, 0),
                potentialValue: totalAnimalValue
            },
            totalPotentialValue: totalCropValue + totalAnimalValue,
            formattedTotalValue: HELPERS.formatMoney(totalCropValue + totalAnimalValue)
        };
    }
}

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 *
 * // Get farm manager instance
 * const farmManager = FarmManager.getInstance();
 *
 * // Plant a crop
 * const plantResult = farmManager.plantCrop(cropId);
 * if (plantResult.success) {
 *     console.log('Planted!', plantResult.crop.name);
 * } else {
 *     console.error(plantResult.message);
 * }
 *
 * // Harvest a crop
 * const harvestResult = farmManager.harvestCrop(cropId);
 * if (harvestResult.success) {
 *     console.log('Harvested!', harvestResult.crop.name);
 * }
 *
 * // Harvest all mature crops
 * const harvestAll = farmManager.harvestAllMature();
 * console.log(`Harvested ${harvestAll.count} crops`);
 *
 * // Place an animal
 * const placeResult = farmManager.placeAnimal(animalId);
 * if (placeResult.success) {
 *     console.log('Placed!', placeResult.animal.name);
 * }
 *
 * // Check if can plant
 * const canPlant = farmManager.canPlantCrop(cropId);
 * if (canPlant.canPlant) {
 *     // Enable plant button
 * } else {
 *     console.log(canPlant.reason);
 * }
 *
 * // Get farm status
 * const status = farmManager.getFarmStatus();
 * console.log(`Crops: ${status.crops.total}/${status.cropSlots.total}`);
 * console.log(`Animals: ${status.animals.total}/${status.animalSlots.total}`);
 *
 * // Get mature items
 * const mature = farmManager.getMatureItems();
 * console.log(`${mature.totalCount} items ready!`);
 *
 * // Get farm statistics
 * const stats = farmManager.getFarmStatistics();
 * console.log(`Potential value: ${stats.formattedTotalValue}`);
 *
 * ============================================================================
 */