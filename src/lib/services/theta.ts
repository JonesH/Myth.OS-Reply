import { createHash } from 'crypto'
import { createPublicClient, http, parseEther, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// Theta testnet configuration (TFUEL native currency)
const THETA_CHAIN = {
  id: 365,
  name: 'Theta Testnet',
  network: 'theta-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TFUEL',
    symbol: 'TFUEL',
  },
  rpcUrls: {
    default: {
      http: [process.env.THETA_TESTNET_RPC_URL || 'https://eth-rpc-api-testnet.thetatoken.org/rpc'],
    },
    public: {
      http: [process.env.THETA_TESTNET_RPC_URL || 'https://eth-rpc-api-testnet.thetatoken.org/rpc'],
    },
  },
}

// Create Theta testnet client
const thetaClient = createPublicClient({
  chain: THETA_CHAIN,
  transport: http()
})

export interface SubscriptionPlan {
  id: string
  name: string
  priceInTheta: string
  durationDays: number
}

export interface PaymentTransaction {
  hash: string
  from: string
  to: string
  value: string
  blockNumber: bigint
  timestamp: Date
}

export interface UserSubscription {
  isActive: boolean
  planType: string | null
  expiresAt: Date | null
  lastPayment: PaymentTransaction | null
}

export class ThetaPaymentService {
  private static readonly SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Basic Plan',
      priceInTheta: '1',
      durationDays: 30,
    },
    {
      id: 'premium', 
      name: 'Premium Plan',
      priceInTheta: '5',
      durationDays: 30,
    }
  ]

  /**
   * Generate deterministic payment address for a user
   */
  static generateUserPaymentAddress(userId: string): string {
    const masterSeed = process.env.THETA_MASTER_SEED
    if (!masterSeed) {
      throw new Error('THETA_MASTER_SEED environment variable not set')
    }

    // Create deterministic hash from userId + master seed
    const hash = createHash('sha256')
      .update(masterSeed + userId)
      .digest('hex')

    // Generate private key from hash
    const privateKey = `0x${hash}` as `0x${string}`
    
    // Generate account from private key
    const account = privateKeyToAccount(privateKey)
    
    return account.address
  }

  /**
   * Get available subscription plans
   */
  static getSubscriptionPlans(): SubscriptionPlan[] {
    return [...this.SUBSCRIPTION_PLANS]
  }

  /**
   * Get plan by payment amount (string TFUEL amount, e.g., "1" or "5")
   */
  static getPlanByAmount(amountInTheta: string): SubscriptionPlan | null {
    try {
      // Normalize formatted string to wei and compare exactly
      const wei = parseEther(amountInTheta)
      return this.getPlanByAmountWei(wei)
    } catch {
      return null
    }
  }

  /**
   * Get plan by payment amount in wei (BigInt)
   */
  static getPlanByAmountWei(amountWei: bigint): SubscriptionPlan | null {
    const basic = parseEther('1')
    const premium = parseEther('5')
    if (amountWei === basic) return this.SUBSCRIPTION_PLANS.find(p => p.id === 'basic') || null
    if (amountWei === premium) return this.SUBSCRIPTION_PLANS.find(p => p.id === 'premium') || null
    return null
  }

  /**
   * Get transaction history for an address
   */
  static async getTransactionHistory(address: string): Promise<PaymentTransaction[]> {
    try {
      // Get latest block number
      const latestBlock = await thetaClient.getBlockNumber()
      
      // Look back 1000 blocks for transactions (roughly 1-2 days on Theta)
      const fromBlock = latestBlock - BigInt(1000) > BigInt(0) ? latestBlock - BigInt(1000) : BigInt(0)
      
      // Get transaction logs (this is a simplified approach)
      // In a production system, you'd want to index transactions more efficiently
      const transactions: PaymentTransaction[] = []
      
      // Note: This is a basic implementation. For production, you'd want to:
      // 1. Use event logs or transaction indexing
      // 2. Cache transaction history
      // 3. Use pagination for large histories
      
      for (let blockNumber = fromBlock; blockNumber <= latestBlock; blockNumber++) {
        try {
          const block = await thetaClient.getBlock({
            blockNumber,
            includeTransactions: true
          })
          
          if (block.transactions) {
            for (const tx of block.transactions) {
              if (typeof tx === 'object' && tx.to?.toLowerCase() === address.toLowerCase() && tx.value > BigInt(0)) {
                transactions.push({
                  hash: tx.hash,
                  from: tx.from,
                  to: tx.to,
                  value: formatEther(tx.value),
                  blockNumber: block.number!,
                  timestamp: new Date(Number(block.timestamp) * 1000)
                })
              }
            }
          }
        } catch (error) {
          // Skip blocks that can't be fetched
          continue
        }
      }
      
      // Sort by timestamp (newest first)
      return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      
    } catch (error) {
      console.error('Error fetching transaction history:', error)
      return []
    }
  }

  /**
   * Get user's current subscription status
   */
  static async getUserSubscription(userId: string): Promise<UserSubscription> {
    const paymentAddress = this.generateUserPaymentAddress(userId)
    const transactions = await this.getTransactionHistory(paymentAddress)
    
    // Find the most recent valid payment
    for (const tx of transactions) {
      const plan = this.getPlanByAmount(tx.value)
      if (plan) {
        const expiresAt = new Date(tx.timestamp.getTime() + (plan.durationDays * 24 * 60 * 60 * 1000))
        const isActive = new Date() < expiresAt
        
        return {
          isActive,
          planType: plan.id,
          expiresAt,
          lastPayment: tx
        }
      }
    }
    
    // No valid subscription found
    return {
      isActive: false,
      planType: null,
      expiresAt: null,
      lastPayment: null
    }
  }

  /**
   * Verify a specific transaction hash
   */
  static async verifyTransaction(txHash: string): Promise<PaymentTransaction | null> {
    try {
      const tx = await thetaClient.getTransaction({ hash: txHash as `0x${string}` })
      const receipt = await thetaClient.getTransactionReceipt({ hash: txHash as `0x${string}` })
      
      if (receipt.status === 'success' && tx.to && tx.value > BigInt(0)) {
        const block = await thetaClient.getBlock({ blockHash: receipt.blockHash })
        
        return {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: formatEther(tx.value),
          blockNumber: receipt.blockNumber,
          timestamp: new Date(Number(block.timestamp) * 1000)
        }
      }
      
      return null
    } catch (error) {
      console.error('Error verifying transaction:', error)
      return null
    }
  }
}
