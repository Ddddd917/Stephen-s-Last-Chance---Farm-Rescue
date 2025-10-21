/**
 * ============================================================================
 * FILE: GameState.js
 * PURPOSE: Central game state management
 *
 * DESCRIPTION:
 * This is the CORE of the entire game. GameState manages:
 * - Current money, day, and goal progress
 * - All game inventory (crops, animals)
 * - Weather forecast for 7 days
 * - Game status (playing/won/lost)
 * - Statistics tracking
 * - Milestone progress
 * - Win/lose condition checking
 *
 * DESIGN PATTERN: Singleton
 * Only ONE GameState instance should exist for the entire game
 * All other modules interact with this central state
 *
 * DEPENDENCIES:
 * - config.js (for game settings)
 * - constants.js (for status constants)
 * - helpers.js (for utility functions)
 * - Weather.js (for forecast generation)
 * - Crop.js (for crop management)
 * - Animal.js (for animal management)
 *
 * USED BY:
 * - main.js (initialize game)
 * - UIManager.js (read state for display)
 * - FarmManager.js (update inventory)
 * - ShopManager.js (update money and inventory)
 * - TimerManager.js (advance days, update progress)
 * ============================================================================
 */

/**
 * CLASS: GameState
 * Singleton class managing all game state
 *
 * STATE DATA:
 * - currentMoney: Player's current balance
 * - currentDay: Current game day (1-10)
 * - goalMoney: Target amount to win ($5,000)
 * - gameStatus: Current status (playing/won/lost)
 * - weatherForecast: Array of Weather objects (7 days)
 * - inventory: All crops and animals
 * - statistics: Game statistics for end screen
 * - milestones: Progress tracking
 *
 * SINGLETON USAGE:
 * const gameState = GameState.getInstance();
 */
class GameState {

    /**
     * CONSTRUCTOR (PRIVATE)
     * Initializes a new game state
     *
     * NOTE: Do not call directly! Use GameState.getInstance()
     *
     * INITIALIZATION:
     * - Sets starting money ($50)
     * - Sets day to 1
     * - Generates initial 7-day weather forecast
     * - Creates empty inventory
     * - Initializes statistics
     */
    constructor() {
        // Prevent multiple instances (singleton pattern)
        if (GameState.instance) {
            return GameState.instance;
        }

        // Core game values
        this.currentMoney = GAME_CONFIG.STARTING_MONEY; // $50
        this.currentDay = 1;
        this.goalMoney = GAME_CONFIG.GOAL_MONEY; // $5,000
        this.gameStatus = CONSTANTS.GAME_STATUS.PLAYING;

        // Weather forecast (7 days ahead)
        this.weatherForecast = Weather.generateForecast(
            GAME_CONFIG.WEATHER_FORECAST_DAYS,
            this.currentDay
        );

        // Inventory system
        this.inventory = {
            // Seeds purchased but not planted
            seeds: [],

            // Crops planted on farm (growing or mature)
            crops: [],

            // Harvested crops ready to sell
            harvestedCrops: [],

            // Young animals not yet placed
            youngAnimals: [],

            // Animals on farm (growing or mature)
            animals: []
        };

        // Game statistics (for end screen)
        this.statistics = {
            totalCropsSold: 0,
            totalAnimalsSold: 0,
            totalCropsPurchased: 0,
            totalAnimalsPurchased: 0,
            totalMoneyEarned: 0,
            totalMoneySpent: 0,
            bestSingleSale: 0,
            totalOffspringBorn: 0,
            successfulBreedings: 0
        };

        // Milestone tracking
        this.milestonesReached = [];

        // Timestamps
        this.gameStartTime = Date.now();
        this.lastSaveTime = null;

        // Store singleton instance
        GameState.instance = this;

        HELPERS.debugLog('GameState initialized', {
            money: this.currentMoney,
            day: this.currentDay,
            goal: this.goalMoney
        });
    }


    // ========================================================================
    // SINGLETON PATTERN
    // ========================================================================

    /**
     * STATIC: getInstance
     * Gets or creates the single GameState instance
     *
     * @returns {GameState} The game state instance
     *
     * CALLED BY: All modules that need game state
     *
     * EXAMPLE:
     * const gameState = GameState.getInstance();
     * console.log(gameState.currentMoney);
     */
    static getInstance() {
        if (!GameState.instance) {
            GameState.instance = new GameState();
        }
        return GameState.instance;
    }


