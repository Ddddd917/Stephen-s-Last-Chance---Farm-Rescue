/**
 * ============================================================================
 * FILE: main.js
 * PURPOSE: Main application entry point and game initialization
 *
 * DESCRIPTION:
 * This is the heart of the game that:
 * - Initializes all manager instances (GameState, Farm, Shop, Timer, UI)
 * - Sets up the game flow and connections between systems
 * - Starts the game loop
 * - Handles game restart
 * - Provides global error handling
 *
 * EXECUTION ORDER:
 * 1. Wait for DOM to be ready
 * 2. Initialize GameState (create new game)
 * 3. Initialize all Managers
 * 4. Connect Managers through UIManager
 * 5. Start Timer system
 * 6. Display initial screen
 *
 * DEPENDENCIES:
 * - All Manager classes
 * - All Model classes
 * - config.js, constants.js, helpers.js
 *
 * CALLED BY: Browser when page loads
 * ============================================================================
 */

/**
 * GAME APPLICATION CLASS
 * Main application controller
 */
console.log('main.js loaded — typeof GameState =', typeof GameState);

class FarmRescueGame {

    /**
     * CONSTRUCTOR
     * Initializes the game application
     */
    constructor() {
        // Manager references
        this.gameState = null;
        this.farmManager = null;
        this.shopManager = null;
        this.timerManager = null;
        this.uiManager = null;

        // Game status flags
        this.isInitialized = false;
        this.isRunning = false;

        HELPERS.debugLog('FarmRescueGame instance created');
    }


    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /**
     * PUBLIC: initialize
     * Initializes all game systems
     *
     * CALLED BY: DOMContentLoaded event
     */
    async initialize() {
        try {
            HELPERS.debugLog('=== GAME INITIALIZATION STARTED ===');

            // Step 1: Display loading message
            this._showLoadingMessage('Initializing game...');

            // Step 2: Initialize Game State
            HELPERS.debugLog('Step 1/5: Initializing GameState...');
            this.gameState = GameState.getInstance();

            // Step 3: Initialize Managers
            HELPERS.debugLog('Step 2/5: Initializing Managers...');
            this._initializeManagers();

            // Step 4: Connect systems through UIManager
            HELPERS.debugLog('Step 3/5: Connecting systems...');
            this._connectSystems();

            // Step 5: Start game loop
            HELPERS.debugLog('Step 4/5: Starting game loop...');
            this._startGameLoop();

            // Step 6: Display initial screen
            HELPERS.debugLog('Step 5/5: Rendering initial UI...');
            this._displayInitialScreen();

            // Mark as initialized
            this.isInitialized = true;
            this.isRunning = true;

            HELPERS.debugLog('=== GAME INITIALIZATION COMPLETE ===');
            console.log('%c🚜 Farm Rescue - Game Ready!', 'color: green; font-size: 16px; font-weight: bold;');

        } catch (error) {
            console.error('FATAL ERROR during initialization:', error);
            this._showErrorMessage('Failed to initialize game. Please refresh the page.');
        }
    }


    /**
     * PRIVATE: _initializeManagers
     * Creates instances of all manager classes
     */
    _initializeManagers() {
        // Farm Manager
        this.farmManager = FarmManager.getInstance();
        HELPERS.debugLog('✓ FarmManager initialized');

        // Shop Manager
        this.shopManager = ShopManager.getInstance();
        HELPERS.debugLog('✓ ShopManager initialized');

        // Timer Manager
        this.timerManager = TimerManager.getInstance();
        HELPERS.debugLog('✓ TimerManager initialized');

        // UI Manager
        this.uiManager = UIManager.getInstance();
        HELPERS.debugLog('✓ UIManager initialized');
    }


    /**
     * PRIVATE: _connectSystems
     * Connects all managers through UIManager
     */
    _connectSystems() {
        // Pass all managers to UIManager
        this.uiManager.initialize({
            gameState: this.gameState,
            farmManager: this.farmManager,
            shopManager: this.shopManager,
            timerManager: this.timerManager
        });

        HELPERS.debugLog('✓ Systems connected through UIManager');
    }


    /**
     * PRIVATE: _startGameLoop
     * Starts the main game timer loop
     */
    _startGameLoop() {
        // Start timer system
        this.timerManager.start();

        HELPERS.debugLog('✓ Game loop started');
    }


    /**
     * PRIVATE: _displayInitialScreen
     * Shows the home screen to start playing
     */
    _displayInitialScreen() {
        // Show home screen
        this.uiManager.showScreen(CONSTANTS.SCREENS.HOME);

        // Update header
        this.uiManager.updateHeader();

        // Show welcome notification
        this.uiManager.showNotification(
            'info',
            '🌾 Welcome to Farm Rescue! Save your grandfather\'s farm!',
            5000
        );

        HELPERS.debugLog('✓ Initial screen displayed');
    }


    // ========================================================================
    // GAME CONTROL
    // ========================================================================

