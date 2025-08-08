interface EnvironmentConfig {
  walletConnectProjectId?: string
}

interface ValidationResult {
  isValid: boolean
  warnings: string[]
  errors: string[]
  config: EnvironmentConfig
}

export function validateEnvironment(): ValidationResult {
  const warnings: string[] = []
  const errors: string[] = []
  
  const config: EnvironmentConfig = {
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  }

  // Critical environment variables (client-side only)
  if (!config.walletConnectProjectId || config.walletConnectProjectId === "demo") {
    errors.push("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required for wallet connections")
  }

  // Note: All other sensitive variables (API keys, RPC URLs) are now handled server-side for security

  const isValid = errors.length === 0

  return {
    isValid,
    warnings,
    errors,
    config,
  }
}

export function logEnvironmentStatus() {
  const result = validateEnvironment()
  
  console.log("🔧 Environment Configuration Status:")
  
  if (result.isValid) {
  } else {
    console.log("❌ Missing critical environment variables:")
    result.errors.forEach(error => console.log(`  - ${error}`))
  }
  
  if (result.warnings.length > 0) {
    console.log("⚠️  Environment warnings:")
    result.warnings.forEach(warning => console.log(`  - ${warning}`))
  }
  
  return result
}