    /**
     * STATIC: resetInstance
     * Resets the singleton (for new game)
     *
     * CALLED BY: main.js (when starting new game)
     *
     * EXAMPLE:
     * GameState.resetInstance();
     * const newGame = GameState.getInstance();
     */
    static resetInstance() {
        GameState.instance = null;
        HELPERS.debugLog('GameState reset');
    }


    // ========================================================================
    // MONEY MANAGEMENT
    // ========================================================================

    /**
     * PUBLIC: addMoney
     * Adds money to player's balance
     *
     * @param {number} amount - Amount to add
     * @param {string} reason - Reason for adding (for statistics)
     * @returns {boolean} Success status
     *
     * CALLED BY:
     * - ShopManager.js (when selling items)
     *
     * SIDE EFFECTS:
     * - Updates currentMoney
     * - Checks for milestones
     * - Checks for victory condition
     * - Updates statistics
     * - Dispatches MONEY_CHANGED event
     *
     * EXAMPLE:
     * gameState.addMoney(100, 'Sold wheat');
     */
    addMoney(amount, reason = 'unknown') {
        // Validate amount
        if (!HELPERS.isValidNumber(amount) || amount < 0) {
            console.error('GameState.addMoney: Invalid amount', amount);
            return false;
        }

        // Add money
        this.currentMoney += amount;

        // Update statistics
        this.statistics.totalMoneyEarned += amount;
        if (amount > this.statistics.bestSingleSale) {
            this.statistics.bestSingleSale = amount;
        }

        HELPERS.debugLog(`Added ${HELPERS.formatMoney(amount)}`, {
            reason: reason,
            newBalance: HELPERS.formatMoney(this.currentMoney)
        });

        // Check for milestones
        this._checkMilestones();

        // Check for victory
        this._checkWinCondition();

        // Dispatch event for UI updates
        this._dispatchMoneyChangedEvent();

        return true;
    }


    /**
     * PUBLIC: deductMoney
     * Removes money from player's balance
     *
     * @param {number} amount - Amount to deduct
     * @param {string} reason - Reason for deduction
     * @returns {boolean} Success status (false if insufficient funds)
     *
     * CALLED BY:
     * - ShopManager.js (when buying items)
     *
     * EXAMPLE:
     * if (gameState.deductMoney(50, 'Bought seeds')) {
     *     // Purchase successful
     * }
     */
    deductMoney(amount, reason = 'unknown') {
        // Validate amount
        if (!HELPERS.isValidNumber(amount) || amount < 0) {
            console.error('GameState.deductMoney: Invalid amount', amount);
            return false;
        }

        // Check if player has enough money
        if (this.currentMoney < amount) {
            console.warn('GameState.deductMoney: Insufficient funds', {
                required: amount,
                available: this.currentMoney
            });
            return false;
        }

        // Deduct money
        this.currentMoney -= amount;

        // Update statistics
        this.statistics.totalMoneySpent += amount;

        HELPERS.debugLog(`Deducted ${HELPERS.formatMoney(amount)}`, {
            reason: reason,
            newBalance: HELPERS.formatMoney(this.currentMoney)
        });

        // Dispatch event for UI updates
        this._dispatchMoneyChangedEvent();

        return true;
    }


    /**
     * PUBLIC: canAfford
     * Checks if player can afford a purchase
     *
     * @param {number} amount - Amount to check
     * @returns {boolean} True if player has enough money
     *
     * CALLED BY:
     * - ShopManager.js (before allowing purchase)
     * - UIManager.js (enable/disable buy buttons)
     */
    canAfford(amount) {
        return HELPERS.isValidNumber(amount) && this.currentMoney >= amount;
    }


    // ========================================================================
    // DAY MANAGEMENT
    // ========================================================================

    /**
     * PUBLIC: advanceDay
     * Advances to the next day
     *
     * SIDE EFFECTS:
     * - Increments currentDay
     * - Updates weather forecast (shifts forward 1 day)
     * - Checks for game over (day > 10)
     * - Dispatches DAY_ADVANCED event
     *
     * CALLED BY:
     * - TimerManager.js (when day timer expires)
     *
     * EXAMPLE:
     * gameState.advanceDay();
     */
    advanceDay() {
        // Check if game is still playing
        if (this.gameStatus !== CONSTANTS.GAME_STATUS.PLAYING) {
            console.warn('GameState.advanceDay: Game is not in PLAYING status');
            return;
        }

        // Increment day
        this.currentDay++;

        HELPERS.debugLog(`Advanced to Day ${this.currentDay}`);

        // Update weather forecast (shift forward)
        this._updateWeatherForecast();

        // Check for game over
        this._checkLoseCondition();

        // Dispatch event
        this._dispatchDayAdvancedEvent();
    }


