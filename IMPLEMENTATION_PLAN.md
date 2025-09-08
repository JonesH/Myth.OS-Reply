# IMPLEMENTATION_PLAN.md - ULTRA-TDD Approach

## Architectural Decision: TypeScript + Vercel AI SDK for EdgeCloud Integration

**CRITICAL TDD RULE**: Write ONE failing test → Make it pass → Write next test. Never skip a red test.

## Phase 1: AI SDK Foundation (Ultra-Atomic TDD)

### Test 1: AI SDK Installation Verification
```typescript
// __tests__/ai-sdk-setup.test.ts
test('can import AI SDK modules', () => {
  expect(() => require('ai')).not.toThrow();
  expect(() => require('@openrouter/ai-sdk-provider')).not.toThrow();
});
```
**Implementation**: Install packages, make test green.

### Test 2: OpenRouter Provider Creation
```typescript
// __tests__/openrouter-provider.test.ts
test('creates OpenRouter provider instance', () => {
  const provider = openrouter('openai/gpt-4o');
  expect(provider).toBeDefined();
});
```
**Implementation**: Import and configure OpenRouter provider.

### Test 3: Mock generateText Call
```typescript
test('generateText returns text response', async () => {
  const mockResponse = { text: 'Hello world' };
  // Mock the generateText function
  const result = await generateText({ model: mockProvider, prompt: 'test' });
  expect(result.text).toBe('Hello world');
});
```
**Implementation**: Set up mocking infrastructure.

### Test 4: Real OpenRouter Integration
```typescript
test('OpenRouter provider generates real response', async () => {
  const result = await generateText({
    model: openrouter('openai/gpt-4o'),
    prompt: 'Say "test"',
  });
  expect(result.text).toBeDefined();
  expect(result.text.length).toBeGreaterThan(0);
}, 10000);
```
**Implementation**: Configure real API key, make actual call.

## Phase 2: EdgeCloud Provider (Ultra-Atomic TDD)

### Test 5: EdgeCloud HTTP Client
```typescript
test('EdgeCloud client makes HTTP request', async () => {
  const client = new EdgeCloudClient({ apiKey: 'test-key' });
  const mockResponse = { data: 'response' };
  // Mock HTTP call
  const result = await client.makeRequest('/inference', { prompt: 'test' });
  expect(result.data).toBeDefined();
});
```
**Implementation**: Create basic HTTP client class.

### Test 6: EdgeCloud Response Parsing
```typescript
test('parses EdgeCloud response to AI SDK format', () => {
  const edgeResponse = { output: 'AI response', job_id: '123', latency_ms: 500 };
  const parsed = parseEdgeCloudResponse(edgeResponse);
  expect(parsed.text).toBe('AI response');
  expect(parsed.providerMetadata.edgecloud.jobId).toBe('123');
});
```
**Implementation**: Create response parser function.

### Test 7: EdgeCloud Provider Interface
```typescript
test('EdgeCloud provider implements generateText interface', async () => {
  const edgecloud = createEdgeCloudProvider({ apiKey: 'test' });
  const result = await generateText({
    model: edgecloud('llama-3-70b'),
    prompt: 'test prompt'
  });
  expect(result.text).toBeDefined();
  expect(result.providerMetadata?.edgecloud?.jobId).toBeDefined();
});
```
**Implementation**: Build provider that follows AI SDK interface.

## Phase 3: Provider Selection (Ultra-Atomic TDD)

### Test 8: Environment Variable Reading
```typescript
test('reads USE_EDGECLOUD environment variable', () => {
  process.env.USE_EDGECLOUD = 'true';
  const useEdgeCloud = shouldUseEdgeCloud();
  expect(useEdgeCloud).toBe(true);
});
```
**Implementation**: Create config reading function.

### Test 9: Provider Factory
```typescript
test('provider factory returns EdgeCloud when configured', () => {
  process.env.USE_EDGECLOUD = 'true';
  const provider = createAIProvider();
  expect(provider.type).toBe('edgecloud');
});

test('provider factory returns OpenRouter by default', () => {
  delete process.env.USE_EDGECLOUD;
  const provider = createAIProvider();
  expect(provider.type).toBe('openrouter');
});
```
**Implementation**: Create provider factory function.

## Phase 4: Theta Blockchain Integration (Ultra-Atomic TDD)

