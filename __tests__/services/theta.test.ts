import { createHash } from 'crypto'
import { privateKeyToAccount } from 'viem/accounts'
import { parseEther, formatEther } from 'viem'

// Mock viem client methods
const mockGetBlockNumber = jest.fn()
const mockGetBlock = jest.fn()
const mockGetTransaction = jest.fn()
const mockGetTransactionReceipt = jest.fn()

// Mock external dependencies BEFORE importing the service
jest.mock('crypto')
jest.mock('viem/accounts')
jest.mock('viem', () => ({
  createPublicClient: jest.fn(() => ({
    getBlockNumber: mockGetBlockNumber,
    getBlock: mockGetBlock,
    getTransaction: mockGetTransaction,
    getTransactionReceipt: mockGetTransactionReceipt,
  })),
  http: jest.fn(),
  parseEther: jest.fn(),
  formatEther: jest.fn(),
}))

// Import the service AFTER mocks are set up
import { ThetaPaymentService } from '@/lib/services/theta'

const mockedCreateHash = createHash as jest.MockedFunction<typeof createHash>
const mockedPrivateKeyToAccount = privateKeyToAccount as jest.MockedFunction<typeof privateKeyToAccount>
const mockedParseEther = parseEther as jest.MockedFunction<typeof parseEther>
const mockedFormatEther = formatEther as jest.MockedFunction<typeof formatEther>

