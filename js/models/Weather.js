/**
 * ============================================================================
 * FILE: Weather.js
 * PURPOSE: Weather system model and forecast generation
 *
 * DESCRIPTION:
 * This class handles all weather-related functionality:
 * - Generate random weather values (0.10 - 1.00)
 * - Convert weather values to demand multipliers
 * - Create multi-day weather forecasts
 * - Provide weather classification (Perfect/Good/Poor/Terrible)
 *
 * WEATHER SYSTEM LOGIC:
 * - Weather value ranges from 0.10 (terrible storm) to 1.00 (perfect sunny)
 * - Better weather = Lower demand = Lower prices (farmers produce more)
 * - Worse weather = Higher demand = Higher prices (farmers produce less)
 *
 * DEPENDENCIES:
 * - config.js (for weather-demand conversion rules)
 * - helpers.js (for random number generation)
 *
 * USED BY:
 * - GameState.js (generate initial forecast)
 * - TimerManager.js (update forecast when day advances)
 * - UIManager.js (display weather forecast)
 * - ShopManager.js (calculate current selling prices)
 * ============================================================================
 */

/**
 * CLASS: Weather
 * Represents a single day's weather conditions
 *
 * INSTANCE DATA:
 * - day: Which day this weather is for (1-10)
 * - weatherValue: Numeric value representing weather quality (0.10-1.00)
 * - demandIndex: Price multiplier calculated from weather (0.8-2.0)
 * - marketCondition: Text description of market state
 *
 * USAGE:
 * const weather = new Weather(1); // Create weather for Day 1
 * console.log(weather.weatherValue); // e.g., 0.45
 * console.log(weather.demandIndex); // e.g., 1.5
 */
class Weather {

    /**
     * CONSTRUCTOR
     * Creates a new Weather instance for a specific day
     *
     * @param {number} day - The day number (1-10)
     * @param {number} weatherValue - Optional: specify weather value (for testing)
     *
     * CALLED BY:
     * - Weather.generateForecast() (creates multiple Weather objects)
     * - GameState.js (when advancing days)
     *
     * EXAMPLE:
     * const todayWeather = new Weather(1);
     * const testWeather = new Weather(5, 0.25); // Force specific weather for testing
     */
    constructor(day, weatherValue = null) {
        // Validate day number
        if (typeof day !== 'number' || day < 1 || day > GAME_CONFIG.TOTAL_DAYS) {
            console.error('Weather: Invalid day number', day);
            this.day = 1;
        } else {
            this.day = day;
        }

        // Generate or use provided weather value
        if (weatherValue !== null) {
            // Use provided value (useful for testing)
            this.weatherValue = HELPERS.clamp(
                weatherValue,
                CONSTANTS.WEATHER_RANGES.MIN,
                CONSTANTS.WEATHER_RANGES.MAX
            );
        } else {
            // Generate random weather value
            this.weatherValue = this._generateWeatherValue();
        }

        // Calculate demand index from weather value
        this.demandIndex = Weather.calculateDemandIndex(this.weatherValue);

        // Get market condition description
        this.marketCondition = this._getMarketCondition();

        // Store timestamp of creation
        this.createdAt = Date.now();
    }


    // ========================================================================
    // PRIVATE METHODS (INSTANCE)
    // ========================================================================

    /**
     * PRIVATE: _generateWeatherValue
     * Generates a random weather value with 2 decimal places
     *
     * @returns {number} Random weather value (0.10 - 1.00)
     *
     * LOGIC:
     * Uses HELPERS.randomFloat to generate value in valid range
     * Rounds to 2 decimal places (e.g., 0.65, not 0.654321)
     *
     * CALLED BY: constructor (when weatherValue not provided)
     */
    _generateWeatherValue() {
        return HELPERS.randomFloat(
            CONSTANTS.WEATHER_RANGES.MIN,      // 0.10
            CONSTANTS.WEATHER_RANGES.MAX,      // 1.00
            CONSTANTS.WEATHER_RANGES.DECIMALS  // 2 decimal places
        );
    }