### Test 10: Foundry Smart Contract Setup
```bash
# Initialize Foundry project structure
mkdir contracts && cd contracts && forge init --no-git --no-commit
```
**Implementation**: Create Foundry project with InferenceAttestor.sol contract.

### Test 11: Contract Deployment to Theta Testnet
```bash
# Deploy to Theta testnet
forge script script/Deploy.s.sol --rpc-url theta_testnet --broadcast --verify
```
**Implementation**: Deploy InferenceAttestor contract to Theta testnet.

### Test 12: Hash Generation Utils
```typescript
test('generates SHA256 hash for string', async () => {
  const hash = await sha256hex('test input');
  expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
});

test('generates same hash for same input', async () => {
  const hash1 = await sha256hex('test');
  const hash2 = await sha256hex('test');
  expect(hash1).toBe(hash2);
});
```
**Implementation**: Create hash utility functions using Web Crypto API.

### Test 13: Attestation Data Extraction
```typescript
test('extracts attestation data from AI response', () => {
  const aiResponse = {
    text: 'AI response',
    providerMetadata: { edgecloud: { jobId: '123', latency: 500 } },
    usage: { cost: 0.001 }
  };
  const attestationData = extractAttestationData(aiResponse, 'input prompt');
  expect(attestationData.jobId).toBe('123');
  expect(attestationData.inputHash).toBeDefined();
  expect(attestationData.outputHash).toBeDefined();
});
```
**Implementation**: Create attestation data extractor.

### Test 14: Viem Integration for Contract Calls
```typescript
test('creates valid attestation transaction', async () => {
  const attestationData = {
    receiptHash: '0x123...',
    inputHash: '0x456...',
    outputHash: '0x789...',
    modelIdHash: '0xabc...',
    jobIdHash: '0xdef...',
    latencyMs: 500,
    costMilli: 3
  };
  const txHash = await attestOnChain(attestationData);
  expect(txHash).toMatch(/^0x[a-f0-9]{64}$/);
});
```
**Implementation**: Integrate viem for Theta testnet contract calls.

### Test 15: Receipt JSON Storage
```typescript
test('stores receipt JSON and computes hashes', async () => {
  const receipt = {
    tweet_id: '1876...',
    edge_job_id: 'job-ec-2f4b...',
    inputs: { prompt: 'test' },
    outputs: { reply: 'response' }
  };
  const result = await storeReceipt(receipt);
  expect(result.receiptHash).toBeDefined();
  expect(result.s3Key).toBeDefined();
});
```
**Implementation**: Create receipt storage and hash computation.

## Phase 5: API Integration (Ultra-Atomic TDD)

### Test 16: API Route Handler
```typescript
test('reply generation API uses provider factory', async () => {
  const req = { body: { prompt: 'test', useEdgeCloud: true } };
  const res = await handleReplyGeneration(req);
  expect(res.reply).toBeDefined();
  expect(res.attestation).toBeDefined();
});
```
**Implementation**: Update existing API routes.

### Test 17: Database Schema Update
```prisma
model ReplyJob {
  // ... existing fields ...
  edgeJobId     String?
  receiptS3Key  String?
  receiptHash   String?
  inputHash     String?
  outputHash    String?
  modelIdHash   String?
  txHashAttest  String?
  latencyMs     Int?
  costMilli     Int?
}
```
**Implementation**: Add blockchain fields to Prisma schema.

### Test 18: End-to-End Integration
```typescript
test('complete flow: AI generation → attestation → database', async () => {
  const result = await generateAndAttestReply('test prompt');
  expect(result.reply).toBeDefined();
  expect(result.txHash).toBeDefined();
  expect(result.dbRecord).toBeDefined();
});
```
**Implementation**: Wire everything together.

## TDD Rules Enforced:
1. **Write ONE test** → Make it green → Move to next
2. **Never skip a red test** - fix immediately  
3. **Smallest possible implementations** to make tests pass
4. **No complex setup** - each test is atomic
5. **Mock external dependencies** until ready for integration

## Implementation Order:
1. Install packages → Test 1 passes
2. Basic provider setup → Test 2 passes
3. Mocking infrastructure → Test 3 passes
4. Real API integration → Test 4 passes
5. Continue sequentially through all tests

**Success criteria**: Every test green before moving to next phase. No red tests allowed in codebase.