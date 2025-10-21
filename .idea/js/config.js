/**
 * ============================================================================
 * FILE: config.js
 * PURPOSE: Central configuration file containing all game constants and data
 *
 * DESCRIPTION:
 * This file stores all game configuration including:
 * - Starting conditions (money, days, goal)
 * - Crop definitions (prices, growth times, sell prices)
 * - Animal definitions (prices, growth times, breeding mechanics)
 * - Weather-demand conversion rules
 * - UI text and messages
 *
 * DEPENDENCIES: None (this is the foundation file)
 * USED BY: All other game modules
 * ============================================================================
 */

/**
 * MAIN GAME CONFIGURATION OBJECT
 * Contains all game settings and data definitions
 */
const GAME_CONFIG = {

    // ========================================================================
    // CORE GAME SETTINGS
    // ========================================================================

    /**
     * STARTING_MONEY: Initial player balance at game start
     * Player begins with $50 to purchase their first seeds
     */
    STARTING_MONEY: 50,

    /**
     * GOAL_MONEY: Target amount player must reach to win
     * Player must earn $5,000 within 10 days to save the farm
     */
    GOAL_MONEY: 5000,

    /**
     * TOTAL_DAYS: Maximum number of in-game days allowed
     * Player has 10 days to reach the goal or lose the farm
     */
    TOTAL_DAYS: 10,

    /**
     * DAY_DURATION_MINUTES: Real-time length of each in-game day
     * Each game day lasts 3 real minutes (adjustable for testing)
     */
    DAY_DURATION_MINUTES: 3,

    /**
     * WEATHER_FORECAST_DAYS: Number of days shown in weather forecast
     * Player can see 7 days ahead to plan their strategy
     */
    WEATHER_FORECAST_DAYS: 7,


    // ========================================================================
    // CROP DEFINITIONS
    // ========================================================================

    /**
     * CROPS: Array of all available crop types
     *
     * Each crop object contains:
     * - id: Unique identifier for the crop type
     * - name: Display name shown to player
     * - seedCost: Fixed price to purchase seeds (never changes)
     * - growthTime: Time in minutes for crop to mature
     * - baseSellPrice: Default selling price (before weather multiplier)
     * - tier: Difficulty/progression tier (1-5, where 5 is premium)
     * - description: Helpful information for player
     *
     * PROGRESSION SYSTEM:
     * - Tier 1 (⭐): Starter crops - low cost, fast growth, low profit
     * - Tier 5 (⭐⭐⭐⭐⭐): Premium crops - high cost, slow growth, high profit
     *
     * PROFIT CALCULATION:
     * Profit = baseSellPrice - seedCost
     * Profit Margin = (Profit / seedCost) × 100%
     */
    CROPS: [
        {
            id: 'wheat',
            name: 'Wheat',
            seedCost: 10,              // Cheapest seed - accessible at game start
            growthTime: 2,             // Fastest growth - only 2 minutes
            baseSellPrice: 18,         // Base price before weather multiplier
            tier: 1,                   // Starter tier
            description: 'Fast-growing starter crop. Perfect for early game.'
        },
        {
            id: 'carrot',
            name: 'Carrot',
            seedCost: 30,              // Affordable after a few wheat harvests
            growthTime: 3,             // 3 minutes to mature
            baseSellPrice: 60,         // 100% profit margin
            tier: 2,                   // Basic tier
            description: 'Reliable crop with good profit margins.'
        },
        {
            id: 'corn',
            name: 'Corn',
            seedCost: 70,              // Mid-tier investment
            growthTime: 4,             // 4 minutes to mature
            baseSellPrice: 150,        // 114% profit margin
            tier: 3,                   // Common tier
            description: 'Popular crop with strong returns.'
        },
        {
            id: 'strawberry',
            name: 'Strawberry',
            seedCost: 150,             // Expensive seed requiring capital
            growthTime: 5,             // 5 minutes to mature
            baseSellPrice: 350,        // 133% profit margin
            tier: 4,                   // Rare tier
            description: 'Premium crop with excellent profit potential.'
        },
        {
            id: 'watermelon',
            name: 'Watermelon',
            seedCost: 300,             // Most expensive seed
            growthTime: 7,             // Longest growth time
            baseSellPrice: 750,        // 150% profit margin - best in game
            tier: 5,                   // Premium tier
            description: 'Ultimate crop. Highest profit but requires time and capital.'
        }
    ],


    // ========================================================================
    // ANIMAL DEFINITIONS
    // ========================================================================

    /**
     * ANIMALS: Array of all available animal types
     *
     * Each animal object contains:
     * - id: Unique identifier for the animal type
     * - name: Display name shown to player
     * - purchaseCost: Fixed price to buy animal (never changes)
     * - growthTime: Time in minutes for animal to mature
     * - baseSellPrice: Default selling price (before weather multiplier)
     * - breedingChance: Probability (0-1) of producing offspring during growth
     * - offspringSurvivalRate: Probability (0-1) that offspring survives
     * - tier: Difficulty/progression tier (1-5)
     * - description: Helpful information for player
     *
     * BREEDING MECHANICS:
     * - During growth, each animal has a chance to breed
     * - If breeding succeeds, offspring is created
     * - Offspring has a survival rate check
     * - Surviving offspring starts its own growth cycle
     * - Purchased animals have 100% survival (no risk)
     * - Bred offspring use the survivalRate percentage
     *
     * STRATEGIC NOTES:
     * - Higher tier animals have LOWER breeding chances (balanced)
     * - Rabbits have highest breeding chance (40%) - best for multiplication
     * - Animals take longer than crops but can multiply for free
     */
    ANIMALS: [
        {
            id: 'chicken',
            name: 'Chicken',
            purchaseCost: 40,          // Cheapest animal - accessible early
            growthTime: 3,             // 3 minutes to mature
            baseSellPrice: 75,         // 88% profit margin
            breedingChance: 0.35,      // 35% chance to breed during growth
            offspringSurvivalRate: 0.75, // 75% survival rate for chicks
            tier: 1,                   // Starter tier
            description: 'Common farm animal. Good breeding rate.'
        },
        {
            id: 'rabbit',
            name: 'Rabbit',
            purchaseCost: 100,         // Affordable after early crops
            growthTime: 4,             // 4 minutes to mature
            baseSellPrice: 200,        // 100% profit margin
            breedingChance: 0.40,      // 40% chance - HIGHEST breeding rate
            offspringSurvivalRate: 0.70, // 70% survival rate
            tier: 2,                   // Basic tier
            description: 'Excellent breeder. Best choice for multiplication strategy.'
        },
        {
            id: 'sheep',
            name: 'Sheep',
            purchaseCost: 220,         // Mid-tier investment
            growthTime: 5,             // 5 minutes to mature
            baseSellPrice: 480,        // 118% profit margin
            breedingChance: 0.30,      // 30% chance to breed
            offspringSurvivalRate: 0.65, // 65% survival rate
            tier: 3,                   // Common tier
            description: 'Steady income source with moderate breeding.'
        },
        {
            id: 'pig',
            name: 'Pig',
            purchaseCost: 450,         // Expensive animal
            growthTime: 6,             // 6 minutes to mature
            baseSellPrice: 1050,       // 133% profit margin
            breedingChance: 0.25,      // 25% chance to breed
            offspringSurvivalRate: 0.60, // 60% survival rate
            tier: 4,                   // Rare tier
            description: 'High-value livestock. Significant profit potential.'
        },
        {
            id: 'cow',
            name: 'Cow',
            purchaseCost: 900,         // Most expensive animal
            growthTime: 8,             // Longest growth time
            baseSellPrice: 2250,       // 150% profit margin - matches watermelon
            breedingChance: 0.20,      // 20% chance - lowest breeding rate
            offspringSurvivalRate: 0.55, // 55% survival rate - lowest
            tier: 5,                   // Premium tier
            description: 'Ultimate livestock. Massive profit but slow growth and rare breeding.'
        }
    ],


    // ========================================================================
    // WEATHER-DEMAND SYSTEM
    // ========================================================================

    /**
     * WEATHER_DEMAND_RULES: Conversion table from weather to demand multiplier
     *
     * HOW IT WORKS:
     * - Weather value ranges from 0.10 (terrible) to 1.00 (perfect)
     * - Better weather = Lower demand = Lower prices (oversupply)
     * - Worse weather = Higher demand = Higher prices (shortage)
     *
     * LOGIC EXPLANATION:
     * When weather is perfect (1.00), farms everywhere produce well,
     * creating oversupply and driving prices down (0.8x multiplier).
     *
     * When weather is terrible (0.10-0.29), most farms fail to produce,
     * creating critical shortage and driving prices up (2.0x multiplier).
     *
     * Each rule contains:
     * - minWeather: Minimum weather value for this tier (inclusive)
     * - maxWeather: Maximum weather value for this tier (inclusive)
     * - demandMultiplier: Price multiplier applied to base prices
     * - marketCondition: Description of market state
     *
     * STRATEGIC IMPORTANCE:
     * This is THE KEY to the game. Players must:
     * 1. Check weather forecast
     * 2. Time their harvests for bad weather days
     * 3. Sell during 2.0x multiplier to maximize profit
     *
     * NOTE: Rules are ordered from best to worst weather
     */
    WEATHER_DEMAND_RULES: [
        {
            minWeather: 1.00,
            maxWeather: 1.00,
            demandMultiplier: 0.8,      // WORST selling time - only 80% of base price
            marketCondition: 'Oversupply'
        },
        {
            minWeather: 0.90,
            maxWeather: 0.99,
            demandMultiplier: 0.9,      // Poor selling time
            marketCondition: 'Good Supply'
        },
        {
            minWeather: 0.80,
            maxWeather: 0.89,
            demandMultiplier: 1.0,      // Normal prices - no multiplier
            marketCondition: 'Balanced'
        },
        {
            minWeather: 0.70,
            maxWeather: 0.79,
            demandMultiplier: 1.2,      // Good selling time - 20% bonus
            marketCondition: 'Slight Shortage'
        },
        {
            minWeather: 0.60,
            maxWeather: 0.69,
            demandMultiplier: 1.3,      // Very good selling time - 30% bonus
            marketCondition: 'Moderate Shortage'
        },
        {
            minWeather: 0.50,
            maxWeather: 0.59,
            demandMultiplier: 1.4,      // Great selling time - 40% bonus
            marketCondition: 'Significant Shortage'
        },
        {
            minWeather: 0.40,
            maxWeather: 0.49,
            demandMultiplier: 1.5,      // Excellent selling time - 50% bonus
            marketCondition: 'High Shortage'
        },
        {
            minWeather: 0.30,
            maxWeather: 0.39,
            demandMultiplier: 1.7,      // Outstanding selling time - 70% bonus
            marketCondition: 'Severe Shortage'
        },
        {
            minWeather: 0.10,
            maxWeather: 0.29,
            demandMultiplier: 2.0,      // BEST selling time - DOUBLE base price
            marketCondition: 'Critical Shortage'
        }
    ],


    // ========================================================================
    // MILESTONE DEFINITIONS
    // ========================================================================

    /**
     * MILESTONES: Progress checkpoints to encourage players
     *
     * Each milestone contains:
     * - amount: Money threshold to reach
     * - title: Short title for the achievement
     * - message: Congratulatory message shown to player
     * - achieved: Boolean flag (set at runtime, default false)
     *
     * PURPOSE:
     * - Provide positive feedback during gameplay
     * - Show progress toward final goal
     * - Keep player motivated during difficult stretches
     */
    MILESTONES: [
        {
            amount: 100,
            title: 'First Harvest',
            message: 'Great start! You\'ve made your first $100!',
            achieved: false
        },
        {
            amount: 1250,
            title: 'Quarter Goal',
            message: 'You\'re 25% there! The farm is coming back to life!',
            achieved: false
        },
        {
            amount: 2500,
            title: 'Halfway Point',
            message: 'Halfway there! Don\'t give up now!',
            achieved: false
        },
        {
            amount: 3750,
            title: 'Three Quarters',
            message: 'Almost there! The farm is within reach!',
            achieved: false
        },
        {
            amount: 5000,
            title: 'Victory',
            message: 'SUCCESS! You saved the farm!',
            achieved: false
        }
    ],


    // ========================================================================
    // GAME TEXT AND MESSAGES
    // ========================================================================

    /**
     * MESSAGES: All game text and dialogue
     * Centralized for easy editing and potential localization
     */
    MESSAGES: {

        // Story and introduction text
        STORY_INTRO: 'Stephen has inherited his grandfather\'s farm, but it\'s $5,000 in debt! ' +
            'The bank has given him 10 days to pay it back or lose the farm forever. ' +
            'Can you help Stephen save his family\'s legacy?',

        // Victory messages
        VICTORY_TITLE: '🎉 CONGRATULATIONS! 🎉',
        VICTORY_MESSAGE: 'You saved the farm! Stephen\'s grandfather would be proud. ' +
            'The farm is saved and will prosper for generations.',

        // Defeat messages
        DEFEAT_TITLE: '💔 GAME OVER 💔',
        DEFEAT_MESSAGE: 'The farm has been foreclosed... Don\'t give up! ' +
            'Try again with better strategy. Remember to check the weather forecast ' +
            'and time your sales wisely!',

        // Tutorial/help messages
        TUTORIAL_PLANTING: 'Buy seeds from Tom\'s shop and plant them on your farm. ' +
            'Each crop takes a different amount of time to grow.',

        TUTORIAL_WEATHER: 'Check the 7-day weather forecast! Worse weather means higher prices. ' +
            'Wait for bad weather (0.10-0.29) to sell for DOUBLE the price!',

        TUTORIAL_ANIMALS: 'Animals can breed during growth, giving you free livestock! ' +
            'Rabbits have the highest breeding chance at 40%.',

        TUTORIAL_TIMING: 'Watch the calendar! Don\'t plant a 7-minute watermelon on Day 10. ' +
            'Make sure your crops mature before time runs out!',

        // Error messages
        ERROR_NOT_ENOUGH_MONEY: 'Not enough money! You need $X to purchase this item.',
        ERROR_NO_SPACE: 'No space available on the farm. Harvest some items first.',
        ERROR_NOT_MATURE: 'This item is not ready to harvest yet. Please wait.',

        // Confirmation messages
        CONFIRM_PURCHASE: 'Purchase X for $Y?',
        CONFIRM_SELL: 'Sell X for $Y? (Weather multiplier: Zx)',

        // Shop dialogue
        TOM_GREETING: 'Welcome to Tom\'s Seed Store! Fresh seeds at fixed prices. ' +
            'I\'ll buy back your harvests at today\'s market rate.',

        HENRY_GREETING: 'Welcome to Henry\'s Animal Farm! Quality livestock for sale. ' +
            'I\'ll pay top dollar for your mature animals based on current demand.'
    },


    // ========================================================================
    // UI CONFIGURATION
    // ========================================================================

    /**
     * UI_SETTINGS: Display and interface configuration
     */
    UI_SETTINGS: {

        // Color scheme for different elements
        COLORS: {
            PRIMARY: '#2ecc71',        // Green - positive actions, money
            SECONDARY: '#3498db',      // Blue - neutral info
            DANGER: '#e74c3c',         // Red - warnings, negative
            WARNING: '#f39c12',        // Orange - caution
            SUCCESS: '#27ae60',        // Dark green - achievements
            BACKGROUND: '#ecf0f1',     // Light gray - backgrounds
            TEXT: '#2c3e50'            // Dark gray - main text
        },

        // Screen names (for navigation)
        SCREENS: {
            HOME: 'home',
            FARM: 'farm',
            TOM_SHOP: 'tom-shop',
            HENRY_SHOP: 'henry-shop',
            VICTORY: 'victory',
            DEFEAT: 'defeat'
        },

        // Animation durations (in milliseconds)
        ANIMATION_DURATION: {
            FAST: 200,
            NORMAL: 400,
            SLOW: 600
        },

        // Notification display time (in milliseconds)
        NOTIFICATION_DURATION: 3000,

        // Timer update interval (in milliseconds)
        TIMER_UPDATE_INTERVAL: 1000    // Update every 1 second
    },


    // ========================================================================
    // GAME BALANCE SETTINGS
    // ========================================================================

    /**
     * BALANCE: Fine-tuning settings for game difficulty
     * Can be adjusted for testing or difficulty modes
     */
    BALANCE: {

        // Weather generation settings
        WEATHER_MIN: 0.10,             // Minimum weather value
        WEATHER_MAX: 1.00,             // Maximum weather value
        WEATHER_DECIMALS: 2,           // Number of decimal places for weather

        // Maximum items player can have growing simultaneously
        MAX_CROP_SLOTS: 10,            // Maximum crop plots on farm
        MAX_ANIMAL_SLOTS: 5,           // Maximum animal pens on farm

        // Breeding mechanics
        PURCHASED_ANIMAL_SURVIVAL: 1.0, // Purchased animals always survive (100%)

        // Testing mode (set to true to speed up gameplay for testing)
        TESTING_MODE: false,           // If true, speeds up timers
        TESTING_SPEED_MULTIPLIER: 10   // If testing mode, timers are 10x faster
    }
};

/**
 * ============================================================================
 * EXPORT CONFIGURATION
 * ============================================================================
 *
 * Make GAME_CONFIG available to other modules
 *
 * USAGE IN OTHER FILES:
 * Import this file and access configuration like:
 * GAME_CONFIG.STARTING_MONEY
 * GAME_CONFIG.CROPS[0].name
 * GAME_CONFIG.WEATHER_DEMAND_RULES.find(...)
 *
 * This centralized approach ensures:
 * - Easy balancing (change values in one place)
 * - No magic numbers scattered throughout code
 * - Consistent data across all modules
 * - Simple to test different configurations
 */

// Export for use in other modules
// Note: If using ES6 modules, use: export default GAME_CONFIG;
// For now, we're using it as a global variable accessible to all scripts