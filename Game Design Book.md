# Stephen's last chance - Game Design Document

## 1. Game Overview

**Game Title:** Stephen's last chance  
**Genre:** Farm Management Simulation  
**Platform:** Web Browser  
**Target Audience:** Casual players who enjoy resource management and strategy games  
**Estimated Playtime:** 15-30 minutes per session  
**Game Duration:** 10 in-game days

### 1.1 Core Concept
Players manage a farm by growing crops and raising animals, then selling their produce to shops. The game features a dynamic economy system where prices fluctuate based on weather conditions and supply-demand mechanics, requiring strategic planning and market timing.

### 1.2 Story Background
Stephen is a young farmer who has inherited an old, run-down farm from his grandfather. However, there's a problem: the farm is heavily in debt! The bank has given Stephen an ultimatum - he must pay back **$5,000** within **10 days** or the farm will be foreclosed and sold.

With only **$50** in his pocket and the farm's last remaining plot of land, Stephen must work day and night, growing crops and raising animals. Fortunately, two old friends of his grandfather - Tom (the seed merchant) and Henry (the livestock trader) - have agreed to help him by buying and selling goods.

The weather has been unpredictable lately, which affects market prices. Stephen must use his farming skills, strategic thinking, and a bit of luck to save his family's legacy.

**Will Stephen save the farm, or will he lose everything his grandfather built?**

### 1.3 Win/Lose Conditions

**Victory Condition:**
- Accumulate **$5,000** or more within 10 in-game days
- Upon winning, Stephen saves the farm and can continue his grandfather's legacy

**Defeat Condition:**
- Fail to reach $5,000 by the end of Day 10
- The farm is foreclosed and Stephen loses everything

**Day System:**
- Each in-game day lasts a set amount of real time (e.g., 3 minutes)
- Weather changes each day according to the 7-day forecast
- Players can see which day they're on and how much money they still need

---

## 2. Game Characters

### 2.1 Stephen (The Farmer) - Player Character
- **Role:** Main protagonist and player-controlled character
- **Responsibilities:**
    - Plant crops and purchase seeds from Tom's shop
    - Raise animals and purchase livestock from Henry's shop
    - Harvest mature crops and animals
    - Sell products back to the respective shops
    - Monitor weather forecasts to maximize profit

### 2.2 Tom (Seeds Shop Owner) - NPC
- **Role:** Crop merchant
- **Shop Name:** Tom's Seed Store
- **Functions:**
    - Sells seeds to Stephen (5 types: Wheat, Carrot, Corn, Strawberry, Watermelon)
    - Buys back harvested crops from Stephen
    - Purchase prices are FIXED (always the same)
    - Buyback prices FLUCTUATE based on weather-demand system

### 2.3 Henry (Animal Shop Owner) - NPC
- **Role:** Livestock merchant
- **Shop Name:** Henry's Animal Farm
- **Functions:**
    - Sells young animals to Stephen (5 types: Chicken, Rabbit, Sheep, Pig, Cow)
    - Buys back mature animals from Stephen
    - Purchase prices are FIXED (always the same)
    - Buyback prices FLUCTUATE based on weather-demand system

---

## 3. Core Game Mechanics

### 3.1 Starting Conditions
- **Initial Capital:** $50
- **Starting Location:** Stephen's Farm (main hub)
- **Available Actions:** Visit Tom's shop, Visit Henry's shop, View weather forecast

### 3.2 Crop System

| Tier  | Crop Type  | Seed Cost (Fixed) | Growth Time | Base Sell Price | Base Profit |
| ----- | ---------- | ----------------- | ----------- | --------------- | ----------- |
| ⭐     | Wheat      | $10               | 2 min       | $18             | $8 (80%)    |
| ⭐⭐    | Carrot     | $30               | 3 min       | $60             | $30 (100%)  |
| ⭐⭐⭐   | Corn       | $70               | 4 min       | $150            | $80 (114%)  |
| ⭐⭐⭐⭐  | Strawberry | $150              | 5 min       | $350            | $200 (133%) |
| ⭐⭐⭐⭐⭐ | Watermelon | $300              | 7 min       | $750            | $450 (150%) |

