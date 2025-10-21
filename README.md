# 🚜 Farm Rescue

A strategic farm management simulation game where players race against time to save their grandfather's farm from foreclosure.

[![Game Status](https://img.shields.io/badge/GroupB--yellow)]()
[![COMPSCI](https://img.shields.io/badge/COMPSCI2023-SucceedInCS-green)]()
[![University](https://img.shields.io/badge/University-Glasgow-blue)]()

---

## 📖 Story Background

Stephen is a young farmer who has just inherited his grandfather's old farm. However, the farm is heavily in debt! The bank has given Stephen an ultimatum: **pay back $5,000 within 10 days** or lose the farm forever.

With only **$50** in his pocket and one last plot of farmland, Stephen must work tirelessly to grow crops and raise animals. Two of his grandfather's old friends—**Tom** (the seed merchant) and **Henry** (the livestock trader)—have agreed to help by buying and selling goods.

The weather has been unpredictable, causing market prices to fluctuate wildly. Can Stephen save his family's legacy?

---

## 🎮 Game Overview

### Objective
Earn **$5,000 or more** within **10 in-game days** to save the farm.

### Win Condition
- Accumulate ≥ $5,000 before the end of Day 10
- Successfully save the farm and continue the family legacy

### Lose Condition
- Fail to reach $5,000 by Day 10
- The farm is foreclosed and lost forever

---

## 🌟 Key Features

### 1. Dynamic Economy System
- **Weather-Based Pricing**: Market prices fluctuate based on daily weather conditions
- **Supply-Demand Mechanics**: Worse weather = higher demand = better prices (0.8x - 2.0x multipliers)
- **Strategic Timing**: Plan harvests around weather forecasts for maximum profit

### 2. Crop Cultivation
5 types of crops with varying profitability and growth times:

| Crop | Seed Cost | Growth Time | Base Sell Price | Profit Margin |
|------|-----------|-------------|-----------------|---------------|
| 🌾 Wheat | $10 | 2 min | $18 | 80% |
| 🥕 Carrot | $30 | 3 min | $60 | 100% |
| 🌽 Corn | $70 | 4 min | $150 | 114% |
| 🍓 Strawberry | $150 | 5 min | $350 | 133% |
| 🍉 Watermelon | $300 | 7 min | $750 | 150% |

### 3. Animal Husbandry
5 types of animals with breeding mechanics:

| Animal | Purchase Cost | Growth Time | Base Sell Price | Breeding Chance | Offspring Survival |
|--------|---------------|-------------|-----------------|-----------------|-------------------|
| 🐔 Chicken | $40 | 3 min | $75 | 35% | 75% |
| 🐰 Rabbit | $100 | 4 min | $200 | 40% | 70% |
| 🐑 Sheep | $220 | 5 min | $480 | 30% | 65% |
| 🐷 Pig | $450 | 6 min | $1,050 | 25% | 60% |
| 🐮 Cow | $900 | 8 min | $2,250 | 20% | 55% |

**Special Feature**: Animals can randomly breed during growth, producing offspring at no cost!

### 4. Weather System
- **7-Day Forecast**: Plan ahead with weather predictions
- **Weather Values**: Range from 0.10 (terrible) to 1.00 (perfect)
- **Price Impact**: Weather directly affects selling prices through demand multipliers

#### Weather-Demand Conversion Table

| Weather Range | Demand Multiplier | Market Condition | Recommendation |
|---------------|-------------------|------------------|----------------|
| 1.00 | 0.8x | Oversupply | ❌ Don't sell |
| 0.90 - 0.99 | 0.9x | Good Supply | ❌ Avoid selling |
| 0.80 - 0.89 | 1.0x | Balanced | 🟡 Normal prices |
| 0.70 - 0.79 | 1.2x | Slight Shortage | ✅ Good time |
| 0.60 - 0.69 | 1.3x | Moderate Shortage | ✅ Very good |
| 0.50 - 0.59 | 1.4x | Significant Shortage | ✅ Great time |
| 0.40 - 0.49 | 1.5x | High Shortage | ✅✅ Excellent |
| 0.30 - 0.39 | 1.7x | Severe Shortage | ✅✅ Outstanding |
| 0.10 - 0.29 | 2.0x | Critical Shortage | ✅✅✅ BEST TIME |

### 5. Progress Milestones
Track your journey to success:
- 💰 **$100**: First Harvest
- 💰 **$1,250**: Quarter Goal (25%)
- 💰 **$2,500**: Halfway Point (50%)
- 💰 **$3,750**: Three-Quarters Mark (75%)
- 💰 **$5,000**: VICTORY! Farm Saved!

---

## 👥 Characters

### Stephen (Player)
The protagonist farmer who must save his grandfather's farm through strategic farming and trading.

### Tom (Seed Merchant)
Runs "Tom's Seed Store" where Stephen can:
- Buy seeds at fixed prices
- Sell harvested crops at weather-affected prices

### Henry (Livestock Trader)
Operates "Henry's Animal Farm" where Stephen can:
- Purchase young animals at fixed prices
- Sell mature animals at weather-affected prices

---

## 🎯 Gameplay Strategy

### Early Game (Days 1-3) - Goal: $500-$1,000
**Strategy**: Focus on fast-growing, low-cost crops
- Start with Wheat (5 seeds for $50)
- Quick 2-minute turnaround
- Reinvest profits into more wheat and carrots
- Save for first chicken when possible

**Key Tip**: Watch the weather forecast and wait for bad weather (< 0.40) before selling!

### Middle Game (Days 4-7) - Goal: $2,500-$4,000
**Strategy**: Diversify and leverage breeding
- Mix crops (Wheat, Carrot, Corn)
- Invest in animals (Chicken, Rabbit)
- Benefit from free offspring through breeding
- Unlock higher-tier items (Strawberry, Sheep)

**Key Tip**: Only sell during favorable weather conditions (1.2x multiplier or higher)

### Late Game (Days 8-10) - Goal: $5,000+
**Strategy**: Maximize profits with premium items
- Focus on high-value crops (Strawberry, Watermelon)
- Invest in expensive animals (Pig, Cow) if time allows
- Time all harvests carefully with remaining days
- Sell everything during worst weather (2.0x multiplier)

**Key Tip**: Don't plant a 7-minute Watermelon on Day 10! Calculate growth time vs remaining time.

### Pro Tips 💡
- **Rabbits are best for breeding** (40% chance, 4-minute growth)
- **Never sell when weather = 1.00** (only 80% of base price)
- **Always sell when weather < 0.30** (double the base price!)
- **Keep some fast crops as backup** (wheat for emergency cash)
- **Animal breeding = free money** if you get lucky

---

## 🖥️ Technical Information

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **Development Tools**: WebStorm IDE
- **Version Control**: Git & GitHub
- **Target Platform**: Web Browser (Chrome, Firefox, Safari, Edge)

### Project Structure
```
farm-rescue/
├── index.html          # Main game page
├── style.css           # Game styling
├── script.js           # Game logic
├── assets/
│   ├── images/         # Sprites and graphics
│   │   ├── crops/
│   │   ├── animals/
│   │   ├── characters/
│   │   └── ui/
│   └── sounds/         # Audio files (optional)
├── docs/
│   └── game-design-document.md
└── README.md
```

### Core Systems
1. **Timer System**: Tracks growth progress for all crops and animals
2. **Weather Generator**: Generates random weather values for 7-day forecasts
3. **Price Calculator**: Applies demand multipliers to base prices
4. **Breeding System**: Handles random animal reproduction
5. **Day Cycle Manager**: Advances game days and checks win/lose conditions
6. **Save System**: Stores player progress (optional)

---

## 🎨 Game Screens

### Main Menu
- Current money display
- Day counter (1-10)
- Goal progress tracker ($X / $5,000)
- 7-day weather forecast
- Navigation to Farm, Tom's Shop, Henry's Shop

### Farm Screen
- Crop plots with growth timers
- Animal pens with breeding status
- Current weather and demand index
- Harvest buttons for mature items

### Shop Screens (Tom & Henry)
- Available items with fixed purchase prices
- Current buyback prices (weather-adjusted)
- Player inventory for selling
- Real-time demand multiplier display

### End Screens
- **Victory Screen**: Congratulatory message with statistics
- **Defeat Screen**: Encouragement to try again with strategy tips

---

## 📊 Game Balance

### Difficulty
- **Achievable**: Reaching $5,000 in 10 days is possible with good strategy
- **Challenging**: Requires planning, weather monitoring, and smart timing
- **Optimal Play**: Should reach goal around Day 8-9

### Multiple Strategies
Players can win through:
- **Fast farming**: Quick crops like Wheat and Carrots
- **Animal breeding**: Leverage free offspring for profit
- **Weather trading**: Strategic selling during worst weather
- **Mixed approach**: Balanced portfolio of crops and animals

---

## 🚀 Installation & Setup

### Prerequisites
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Text editor or IDE (WebStorm recommended)
- Git for version control

### Local Development
```bash
# Clone the repository
git clone https://github.com/your-username/farm-rescue.git

# Navigate to project directory
cd farm-rescue

# Open index.html in your browser
# Or use a local server (recommended)
```

### Using WebStorm
1. Open project folder in WebStorm
2. Right-click `index.html`
3. Select "Open in Browser"

---

## 👥 Team & Roles

| Role | Responsibilities | Team Member |
|------|------------------|-------------|
| **Secretary** | Schedule meetings, record minutes, submit documentation | Nomin Erdene Gantulga |
| **Submission Coordinator** | Manage deadlines, compile final submission | Alae Athamena |
| **Software Dev Coordinator** | Oversee code integration, resolve conflicts | Kunter Cetin |
| **Game Design Lead** | Coordinate design decisions, manage assets | Xufei Cao |
| **Team Lead** | Facilitate meetings, ensure task completion | Minghao Dai |

---





## 📄 License

This project is created for educational purposes as part of COMPSCI2023 coursework at the University of Glasgow.

---

## 🙏 Acknowledgments

- **Course**: COMPSCI2023 - Succeeding in University Study in Computing Science
- **University**: University of Glasgow
- **Semester**: Fall 2025

Special thanks to:
- Course instructors(Stephen Lindsay) for project guidance
- Team members for collaboration
- Grandfather for the farm (in-game) 🚜

---

## 🎮 Quick Start Guide

### For Players
1. Open `index.html` in your web browser
2. Read the story introduction
3. Start with $50 and buy wheat seeds from Tom
4. Plant, wait 2 minutes, and harvest
5. Check weather forecast before selling
6. Aim to reach $5,000 before Day 10!


*Save the farm, save the legacy! 🌾*