    /**
     * PUBLIC: restart
     * Restarts the game with a fresh state
     *
     * CALLED BY:
     * - End screen buttons
     * - Debug commands
     */
    restart() {
        HELPERS.debugLog('=== GAME RESTART INITIATED ===');

        try {
            // Stop current game
            this.stop();

            // Reset all managers
            GameState.resetInstance();
            FarmManager.resetInstance();
            ShopManager.resetInstance();
            TimerManager.resetInstance();
            UIManager.resetInstance();

            HELPERS.debugLog('✓ All managers reset');

            // Reinitialize
            this.initialize();

            HELPERS.debugLog('=== GAME RESTART COMPLETE ===');

        } catch (error) {
            console.error('Error restarting game:', error);
            this._showErrorMessage('Failed to restart game. Please refresh the page.');
        }
    }


    /**
     * PUBLIC: stop
     * Stops the current game
     *
     * CALLED BY:
     * - restart()
     * - Game over conditions
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        HELPERS.debugLog('Stopping game...');

        // Stop timer system
        if (this.timerManager) {
            this.timerManager.stop();
        }

        this.isRunning = false;

        HELPERS.debugLog('✓ Game stopped');
    }


    /**
     * PUBLIC: pause
     * Pauses the game (optional feature)
     *
     * CALLED BY:
     * - Pause button (if implemented)
     */
    pause() {
        if (!this.isRunning) {
            return;
        }

        HELPERS.debugLog('Pausing game...');

        // Pause timer system
        if (this.timerManager) {
            this.timerManager.pause();
        }

        this.isRunning = false;

        this.uiManager.showNotification('info', 'Game Paused');

        HELPERS.debugLog('✓ Game paused');
    }


    /**
     * PUBLIC: resume
     * Resumes a paused game (optional feature)
     *
     * CALLED BY:
     * - Resume button (if implemented)
     */
    resume() {
        if (this.isRunning) {
            return;
        }

        HELPERS.debugLog('Resuming game...');

        // Resume timer system
        if (this.timerManager) {
            this.timerManager.resume();
        }

        this.isRunning = true;

        this.uiManager.showNotification('info', 'Game Resumed');

        HELPERS.debugLog('✓ Game resumed');
    }


    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    /**
     * PRIVATE: _showLoadingMessage
     * Displays a loading message
     *
     * @param {string} message - Loading message
     */
    _showLoadingMessage(message) {
        console.log(`⏳ ${message}`);
        // Could also display in UI if desired
    }


    /**
     * PRIVATE: _showErrorMessage
     * Displays an error message
     *
     * @param {string} message - Error message
     */
    _showErrorMessage(message) {
        console.error(`❌ ${message}`);

        // Display error in UI
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #e74c3c;
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 8px 16px rgba(0,0,0,0.3);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }


    /**
     * PUBLIC: getGameInfo
     * Returns current game information for debugging
     *
     * @returns {Object} Game information
     */
    getGameInfo() {
        if (!this.gameState) {
            return { error: 'Game not initialized' };
        }

        return {
            initialized: this.isInitialized,
            running: this.isRunning,
            currentMoney: this.gameState.currentMoney,
            currentDay: this.gameState.currentDay,
            goalMoney: this.gameState.goalMoney,
            gameStatus: this.gameState.gameStatus,
            daysRemaining: this.gameState.getDaysRemaining(),
            progress: this.gameState.getProgress()
        };
    }


    /**
     * PUBLIC: debugInfo
     * Logs debug information to console
     */
    debugInfo() {
        const info = this.getGameInfo();

        console.log('%c=== GAME DEBUG INFO ===', 'color: cyan; font-weight: bold;');
        console.log('Game State:', info);

        if (this.gameState) {
            console.log('Farm Status:', this.farmManager.getFarmStatus());
            console.log('Shop Status:', this.shopManager.getShopStatus());
            console.log('Timer Status:', this.timerManager.getStatus());
        }

        console.log('%c=====================', 'color: cyan; font-weight: bold;');
    }
}


// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

/**
 * Global game instance
 * Accessible from browser console for debugging
 */
let game = null;


// ============================================================================
// APPLICATION ENTRY POINT
// ============================================================================

/**
 * Initialize game when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('%c╔═══════════════════════════════════════╗', 'color: green;');
    console.log('%c║     🚜 FARM RESCUE - Game Starting   ║', 'color: green; font-weight: bold;');
    console.log('%c╚═══════════════════════════════════════╝', 'color: green;');
    console.log('');
    console.log('📖 Story: Save your grandfather\'s farm!');
    console.log('💰 Goal: Earn $5,000 in 10 days');
    console.log('🌾 Strategy: Grow crops and raise animals');
    console.log('🌧️ Key: Sell during bad weather for 2x prices!');
    console.log('');
    console.log('%cStarting game...', 'color: blue;');
    console.log('');

    // Create and initialize game
    game = new FarmRescueGame();
    game.initialize();

    // Make game accessible in console for debugging
    window.game = game;

    console.log('');
    console.log('%c✓ Game is ready!', 'color: green; font-weight: bold;');
    console.log('%cType "game.debugInfo()" in console for debug information', 'color: gray; font-style: italic;');
    console.log('');
});


// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================

/**
 * Catch and log any unhandled errors
 */
