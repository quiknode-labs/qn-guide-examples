# AI-Powered DeFi Yield Optimizer for Aerodrome Finance

An AI-powered DeFi yield farming optimizer that helps users build personalized portfolio strategies across Aerodrome Finance pools on Base network.

## 🚀 Features

### Core Functionality
- **Real-time Pool Data**: Fetches live pool data from QuickNode's Aerodrome API
- **AI-Powered Optimization**: Uses Claude AI for intelligent portfolio recommendations
- **Risk Assessment**: Comprehensive 5-step quiz to determine user risk profile
- **Smart Allocation**: Automated portfolio diversification with percentage allocations
- **Detailed Reasoning**: AI-generated explanations for each pool recommendation

### Pool Analysis
- **Multi-criteria**: TVL, APR, and volume analysis
- **Pool Type Support**: Stable pairs, volatile pairs, and concentrated liquidity pools
- **Token Verification**: Integration with verified token lists for safety
- **Real-time Metrics**: Live APR, TVL, and trading volume data

### User Experience
- **3-Step Workflow**: Pool overview → Risk assessment → Strategy results
- **Interactive Quiz**: Investment amount, risk tolerance, time horizon, and preferences
- **Visual Portfolio**: Pie charts and detailed breakdowns of recommendations

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │    │   AI Processing  │    │  Pool Data API  │
│                 │    │                  │    │                 │
│ • Risk Quiz     │───▶│  Claude AI API   │◀───│ QuickNode API   │
│ • Preferences   │    │  • Analysis      │    │ • Live Pools    │
│ • Investment $  │    │  • Optimization  │    │ • Token Data    │
└─────────────────┘    │  • Reasoning     │    │ • Verification  │
                       └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Optimized Strategy│
                       │                  │
                       │ • Pool Selection │
                       │ • Allocations    │
                       │ • Risk Scores    │
                       │ • Reasoning      │
                       └──────────────────┘
```


### Component Architecture

```
├── app
│   ├── api
│   │   └── optimize              # Server-side API route for AI optimization
│   ├── globals.css               # Global styles and CSS variables
│   ├── layout.tsx                # Root layout with providers and metadata
│   └── page.tsx                  # Main orchestrator component for the 3-phase flow
├── components
│   ├── pools
│   │   ├── enhanced-pool-card.tsx    # Rich pool data display with metrics
│   │   └── pool-overview.tsx         # Pool grid with sorting and filtering
│   ├── quiz
│   │   └── risk-assessment-quiz.tsx  # Multi-step risk profiling interface
│   ├── strategy
│   │   └── strategy-results.tsx      # AI-generated strategy visualization
│   ├── theme-provider.tsx            # Theme context for dark/light mode
│   └── ui                           # Reusable UI components (shadcn/ui)
├── hooks
│   ├── use-mobile.tsx               # Responsive design hook
│   └── use-toast.ts                 # Toast notification system
├── lib
│   ├── ai-optimizer.ts              # Claude AI integration and prompt engineering
│   ├── api.ts                       # Aerodrome API client and data fetching
│   ├── mock-data.ts                 # Fallback data for demo mode
│   ├── optimizer.ts                 # Portfolio optimization orchestrator
│   └── utils.ts                     # Utility functions and formatting
├── types
│   ├── pool.ts                      # Pool data structures and API responses
│   ├── strategy.ts                  # Strategy and risk profile interfaces
│   └── token.ts                     # Token metadata and verification types
```

## 📋 Prerequisites

### Required Accounts & APIs
1. **Anthropic Claude API**: 
   - Sign up at [console.anthropic.com](https://console.anthropic.com/)
   - Get API key

2. **QuickNode Account**:
   - Sign up at [quicknode.com](https://www.quicknode.com/)
   - Subscribe to Aerodrome API add-on
   - Get endpoint URL

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/sample-dapps/ai-powered-defi-yield-optimizer
```

### 2. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 3. Environment Configuration
```bash
cp .env.example .env

```

Edit `.env`:
```bash
# Required for AI optimization
ANTHROPIC_API_KEY=your_claude_api_key_here

# Optional for live data (falls back to demo data)
NEXT_PUBLIC_QUICKNODE_ENDPOINT=https://your-quicknode-endpoint.com/your-api-key/
```

### 4. Run Development Server
```bash
pnpm dev
# or
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### 5. Production Build
```bash
pnpm build
pnpm start
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude AI API key for optimization |
| `NEXT_PUBLIC_QUICKNODE_ENDPOINT` | Yes | QuickNode Aerodrome API endpoint |

### API Endpoints

#### `/api/optimize` (POST)
Generates AI-powered portfolio optimization.

**Request:**
```typescript
{
  pools: DetailedPool[],
  riskProfile: RiskProfile
}
```

**Response:**
```typescript
{
  success: boolean,
  optimization: {
    recommendations: PoolRecommendation[],
    portfolioSummary: PortfolioMetrics
  },
  usedAI: boolean
}
```

## 🎯 Usage Guide

### Step 1: Pool Overview
- Browse real-time Aerodrome pools
- Filter by pool type, tokens, or characteristics
- Sort by TVL, APR, or volume
- Click "Build My Strategy" to start

### Step 2: Risk Assessment
Complete the 5-step questionnaire:

1. **Investment Amount**: $1,000 - $100,000+
2. **Risk Tolerance**: Conservative, Moderate, or Aggressive
3. **Time Horizon**: Short (1-3mo), Medium (3-6mo), or Long (6mo+)
4. **Pool Preferences**: Stable, Major tokens, Volatile, Concentrated liquidity
5. **Minimum TVL**: $100K - $10M+ for liquidity requirements

### Step 3: Strategy Results
View your personalized recommendations:

- **Portfolio Overview**: Expected APR, risk score, diversification
- **Allocation Chart**: Visual breakdown of recommended investments
- **Pool Details**: Specific reasoning for each recommendation
- **Implementation Guide**: Step-by-step instructions

### Getting Help
- **Documentation**: This README and inline code comments
- **API Documentation**: 
  - [QuickNode Aerodrome API](https://marketplace.quicknode.com/add-on/aerodrome-swap-api)
  - [Anthropic Claude API](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