    /**
     * PRIVATE: _getMarketCondition
     * Gets the market condition description based on weather value
     *
     * @returns {string} Market condition text (e.g., "Critical Shortage")
     *
     * LOGIC:
     * Looks through GAME_CONFIG.WEATHER_DEMAND_RULES
     * Finds which range the current weatherValue falls into
     * Returns the corresponding marketCondition text
     *
     * CALLED BY: constructor
     */
    _getMarketCondition() {
        // Loop through all weather-demand rules
        for (const rule of GAME_CONFIG.WEATHER_DEMAND_RULES) {
            // Check if weather value falls within this rule's range
            if (this.weatherValue >= rule.minWeather &&
                this.weatherValue <= rule.maxWeather) {
                return rule.marketCondition;
            }
        }

        // Fallback (should never reach here if config is correct)
        return 'Unknown';
    }


    // ========================================================================
    // PUBLIC METHODS (INSTANCE)
    // ========================================================================

    /**
     * PUBLIC: getWeatherDescription
     * Returns a human-readable description of the weather
     *
     * @returns {string} Weather description
     *
     * CLASSIFICATION:
     * 1.00: "Perfect"
     * 0.80-0.99: "Good"
     * 0.60-0.79: "Fair"
     * 0.40-0.59: "Poor"
     * 0.20-0.39: "Bad"
     * 0.10-0.19: "Terrible"
     *
     * USED BY:
     * - UIManager.js (display weather forecast with descriptions)
     *
     * EXAMPLE:
     * weather.getWeatherDescription() → "Poor Weather"
     */
    getWeatherDescription() {
        const value = this.weatherValue;

        if (value === 1.00) return 'Perfect Weather';
        if (value >= 0.80) return 'Good Weather';
        if (value >= 0.60) return 'Fair Weather';
        if (value >= 0.40) return 'Poor Weather';
        if (value >= 0.20) return 'Bad Weather';
        return 'Terrible Weather';
    }


    /**
     * PUBLIC: getWeatherIcon
     * Returns an emoji or icon representing the weather
     *
     * @returns {string} Weather icon/emoji
     *
     * USED BY:
     * - UIManager.js (visual weather display)
     *
     * EXAMPLE:
     * weather.getWeatherIcon() → "⛈️" (storm icon)
     */
    getWeatherIcon() {
        const value = this.weatherValue;

        if (value === 1.00) return '☀️';      // Perfect - sunny
        if (value >= 0.80) return '🌤️';      // Good - partly sunny
        if (value >= 0.60) return '⛅';      // Fair - partly cloudy
        if (value >= 0.40) return '☁️';      // Poor - cloudy
        if (value >= 0.20) return '🌧️';     // Bad - rainy
        return '⛈️';                         // Terrible - stormy
    }


    /**
     * PUBLIC: getSellRecommendation
     * Provides advice on whether it's a good time to sell
     *
     * @returns {string} Recommendation text
     *
     * LOGIC:
     * Based on demand index:
     * - 2.0x: "BEST time to sell!"
     * - 1.5-1.7x: "Excellent time to sell"
     * - 1.2-1.4x: "Good time to sell"
     * - 1.0x: "Normal prices"
     * - 0.8-0.9x: "Poor time to sell"
     *
     * USED BY:
     * - UIManager.js (show strategic advice)
     *
     * EXAMPLE:
     * weather.getSellRecommendation() → "BEST time to sell!"
     */
    getSellRecommendation() {
        const index = this.demandIndex;

        if (index >= 2.0) return '🔥 BEST time to sell! (2.0x prices)';
        if (index >= 1.7) return '✅ Excellent time to sell!';
        if (index >= 1.5) return '✅ Great time to sell!';
        if (index >= 1.2) return '👍 Good time to sell';
        if (index === 1.0) return '➡️ Normal prices';
        if (index >= 0.9) return '⚠️ Below average prices';
        return '❌ Poor time to sell (wait for worse weather)';
    }


    /**
     * PUBLIC: toJSON
     * Converts Weather object to plain JSON for storage/transmission
     *
     * @returns {Object} JSON representation of weather
     *
     * USED BY:
     * - GameState.js (when saving game)
     * - Optional: Save system
     *
     * EXAMPLE:
     * weather.toJSON() → {day: 1, weatherValue: 0.65, demandIndex: 1.3, ...}
     */
    toJSON() {
        return {
            day: this.day,
            weatherValue: this.weatherValue,
            demandIndex: this.demandIndex,
            marketCondition: this.marketCondition,
            createdAt: this.createdAt
        };
    }