    /**
     * PUBLIC: getDaysRemaining
     * Calculates how many days are left
     *
     * @returns {number} Days remaining (0 if day 10+)
     *
     * CALLED BY:
     * - UIManager.js (display "X days remaining")
     */
    getDaysRemaining() {
        const remaining = GAME_CONFIG.TOTAL_DAYS - this.currentDay + 1;
        return Math.max(0, remaining);
    }


    /**
     * PUBLIC: isLastDay
     * Checks if current day is the last day (Day 10)
     *
     * @returns {boolean} True if last day
     *
     * CALLED BY:
     * - UIManager.js (show urgency warnings)
     */
    isLastDay() {
        return this.currentDay === GAME_CONFIG.TOTAL_DAYS;
    }


    // ========================================================================
    // WEATHER MANAGEMENT
    // ========================================================================

    /**
     * PUBLIC: getCurrentWeather
     * Gets today's weather
     *
     * @returns {Weather} Current day's weather object
     *
     * CALLED BY:
     * - ShopManager.js (calculate selling prices)
     * - UIManager.js (display current weather)
     */
    getCurrentWeather() {
        // Find weather for current day in forecast
        return this.weatherForecast.find(w => w.day === this.currentDay) || null;
    }


    /**
     * PUBLIC: getWeatherForecast
     * Gets full weather forecast
     *
     * @returns {Weather[]} Array of Weather objects
     *
     * CALLED BY:
     * - UIManager.js (display 7-day forecast)
     */
    getWeatherForecast() {
        return this.weatherForecast;
    }


    /**
     * PRIVATE: _updateWeatherForecast
     * Updates forecast when day advances
     *
     * LOGIC:
     * Remove yesterday's weather, add new day at end
     * Keeps forecast at 7 days
     *
     * CALLED BY: advanceDay()
     */
    _updateWeatherForecast() {
        // Remove weather for days that have passed
        this.weatherForecast = this.weatherForecast.filter(
            w => w.day >= this.currentDay
        );

        // Add new weather to maintain 7-day forecast
        const lastDay = this.weatherForecast[this.weatherForecast.length - 1].day;
        const newWeather = new Weather(lastDay + 1);
        this.weatherForecast.push(newWeather);

        HELPERS.debugLog('Weather forecast updated', {
            forecastDays: this.weatherForecast.map(w => ({
                day: w.day,
                weather: w.weatherValue,
                demand: w.demandIndex
            }))
        });
    }


    // ========================================================================
    // INVENTORY MANAGEMENT - CROPS
    // ========================================================================

    /**
     * PUBLIC: addSeed
     * Adds a seed to inventory (purchased but not planted)
     *
     * @param {Crop} crop - Crop object in SEED status
     *
     * CALLED BY:
     * - ShopManager.js (after purchasing seed)
     */
    addSeed(crop) {
        if (!(crop instanceof Crop)) {
            console.error('GameState.addSeed: Invalid crop object');
            return;
        }

        this.inventory.seeds.push(crop);
        this.statistics.totalCropsPurchased++;

        HELPERS.debugLog(`Added ${crop.name} seed to inventory`, {
            seedId: crop.id
        });
    }


    /**
     * PUBLIC: plantCrop
     * Moves crop from seeds to crops (planted on farm)
     *
     * @param {string} cropId - ID of crop to plant
     * @returns {boolean} Success status
     *
     * CALLED BY:
     * - FarmManager.js (when planting seed)
     */
    plantCrop(cropId) {
        // Find seed in inventory
        const seedIndex = this.inventory.seeds.findIndex(s => s.id === cropId);

        if (seedIndex === -1) {
            console.error('GameState.plantCrop: Seed not found', cropId);
            return false;
        }

        // Remove from seeds
        const crop = this.inventory.seeds.splice(seedIndex, 1)[0];

        // Plant the crop
        crop.plant();

        // Add to crops (on farm)
        this.inventory.crops.push(crop);

        HELPERS.debugLog(`Planted ${crop.name}`, {cropId: crop.id});

        return true;
    }