**Crop Lifecycle:**
1. Purchase seeds from Tom's shop (fixed price)
2. Plant seeds on farm plots
3. Wait for growth timer to complete
4. Harvest mature crops
5. Sell to Tom's shop (price varies by weather-demand)

### 3.3 Animal System

| Tier  | Animal Type | Purchase Cost (Fixed) | Growth Time | Base Sell Price | Base Profit  | Breeding Chance | Offspring Survival |
| ----- | ----------- | --------------------- | ----------- | --------------- | ------------ | --------------- | ------------------ |
| ⭐     | Chicken     | $40                   | 3 min       | $75             | $35 (88%)    | 35%             | 75%                |
| ⭐⭐    | Rabbit      | $100                  | 4 min       | $200            | $100 (100%)  | 40%             | 70%                |
| ⭐⭐⭐   | Sheep       | $220                  | 5 min       | $480            | $260 (118%)  | 30%             | 65%                |
| ⭐⭐⭐⭐  | Pig         | $450                  | 6 min       | $1050           | $600 (133%)  | 25%             | 60%                |
| ⭐⭐⭐⭐⭐ | Cow         | $900                  | 8 min       | $2250           | $1350 (150%) | 20%             | 55%                |

**Animal Lifecycle:**
1. Purchase young animals from Henry's shop (fixed price)
2. Place animals in farm pens
3. Wait for growth timer to complete
4. **Random Breeding Event:** During growth, animals have a chance to produce offspring
    5. If breeding occurs, offspring are created with survival rate chance
    6. Surviving offspring begin their own growth cycle
    7. Purchased animals always have 100% survival rate
5. Harvest mature animals
6. Sell to Henry's shop (price varies by weather-demand)

---

## 4. Weather & Economic System

### 4.1 Weather Forecast
- **Display Location:** Game main menu/home screen
- **Forecast Range:** 7 days ahead (including current day)
- **Weather Value:** Decimal number from 0.10 to 1.00 (two decimal places)
    - **1.00 = Perfect weather** (sunny, ideal conditions)
    - **0.10 = Worst weather** (stormy, poor conditions)

### 4.2 Supply-Demand Index System

The weather directly affects market demand, which changes the selling prices at Tom's and Henry's shops.

**Weather-to-Demand Conversion Table:**

| Weather Range | Demand Index | Market Condition     | Effect on Sell Price     |
| ------------- | ------------ | -------------------- | ------------------------ |
| 1.00          | 0.8x         | Oversupply           | Sell prices × 0.8        |
| 0.90 - 0.99   | 0.9x         | Good Supply          | Sell prices × 0.9        |
| 0.80 - 0.89   | 1.0x         | Balanced             | Sell prices × 1.0 (base) |
| 0.70 - 0.79   | 1.2x         | Slight Shortage      | Sell prices × 1.2        |
| 0.60 - 0.69   | 1.3x         | Moderate Shortage    | Sell prices × 1.3        |
| 0.50 - 0.59   | 1.4x         | Significant Shortage | Sell prices × 1.4        |
| 0.40 - 0.49   | 1.5x         | High Shortage        | Sell prices × 1.5        |
| 0.30 - 0.39   | 1.7x         | Severe Shortage      | Sell prices × 1.7        |
| 0.10 - 0.29   | 2.0x         | Critical Shortage    | Sell prices × 2.0        |

### 4.3 Price Calculation Formula

**For selling crops to Tom:**
```
Final Sell Price = Base Crop Sell Price × Demand Index
```

**For selling animals to Henry:**
```
Final Sell Price = Base Animal Sell Price × Demand Index
```

**Example:**
- Weather today: 0.25 → Demand Index: 2.0x
- Selling Wheat (base price $18): $18 × 2.0 = **$36\*\*
- Selling Chicken (base price $75): $75 × 2.0 = **$150\*\*

