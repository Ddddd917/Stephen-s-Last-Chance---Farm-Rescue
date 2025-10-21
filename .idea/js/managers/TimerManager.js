/**
 * ============================================================================
 * FILE: TimerManager.js
 * PURPOSE: Manage all time-based mechanics in the game
 *
 * DESCRIPTION:
 * This manager handles:
 * - Crop growth progress updates
 * - Animal growth progress updates
 * - Animal breeding checks and triggers
 * - Day advancement timer
 * - Maturity checking for all items
 * - Real-time progress bar updates
 *
 * ARCHITECTURE:
 * Uses setInterval to create a main game loop that runs every second
 * Updates all growing items and checks for state changes
 *
 * DEPENDENCIES:
 * - GameState.js (read/write game state)
 * - Crop.js (check maturity, update progress)
 * - Animal.js (check maturity, attempt breeding)
 * - constants.js (timer intervals)
 * - helpers.js (time calculations)
 *
 * USED BY:
 * - main.js (initialize and start timer system)
 * - UIManager.js (get timer updates for display)
 * ============================================================================
 */

/**
 * CLASS: TimerManager
 * Singleton class managing all game timers
 *
 * MAIN LOOP:
 * Runs every 1 second (CONSTANTS.TIMING.TIMER_UPDATE_INTERVAL)
 * Checks all growing crops and animals
 * Updates progress bars
 * Triggers breeding events
 * Advances days when needed
 */
class TimerManager {

    /**
     * CONSTRUCTOR
     * Initializes the timer manager
     *
     * NOTE: Use TimerManager.getInstance() instead of calling directly
     */
    constructor() {
        // Prevent multiple instances (singleton pattern)
        if (TimerManager.instance) {
            return TimerManager.instance;
        }

        // Timer references
        this.mainLoopTimer = null;           // Main game loop interval
        this.dayTimer = null;                // Day advancement interval

        // State tracking
        this.isRunning = false;              // Whether timers are active
        this.currentDayStartTime = null;     // When current day started

        // Store singleton instance
        TimerManager.instance = this;

        HELPERS.debugLog('TimerManager initialized');
    }


    // ========================================================================
    // SINGLETON PATTERN
    // ========================================================================

    /**
     * STATIC: getInstance
     * Gets or creates the single TimerManager instance
     *
     * @returns {TimerManager} The timer manager instance
     *
     * CALLED BY: main.js, other managers
     */
    static getInstance() {
        if (!TimerManager.instance) {
            TimerManager.instance = new TimerManager();
        }
        return TimerManager.instance;
    }


    /**
     * STATIC: resetInstance
     * Resets the singleton (for new game)
     *
     * CALLED BY: main.js (when starting new game)
     */
    static resetInstance() {
        if (TimerManager.instance) {
            TimerManager.instance.stop();
        }
        TimerManager.instance = null;
        HELPERS.debugLog('TimerManager reset');
    }


    // ========================================================================
    // TIMER CONTROL
    // ========================================================================

    /**
     * PUBLIC: start
     * Starts all timer systems
     *
     * CALLED BY:
     * - main.js (when game starts)
     *
     * SIDE EFFECTS:
     * - Starts main game loop (1 second interval)
     * - Starts day advancement timer
     * - Sets isRunning flag
     */
    start() {
        if (this.isRunning) {
            console.warn('TimerManager: Already running');
            return;
        }

        const gameState = GameState.getInstance();

        // Start main game loop (runs every second)
        this.mainLoopTimer = setInterval(() => {
            this._mainLoop();
        }, CONSTANTS.TIMING.TIMER_UPDATE_INTERVAL);

        // Record when current day started
        this.currentDayStartTime = Date.now();

        // Start day advancement timer (runs every 3 minutes by default)
        this._startDayTimer();

        this.isRunning = true;

        HELPERS.debugLog('TimerManager started', {
            updateInterval: CONSTANTS.TIMING.TIMER_UPDATE_INTERVAL,
            dayDuration: GAME_CONFIG.DAY_DURATION_MINUTES
        });
    }