window.addEventListener('error', (event) => {
    console.error('UNHANDLED ERROR:', event.error);

    // Show user-friendly error message
    if (game && game.uiManager) {
        game.uiManager.showNotification(
            'danger',
            'An error occurred. The game may not work correctly.',
            5000
        );
    }
});


/**
 * Catch and log unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('UNHANDLED PROMISE REJECTION:', event.reason);

    // Show user-friendly error message
    if (game && game.uiManager) {
        game.uiManager.showNotification(
            'danger',
            'An error occurred. Please refresh the page if problems persist.',
            5000
        );
    }
});


// ============================================================================
// DEVELOPER CONSOLE COMMANDS
// ============================================================================

/**
 * Provide helpful console commands for debugging
 */
window.devCommands = {

    /**
     * Show game information
     */
    info: () => {
        if (game) {
            game.debugInfo();
        } else {
            console.log('Game not initialized');
        }
    },

    /**
     * Restart the game
     */
    restart: () => {
        if (game) {
            game.restart();
            console.log('✓ Game restarted');
        } else {
            console.log('Game not initialized');
        }
    },

    /**
     * Add money (for testing)
     */
    addMoney: (amount) => {
        if (game && game.gameState) {
            game.gameState.addMoney(amount, 'Debug command');
            console.log(`✓ Added ${HELPERS.formatMoney(amount)}`);
        } else {
            console.log('Game not initialized');
        }
    },

    /**
     * Advance to next day (for testing)
     */
    nextDay: () => {
        if (game && game.gameState) {
            game.gameState.advanceDay();
            console.log(`✓ Advanced to Day ${game.gameState.currentDay}`);
        } else {
            console.log('Game not initialized');
        }
    },

    /**
     * Win the game instantly (for testing)
     */
    win: () => {
        if (game && game.gameState) {
            const needed = game.gameState.goalMoney - game.gameState.currentMoney;
            game.gameState.addMoney(needed + 100, 'Debug win');
            console.log('✓ Victory triggered!');
        } else {
            console.log('Game not initialized');
        }
    },

    /**
     * Show all available commands
     */
    help: () => {
        console.log('%c=== DEVELOPER COMMANDS ===', 'color: cyan; font-weight: bold;');
        console.log('');
        console.log('devCommands.info()           - Show game information');
        console.log('devCommands.restart()        - Restart the game');
        console.log('devCommands.addMoney(amount) - Add money for testing');
        console.log('devCommands.nextDay()        - Advance to next day');
        console.log('devCommands.win()            - Win the game instantly');
        console.log('devCommands.help()           - Show this help');
        console.log('');
        console.log('game.debugInfo()             - Detailed debug information');
        console.log('game.getGameInfo()           - Get current game state');
        console.log('');
        console.log('%c=========================', 'color: cyan; font-weight: bold;');
    }
};


// ============================================================================
// WELCOME MESSAGE
// ============================================================================

console.log('');
console.log('%c💡 Developer Tips:', 'color: orange; font-weight: bold;');
console.log('• Type "devCommands.help()" for debugging commands');
console.log('• Type "game.debugInfo()" for game state information');
console.log('• Press F12 to open Developer Tools');
console.log('');


// ============================================================================
// EXPORT FOR TESTING (IF NEEDED)
// ============================================================================

// If using ES6 modules in the future, uncomment:
// export default FarmRescueGame;


/**
 * ============================================================================
 * END OF main.js
 * ============================================================================
 *
 * GAME INITIALIZATION FLOW:
 *
 * 1. DOM Ready → DOMContentLoaded event fires
 * 2. Create FarmRescueGame instance
 * 3. Initialize GameState (new game with $50, Day 1)
 * 4. Initialize all Managers (Farm, Shop, Timer, UI)
 * 5. Connect systems through UIManager
 * 6. Start TimerManager game loop (updates every second)
 * 7. Display home screen
 * 8. Game is now running!
 *
 * PLAYER ACTIONS:
 * - Click buttons → UIManager handlers → Manager methods → GameState updates
 * - GameState changes → Events dispatched → UIManager updates display
 * - Timer ticks → Crops/animals grow → Breeding occurs → UI updates
 * - Days advance → Weather changes → Prices update → UI reflects changes
 * - Reach $5,000 → Victory! → Show victory screen
 * - Day 10 ends without goal → Defeat! → Show defeat screen
 *
 * ARCHITECTURE:
 * - GameState: Central source of truth
 * - Managers: Handle specific domains (farm, shop, timer, UI)
 * - Models: Data structures (Crop, Animal, Weather)
 * - UIManager: Connects user actions to game logic
 * - main.js: Orchestrates initialization and connects everything
 *
 * ============================================================================
 */