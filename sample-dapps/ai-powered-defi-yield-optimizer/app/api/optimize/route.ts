import { NextRequest, NextResponse } from 'next/server';
import type { RiskProfile } from '@/types/strategy';
import type { DetailedPool } from '@/types/pool';

interface OptimizeRequest {
  pools: DetailedPool[];
  riskProfile: RiskProfile;
}

const POOL_CATEGORIES = {
  stable: "Low-risk stable pairs with minimal impermanent loss",
  major: "Established tokens with good liquidity and moderate risk",
  volatile: "Higher risk/reward pairs with potential for greater returns",
  concentrated: "Advanced liquidity strategies requiring active management"
};

const RISK_TOLERANCE_DESCRIPTIONS = {
  conservative: "Prefers stable returns with minimal risk, focusing on capital preservation",
  moderate: "Balanced approach seeking reasonable returns with controlled risk",
  aggressive: "Willing to accept higher risk for potentially greater rewards"
};

const TIME_HORIZON_DESCRIPTIONS = {
  short: "Short-term investment (1-3 months) requiring high liquidity",
  medium: "Medium-term investment (3-6 months) with balanced growth approach",
  long: "Long-term investment (6+ months) focused on maximum growth potential"
};

export async function POST(request: NextRequest) {
  try {
    const { pools, riskProfile }: OptimizeRequest = await request.json();

    // Validate input
    if (!pools || !Array.isArray(pools) || pools.length === 0) {
      return NextResponse.json(
        { error: 'Invalid pools data' },
        { status: 400 }
      );
    }

    if (!riskProfile || !riskProfile.riskTolerance) {
      return NextResponse.json(
        { error: 'Invalid risk profile' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'Claude AI not configured',
          fallback: true
        },
        { status: 200 }
      );
    }

    // Build the prompt
    const prompt = buildOptimizationPrompt(pools, riskProfile);

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.text();
      console.error('Claude API error:', claudeResponse.status, errorData);
      return NextResponse.json(
        { 
          error: 'Claude API call failed',
          fallback: true
        },
        { status: 200 }
      );
    }

    const data = await claudeResponse.json();
    const aiResponse = data.content[0].text;

    // Parse Claude's response
    const optimization = parseClaudeResponse(aiResponse, pools, riskProfile);

    return NextResponse.json({
      success: true,
      optimization,
      usedAI: true
    });

  } catch (error) {
    console.error('Optimization API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        fallback: true
      },
      { status: 200 }
    );
  }
}

function buildOptimizationPrompt(pools: DetailedPool[], riskProfile: RiskProfile): string {
  return `
You are an expert DeFi portfolio manager specializing in Aerodrome Finance yield strategies on Base network. 
Analyze the provided pools and user profile to create an optimal portfolio allocation.

USER PROFILE:
- Investment Amount: $${riskProfile.investmentAmount.toLocaleString()}
- Risk Tolerance: ${riskProfile.riskTolerance} (${
    RISK_TOLERANCE_DESCRIPTIONS[riskProfile.riskTolerance]
  })
- Time Horizon: ${riskProfile.timeHorizon} (${
    TIME_HORIZON_DESCRIPTIONS[riskProfile.timeHorizon]
  })
- Minimum TVL Preference: $${(riskProfile.minTVL / 1000000).toFixed(1)}M
- Preferred Pool Types: ${riskProfile.poolTypes
    .map(
      (type) =>
        `${type} (${
          POOL_CATEGORIES[type as keyof typeof POOL_CATEGORIES] || type
        })`
    )
    .join(", ")}

AVAILABLE POOLS (${pools.length} pools):
${pools
  .slice(0, 20)
  .map(
    (pool) => `
- ${pool.symbol} (${pool.tokens.token0.symbol}/${pool.tokens.token1.symbol})
  * TVL: $${(pool.liquidity.tvl / 1000000).toFixed(2)}M
  * APR: ${pool.trading.apr.toFixed(2)}%
  * Volume 24h: $${(pool.trading.volume_24h / 1000000).toFixed(2)}M
  * Type: ${
    pool.type_info.is_stable
      ? "Stable"
      : pool.type_info.is_cl
      ? "Concentrated Liquidity"
      : "Volatile"
  }
  * Fees: ${(pool.trading.pool_fee_percentage)}%
`
  )
  .join("")}

REQUIREMENTS:
1. Select 3-5 pools that best match the user's profile
2. Allocate the investment across selected pools (totaling 100%)
3. Provide specific reasoning for each pool selection
4. Consider risk diversification and correlation between pools
5. Factor in liquidity depth, trading volume, and sustainability of APRs
6. Account for impermanent loss risks and user's time horizon

Please respond with a JSON structure in the following format:

\`\`\`json
{
  "recommendations": [
    {
      "poolSymbol": "ETH/USDC-V",
      "allocation": 40,
      "reasoning": [
        "High liquidity reduces slippage risk",
        "Strong trading volume ensures sustainable fees",
        "ETH exposure aligns with growth objectives"
      ],
      "riskScore": 35,
      "expectedReturn": 12.5
    }
  ],
  "portfolioSummary": {
    "expectedAPR": 15.2,
    "riskScore": 42,
    "diversificationScore": 85,
    "reasoning": [
      "Balanced approach mixing stable and growth assets",
      "Diversified across multiple pool types",
      "Risk-adjusted for conservative profile"
    ]
  }
}
\`\`\`

Analyze the pools carefully and provide thoughtful, data-driven recommendations.
`;
}