    /**
     * PUBLIC: stop
     * Stops all timer systems
     *
     * CALLED BY:
     * - main.js (when game ends)
     * - resetInstance()
     *
     * SIDE EFFECTS:
     * - Clears all intervals
     * - Sets isRunning flag to false
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        // Clear main loop
        if (this.mainLoopTimer) {
            clearInterval(this.mainLoopTimer);
            this.mainLoopTimer = null;
        }

        // Clear day timer
        if (this.dayTimer) {
            clearInterval(this.dayTimer);
            this.dayTimer = null;
        }

        this.isRunning = false;

        HELPERS.debugLog('TimerManager stopped');
    }


    /**
     * PUBLIC: pause
     * Temporarily pauses all timers
     *
     * CALLED BY:
     * - UIManager (if pause feature implemented)
     */
    pause() {
        this.stop();
        HELPERS.debugLog('TimerManager paused');
    }


    /**
     * PUBLIC: resume
     * Resumes paused timers
     *
     * CALLED BY:
     * - UIManager (if pause feature implemented)
     */
    resume() {
        this.start();
        HELPERS.debugLog('TimerManager resumed');
    }


    // ========================================================================
    // MAIN GAME LOOP
    // ========================================================================

    /**
     * PRIVATE: _mainLoop
     * Main game loop - runs every second
     *
     * RESPONSIBILITIES:
     * 1. Check all growing crops for maturity
     * 2. Check all growing animals for maturity
     * 3. Check animals for breeding eligibility
     * 4. Dispatch update events for UI
     *
     * CALLED BY: setInterval (every second)
     */
    _mainLoop() {
        const gameState = GameState.getInstance();

        // Skip if game is over
        if (gameState.isGameOver()) {
            this.stop();
            return;
        }

        // Update all crops
        this._updateCrops();

        // Update all animals (includes breeding checks)
        this._updateAnimals();

        // Dispatch event for UI updates
        this._dispatchTimerUpdateEvent();
    }


    // ========================================================================
    // CROP UPDATE METHODS
    // ========================================================================

    /**
     * PRIVATE: _updateCrops
     * Updates all growing crops and checks for maturity
     *
     * CALLED BY: _mainLoop()
     *
     * SIDE EFFECTS:
     * - Calls isMature() on each crop (auto-updates status if ready)
     * - Dispatches CROP_MATURED event if crop becomes mature
     */
    _updateCrops() {
        const gameState = GameState.getInstance();
        const crops = gameState.getGrowingCrops();

        crops.forEach(crop => {
            // Check if mature (this auto-updates status)
            const wasGrowing = crop.status === CONSTANTS.CROP_STATUS.GROWING;
            const isNowMature = crop.isMature();

            // If just became mature, dispatch event
            if (wasGrowing && isNowMature) {
                this._onCropMatured(crop);
            }
        });
    }


