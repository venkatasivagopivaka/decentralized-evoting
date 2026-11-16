import * as paillier from 'paillier-bigint';
import { RADIX_BASE } from './constants.js';

/**
 * Generate a new Paillier key pair
 * @param {number} bitLength Modulus bit length (1024 recommended for responsive client-side performance, 2048 for high security)
 * @returns {Promise<{publicKey: paillier.PublicKey, privateKey: paillier.PrivateKey}>}
 */
export async function generatePaillierKeys(bitLength = 1024) {
  return await paillier.generateRandomKeys(bitLength);
}

/**
 * Serialize a Paillier Public Key into string representation
 */
export function serializePublicKey(publicKey) {
  if (!publicKey) return null;
  return {
    n: publicKey.n.toString(),
    g: publicKey.g.toString(),
  };
}

/**
 * Reconstruct a Paillier Public Key from string representation
 */
export function deserializePublicKey(nStr, gStr) {
  if (!nStr || !gStr) return null;
  try {
    return new paillier.PublicKey(BigInt(nStr), BigInt(gStr));
  } catch (error) {
    console.error("Failed to deserialize public key:", error);
    return null;
  }
}

/**
 * Serialize a Paillier Private Key into string representation for secure storage/export
 */
export function serializePrivateKey(privateKey) {
  if (!privateKey) return null;
  return {
    lambda: privateKey.lambda.toString(),
    mu: privateKey.mu.toString(),
    _p: privateKey._p ? privateKey._p.toString() : null,
    _q: privateKey._q ? privateKey._q.toString() : null,
  };
}

/**
 * Reconstruct a Paillier Private Key from serialized object and corresponding Public Key
 */
export function deserializePrivateKey(keyData, publicKey) {
  if (!keyData || !publicKey) return null;
  try {
    const p = keyData._p ? BigInt(keyData._p) : undefined;
    const q = keyData._q ? BigInt(keyData._q) : undefined;
    return new paillier.PrivateKey(
      BigInt(keyData.lambda),
      BigInt(keyData.mu),
      publicKey,
      p,
      q
    );
  } catch (error) {
    console.error("Failed to deserialize private key:", error);
    return null;
  }
}

/**
 * Encode a candidate vote using Radix (super-increasing base) scheme
 * For candidate i, returns B^i as BigInt
 * E.g., Candidate 0 -> 10000^0 = 1n
 *       Candidate 1 -> 10000^1 = 10000n
 *       Candidate 2 -> 10000^2 = 100000000n
 */
export function encodeCandidateVoteRadix(candidateIndex, base = RADIX_BASE) {
  return BigInt(base) ** BigInt(candidateIndex);
}

/**
 * Encode candidate vote using the simple 2-candidate representation (A = 1, B = 2)
 */
export function encodeCandidateVoteSimple(candidateIndex) {
  return BigInt(candidateIndex + 1);
}

/**
 * Encrypt a plaintext BigInt with the Paillier Public Key
 * @param {paillier.PublicKey} publicKey 
 * @param {bigint|string|number} plaintext 
 * @returns {bigint} Ciphertext as BigInt
 */
export function encryptVote(publicKey, plaintext) {
  if (!publicKey) throw new Error("Public key is required for encryption");
  const m = BigInt(plaintext);
  return publicKey.encrypt(m);
}

/**
 * Perform Homomorphic Addition over an array of ciphertexts
 * c_sum = c_1 * c_2 * ... * c_k mod n^2
 * @param {paillier.PublicKey} publicKey 
 * @param {Array<string|bigint>} ciphertexts Array of encrypted vote strings or BigInts
 * @returns {bigint} Homomorphically aggregated ciphertext
 */
export function homomorphicAddition(publicKey, ciphertexts) {
  if (!publicKey) throw new Error("Public key is required for homomorphic addition");
  if (!ciphertexts || ciphertexts.length === 0) {
    throw new Error("No ciphertexts provided for homomorphic aggregation");
  }

  let aggregated = BigInt(ciphertexts[0]);
  for (let i = 1; i < ciphertexts.length; i++) {
    const nextCiphertext = BigInt(ciphertexts[i]);
    aggregated = publicKey.addition(aggregated, nextCiphertext);
  }
  return aggregated;
}

/**
 * Decrypt an aggregate ciphertext using the Admin's Private Key
 * @param {paillier.PrivateKey} privateKey 
 * @param {bigint|string} ciphertext 
 * @returns {bigint} Decrypted mathematical sum
 */
export function decryptTally(privateKey, ciphertext) {
  if (!privateKey) throw new Error("Private key is required for decryption");
  const c = BigInt(ciphertext);
  return privateKey.decrypt(c);
}

/**
 * Decode decrypted Radix sum into individual candidate vote counts
 * sum = N_0 * B^0 + N_1 * B^1 + N_2 * B^2 + ...
 * @param {bigint} decryptedSum 
 * @param {number} candidateCount 
 * @param {bigint} base 
 * @returns {Array<{candidateId: number, count: number}>}
 */
export function decodeRadixTally(decryptedSum, candidateCount, base = RADIX_BASE) {
  const counts = [];
  let remaining = BigInt(decryptedSum);
  const b = BigInt(base);

  for (let i = 0; i < candidateCount; i++) {
    const count = remaining % b;
    counts.push({
      candidateId: i,
      count: Number(count),
    });
    remaining = remaining / b;
  }
  return counts;
}

/**
 * Decode simple 2-candidate tally where A=1, B=2
 * totalSum = 1*N_A + 2*N_B
 * totalVoters = N_A + N_B
 * N_B = totalSum - totalVoters
 * N_A = totalVoters - N_B
 */
export function decodeSimpleTally(decryptedSum, totalVoters) {
  const sum = BigInt(decryptedSum);
  const voters = BigInt(totalVoters);

  const countB = sum - voters;
  const countA = voters - countB;

  return [
    { candidateId: 0, count: Number(countA) },
    { candidateId: 1, count: Number(countB) },
  ];
}