    // ========================================================================
    // STATIC METHODS (CLASS-LEVEL)
    // ========================================================================

    /**
     * STATIC: calculateDemandIndex
     * Converts a weather value to a demand multiplier
     *
     * @param {number} weatherValue - Weather value (0.10-1.00)
     * @returns {number} Demand multiplier (0.8-2.0)
     *
     * ALGORITHM:
     * 1. Loop through GAME_CONFIG.WEATHER_DEMAND_RULES
     * 2. Find the rule where weatherValue falls in range
     * 3. Return that rule's demandMultiplier
     *
     * EXAMPLES:
     * calculateDemandIndex(1.00) → 0.8 (oversupply)
     * calculateDemandIndex(0.85) → 1.0 (balanced)
     * calculateDemandIndex(0.25) → 2.0 (critical shortage)
     *
     * USED BY:
     * - constructor (calculate demandIndex for instance)
     * - ShopManager.js (recalculate if needed)
     *
     * CALLED BY:
     * - Weather constructor
     * - ShopManager.calculateSellPrice()
     */
    static calculateDemandIndex(weatherValue) {
        // Validate input
        if (!HELPERS.isValidNumber(weatherValue)) {
            console.error('Weather.calculateDemandIndex: Invalid weather value', weatherValue);
            return 1.0; // Return neutral multiplier as fallback
        }

        // Clamp to valid range
        weatherValue = HELPERS.clamp(
            weatherValue,
            CONSTANTS.WEATHER_RANGES.MIN,
            CONSTANTS.WEATHER_RANGES.MAX
        );

        // Find matching rule
        for (const rule of GAME_CONFIG.WEATHER_DEMAND_RULES) {
            if (weatherValue >= rule.minWeather &&
                weatherValue <= rule.maxWeather) {
                return rule.demandMultiplier;
            }
        }

        // Fallback (should never happen if config is correct)
        console.warn('Weather.calculateDemandIndex: No matching rule found', weatherValue);
        return 1.0; // Return neutral multiplier
    }


    /**
     * STATIC: generateForecast
     * Generates a multi-day weather forecast
     *
     * @param {number} numDays - Number of days to forecast (default: 7)
     * @param {number} startDay - Starting day number (default: 1)
     * @returns {Weather[]} Array of Weather objects
     *
     * USAGE:
     * Used at game start and when day advances to show upcoming weather
     *
     * EXAMPLES:
     * Weather.generateForecast(7, 1) → [Weather(day=1), Weather(day=2), ..., Weather(day=7)]
     * Weather.generateForecast(7, 5) → [Weather(day=5), Weather(day=6), ..., Weather(day=11)]
     *
     * NOTE:
     * Can generate forecasts beyond day 10 (for UI smoothness)
     * but game only uses days 1-10
     *
     * CALLED BY:
     * - GameState.js (initialize forecast at game start)
     * - TimerManager.js (update forecast when day advances)
     */
    static generateForecast(numDays = 7, startDay = 1) {
        // Validate inputs
        if (!HELPERS.isValidNumber(numDays) || numDays < 1) {
            console.error('Weather.generateForecast: Invalid numDays', numDays);
            numDays = 7;
        }

        if (!HELPERS.isValidNumber(startDay) || startDay < 1) {
            console.error('Weather.generateForecast: Invalid startDay', startDay);
            startDay = 1;
        }

        // Create array to store forecast
        const forecast = [];

        // Generate weather for each day
        for (let i = 0; i < numDays; i++) {
            const day = startDay + i;
            const weather = new Weather(day);
            forecast.push(weather);
        }

        // Log forecast for debugging
        HELPERS.debugLog('Generated weather forecast:', forecast.map(w => ({
            day: w.day,
            weather: w.weatherValue,
            demand: w.demandIndex
        })));

        return forecast;
    }


    /**
     * STATIC: fromJSON
     * Recreates a Weather object from JSON data
     *
     * @param {Object} json - JSON representation of weather
     * @returns {Weather} Weather object
     *
     * USAGE:
     * Used when loading saved game data
     *
     * CALLED BY:
     * - GameState.js (when loading game from localStorage)
     *
     * EXAMPLE:
     * const json = {day: 1, weatherValue: 0.65, ...};
     * const weather = Weather.fromJSON(json);
     */
    static fromJSON(json) {
        // Validate JSON structure
        if (!json || typeof json !== 'object') {
            console.error('Weather.fromJSON: Invalid JSON', json);
            return new Weather(1); // Return default weather
        }

        // Create Weather instance with saved weather value
        const weather = new Weather(json.day || 1, json.weatherValue);

        // Restore timestamp if available
        if (json.createdAt) {
            weather.createdAt = json.createdAt;
        }

        return weather;
    }