### 4.4 Economic Strategy
- **Perfect Weather (1.00):** Worst time to sell (only 80% of base price)
- **Poor Weather (0.10-0.29):** Best time to sell (200% of base price)
- Players must balance growth times with weather forecasts
- Strategic players will time their harvests to coincide with poor weather days

---

## 5. Game Flow & User Interface

### 5.1 Main Menu / Home Screen
**Display Elements:**
- Current money balance
- **Current Day (1-10)** with progress indicator
- **Goal Progress:** "$X / $5,000" showing how much money is needed
- **Days Remaining:** "X days left to save the farm!"
- 7-day weather forecast with daily weather values
- Navigation buttons:
    - "Go to Farm"
    - "Visit Tom's Seed Shop"
    - "Visit Henry's Animal Farm"
- **Story Reminder:** Brief text reminding player of the goal

### 5.2 Farm Screen
**Display Elements:**
- Farm plots showing:
    - Planted crops with growth progress
    - Animals with growth progress
    - Empty slots for new purchases
- Current money
- Current day and days remaining
- Today's weather and demand index
- Action buttons:
    - "Harvest" (for mature items)
    - "Back to Home"

### 5.3 Tom's Seed Shop
**Display Elements:**
- Shop inventory showing 5 crop types with:
    - Seed name
    - Purchase price (fixed)
    - Current buyback price (based on today's demand)
    - Growth time
- Player's harvested crops available to sell
- Current demand index display
- Action buttons:
    - "Buy Seeds"
    - "Sell Crops"
    - "Back to Home"

### 5.4 Henry's Animal Farm
**Display Elements:**
- Shop inventory showing 5 animal types with:
    - Animal name
    - Purchase price (fixed)
    - Current buyback price (based on today's demand)
    - Growth time
    - Breeding chance
- Player's mature animals available to sell
- Current demand index display
- Action buttons:
    - "Buy Animals"
    - "Sell Animals"
    - "Back to Home"

---

## 6. Reward System & Milestones

### 6.1 Progress Milestones
To encourage players and track progress, the game includes milestone achievements:

| Milestone      | Money Goal | Reward Message                                       | Visual Reward         |
| -------------- | ---------- | ---------------------------------------------------- | --------------------- |
| First Harvest  | $100       | "Great start! You've made your first $100!"          | Bronze medal icon     |
| Quarter Goal   | $1,250     | "You're 25% there! The farm is coming back to life!" | Encouragement message |
| Half Goal      | $2,500     | "Halfway there! Don't give up now!"                  | Silver medal icon     |
| Three Quarters | $3,750     | "Almost there! The farm is within reach!"            | Gold medal icon       |
| Final Goal     | $5,000     | "SUCCESS! You saved the farm!"                       | Victory screen        |

### 6.2 Daily Bonus System (Optional)
To add variety and reward consistent play:

**Daily Challenges:**
- "Sell crops worth $200 today" → Bonus: +$50
- "Successfully breed an animal today" → Bonus: +$100
- "Complete 5 harvests today" → Bonus: +$75

**Perfect Weather Strategy Bonus:**
- If player sells during worst weather (2.0x multiplier), earn 10% extra bonus
- Encourages strategic timing

### 6.3 End Game Screens

**Victory Screen (≥$5,000):**
```
🎉 CONGRATULATIONS! 🎉

You saved the farm!

Final Money: $X,XXX
Days Used: X/10
Total Crops Sold: XX
Total Animals Sold: XX

Stephen's grandfather would be proud!
The farm is saved and will prosper for generations.

[Play Again] [Main Menu]
```

**Defeat Screen (\<$5,000 by Day 10):**
```
💔 GAME OVER 💔

The farm has been foreclosed...

Final Money: $X,XXX (Goal: $5,000)
You were $X,XXX short.

Don't give up! Try again with better strategy.
Remember to check the weather forecast and 
time your sales wisely!

[Try Again] [Main Menu]
```

### 6.4 Performance Statistics
After each game (win or lose), show player statistics:
- Total money earned
- Days played
- Most profitable crop sold
- Most profitable animal sold
- Best single sale (highest multiplier used)
- Total crops harvested
- Total animals raised
- Successful breeding events

---

## 7. Game Progression & Strategy

### 7.1 Early Game (Starting Capital: $50, Days 1-3)
**Goal:** Reach $500-$1,000

1. Player can only afford Wheat seeds (5 seeds for $50)
2. Plant wheat and wait 2 minutes
3. Check weather forecast - if poor weather is coming, wait to sell
4. Sell wheat when demand index is favorable (ideally 1.2x or higher)
5. Accumulate capital to unlock Carrots and eventually Chicken
6. **Key Strategy:** Focus on quick turnaround items (Wheat) and watch weather

### 7.2 Mid Game (Capital: $500-$2,500, Days 4-7)
**Goal:** Reach $2,500-$4,000

1. Mix crop farming (Wheat, Carrot, Corn) with first animals (Chicken, Rabbit)
2. Begin timing harvests with weather forecasts strategically
3. Benefit from animal breeding for extra income (free animals!)
4. Unlock higher-tier items (Strawberry, Sheep)
5. **Key Strategy:** Diversify portfolio, maximize breeding opportunities, sell only on bad weather days

### 7.3 Late Game (Capital: $2,500+, Days 8-10)
**Goal:** Reach $5,000+ before Day 10 ends

1. Access to premium crops (Strawberry, Watermelon)
2. Access to premium animals (Sheep, Pig, Cow)
3. Complex strategy: balance multiple growth timers with remaining days and weather forecast
4. Maximize profits by selling during worst weather conditions (2.0x multiplier)
5. **Final Push:** If close to deadline, take calculated risks on expensive items
6. **Key Strategy:** Time management is critical - ensure harvests complete before Day 10 ends

### 7.4 Optimal Strategy Tips
- **Weather = 0.10-0.29 (2.0x multiplier):** ALWAYS sell if you have mature items
- **Weather = 1.00 (0.8x multiplier):** NEVER sell unless desperate
- **Growth Time vs Days Left:** Don't plant a 7-minute Watermelon on Day 10!
- **Animal Breeding:** Free money if you get lucky - prioritize Rabbits (40% chance)
- **Risk Management:** Keep some fast crops (Wheat) as backup if expensive items don't mature in time

---

## 8. Technical Requirements

### 8.1 Core Systems to Implement
1. **Timer System:** Track growth progress for all crops and animals
2. **Weather Generator:** Generate random weather values (0.10-1.00) for 7 days
3. **Price Calculator:** Apply demand index to base prices
4. **Breeding System:** Random chance calculations for animal offspring
5. **Inventory System:** Track player's money, seeds, crops, animals
6. **Day/Night Cycle:** Track current day (1-10) and advance days
7. **Win/Lose Detection:** Check if player reached $5,000 or exceeded 10 days
8. **Milestone System:** Track and display progress achievements
9. **Save System (Optional):** Store player progress

### 8.2 Data Structures Needed

**Crop Object:**
```javascript
{
  type: "wheat",
  status: "growing", // "seed", "growing", "mature"
  plantTime: timestamp,
  growthDuration: 120000, // milliseconds
}
```

**Animal Object:**
```javascript
{
  type: "chicken",
  status: "growing", // "young", "growing", "mature"
  purchaseTime: timestamp,
  growthDuration: 180000, // milliseconds
  hasOffspring: false,
  offspring: []
}
```

**Weather Object:**
```javascript
{
  day: 1, // 1-10
  weatherValue: 0.65, // 0.10-1.00
  demandIndex: 1.3 // calculated from weather
}
```

**Game State Object:**
```javascript
{
  currentDay: 1, // 1-10
  currentMoney: 50,
  goalMoney: 5000,
  milestonesReached: [],
  totalCropsSold: 0,
  totalAnimalsSold: 0,
  gameStatus: "playing" // "playing", "won", "lost"
}
```

### 8.3 Minimum Viable Product (MVP) Features
1. ✅ Basic farm with crop planting and harvesting
2. ✅ Two shop NPCs with buy/sell functionality
3. ✅ Weather system with 7-day forecast
4. ✅ Dynamic pricing based on weather-demand
5. ✅ 10-day time limit system
6. ✅ Win/lose conditions ($5,000 goal)
7. ✅ Day advancement mechanic
8. ✅ At least 3 crops and 3 animals implemented
9. ✅ Timer system for growth
10. ✅ Progress tracking (current money vs goal)
11. ✅ Basic animal breeding (optional for MVP)

### 8.4 Extended Features (If Time Permits)
- Milestone achievement notifications
- Daily challenge bonuses
- Performance statistics screen
- Sound effects and background music
- Animations for planting, harvesting, weather
- Farm expansion (unlock more plots)
- Special events (festivals, holidays)
- Leaderboard for fastest completion time

---

## 9. Art & Audio Assets Needed

### 9.1 Visual Assets

**Characters:**
- Stephen (farmer sprite)
- Tom (shop owner sprite)
- Henry (shop owner sprite)

**Crops (5 types, each needs 3 states):**
- Wheat: seed → growing → mature
- Carrot: seed → growing → mature
- Corn: seed → growing → mature
- Strawberry: seed → growing → mature
- Watermelon: seed → growing → mature

**Animals (5 types, each needs 2 states):**
- Chicken: young → mature
- Rabbit: young → mature
- Sheep: young → mature
- Pig: young → mature
- Cow: young → mature

**Environments:**
- Farm background with plots
- Tom's shop interior
- Henry's shop interior
- Weather icons (sunny, cloudy, rainy, stormy)

**UI Elements:**
- Progress bars for growth timers
- Money counter display
- Day counter display
- Weather forecast display
- Milestone badges (bronze, silver, gold)

### 9.2 Audio Assets (Optional)
- Background music (farm theme)
- Sound effects: planting, harvesting, buying, selling
- Shop bell when entering stores
- Victory fanfare
- Defeat sound

---

## 10. Development Workflow

### 10.1 Core Mechanics & Polish (Week 7-8)
- Implement basic farm with crop system
- Create timer system for growth
- Build shop interfaces for Tom and Henry
- Implement buy/sell functionality with fixed prices
- **Add day system (1-10 days)**
- **Add win/lose condition checking**

### 10.2 Weather & Economy (Week 8-9)
- Add weather generation system
- Implement demand index calculations
- Link weather to shop prices
- Display 7-day forecast on home screen
- **Add goal tracking UI ($X / $5,000)**
- **Add days remaining display**

### 10.3 Animals, Breeding & Story (Week 9)
- Add animal purchase and growth
- Implement breeding mechanics
- Add offspring survival rates
- **Implement milestone system**
- **Add victory/defeat screens**
- **Add story introduction screen**

### 10.4 Testing & Video (Week 9)
- Add visual feedback and UI improvements
- Test all systems thoroughly
- Balance prices and growth times to ensure $5,000 is achievable in 10 days
- Test edge cases (running out of time, perfect strategy)
- Record demo video showing complete gameplay loop

---

## 11. Success Criteria

### 11.1 Game Must Include:
1. ✅ Story introduction explaining the $5,000 debt and 10-day deadline
2. ✅ All 3 characters (Stephen, Tom, Henry) with clear roles
3. ✅ 5 types of crops with different prices and growth times
4. ✅ 5 types of animals with breeding mechanics
5. ✅ Weather system affecting prices (0.8x to 2.0x)
6. ✅ 7-day weather forecast visible to player
7. ✅ 10-day time limit clearly displayed
8. ✅ Goal progress tracking ($X / $5,000)
9. ✅ Working buy/sell system with dynamic prices
10. ✅ Win condition (reach $5,000) and lose condition (fail by Day 10)
11. ✅ Victory and defeat screens with appropriate messages
12. ✅ Functional gameplay loop demonstrating 5 minutes of play

### 11.2 Video Demo Should Show:
1. **Story Introduction:** Brief explanation of Stephen's situation
2. **Starting State:** Player begins with $50, Day 1
3. **Early Game:** Buying wheat seeds, planting, harvesting
4. **Weather Impact:** Showing how different weather affects selling prices
5. **Mid Game Progress:** Unlocking animals, showing breeding
6. **Strategic Play:** Waiting for bad weather to sell for 2.0x multiplier
7. **Day Progression:** Showing days advancing and goal progress
8. **Either:**
    9. Victory screen when reaching $5,000, OR
    10. Defeat screen if demonstration runs to Day 10 without success
9. **Statistics:** Final performance summary

### 11.3 Balancing Requirements
To ensure the game is fair and fun:
- **Achievability Test:** It should be POSSIBLE to reach $5,000 in 10 days with good strategy
- **Challenge Test:** It should NOT be too easy - requires planning and good weather timing
- **Recommended Balance:** Player should reach goal around Day 8-9 with optimal play
- **Safety Margin:** Player should have multiple valid strategies to win

---

## 12. Glossary

- **Base Price:** The standard selling price when demand index is 1.0x
- **Demand Index:** Multiplier applied to selling prices (0.8x to 2.0x)
- **Weather Value:** Number from 0.10 to 1.00 representing weather conditions
- **Breeding:** Random event where animals produce offspring during growth
- **Survival Rate:** Chance that offspring will successfully mature
- **Growth Timer:** Time required for crops/animals to reach maturity
- **Fixed Price:** Purchase prices that never change (buying from shops)
- **Dynamic Price:** Selling prices that change with weather (selling to shops)
- **In-Game Day:** A period of time representing one day in the game world
- **Milestone:** Achievement reached at certain money thresholds
- **Goal:** The target amount of $5,000 that must be reached to win
- **Foreclosure:** What happens to the farm if Stephen fails to reach $5,000 by Day 10

---

**Document Version:** 2.0  
**Last Updated:** October 2025  
**Authors:** [Your Team Name]

---

## Quick Reference Tables

### Crop Quick Reference

| Crop       | Cost | Time | Base Sell | With 2.0x |
| ---------- | ---- | ---- | --------- | --------- |
| Wheat      | $10  | 2m   | $18       | $36       |
| Carrot     | $30  | 3m   | $60       | $120      |
| Corn       | $70  | 4m   | $150      | $300      |
| Strawberry | $150 | 5m   | $350      | $700      |
| Watermelon | $300 | 7m   | $750      | $1,500    |

### Animal Quick Reference

| Animal  | Cost | Time | Base Sell | With 2.0x | Breed % |
| ------- | ---- | ---- | --------- | --------- | ------- |
| Chicken | $40  | 3m   | $75       | $150      | 35%     |
| Rabbit  | $100 | 4m   | $200      | $400      | 40%     |
| Sheep   | $220 | 5m   | $480      | $960      | 30%     |
| Pig     | $450 | 6m   | $1,050    | $2,100    | 25%     |
| Cow     | $900 | 8m   | $2,250    | $4,500    | 20%     |

### Weather-Demand Quick Reference

| Weather   | Demand | When to Sell   |
| --------- | ------ | -------------- |
| 1.00      | 0.8x   | ❌ Worst time   |
| 0.90-0.99 | 0.9x   | ❌ Bad          |
| 0.80-0.89 | 1.0x   | 🟡 Neutral     |
| 0.70-0.79 | 1.2x   | ✅ Good         |
| 0.60-0.69 | 1.3x   | ✅ Very Good    |
| 0.50-0.59 | 1.4x   | ✅ Great        |
| 0.40-0.49 | 1.5x   | ✅✅ Excellent   |
| 0.30-0.39 | 1.7x   | ✅✅ Outstanding |
| 0.10-0.29 | 2.0x   | ✅✅✅ BEST TIME  |
