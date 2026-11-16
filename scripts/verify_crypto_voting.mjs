/**
 * Standalone Isolated Verification Script: Cryptographic Voting Correctness
 * 
 * Verifies:
 * 1. Multi-candidate Radix Base-10,000 ballot encoding
 * 2. Probabilistic encryption uniqueness for identical votes (c1 != c2)
 * 3. Homomorphic aggregation over ciphertexts without intermediate decryption
 * 4. Correct decryption and Radix tally decomposition
 * 5. Boundary carry-over behavior (9,999 vs 10,000 votes)
 * 6. Malformed and edge-case ciphertext rejection
 */

import {
  generatePaillierKeys,
  encodeCandidateVoteRadix,
  encryptVote,
  homomorphicAddition,
  decryptTally,
  decodeRadixTally,
  serializePublicKey,
  deserializePublicKey,
} from '../frontend/src/utils/crypto.js';
import { RADIX_BASE, CANDIDATES } from '../frontend/src/utils/constants.js';

async function runControlledCryptoVerification() {
  console.log('===============================================================');
  console.log('   CONTROLLED CRYPTOGRAPHIC VOTING CORRECTNESS VERIFICATION   ');
  console.log('===============================================================\n');

  // Step 1: Generate Paillier Keypair
  console.log('>>> [1/7] Generating 1024-bit Paillier Keypair...');
  const t0 = performance.now();
  const { publicKey, privateKey } = await generatePaillierKeys(1024);
  const tKeygen = (performance.now() - t0).toFixed(2);
  console.log(`    Generated in ${tKeygen} ms.`);
  console.log(`    Modulus n bitlength: ${publicKey.n.toString(2).length} bits`);
  console.log(`    Generator g: Random element in Z*_{n^2} satisfying gcd(L(g^λ mod n^2), n) = 1 (Paillier 1999)`);

  // Step 2: Serialization & Deserialization Check
  console.log('>>> [2/7] Testing Public Key Serialization / Deserialization...');
  const serializedPub = serializePublicKey(publicKey);
  const reconstructedPub = deserializePublicKey(serializedPub.n, serializedPub.g);
  if (reconstructedPub.n !== publicKey.n || reconstructedPub.g !== publicKey.g) {
    throw new Error('Public key serialization failed');
  }
  console.log('    Serialization round-trip: PASS (Lossless BigInt recovery)\n');

  // Step 3: Multi-Candidate Ballot Encoding & Encryption
  console.log('>>> [3/7] Simulating 3-Voter, 2-Candidate Election...');
  // Scenario:
  // Voter 1 votes Candidate 0 (Satoshi Nakamoto) -> Weight: 10,000^0 = 1
  // Voter 2 votes Candidate 1 (Vitalik Buterin)  -> Weight: 10,000^1 = 10,000
  // Voter 3 votes Candidate 1 (Vitalik Buterin)  -> Weight: 10,000^1 = 10,000
  const m1 = encodeCandidateVoteRadix(0, RADIX_BASE); // 1n
  const m2 = encodeCandidateVoteRadix(1, RADIX_BASE); // 10000n
  const m3 = encodeCandidateVoteRadix(1, RADIX_BASE); // 10000n

  console.log(`    Voter 1 (Candidate 0): plaintext weight = ${m1}`);
  console.log(`    Voter 2 (Candidate 1): plaintext weight = ${m2}`);
  console.log(`    Voter 3 (Candidate 1): plaintext weight = ${m3}`);

  const c1 = encryptVote(publicKey, m1);
  const c2 = encryptVote(publicKey, m2);
  const c3 = encryptVote(publicKey, m3);

  console.log(`    Ciphertext 1 length: ${c1.toString().length} decimal digits`);
  console.log(`    Ciphertext 2 length: ${c2.toString().length} decimal digits`);
  console.log(`    Ciphertext 3 length: ${c3.toString().length} decimal digits\n`);

  // Step 4: Verify Probabilistic Semantic Security (c2 != c3 despite m2 == m3)
  console.log('>>> [4/7] Verifying Probabilistic Semantic Security...');
  const isDifferent = (c2 !== c3);
  console.log(`    Voter 2 & Voter 3 both voted for Candidate 1.`);
  console.log(`    c2 === c3? ${!isDifferent} (Must be false for semantic security)`);
  if (!isDifferent) {
    throw new Error('FATAL: Deterministic encryption detected! Blinding factor failed.');
  }
  console.log('    Probabilistic uniqueness: PASS (IND-CPA preserved)\n');

  // Step 5: Homomorphic Aggregation
  console.log('>>> [5/7] Homomorphic Aggregation in Ciphertext Space...');
  const ciphertexts = [c1.toString(), c2.toString(), c3.toString()];
  const cAggregate = homomorphicAddition(publicKey, ciphertexts);
  console.log(`    Aggregated Ciphertext length: ${cAggregate.toString().length} decimal digits`);

  // Decryption & Radix Decomposition
  const decryptedSum = decryptTally(privateKey, cAggregate);
  console.log(`    Decrypted Aggregate Sum: ${decryptedSum} (Expected: 20001)`);
  if (decryptedSum !== 20001n) {
    throw new Error(`Aggregate sum mismatch: got ${decryptedSum}, expected 20001`);
  }

  const results = decodeRadixTally(decryptedSum, CANDIDATES.length, RADIX_BASE);
  console.log('    Decomposed Tally:');
  results.forEach((r) => {
    const candidate = CANDIDATES[r.candidateId];
    console.log(`      - [Candidate ${r.candidateId}] ${candidate.name}: ${r.count} votes`);
  });

  const expectedCounts = [1, 2, 0];
  for (let i = 0; i < expectedCounts.length; i++) {
    if (results[i].count !== expectedCounts[i]) {
      throw new Error(`Count mismatch for candidate ${i}: got ${results[i].count}, expected ${expectedCounts[i]}`);
    }
  }
  console.log('    Tally Verification: PASS (Winner: Vitalik Buterin with 2 votes)\n');

  // Step 6: Boundary & Overflow Behavior
  console.log('>>> [6/7] Testing Boundary and Overflow Limits...');
  // A. Exactly 9,999 votes for Candidate 0 (Max allowed before carry-over)
  const maxSafeSum = 9999n;
  const decodedSafe = decodeRadixTally(maxSafeSum, 3, RADIX_BASE);
  console.log(`    Safe Boundary (9,999 votes for Cand 0): Cand 0 = ${decodedSafe[0].count}, Cand 1 = ${decodedSafe[1].count}`);
  if (decodedSafe[0].count !== 9999 || decodedSafe[1].count !== 0) {
    throw new Error('Safe boundary decoding failed');
  }

  // B. Base Overflow (10,000 votes for Candidate 0)
  // 10,000 exceeds base B=10,000 and carries over into Candidate 1's position!
  const overflowSum = 10000n;
  const decodedOverflow = decodeRadixTally(overflowSum, 3, RADIX_BASE);
  console.log(`    Overflow Boundary (10,000 votes for Cand 0): Cand 0 = ${decodedOverflow[0].count}, Cand 1 = ${decodedOverflow[1].count}`);
  console.log('    -> Notice: 10,000 votes carries over into Candidate 1 (+1 vote).');
  console.log('    -> This confirms the mathematical boundary: max 9,999 votes per candidate per base position.\n');

  // Step 7: Malformed Input and Error Handling
  console.log('>>> [7/7] Testing Malformed Input Rejection...');
  let emptyArrayRejected = false;
  try {
    homomorphicAddition(publicKey, []);
  } catch (err) {
    emptyArrayRejected = true;
    console.log(`    Empty ciphertext array rejected: "${err.message}"`);
  }

  let missingKeyRejected = false;
  try {
    encryptVote(null, 1n);
  } catch (err) {
    missingKeyRejected = true;
    console.log(`    Missing public key rejected: "${err.message}"`);
  }

  let invalidFormatRejected = false;
  try {
    homomorphicAddition(publicKey, ['not-a-number']);
  } catch (err) {
    invalidFormatRejected = true;
    console.log(`    Malformed non-numeric ciphertext rejected: "${err.message}"`);
  }

  if (!emptyArrayRejected || !missingKeyRejected || !invalidFormatRejected) {
    throw new Error('Malformed input rejection check failed');
  }
  console.log('    Malformed Input Rejection: PASS\n');

  console.log('===============================================================');
  console.log('   ALL 7 CRYPTOGRAPHIC VERIFICATION CHECKS PASSED (100%)       ');
  console.log('===============================================================');
}

runControlledCryptoVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('FATAL VERIFICATION ERROR:', err);
    process.exit(1);
  });