    /**
     * STATIC: getWorstWeatherForSelling
     * Finds the worst weather (best selling time) in a forecast
     *
     * @param {Weather[]} forecast - Array of Weather objects
     * @returns {Weather|null} Weather object with lowest weather value (highest demand)
     *
     * USAGE:
     * Strategic helper - shows player when the best selling opportunity is
     *
     * CALLED BY:
     * - UIManager.js (highlight best selling day)
     * - Optional: AI helper system
     *
     * EXAMPLE:
     * const worst = Weather.getWorstWeatherForSelling(forecast);
     * console.log(`Best selling day: Day ${worst.day} with ${worst.demandIndex}x prices`);
     */
    static getWorstWeatherForSelling(forecast) {
        if (!Array.isArray(forecast) || forecast.length === 0) {
            return null;
        }

        // Find weather with minimum weatherValue (= maximum demand)
        let worstWeather = forecast[0];

        for (const weather of forecast) {
            if (weather.weatherValue < worstWeather.weatherValue) {
                worstWeather = weather;
            }
        }

        return worstWeather;
    }


    /**
     * STATIC: getBestWeatherForSelling
     * Finds the best weather (worst selling time) in a forecast
     *
     * @param {Weather[]} forecast - Array of Weather objects
     * @returns {Weather|null} Weather object with highest weather value (lowest demand)
     *
     * USAGE:
     * Strategic helper - shows player when to avoid selling
     *
     * CALLED BY:
     * - UIManager.js (warn about poor selling days)
     *
     * EXAMPLE:
     * const best = Weather.getBestWeatherForSelling(forecast);
     * console.log(`Worst selling day: Day ${best.day} with only ${best.demandIndex}x prices`);
     */
    static getBestWeatherForSelling(forecast) {
        if (!Array.isArray(forecast) || forecast.length === 0) {
            return null;
        }

        // Find weather with maximum weatherValue (= minimum demand)
        let bestWeather = forecast[0];

        for (const weather of forecast) {
            if (weather.weatherValue > bestWeather.weatherValue) {
                bestWeather = weather;
            }
        }

        return bestWeather;
    }


    /**
     * STATIC: getAverageDemand
     * Calculates average demand multiplier across a forecast
     *
     * @param {Weather[]} forecast - Array of Weather objects
     * @returns {number} Average demand multiplier
     *
     * USAGE:
     * Statistical helper for game balance or analytics
     *
     * EXAMPLE:
     * Weather.getAverageDemand(forecast) → 1.3 (average)
     */
    static getAverageDemand(forecast) {
        if (!Array.isArray(forecast) || forecast.length === 0) {
            return 1.0;
        }

        const totalDemand = forecast.reduce((sum, weather) => sum + weather.demandIndex, 0);
        return HELPERS.roundToDecimals(totalDemand / forecast.length, 2);
    }
}

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 *
 * // Create single weather instance
 * const todayWeather = new Weather(1);
 * console.log(todayWeather.weatherValue);     // 0.65
 * console.log(todayWeather.demandIndex);      // 1.3
 * console.log(todayWeather.marketCondition);  // "Moderate Shortage"
 * console.log(todayWeather.getWeatherIcon()); // "🌧️"
 *
 * // Generate 7-day forecast
 * const forecast = Weather.generateForecast(7, 1);
 * forecast.forEach(w => {
 *     console.log(`Day ${w.day}: ${w.weatherValue} = ${w.demandIndex}x`);
 * });
 *
 * // Find best selling opportunity
 * const bestDay = Weather.getWorstWeatherForSelling(forecast);
 * console.log(`Sell on Day ${bestDay.day} for ${bestDay.demandIndex}x prices!`);
 *
 * // Convert weather value to demand
 * const demand = Weather.calculateDemandIndex(0.25);
 * console.log(demand); // 2.0
 *
 * ============================================================================
 */