    /**
     * PRIVATE: _onCropMatured
     * Handles crop maturity event
     *
     * @param {Crop} crop - The crop that just matured
     *
     * CALLED BY: _updateCrops()
     *
     * SIDE EFFECTS:
     * - Dispatches CROP_MATURED event
     * - Triggers UI notification (via event)
     */
    _onCropMatured(crop) {
        HELPERS.debugLog(`Crop matured: ${crop.name}`, {cropId: crop.id});

        // Dispatch event for UI
        document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.CROP_MATURED, {
            detail: {
                crop: crop,
                message: `Your ${crop.name} is ready to harvest!`
            }
        }));
    }


    // ========================================================================
    // ANIMAL UPDATE METHODS
    // ========================================================================

    /**
     * PRIVATE: _updateAnimals
     * Updates all growing animals and checks for maturity and breeding
     *
     * CALLED BY: _mainLoop()
     *
     * SIDE EFFECTS:
     * - Calls isMature() on each animal
     * - Attempts breeding for eligible animals
     * - Dispatches events for maturity and breeding
     */
    _updateAnimals() {
        const gameState = GameState.getInstance();
        const animals = gameState.getAnimalsOnFarm();

        animals.forEach(animal => {
            // Check if mature
            const wasGrowing = animal.status === CONSTANTS.ANIMAL_STATUS.GROWING;
            const isNowMature = animal.isMature();

            // If just became mature, dispatch event
            if (wasGrowing && isNowMature) {
                this._onAnimalMatured(animal);
            }

            // Check for breeding eligibility (only if still growing)
            if (animal.status === CONSTANTS.ANIMAL_STATUS.GROWING && animal.canBreed()) {
                this._attemptAnimalBreeding(animal);
            }
        });
    }


    /**
     * PRIVATE: _onAnimalMatured
     * Handles animal maturity event
     *
     * @param {Animal} animal - The animal that just matured
     *
     * CALLED BY: _updateAnimals()
     */
    _onAnimalMatured(animal) {
        HELPERS.debugLog(`Animal matured: ${animal.name}`, {
            animalId: animal.id,
            hasOffspring: animal.hasOffspring,
            offspringCount: animal.offspring.length
        });

        // Dispatch event for UI
        document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.ANIMAL_MATURED, {
            detail: {
                animal: animal,
                message: `Your ${animal.name} is ready to sell!`
            }
        }));
    }


    /**
     * PRIVATE: _attemptAnimalBreeding
     * Attempts breeding for an eligible animal
     *
     * @param {Animal} animal - Animal to attempt breeding
     *
     * CALLED BY: _updateAnimals()
     *
     * SIDE EFFECTS:
     * - Calls animal.attemptBreeding()
     * - Adds offspring to GameState if successful
     * - Dispatches ANIMAL_BRED event if successful
     * - Updates statistics
     */
    _attemptAnimalBreeding(animal) {
        // Attempt breeding
        const result = animal.attemptBreeding();

        // If breeding attempt was made
        if (result.attempted) {
            HELPERS.debugLog(`Breeding attempted for ${animal.name}`, {
                animalId: animal.id,
                bred: result.bred,
                survived: result.survived
            });

            // If breeding was successful and offspring survived
            if (result.bred && result.survived && result.offspring) {
                this._onBreedingSuccess(animal, result.offspring);
            }
        }
    }


    /**
     * PRIVATE: _onBreedingSuccess
     * Handles successful breeding event
     *
     * @param {Animal} parent - Parent animal
     * @param {Animal} offspring - Offspring animal
     *
     * CALLED BY: _attemptAnimalBreeding()
     *
     * SIDE EFFECTS:
     * - Adds offspring to GameState
     * - Dispatches ANIMAL_BRED event
     * - Updates statistics
     */
    _onBreedingSuccess(parent, offspring) {
        const gameState = GameState.getInstance();

        // Add offspring to farm (it's already placed by Animal.attemptBreeding)
        gameState.addOffspringToFarm(offspring);

        HELPERS.debugLog(`Breeding success! ${parent.name} had offspring`, {
            parentId: parent.id,
            offspringId: offspring.id
        });

        // Dispatch event for UI notification
        document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.ANIMAL_BRED, {
            detail: {
                parent: parent,
                offspring: offspring,
                message: `🎉 Your ${parent.name} gave birth to offspring!`
            }
        }));
    }


    // ========================================================================
    // DAY ADVANCEMENT
    // ========================================================================

    /**
     * PRIVATE: _startDayTimer
     * Starts the day advancement timer
     *
     * CALLED BY: start()
     *
     * LOGIC:
     * - Day duration is set in GAME_CONFIG.DAY_DURATION_MINUTES
     * - Default: 3 minutes per day
     * - Can be adjusted in config.js for testing
     */
    _startDayTimer() {
        const dayDurationMs = HELPERS.minutesToMilliseconds(
            GAME_CONFIG.DAY_DURATION_MINUTES
        );

        // Apply testing speed multiplier if enabled
        const finalDuration = GAME_CONFIG.BALANCE.TESTING_MODE
            ? dayDurationMs / GAME_CONFIG.BALANCE.TESTING_SPEED_MULTIPLIER
            : dayDurationMs;

        this.dayTimer = setInterval(() => {
            this._advanceDay();
        }, finalDuration);

        HELPERS.debugLog('Day timer started', {
            durationMinutes: GAME_CONFIG.DAY_DURATION_MINUTES,
            durationMs: finalDuration,
            testingMode: GAME_CONFIG.BALANCE.TESTING_MODE
        });
    }


    /**
     * PRIVATE: _advanceDay
     * Advances to the next day
     *
     * CALLED BY: setInterval (day timer)
     *
     * SIDE EFFECTS:
     * - Calls GameState.advanceDay()
     * - Resets currentDayStartTime
     * - May trigger game over if day > 10
     */
    _advanceDay() {
        const gameState = GameState.getInstance();

        HELPERS.debugLog('Advancing day', {
            currentDay: gameState.currentDay,
            nextDay: gameState.currentDay + 1
        });

        // Advance day in game state
        gameState.advanceDay();

        // Reset day start time
        this.currentDayStartTime = Date.now();

        // Check if game ended
        if (gameState.isGameOver()) {
            this.stop();
        }
    }


    /**
     * PUBLIC: getDayProgress
     * Gets progress through current day as percentage
     *
     * @returns {number} Progress percentage (0-100)
     *
     * CALLED BY:
     * - UIManager (display day progress bar)
     *
     * EXAMPLE:
     * getDayProgress() → 45 (45% through current day)
     */
    getDayProgress() {
        if (!this.currentDayStartTime) {
            return 0;
        }

        const dayDurationMs = HELPERS.minutesToMilliseconds(
            GAME_CONFIG.DAY_DURATION_MINUTES
        );

        // Apply testing speed multiplier
        const finalDuration = GAME_CONFIG.BALANCE.TESTING_MODE
            ? dayDurationMs / GAME_CONFIG.BALANCE.TESTING_SPEED_MULTIPLIER
            : dayDurationMs;

        const elapsed = HELPERS.getElapsedTime(this.currentDayStartTime);
        const progress = HELPERS.calculatePercentage(elapsed, finalDuration);

        return Math.min(100, progress);
    }


    /**
     * PUBLIC: getDayTimeRemaining
     * Gets time remaining in current day
     *
     * @returns {number} Milliseconds remaining
     *
     * CALLED BY:
     * - UIManager (display countdown)
     */
    getDayTimeRemaining() {
        if (!this.currentDayStartTime) {
            return 0;
        }

        const dayDurationMs = HELPERS.minutesToMilliseconds(
            GAME_CONFIG.DAY_DURATION_MINUTES
        );

        const finalDuration = GAME_CONFIG.BALANCE.TESTING_MODE
            ? dayDurationMs / GAME_CONFIG.BALANCE.TESTING_SPEED_MULTIPLIER
            : dayDurationMs;

        return HELPERS.getRemainingTime(this.currentDayStartTime, finalDuration);
    }


    // ========================================================================
    // EVENT DISPATCHING
    // ========================================================================

    /**
     * PRIVATE: _dispatchTimerUpdateEvent
     * Dispatches event to notify UI of timer updates
     *
     * CALLED BY: _mainLoop()
     *
     * NOTE: This fires every second, so listeners should be efficient
     */
    _dispatchTimerUpdateEvent() {
        const gameState = GameState.getInstance();

        document.dispatchEvent(new CustomEvent('timer-update', {
            detail: {
                crops: gameState.getGrowingCrops(),
                animals: gameState.getAnimalsOnFarm(),
                dayProgress: this.getDayProgress()
            }
        }));
    }


    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    /**
     * PUBLIC: getCropProgress
     * Gets progress info for a specific crop
     *
     * @param {string} cropId - Crop ID
     * @returns {Object|null} Progress info or null
     *
     * CALLED BY:
     * - UIManager (update individual crop display)
     */
    getCropProgress(cropId) {
        const gameState = GameState.getInstance();
        const crop = gameState.getGrowingCrops().find(c => c.id === cropId);

        if (!crop) {
            return null;
        }

        return {
            id: crop.id,
            name: crop.name,
            progress: crop.getGrowthProgress(),
            remainingTime: crop.getRemainingTime(),
            formattedTime: crop.getFormattedRemainingTime(),
            isMature: crop.isMature()
        };
    }


    /**
     * PUBLIC: getAnimalProgress
     * Gets progress info for a specific animal
     *
     * @param {string} animalId - Animal ID
     * @returns {Object|null} Progress info or null
     *
     * CALLED BY:
     * - UIManager (update individual animal display)
     */
    getAnimalProgress(animalId) {
        const gameState = GameState.getInstance();
        const animal = gameState.getAnimalsOnFarm().find(a => a.id === animalId);

        if (!animal) {
            return null;
        }

        return {
            id: animal.id,
            name: animal.name,
            progress: animal.getGrowthProgress(),
            remainingTime: animal.getRemainingTime(),
            formattedTime: animal.getFormattedRemainingTime(),
            isMature: animal.isMature(),
            canBreed: animal.canBreed(),
            hasOffspring: animal.hasOffspring,
            offspringCount: animal.offspring.length
        };
    }


    /**
     * PUBLIC: getAllProgress
     * Gets progress info for all items
     *
     * @returns {Object} Complete progress data
     *
     * CALLED BY:
     * - UIManager (full UI update)
     */
    getAllProgress() {
        const gameState = GameState.getInstance();

        return {
            crops: gameState.getGrowingCrops().map(c => this.getCropProgress(c.id)),
            animals: gameState.getAnimalsOnFarm().map(a => this.getAnimalProgress(a.id)),
            dayProgress: this.getDayProgress(),
            dayTimeRemaining: this.getDayTimeRemaining()
        };
    }


    /**
     * PUBLIC: getStatus
     * Gets current status of timer system
     *
     * @returns {Object} Status info
     *
     * CALLED BY:
     * - Debug/testing functions
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            hasMainLoop: this.mainLoopTimer !== null,
            hasDayTimer: this.dayTimer !== null,
            dayProgress: this.getDayProgress(),
            dayTimeRemaining: this.getDayTimeRemaining()
        };
    }
}

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 *
 * // Get timer manager instance
 * const timerManager = TimerManager.getInstance();
 *
 * // Start timers when game begins
 * timerManager.start();
 *
 * // Get progress for a specific crop
 * const cropProgress = timerManager.getCropProgress(cropId);
 * console.log(`Progress: ${cropProgress.progress}%`);
 * console.log(`Time remaining: ${cropProgress.formattedTime}`);
 *
 * // Get progress for all items
 * const allProgress = timerManager.getAllProgress();
 * console.log(`Day progress: ${allProgress.dayProgress}%`);
 *
 * // Check day time remaining
 * const remaining = timerManager.getDayTimeRemaining();
 * console.log(`Day ends in: ${HELPERS.formatTime(remaining)}`);
 *
 * // Stop timers when game ends
 * timerManager.stop();
 *
 * // Listen for events
 * document.addEventListener('crop-matured', (e) => {
 *     console.log(`Crop ready: ${e.detail.crop.name}`);
 * });
 *
 * document.addEventListener('animal-bred', (e) => {
 *     console.log(`New offspring: ${e.detail.offspring.name}`);
 * });
 *
 * ============================================================================
 */