    /**
     * PUBLIC: harvestCrop
     * Moves crop from crops to harvestedCrops
     *
     * @param {string} cropId - ID of crop to harvest
     * @returns {boolean} Success status
     *
     * CALLED BY:
     * - FarmManager.js (when harvesting crop)
     */
    harvestCrop(cropId) {
        // Find crop on farm
        const cropIndex = this.inventory.crops.findIndex(c => c.id === cropId);

        if (cropIndex === -1) {
            console.error('GameState.harvestCrop: Crop not found', cropId);
            return false;
        }

        const crop = this.inventory.crops[cropIndex];

        // Check if mature
        if (!crop.isMature()) {
            console.warn('GameState.harvestCrop: Crop not mature yet', cropId);
            return false;
        }

        // Harvest the crop
        crop.harvest();

        // Remove from crops
        this.inventory.crops.splice(cropIndex, 1);

        // Add to harvested crops
        this.inventory.harvestedCrops.push(crop);

        HELPERS.debugLog(`Harvested ${crop.name}`, {cropId: crop.id});

        return true;
    }


    /**
     * PUBLIC: sellCrop
     * Removes crop from inventory after selling
     *
     * @param {string} cropId - ID of crop to sell
     * @returns {Crop|null} Sold crop object or null
     *
     * CALLED BY:
     * - ShopManager.js (after selling crop to Tom)
     */
    sellCrop(cropId) {
        // Find harvested crop
        const cropIndex = this.inventory.harvestedCrops.findIndex(c => c.id === cropId);

        if (cropIndex === -1) {
            console.error('GameState.sellCrop: Crop not found', cropId);
            return null;
        }

        // Remove from inventory
        const crop = this.inventory.harvestedCrops.splice(cropIndex, 1)[0];

        // Update statistics
        this.statistics.totalCropsSold++;

        HELPERS.debugLog(`Sold ${crop.name}`, {cropId: crop.id});

        return crop;
    }


    /**
     * PUBLIC: getGrowingCrops
     * Gets all crops currently on farm
     *
     * @returns {Crop[]} Array of crops
     *
     * CALLED BY:
     * - UIManager.js (display farm)
     * - TimerManager.js (update growth progress)
     */
    getGrowingCrops() {
        return this.inventory.crops;
    }


    /**
     * PUBLIC: getHarvestedCrops
     * Gets all harvested crops ready to sell
     *
     * @returns {Crop[]} Array of harvested crops
     *
     * CALLED BY:
     * - UIManager.js (display in shop)
     */
    getHarvestedCrops() {
        return this.inventory.harvestedCrops;
    }


    // ========================================================================
    // INVENTORY MANAGEMENT - ANIMALS
    // ========================================================================

    /**
     * PUBLIC: addYoungAnimal
     * Adds young animal to inventory (purchased but not placed)
     *
     * @param {Animal} animal - Animal object in YOUNG status
     *
     * CALLED BY:
     * - ShopManager.js (after purchasing animal)
     */
    addYoungAnimal(animal) {
        if (!(animal instanceof Animal)) {
            console.error('GameState.addYoungAnimal: Invalid animal object');
            return;
        }

        this.inventory.youngAnimals.push(animal);
        this.statistics.totalAnimalsPurchased++;

        HELPERS.debugLog(`Added ${animal.name} to inventory`, {
            animalId: animal.id
        });
    }


    /**
     * PUBLIC: placeAnimal
     * Moves animal from youngAnimals to animals (placed on farm)
     *
     * @param {string} animalId - ID of animal to place
     * @returns {boolean} Success status
     *
     * CALLED BY:
     * - FarmManager.js (when placing animal)
     */
    placeAnimal(animalId) {
        // Find young animal
        const animalIndex = this.inventory.youngAnimals.findIndex(a => a.id === animalId);

        if (animalIndex === -1) {
            console.error('GameState.placeAnimal: Animal not found', animalId);
            return false;
        }

        // Remove from young animals
        const animal = this.inventory.youngAnimals.splice(animalIndex, 1)[0];

        // Place the animal
        animal.place();

        // Add to animals (on farm)
        this.inventory.animals.push(animal);

        HELPERS.debugLog(`Placed ${animal.name} on farm`, {animalId: animal.id});

        return true;
    }


    /**
     * PUBLIC: sellAnimal
     * Removes animal from inventory after selling
     *
     * @param {string} animalId - ID of animal to sell
     * @returns {Animal|null} Sold animal object or null
     *
     * CALLED BY:
     * - ShopManager.js (after selling animal to Henry)
     */
    sellAnimal(animalId) {
        // Find animal on farm
        const animalIndex = this.inventory.animals.findIndex(a => a.id === animalId);

        if (animalIndex === -1) {
            console.error('GameState.sellAnimal: Animal not found', animalId);
            return null;
        }

        const animal = this.inventory.animals[animalIndex];

        // Check if mature
        if (!animal.isMature()) {
            console.warn('GameState.sellAnimal: Animal not mature yet', animalId);
            return null;
        }

        // Remove from inventory
        this.inventory.animals.splice(animalIndex, 1);

        // Update statistics
        this.statistics.totalAnimalsSold++;

        HELPERS.debugLog(`Sold ${animal.name}`, {animalId: animal.id});

        return animal;
    }