describe('ThetaPaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up environment variables for tests
    process.env.THETA_MASTER_SEED = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    
    // Setup default mocks
    mockedParseEther.mockImplementation((value: string) => {
      if (value === '1') return BigInt('1000000000000000000') // 1 TFUEL
      if (value === '5') return BigInt('5000000000000000000') // 5 TFUEL
      return BigInt(0)
    })
    
    mockedFormatEther.mockImplementation((value: bigint) => {
      if (value === BigInt('1000000000000000000')) return '1'
      if (value === BigInt('5000000000000000000')) return '5'
      return '0'
    })

    // Setup blockchain client mocks with default successful responses
    mockGetBlockNumber.mockResolvedValue(BigInt(12345))
    
    mockGetBlock.mockResolvedValue({
      number: BigInt(12345),
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
      hash: '0xblockHash123',
    })
    
    mockGetTransaction.mockResolvedValue({
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      from: '0xsender123456789012345678901234567890123456',
      to: '0x1234567890123456789012345678901234567890',
      value: BigInt('1000000000000000000'), // 1 TFUEL
      blockNumber: BigInt(12345),
    })
    
    mockGetTransactionReceipt.mockResolvedValue({
      status: 'success',
      blockNumber: BigInt(12345),
      transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    })
  })

  describe('generateUserPaymentAddress', () => {
    it('should generate deterministic address for user', () => {
      // Arrange
      const userId = 'user123'
      const expectedHash = 'mockhashedvalue123456789012345678901234567890123456789012345678'
      const expectedAddress = '0x1234567890123456789012345678901234567890'
      
      const mockHashInstance = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(expectedHash)
      }
      
      mockedCreateHash.mockReturnValue(mockHashInstance as any)
      mockedPrivateKeyToAccount.mockReturnValue({
        address: expectedAddress
      } as any)

      // Act
      const result = ThetaPaymentService.generateUserPaymentAddress(userId)

      // Assert
      expect(result).toBe(expectedAddress)
      expect(mockedCreateHash).toHaveBeenCalledWith('sha256')
      expect(mockHashInstance.update).toHaveBeenCalledWith(process.env.THETA_MASTER_SEED + userId)
      expect(mockHashInstance.digest).toHaveBeenCalledWith('hex')
      expect(mockedPrivateKeyToAccount).toHaveBeenCalledWith(`0x${expectedHash}`)
    })

    it('should generate different addresses for different users', () => {
      // Arrange
      const userId1 = 'user123'
      const userId2 = 'user456'
      const address1 = '0x1111111111111111111111111111111111111111'
      const address2 = '0x2222222222222222222222222222222222222222'
      
      const mockHashInstance = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn()
          .mockReturnValueOnce('hash1')
          .mockReturnValueOnce('hash2')
      }
      
      mockedCreateHash.mockReturnValue(mockHashInstance as any)
      mockedPrivateKeyToAccount
        .mockReturnValueOnce({ address: address1 } as any)
        .mockReturnValueOnce({ address: address2 } as any)

      // Act
      const result1 = ThetaPaymentService.generateUserPaymentAddress(userId1)
      const result2 = ThetaPaymentService.generateUserPaymentAddress(userId2)

      // Assert
      expect(result1).toBe(address1)
      expect(result2).toBe(address2)
      expect(result1).not.toBe(result2)
    })

    it('should throw error when THETA_MASTER_SEED is not set', () => {
      // Arrange
      delete process.env.THETA_MASTER_SEED

      // Act & Assert
      expect(() => {
        ThetaPaymentService.generateUserPaymentAddress('user123')
      }).toThrow('THETA_MASTER_SEED environment variable not set')
    })
  })

  describe('getSubscriptionPlans', () => {
    it('should return predefined subscription plans', () => {
      // Act
      const plans = ThetaPaymentService.getSubscriptionPlans()

      // Assert
      expect(plans).toHaveLength(2)
      
      expect(plans[0]).toEqual({
        id: 'basic',
        name: 'Basic Plan',
        priceInTheta: '1',
        durationDays: 30,
      })
      
      expect(plans[1]).toEqual({
        id: 'premium',
        name: 'Premium Plan',
        priceInTheta: '5',
        durationDays: 30,
      })
    })

    it('should return immutable plans array', () => {
      // Act
      const plans1 = ThetaPaymentService.getSubscriptionPlans()
      const plans2 = ThetaPaymentService.getSubscriptionPlans()

      // Assert
      expect(plans1).toEqual(plans2)
      expect(plans1).not.toBe(plans2) // Should be different instances
    })
  })

  describe('getPlanByAmount', () => {
    it('should return basic plan for 1 TFUEL', () => {
      // Act
      const plan = ThetaPaymentService.getPlanByAmount('1')

      // Assert
      expect(plan).not.toBeNull()
      expect(plan!.id).toBe('basic')
      expect(plan!.name).toBe('Basic Plan')
      expect(plan!.priceInTheta).toBe('1')
    })

    it('should return premium plan for 5 TFUEL', () => {
      // Act
      const plan = ThetaPaymentService.getPlanByAmount('5')

      // Assert
      expect(plan).not.toBeNull()
      expect(plan!.id).toBe('premium')
      expect(plan!.name).toBe('Premium Plan')
      expect(plan!.priceInTheta).toBe('5')
    })

    it('should return null for invalid amounts', () => {
      // Test various invalid amounts
      expect(ThetaPaymentService.getPlanByAmount('0')).toBeNull()
      expect(ThetaPaymentService.getPlanByAmount('2')).toBeNull()
      expect(ThetaPaymentService.getPlanByAmount('10')).toBeNull()
      expect(ThetaPaymentService.getPlanByAmount('0.5')).toBeNull()
    })

    it('should handle parseEther errors gracefully', () => {
      // Arrange
      mockedParseEther.mockImplementation(() => {
        throw new Error('Invalid ether value')
      })

      // Act
      const result = ThetaPaymentService.getPlanByAmount('invalid')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getPlanByAmountWei', () => {
    it('should return basic plan for 1 TFUEL in wei', () => {
      // Arrange
      const oneEtherWei = BigInt('1000000000000000000')

      // Act
      const plan = ThetaPaymentService.getPlanByAmountWei(oneEtherWei)

      // Assert
      expect(plan).not.toBeNull()
      expect(plan!.id).toBe('basic')
    })

    it('should return premium plan for 5 TFUEL in wei', () => {
      // Arrange
      const fiveEtherWei = BigInt('5000000000000000000')

      // Act
      const plan = ThetaPaymentService.getPlanByAmountWei(fiveEtherWei)

      // Assert
      expect(plan).not.toBeNull()
      expect(plan!.id).toBe('premium')
    })

    it('should return null for invalid wei amounts', () => {
      // Test various invalid wei amounts
      expect(ThetaPaymentService.getPlanByAmountWei(BigInt(0))).toBeNull()
      expect(ThetaPaymentService.getPlanByAmountWei(BigInt('2000000000000000000'))).toBeNull()
      expect(ThetaPaymentService.getPlanByAmountWei(BigInt('500000000000000000'))).toBeNull() // 0.5 TFUEL
    })
  })

  describe('verifyTransaction', () => {
    it('should verify successful transaction', async () => {
      // Arrange
      const txHash = '0xabcdef123456789'
      const mockTransaction = {
        hash: txHash,
        from: '0xsender123',
        to: '0xrecipient456',
        value: BigInt('1000000000000000000')
      }
      const mockReceipt = {
        status: 'success',
        blockNumber: BigInt(12345),
        blockHash: '0xblock123'
      }
      const mockBlock = {
        timestamp: BigInt(1640995200) // 2022-01-01 00:00:00 UTC
      }

      mockGetTransaction.mockResolvedValue(mockTransaction)
      mockGetTransactionReceipt.mockResolvedValue(mockReceipt)
      mockGetBlock.mockResolvedValue(mockBlock)

      // Act
      const result = await ThetaPaymentService.verifyTransaction(txHash)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.hash).toBe(txHash)
      expect(result!.from).toBe(mockTransaction.from)
      expect(result!.to).toBe(mockTransaction.to)
      expect(result!.value).toBe('1')
      expect(result!.blockNumber).toBe(BigInt(12345))
      expect(result!.timestamp).toEqual(new Date(1640995200 * 1000))
    })

    it('should return null for failed transaction', async () => {
      // Arrange
      const txHash = '0xfailedtx123'
      const mockTransaction = {
        hash: txHash,
        from: '0xsender123',
        to: '0xrecipient456',
        value: BigInt('1000000000000000000')
      }
      const mockReceipt = {
        status: 'reverted', // Failed transaction
        blockNumber: BigInt(12345),
        blockHash: '0xblock123'
      }

      mockGetTransaction.mockResolvedValue(mockTransaction)
      mockGetTransactionReceipt.mockResolvedValue(mockReceipt)

      // Act
      const result = await ThetaPaymentService.verifyTransaction(txHash)

      // Assert
      expect(result).toBeNull()
    })

    it('should return null for zero value transaction', async () => {
      // Arrange
      const txHash = '0xzerovaluetx123'
      const mockTransaction = {
        hash: txHash,
        from: '0xsender123',
        to: '0xrecipient456',
        value: BigInt(0) // Zero value
      }
      const mockReceipt = {
        status: 'success',
        blockNumber: BigInt(12345),
        blockHash: '0xblock123'
      }

      mockGetTransaction.mockResolvedValue(mockTransaction)
      mockGetTransactionReceipt.mockResolvedValue(mockReceipt)

      // Act
      const result = await ThetaPaymentService.verifyTransaction(txHash)

      // Assert
      expect(result).toBeNull()
    })

    it('should return null when transaction has no recipient', async () => {
      // Arrange
      const txHash = '0xnorecipienttx123'
      const mockTransaction = {
        hash: txHash,
        from: '0xsender123',
        to: null, // Contract creation or no recipient
        value: BigInt('1000000000000000000')
      }
      const mockReceipt = {
        status: 'success',
        blockNumber: BigInt(12345),
        blockHash: '0xblock123'
      }

      mockGetTransaction.mockResolvedValue(mockTransaction)
      mockGetTransactionReceipt.mockResolvedValue(mockReceipt)

      // Act
      const result = await ThetaPaymentService.verifyTransaction(txHash)

      // Assert
      expect(result).toBeNull()
    })

    it('should return null when blockchain calls fail', async () => {
      // Arrange
      const txHash = '0xinvalidtx123'
      mockGetTransaction.mockRejectedValue(new Error('Transaction not found'))

      // Act
      const result = await ThetaPaymentService.verifyTransaction(txHash)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getUserSubscription', () => {
    it('should return active subscription for user with valid payment', async () => {
      // Arrange
      const userId = 'user123'
      const userAddress = '0x1234567890123456789012345678901234567890'
      
      // Mock address generation
      const mockHashInstance = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('mockhashedvalue')
      }
      mockedCreateHash.mockReturnValue(mockHashInstance as any)
      mockedPrivateKeyToAccount.mockReturnValue({
        address: userAddress
      } as any)

      // Mock transaction history with valid payment (use fixed timestamp without milliseconds)
      const fixedTimestamp = Math.floor(Date.now() / 1000) * 1000 - (10 * 24 * 60 * 60 * 1000) // 10 days ago, no milliseconds
      const mockTransaction = {
        hash: '0xvalidpayment123',
        from: '0xsender123',
        to: userAddress,
        value: '1', // 1 TFUEL for basic plan
        blockNumber: BigInt(12345),
        timestamp: new Date(fixedTimestamp)
      }

      // Mock blockchain calls
      mockGetBlockNumber.mockResolvedValue(BigInt(13000))
      mockGetBlock.mockResolvedValue({
        number: BigInt(12345),
        timestamp: BigInt(fixedTimestamp / 1000),
        transactions: [{
          hash: mockTransaction.hash,
          from: mockTransaction.from,
          to: mockTransaction.to,
          value: BigInt('1000000000000000000')
        }]
      })

      // Act
      const result = await ThetaPaymentService.getUserSubscription(userId)

      // Assert
      expect(result.isActive).toBe(true)
      expect(result.planType).toBe('basic')
      expect(result.lastPayment).not.toBeNull()
      expect(result.lastPayment!.hash).toBe(mockTransaction.hash)
      
      // Check expiry date is correctly calculated (30 days from payment)
      const expectedExpiry = new Date(mockTransaction.timestamp.getTime() + (30 * 24 * 60 * 60 * 1000))
      expect(result.expiresAt).toEqual(expectedExpiry)
    })

    it('should return inactive subscription for user with no payments', async () => {
      // Arrange
      const userId = 'usernosubscription'
      const userAddress = '0x9999999999999999999999999999999999999999'
      
      // Mock address generation
      const mockHashInstance = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('mockhashedvalue')
      }
      mockedCreateHash.mockReturnValue(mockHashInstance as any)
      mockedPrivateKeyToAccount.mockReturnValue({
        address: userAddress
      } as any)

      // Mock empty transaction history
      mockGetBlockNumber.mockResolvedValue(BigInt(13000))
      mockGetBlock.mockResolvedValue({
        number: BigInt(12345),
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        transactions: [] // No transactions
      })

      // Act
      const result = await ThetaPaymentService.getUserSubscription(userId)

      // Assert
      expect(result.isActive).toBe(false)
      expect(result.planType).toBeNull()
      expect(result.expiresAt).toBeNull()
      expect(result.lastPayment).toBeNull()
    })

    it('should return inactive subscription for expired payment', async () => {
      // Arrange
      const userId = 'userexpired'
      const userAddress = '0x5555555555555555555555555555555555555555'
      
      // Mock address generation
      const mockHashInstance = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('mockhashedvalue')
      }
      mockedCreateHash.mockReturnValue(mockHashInstance as any)
      mockedPrivateKeyToAccount.mockReturnValue({
        address: userAddress
      } as any)

      // Mock transaction history with expired payment (45 days ago, basic plan expires after 30 days)
      const expiredTimestamp = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      const mockTransaction = {
        hash: '0xexpiredpayment123',
        from: '0xsender123',
        to: userAddress,
        value: '1',
        blockNumber: BigInt(10000),
        timestamp: expiredTimestamp
      }

      mockGetBlockNumber.mockResolvedValue(BigInt(13000))
      mockGetBlock.mockResolvedValue({
        number: BigInt(10000),
        timestamp: BigInt(Math.floor(expiredTimestamp.getTime() / 1000)),
        transactions: [{
          hash: mockTransaction.hash,
          from: mockTransaction.from,
          to: mockTransaction.to,
          value: BigInt('1000000000000000000')
        }]
      })

      // Act
      const result = await ThetaPaymentService.getUserSubscription(userId)

      // Assert
      expect(result.isActive).toBe(false) // Should be inactive due to expiry
      expect(result.planType).toBe('basic') // But still shows the plan type
      expect(result.lastPayment).not.toBeNull()
    })

    it('should handle blockchain errors gracefully', async () => {
      // Arrange
      const userId = 'usererror'
      
      // Mock address generation
      const mockHashInstance = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('mockhashedvalue')
      }
      mockedCreateHash.mockReturnValue(mockHashInstance as any)
      mockedPrivateKeyToAccount.mockReturnValue({
        address: '0x1111111111111111111111111111111111111111'
      } as any)

      // Mock blockchain error
      mockGetBlockNumber.mockRejectedValue(new Error('Blockchain connection failed'))

      // Act
      const result = await ThetaPaymentService.getUserSubscription(userId)

      // Assert
      expect(result.isActive).toBe(false)
      expect(result.planType).toBeNull()
      expect(result.expiresAt).toBeNull()
      expect(result.lastPayment).toBeNull()
    })
  })
})