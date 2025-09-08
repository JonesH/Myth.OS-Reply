Short answer: we won’t run inference on-chain (that’s impossible/insane for LLMs).
We’ll run inference on Theta EdgeCloud (off-chain GPU) and put a verifiable anchor on Theta (on-chain): hashes + minimal metadata that prove what was run and what came out.

Here’s the crisp plan.
#
⸻

What goes where
	•	EdgeCloud (off-chain): run the model (moderation/classify or first reply variant). Return edge_job_id, raw outputs, timing, cost.
	•	Theta chain (on-chain): emit an event with hashes + job metadata so anyone can re-check:
sha256(inputs), sha256(outputs), modelIdHash, edge_job_id, latency_ms, cost_milli, timestamp.

No PII or full text on-chain—just hashes and identifiers.

⸻

Minimal contract (events-only, KISS)

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title InferenceAttestor - anchors EdgeCloud inference results on Theta
contract InferenceAttestor {
    event InferenceLogged(
        bytes32 receiptHash,   // sha256 of full receipt.json (inputs+outputs+meta)
        bytes32 inputHash,     // sha256 of canonicalized inputs
        bytes32 outputHash,    // sha256 of canonicalized outputs
        bytes32 modelIdHash,   // sha256("edge:llama3-70b-instruct@2025-09-07")
        bytes32 jobIdHash,     // sha256(edge_job_id string)
        uint64  ts,            // block.timestamp
        uint96  latencyMs,     // measured end-to-end latency
        uint96  costMilli,     // milli-units (e.g., $0.001 = 1)
        address caller         // who logged (backend wallet)
    );

    function attest(
        bytes32 receiptHash,
        bytes32 inputHash,
        bytes32 outputHash,
        bytes32 modelIdHash,
        bytes32 jobIdHash,
        uint96  latencyMs,
        uint96  costMilli
    ) external {
        require(receiptHash!=0 && inputHash!=0 && outputHash!=0, "bad hash");
        emit InferenceLogged(
            receiptHash, inputHash, outputHash, modelIdHash, jobIdHash,
            uint64(block.timestamp), latencyMs, costMilli, msg.sender
        );
    }
}

Why events-only: cheapest gas, no storage risk, perfect for hackathon.

⸻

Receipt JSON (off-chain, S3/EdgeStore)

{
  "tweet_id": "1876...",
  "account_handle": "@brand",
  "edge_job_id": "job-ec-2f4b...",
  "model": "edge:llama3-70b-instruct@2025-09-07",
  "inputs": { "prompt": "...", "tone": "witty", "len": "short" },
  "outputs": { "reply": "Thanks for..." },
  "latency_ms": 742,
  "cost_milli": 3,
  "created_at": "2025-09-07T12:45:03Z"
}

We compute:
	•	receiptHash = sha256(stringify(receipt))
	•	inputHash   = sha256(canonical(inputs))
	•	outputHash  = sha256(canonical(outputs))
	•	modelIdHash = sha256("edge:llama3-70b-instruct@2025-09-07")
	•	jobIdHash   = sha256(edge_job_id)

…and pass those to attest().

⸻

Flow (per reply job)
	1.	Generate on EdgeCloud → {edge_job_id, output, latency, cost}
	2.	Build receipt.json → store S3/EdgeStore → compute hashes
	3.	Attest: call InferenceAttestor.attest(...) on Theta testnet
	4.	Show in UI: Edge job id, on-chain tx link, receipt link

This proves the inference happened and ties it to a model + job id without exposing raw content on-chain.

⸻

Next.js glue (server-side)

import { createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const RPC = "https://eth-rpc-api-testnet.thetatoken.org/rpc";
const CHAIN = { id: 365, name: "theta-testnet", nativeCurrency:{name:"TFUEL",symbol:"TFUEL",decimals:18} };

const ATT = {
  addr: process.env.ATTESTOR_ADDR as `0x${string}`,
  abi: parseAbi(["function attest(bytes32,bytes32,bytes32,bytes32,bytes32,uint96,uint96) external"])
};

const sha256hex = async (s: string) => {
  const b = new TextEncoder().encode(s);
  const h = await crypto.subtle.digest("SHA-256", b);
  return ("0x"+Array.from(new Uint8Array(h)).map(x=>x.toString(16).padStart(2,"0")).join("")) as `0x${string}`;
};

export async function logInference({
  receipt, inputs, outputs, model, edgeJobId, latencyMs, costMilli
}: {
  receipt: object; inputs: object; outputs: object;
  model: string; edgeJobId: string; latencyMs: number; costMilli: number;
}) {
  const [receiptHash, inputHash, outputHash, modelIdHash, jobIdHash] = await Promise.all([
    sha256hex(JSON.stringify(receipt)),
    sha256hex(JSON.stringify(inputs)),
    sha256hex(JSON.stringify(outputs)),
    sha256hex(model),
    sha256hex(edgeJobId),
  ]);

  const signer = createWalletClient({
    chain: CHAIN,
    transport: http(RPC),
    account: privateKeyToAccount(process.env.CHAIN_SENDER_PK as `0x${string}`)
  });

  return signer.writeContract({
    address: ATT.addr, abi: ATT.abi, functionName: "attest",
    args: [receiptHash, inputHash, outputHash, modelIdHash, jobIdHash, BigInt(latencyMs), BigInt(costMilli)]
  });
}


⸻

DB additions (Prisma)

model ReplyJob {
  id            String  @id @default(cuid())
  tweetId       String  @unique
  edgeJobId     String?
  receiptS3Key  String?
  receiptHash   String?
  inputHash     String?
  outputHash    String?
  modelIdHash   String?
  txHashAttest  String?
  latencyMs     Int?
  costMilli     Int?
  createdAt     DateTime @default(now())
}


⸻

What to demo
	•	Toggle “Use EdgeCloud” in job settings.
	•	Run a reply: show Edge Job ID and Explorer link to the attestation tx.
	•	Open receipt.json and explain the hashes tie everything together.

⸻

Cost, privacy, and failure modes
	•	Gas: event-only = very cheap on Theta testnet; a few TFUEL covers the demo.
	•	Privacy: keep raw text off-chain; only hashes + model/job IDs on-chain.
	•	If RPC fails: queue retries; attestation can happen async—reply still posts.
	•	If EdgeCloud is slow: call it once per reply (moderation or first variant), not per variant.

⸻

Stretch (if time allows)
	•	Batch attestation: Merkle-root per 50 receipts → one tx.
	•	Off-chain EAS receipts (signed JSON) stored next to receipt.json, anchored by the same hash.
	•	Simple paymaster for TFUEL per verified reply later.