    /**
     * PUBLIC: addOffspringToFarm
     * Adds bred offspring directly to farm
     *
     * @param {Animal} offspring - Offspring animal (already placed)
     *
     * CALLED BY:
     * - Animal.attemptBreeding() creates and places offspring
     * - TimerManager.js adds to GameState after breeding
     */
    addOffspringToFarm(offspring) {
        if (!(offspring instanceof Animal)) {
            console.error('GameState.addOffspringToFarm: Invalid animal');
            return;
        }

        this.inventory.animals.push(offspring);
        this.statistics.totalOffspringBorn++;
        this.statistics.successfulBreedings++;

        HELPERS.debugLog(`Offspring ${offspring.name} added to farm`, {
            offspringId: offspring.id
        });
    }


    /**
     * PUBLIC: getAnimalsOnFarm
     * Gets all animals currently on farm
     *
     * @returns {Animal[]} Array of animals
     *
     * CALLED BY:
     * - UIManager.js (display farm)
     * - TimerManager.js (update growth, attempt breeding)
     */
    getAnimalsOnFarm() {
        return this.inventory.animals;
    }


    // ========================================================================
    // WIN/LOSE CONDITION CHECKING
    // ========================================================================

    /**
     * PRIVATE: _checkWinCondition
     * Checks if player has won the game
     *
     * WIN CONDITION:
     * currentMoney >= goalMoney ($5,000)
     *
     * CALLED BY: addMoney()
     */
    _checkWinCondition() {
        if (this.gameStatus !== CONSTANTS.GAME_STATUS.PLAYING) {
            return;
        }

        if (this.currentMoney >= this.goalMoney) {
            this._setGameWon();
        }
    }


    /**
     * PRIVATE: _checkLoseCondition
     * Checks if player has lost the game
     *
     * LOSE CONDITION:
     * currentDay > TOTAL_DAYS (10) AND currentMoney < goalMoney
     *
     * CALLED BY: advanceDay()
     */
    _checkLoseCondition() {
        if (this.gameStatus !== CONSTANTS.GAME_STATUS.PLAYING) {
            return;
        }

        if (this.currentDay > GAME_CONFIG.TOTAL_DAYS &&
            this.currentMoney < this.goalMoney) {
            this._setGameLost();
        }
    }