function parseClaudeResponse(response: string, pools: DetailedPool[], riskProfile: RiskProfile) {
  try {
    // console.log("Claude raw response:", response); // Debug log
    
    // Try to extract JSON from Claude's response with more flexible patterns
    let jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      jsonMatch = response.match(/```\n([\s\S]*?)\n```/);
    }
    if (!jsonMatch) {
      // Look for JSON-like structure without code blocks
      jsonMatch = response.match(/\{[\s\S]*\}/);
    }
    
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        // console.log("Extracted JSON:", jsonStr); // Debug log
        const parsed = JSON.parse(jsonStr);
        return validateAndFormatResponse(parsed, pools, riskProfile);
      } catch (parseError) {
        console.warn("JSON parse error:", parseError);
        // Fall through to text parsing
      }
    }
    
    // console.log("Falling back to text parsing");
    // If no JSON or parse failed, parse the text response
    return parseTextResponse(response, pools, riskProfile);
  } catch (error) {
    console.warn("Failed to parse Claude response:", error);
    throw new Error("Failed to parse AI response");
  }
}

function validateAndFormatResponse(parsed: any, pools: DetailedPool[], riskProfile: RiskProfile) {
  if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
    throw new Error("Invalid response format: missing recommendations array");
  }
  
  // Map pool symbols to actual pool objects
  const recommendations = parsed.recommendations.map((rec: any) => {
    // console.log(`Looking for pool: ${rec.poolSymbol}`); // Debug log
    
    let pool = pools.find(p => p.symbol === rec.poolSymbol);
    
    if (!pool) {
      // Try to find by partial symbol match
      pool = pools.find(p => 
        p.symbol.toLowerCase().includes(rec.poolSymbol.toLowerCase()) ||
        rec.poolSymbol.toLowerCase().includes(p.symbol.toLowerCase())
      );
    }
    
    if (!pool) {
      // Try to find by token symbols
      pool = pools.find(p => 
        rec.poolSymbol.includes(p.tokens.token0.symbol) && 
        rec.poolSymbol.includes(p.tokens.token1.symbol)
      );
    }
    
    if (!pool) {
      // Try to find by address if provided
      if (rec.poolAddress) {
        pool = pools.find(p => 
          p.address.toLowerCase() === rec.poolAddress.toLowerCase()
        );
      }
    }
    
    if (!pool) {
      console.warn(`Pool not found: ${rec.poolSymbol}. Available pools:`, pools.map(p => p.symbol).slice(0, 10));
      return null;
    }
    
    // console.log(`Found pool: ${pool.symbol} for ${rec.poolSymbol}`); // Debug log
    
    return {
      pool,
      allocation: rec.allocation || 0,
      reasoning: Array.isArray(rec.reasoning) ? rec.reasoning : [rec.reasoning || "AI-selected pool"],
      riskScore: rec.riskScore || calculateRiskScore(pool),
      expectedReturn: rec.expectedReturn || pool.trading.apr
    };
  }).filter(Boolean);
  
  // Normalize allocations to sum to 100%
  const totalAllocation = recommendations.reduce((sum: number, rec: any) => sum + rec.allocation, 0);
  if (totalAllocation > 0) {
    recommendations.forEach((rec: any) => {
      rec.allocation = Math.round((rec.allocation / totalAllocation) * 100);
    });
  }
  
  const portfolioSummary = {
    expectedAPR: parsed.portfolioSummary?.expectedAPR || 
      recommendations.reduce((sum: number, rec: any) => sum + (rec.expectedReturn * rec.allocation) / 100, 0),
    riskScore: parsed.portfolioSummary?.riskScore || 50,
    diversificationScore: parsed.portfolioSummary?.diversificationScore || 
      Math.min(recommendations.length * 25, 100),
    reasoning: parsed.portfolioSummary?.reasoning || 
      [`AI-optimized strategy for ${riskProfile.riskTolerance} risk tolerance`]
  };
  
  return { recommendations, portfolioSummary };
}