    /**
     * PRIVATE: _setGameWon
     * Sets game status to WON
     *
     * SIDE EFFECTS:
     * - Updates gameStatus
     * - Dispatches GAME_WON event
     */
    _setGameWon() {
        this.gameStatus = CONSTANTS.GAME_STATUS.WON;

        HELPERS.debugLog('GAME WON!', {
            finalMoney: HELPERS.formatMoney(this.currentMoney),
            daysUsed: this.currentDay
        });

        // Dispatch event
        document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.GAME_WON, {
            detail: {
                finalMoney: this.currentMoney,
                daysUsed: this.currentDay,
                statistics: this.statistics
            }
        }));
    }


    /**
     * PRIVATE: _setGameLost
     * Sets game status to LOST
     *
     * SIDE EFFECTS:
     * - Updates gameStatus
     * - Dispatches GAME_LOST event
     */
    _setGameLost() {
        this.gameStatus = CONSTANTS.GAME_STATUS.LOST;

        const shortfall = this.goalMoney - this.currentMoney;

        HELPERS.debugLog('GAME LOST', {
            finalMoney: HELPERS.formatMoney(this.currentMoney),
            shortfall: HELPERS.formatMoney(shortfall)
        });

        // Dispatch event
        document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.GAME_LOST, {
            detail: {
                finalMoney: this.currentMoney,
                shortfall: shortfall,
                statistics: this.statistics
            }
        }));
    }


    /**
     * PUBLIC: isGameOver
     * Checks if game has ended (won or lost)
     *
     * @returns {boolean} True if game is over
     *
     * CALLED BY:
     * - main.js (check before allowing actions)
     */
    isGameOver() {
        return this.gameStatus === CONSTANTS.GAME_STATUS.WON ||
            this.gameStatus === CONSTANTS.GAME_STATUS.LOST;
    }


    // ========================================================================
    // MILESTONE TRACKING
    // ========================================================================

    /**
     * PRIVATE: _checkMilestones
     * Checks if any new milestones have been reached
     *
     * CALLED BY: addMoney()
     */
    _checkMilestones() {
        for (const milestone of GAME_CONFIG.MILESTONES) {
            // Skip if already reached
            if (this.milestonesReached.includes(milestone.amount)) {
                continue;
            }

            // Check if reached
            if (this.currentMoney >= milestone.amount) {
                this._reachMilestone(milestone);
            }
        }
    }


    /**
     * PRIVATE: _reachMilestone
     * Marks a milestone as reached
     *
     * @param {Object} milestone - Milestone object
     *
     * SIDE EFFECTS:
     * - Adds to milestonesReached array
     * - Dispatches MILESTONE_REACHED event
     */
    _reachMilestone(milestone) {
        this.milestonesReached.push(milestone.amount);

        HELPERS.debugLog(`Milestone reached: ${milestone.title}`, {
            amount: HELPERS.formatMoney(milestone.amount),
            message: milestone.message
        });

        // Dispatch event for UI notification
        document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.MILESTONE_REACHED, {
            detail: {
                milestone: milestone
            }
        }));
    }


    /**
     * PUBLIC: getProgress
     * Gets goal completion percentage
     *
     * @returns {number} Progress percentage (0-100)
     *
     * CALLED BY:
     * - UIManager.js (display progress bar)
     */
    getProgress() {
        return HELPERS.calculatePercentage(this.currentMoney, this.goalMoney);
    }


    // ========================================================================
    // EVENT DISPATCHING
    // ========================================================================

    /**
     * PRIVATE: _dispatchMoneyChangedEvent
     * Dispatches event when money changes
     */
    _dispatchMoneyChangedEvent() {
        document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.MONEY_CHANGED, {
            detail: {
                currentMoney: this.currentMoney,
                progress: this.getProgress()
            }
        }));
    }


    /**
     * PRIVATE: _dispatchDayAdvancedEvent
     * Dispatches event when day advances
     */
    _dispatchDayAdvancedEvent() {
        document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.DAY_ADVANCED, {
            detail: {
                currentDay: this.currentDay,
                daysRemaining: this.getDaysRemaining()
            }
        }));
    }


    // ========================================================================
    // SAVE/LOAD SYSTEM
    // ========================================================================

    /**
     * PUBLIC: toJSON
     * Converts game state to JSON for saving
     *
     * @returns {Object} JSON representation of game state
     */
    toJSON() {
        return {
            currentMoney: this.currentMoney,
            currentDay: this.currentDay,
            goalMoney: this.goalMoney,
            gameStatus: this.gameStatus,
            weatherForecast: this.weatherForecast.map(w => w.toJSON()),
            inventory: {
                seeds: this.inventory.seeds.map(c => c.toJSON()),
                crops: this.inventory.crops.map(c => c.toJSON()),
                harvestedCrops: this.inventory.harvestedCrops.map(c => c.toJSON()),
                youngAnimals: this.inventory.youngAnimals.map(a => a.toJSON()),
                animals: this.inventory.animals.map(a => a.toJSON())
            },
            statistics: this.statistics,
            milestonesReached: this.milestonesReached,
            gameStartTime: this.gameStartTime,
            lastSaveTime: Date.now()
        };
    }


    /**
     * STATIC: fromJSON
     * Restores game state from JSON
     *
     * @param {Object} json - Saved game state
     * @returns {GameState} Restored game state
     */
    static fromJSON(json) {
        // Reset and get fresh instance
        GameState.resetInstance();
        const gameState = GameState.getInstance();

        // Restore basic values
        gameState.currentMoney = json.currentMoney || GAME_CONFIG.STARTING_MONEY;
        gameState.currentDay = json.currentDay || 1;
        gameState.goalMoney = json.goalMoney || GAME_CONFIG.GOAL_MONEY;
        gameState.gameStatus = json.gameStatus || CONSTANTS.GAME_STATUS.PLAYING;

        // Restore weather forecast
        gameState.weatherForecast = json.weatherForecast.map(w => Weather.fromJSON(w));

        // Restore inventory
        gameState.inventory.seeds = json.inventory.seeds.map(c => Crop.fromJSON(c));
        gameState.inventory.crops = json.inventory.crops.map(c => Crop.fromJSON(c));
        gameState.inventory.harvestedCrops = json.inventory.harvestedCrops.map(c => Crop.fromJSON(c));
        gameState.inventory.youngAnimals = json.inventory.youngAnimals.map(a => Animal.fromJSON(a));
        gameState.inventory.animals = json.inventory.animals.map(a => Animal.fromJSON(a));

        // Restore statistics and milestones
        gameState.statistics = json.statistics || gameState.statistics;
        gameState.milestonesReached = json.milestonesReached || [];
        gameState.gameStartTime = json.gameStartTime || Date.now();

        HELPERS.debugLog('GameState restored from JSON');

        return gameState;
    }


    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    /**
     * PUBLIC: getGameInfo
     * Gets formatted game information for display
     *
     * @returns {Object} Game information object
     *
     * CALLED BY:
     * - UIManager.js (display all game info)
     */
    getGameInfo() {
        const currentWeather = this.getCurrentWeather();

        return {
            // Core values
            currentMoney: this.currentMoney,
            formattedMoney: HELPERS.formatMoney(this.currentMoney),
            currentDay: this.currentDay,
            formattedDay: HELPERS.formatDay(this.currentDay),
            goalMoney: this.goalMoney,
            formattedGoal: HELPERS.formatMoney(this.goalMoney),
            daysRemaining: this.getDaysRemaining(),
            gameStatus: this.gameStatus,

            // Progress
            progress: this.getProgress(),
            moneyNeeded: this.goalMoney - this.currentMoney,
            formattedMoneyNeeded: HELPERS.formatMoney(this.goalMoney - this.currentMoney),

            // Weather
            currentWeather: currentWeather,
            weatherForecast: this.weatherForecast,

            // Inventory counts
            inventoryCounts: {
                seeds: this.inventory.seeds.length,
                growingCrops: this.inventory.crops.length,
                harvestedCrops: this.inventory.harvestedCrops.length,
                youngAnimals: this.inventory.youngAnimals.length,
                animalsOnFarm: this.inventory.animals.length
            },

            // Statistics
            statistics: this.statistics,

            // Milestones
            milestonesReached: this.milestonesReached,

            // Flags
            isLastDay: this.isLastDay(),
            isGameOver: this.isGameOver()
        };
    }


    /**
     * PUBLIC: getStatistics
     * Gets full statistics object
     *
     * @returns {Object} Statistics object
     *
     * CALLED BY:
     * - UIManager.js (display end screen statistics)
     */
    getStatistics() {
        // Calculate additional statistics
        const netProfit = this.statistics.totalMoneyEarned - this.statistics.totalMoneySpent;
        const totalPlayTime = Date.now() - this.gameStartTime;

        return {
            ...this.statistics,
            netProfit: netProfit,
            formattedNetProfit: HELPERS.formatMoney(netProfit),
            totalPlayTime: totalPlayTime,
            formattedPlayTime: HELPERS.formatTime(totalPlayTime),
            finalMoney: this.currentMoney,
            formattedFinalMoney: HELPERS.formatMoney(this.currentMoney),
            daysPlayed: this.currentDay
        };
    }


    /**
     * PUBLIC: reset
     * Resets game state for new game
     *
     * CALLED BY:
     * - main.js (start new game button)
     *
     * EXAMPLE:
     * gameState.reset();
     */
    reset() {
        // Reset to initial values
        this.currentMoney = GAME_CONFIG.STARTING_MONEY;
        this.currentDay = 1;
        this.gameStatus = CONSTANTS.GAME_STATUS.PLAYING;

        // Regenerate weather
        this.weatherForecast = Weather.generateForecast(
            GAME_CONFIG.WEATHER_FORECAST_DAYS,
            this.currentDay
        );

        // Clear inventory
        this.inventory = {
            seeds: [],
            crops: [],
            harvestedCrops: [],
            youngAnimals: [],
            animals: []
        };

        // Reset statistics
        this.statistics = {
            totalCropsSold: 0,
            totalAnimalsSold: 0,
            totalCropsPurchased: 0,
            totalAnimalsPurchased: 0,
            totalMoneyEarned: 0,
            totalMoneySpent: 0,
            bestSingleSale: 0,
            totalOffspringBorn: 0,
            successfulBreedings: 0
        };

        // Reset milestones
        this.milestonesReached = [];

        // Reset timestamps
        this.gameStartTime = Date.now();
        this.lastSaveTime = null;

        HELPERS.debugLog('GameState reset for new game');
    }


    /**
     * PUBLIC: canPlantMoreCrops
     * Checks if farm has space for more crops
     *
     * @returns {boolean} True if space available
     *
     * CALLED BY:
     * - FarmManager.js (before planting)
     * - UIManager.js (enable/disable plant button)
     */
    canPlantMoreCrops() {
        return this.inventory.crops.length < CONSTANTS.VALIDATION.MAX_CROP_SLOTS;
    }


    /**
     * PUBLIC: canPlaceMoreAnimals
     * Checks if farm has space for more animals
     *
     * @returns {boolean} True if space available
     *
     * CALLED BY:
     * - FarmManager.js (before placing)
     * - UIManager.js (enable/disable place button)
     */
    canPlaceMoreAnimals() {
        return this.inventory.animals.length < CONSTANTS.VALIDATION.MAX_ANIMAL_SLOTS;
    }


    /**
     * PUBLIC: getAvailableCropSlots
     * Gets number of available crop slots
     *
     * @returns {number} Available slots
     */
    getAvailableCropSlots() {
        return CONSTANTS.VALIDATION.MAX_CROP_SLOTS - this.inventory.crops.length;
    }


    /**
     * PUBLIC: getAvailableAnimalSlots
     * Gets number of available animal slots
     *
     * @returns {number} Available slots
     */
    getAvailableAnimalSlots() {
        return CONSTANTS.VALIDATION.MAX_ANIMAL_SLOTS - this.inventory.animals.length;
    }
}

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 *
 * // Get game state instance (singleton)
 * const gameState = GameState.getInstance();
 *
 * // Check money and buy something
 * if (gameState.canAfford(50)) {
 *     gameState.deductMoney(50, 'Bought wheat seeds');
 * }
 *
 * // Add money from sale
 * gameState.addMoney(100, 'Sold wheat');
 *
 * // Manage crops
 * const wheat = new Crop('wheat');
 * gameState.addSeed(wheat);
 * gameState.plantCrop(wheat.id);
 * gameState.harvestCrop(wheat.id);
 * gameState.sellCrop(wheat.id);
 *
 * // Manage animals
 * const chicken = new Animal('chicken', true);
 * gameState.addYoungAnimal(chicken);
 * gameState.placeAnimal(chicken.id);
 * gameState.sellAnimal(chicken.id);
 *
 * // Check weather
 * const currentWeather = gameState.getCurrentWeather();
 * console.log(currentWeather.demandIndex); // 1.5
 *
 * // Advance day
 * gameState.advanceDay();
 *
 * // Check game status
 * console.log(gameState.currentDay); // 2
 * console.log(gameState.getDaysRemaining()); // 9
 * console.log(gameState.getProgress()); // 2%
 * console.log(gameState.isGameOver()); // false
 *
 * // Get all game info for UI
 * const info = gameState.getGameInfo();
 * console.log(info.formattedMoney); // "$150"
 * console.log(info.progress); // 3
 *
 * // Save game
 * const json = gameState.toJSON();
 * localStorage.setItem('savedGame', JSON.stringify(json));
 *
 * // Load game
 * const savedJson = JSON.parse(localStorage.getItem('savedGame'));
 * const restoredState = GameState.fromJSON(savedJson);
 *
 * // Start new game
 * GameState.resetInstance();
 * const newGame = GameState.getInstance();
 *
 * ============================================================================
 */

/**
 * ============================================================================
 * IMPORTANT NOTES FOR DEVELOPERS
 * ============================================================================
 *
 * 1. SINGLETON PATTERN:
 *    Always use GameState.getInstance(), never call new GameState()
 *
 * 2. EVENT SYSTEM:
 *    GameState dispatches events for UI updates:
 *    - MONEY_CHANGED: When money changes
 *    - DAY_ADVANCED: When day advances
 *    - GAME_WON: When player wins
 *    - GAME_LOST: When player loses
 *    - MILESTONE_REACHED: When milestone achieved
 *
 * 3. INVENTORY FLOW:
 *    Seeds → Plant → Crops → Harvest → HarvestedCrops → Sell → Money
 *    YoungAnimals → Place → Animals → Sell → Money
 *
 * 4. BREEDING:
 *    TimerManager calls Animal.attemptBreeding()
 *    If successful, Animal creates offspring and places it
 *    TimerManager adds offspring to GameState.inventory.animals
 *
 * 5. WIN/LOSE:
 *    Checked automatically in addMoney() and advanceDay()
 *    No need to manually check in most cases
 *
 * 6. STATISTICS:
 *    Updated automatically as actions occur
 *    Access via getStatistics() for end screens
 *
 * ============================================================================
 */