function parseTextResponse(response: string, pools: DetailedPool[], riskProfile: RiskProfile) {
  // Extract pool mentions from Claude's response
  const poolMentions = pools.filter(pool => 
    response.toLowerCase().includes(pool.symbol.toLowerCase()) ||
    response.toLowerCase().includes(pool.tokens.token0.symbol.toLowerCase()) ||
    response.toLowerCase().includes(pool.tokens.token1.symbol.toLowerCase())
  ).slice(0, 5); // Limit to 5 pools
  
  if (poolMentions.length === 0) {
    throw new Error("No pools found in AI response");
  }
  
  // Generate allocations based on Claude's reasoning
  const recommendations = poolMentions.map((pool) => {
    const baseAllocation = 100 / poolMentions.length;
    const allocation = Math.round(baseAllocation);
    
    // Extract reasoning for this specific pool from Claude's response
    const reasoning = extractPoolReasoning(pool, response, riskProfile);
    
    return {
      pool,
      allocation,
      reasoning,
      riskScore: calculateRiskScore(pool),
      expectedReturn: pool.trading.apr
    };
  });
  
  const portfolioSummary = {
    expectedAPR: recommendations.reduce((sum, rec) => sum + (rec.expectedReturn * rec.allocation) / 100, 0),
    riskScore: Math.round(recommendations.reduce((sum, rec) => sum + (rec.riskScore * rec.allocation) / 100, 0)),
    diversificationScore: Math.min(recommendations.length * 25, 100),
    reasoning: extractGeneralReasoning(response, riskProfile)
  };
  
  return { recommendations, portfolioSummary };
}

function extractPoolReasoning(pool: DetailedPool, response: string, riskProfile: RiskProfile): string[] {
  const reasons: string[] = [];
  const poolSymbol = pool.symbol.toLowerCase();
  const token0 = pool.tokens.token0.symbol.toLowerCase();
  const token1 = pool.tokens.token1.symbol.toLowerCase();
  const lines = response.split('\n');
  
  // Look for reasoning in the response
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes(poolSymbol) || line.includes(token0) || line.includes(token1)) {
      // Get surrounding lines for context
      const contextLines = lines.slice(Math.max(0, i-1), i + 4)
        .filter(l => l.trim().length > 10)
        .map(l => l.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim())
        .filter(l => l.length > 5 && !l.includes('```'));
      
      reasons.push(...contextLines.slice(0, 3));
      break;
    }
  }
  
  // Generate fallback reasoning if none found
  if (reasons.length === 0) {
    if (pool.type_info.is_stable) {
      reasons.push("Stable pair minimizes impermanent loss risk");
    } else if (pool.type_info.is_cl) {
      reasons.push("Concentrated liquidity offers enhanced capital efficiency");
    } else {
      reasons.push("Volatile pair provides higher yield potential");
    }
    
    if (pool.liquidity.tvl > 20000000) {
      reasons.push(`High TVL ($${(pool.liquidity.tvl / 1000000).toFixed(1)}M) ensures excellent liquidity`);
    } else if (pool.liquidity.tvl > 5000000) {
      reasons.push(`Good TVL ($${(pool.liquidity.tvl / 1000000).toFixed(1)}M) provides stable trading`);
    }
    
    if (pool.trading.apr > 15) {
      reasons.push(`Attractive ${pool.trading.apr.toFixed(1)}% APR from fees and emissions`);
    }
    
    reasons.push(`Aligns with ${riskProfile.riskTolerance} risk tolerance`);
  }
  
  return reasons.slice(0, 4);
}

function extractGeneralReasoning(response: string, riskProfile: RiskProfile): string[] {
  const reasoning: string[] = [];
  const lines = response.split('\n').filter(line => line.trim().length > 20);
  
  const summaryStart = lines.findIndex(line => 
    line.toLowerCase().includes('summary') || 
    line.toLowerCase().includes('conclusion') ||
    line.toLowerCase().includes('portfolio') ||
    line.toLowerCase().includes('strategy')
  );
  
  if (summaryStart >= 0) {
    const summaryLines = lines.slice(summaryStart, summaryStart + 5)
      .filter(line => !line.includes('```'))
      .map(line => line.replace(/^[-*•#]\s*/, '').trim())
      .filter(line => line.length > 10);
    
    reasoning.push(...summaryLines.slice(0, 4));
  }
  
  if (reasoning.length === 0) {
    reasoning.push(
      `AI-optimized strategy for ${riskProfile.riskTolerance} risk tolerance`,
      `Diversified portfolio based on comprehensive pool analysis`,
      `Strategy accounts for current market conditions and user preferences`
    );
  }
  
  return reasoning;
}

function calculateRiskScore(pool: DetailedPool): number {
  let score = 0;
  
  if (pool.type_info.is_stable) {
    score += 10;
  } else if (pool.type_info.is_cl) {
    score += 35;
  } else {
    score += 25;
  }
  
  const tvlRisk = Math.max(0, 30 - (pool.liquidity.tvl / 10000000) * 10);
  score += tvlRisk;
  
  const volumeRisk = Math.max(0, 20 - (pool.trading.volume_24h / 1000000) * 5);
  score += volumeRisk;
  
  if (pool.trading.apr > 50) score += 25;
  else if (pool.trading.apr > 30) score += 15;
  else if (pool.trading.apr > 15) score += 10;
  else score += 5;
  
  return Math.min(score, 100);
}