const { expect } = require("chai");
const { ethers } = require("hardhat");
const paillier = require("paillier-bigint");

describe("EVoting Smart Contract & Paillier Homomorphic Cryptosystem", function () {
  let evoting;
  let admin, voter1, voter2, voter3, nonVoter;
  let paillierKeyPair;

  before(async function () {
    // Generate Paillier 512-bit keypair for fast and deterministic testing
    paillierKeyPair = await paillier.generateRandomKeys(512);
  });

  beforeEach(async function () {
    [admin, voter1, voter2, voter3, nonVoter] = await ethers.getSigners();
    const EVoting = await ethers.getContractFactory("EVoting");
    evoting = await EVoting.deploy();
    await evoting.waitForDeployment();
  });

  describe("Deployment & Initial State", function () {
    it("Should correctly set the deployer as admin", async function () {
      expect(await evoting.admin()).to.equal(admin.address);
    });

    it("Should initialize election as closed", async function () {
      expect(await evoting.isElectionOpen()).to.be.false;
      expect(await evoting.electionState()).to.equal(0); // ElectionState.Closed
    });

    it("Should have an empty encrypted votes array initially", async function () {
      const votes = await evoting.getEncryptedVotes();
      expect(votes.length).to.equal(0);
      expect(await evoting.getVotesCount()).to.equal(0);
    });
  });

  describe("Voter Whitelisting Access Control", function () {
    it("Admin should be able to whitelist an individual voter", async function () {
      await expect(evoting.connect(admin).addVoter(voter1.address))
        .to.emit(evoting, "VoterAdded")
        .withArgs(voter1.address);

      expect(await evoting.isWhitelisted(voter1.address)).to.be.true;
    });

    it("Non-admin cannot whitelist a voter", async function () {
      await expect(
        evoting.connect(voter1).addVoter(voter2.address)
      ).to.be.revertedWith("EVoting: Caller is not the admin");
    });

    it("Cannot whitelist the zero address", async function () {
      await expect(
        evoting.connect(admin).addVoter(ethers.ZeroAddress)
      ).to.be.revertedWith("EVoting: Invalid voter address");
    });

    it("Cannot whitelist the same voter twice", async function () {
      await evoting.connect(admin).addVoter(voter1.address);
      await expect(
        evoting.connect(admin).addVoter(voter1.address)
      ).to.be.revertedWith("EVoting: Voter is already whitelisted");
    });

    it("Admin can batch whitelist multiple voters", async function () {
      const voters = [voter1.address, voter2.address, voter3.address];
      await expect(evoting.connect(admin).batchAddVoters(voters))
        .to.emit(evoting, "VotersBatchAdded")
        .withArgs(3);

      expect(await evoting.isWhitelisted(voter1.address)).to.be.true;
      expect(await evoting.isWhitelisted(voter2.address)).to.be.true;
      expect(await evoting.isWhitelisted(voter3.address)).to.be.true;
    });
  });

  describe("Paillier Public Key Management", function () {
    it("Admin can publish Paillier public key on-chain", async function () {
      const nStr = paillierKeyPair.publicKey.n.toString();
      const gStr = paillierKeyPair.publicKey.g.toString();

      await expect(evoting.connect(admin).setPaillierPublicKey(nStr, gStr))
        .to.emit(evoting, "PaillierPublicKeySet")
        .withArgs(nStr, gStr);

      const [storedN, storedG] = await evoting.getPaillierPublicKey();
      expect(storedN).to.equal(nStr);
      expect(storedG).to.equal(gStr);
    });

    it("Non-admin cannot set Paillier public key", async function () {
      await expect(
        evoting.connect(voter1).setPaillierPublicKey("123", "456")
      ).to.be.revertedWith("EVoting: Caller is not the admin");
    });
  });

  describe("Election Lifecycle", function () {
    it("Admin can start and end election", async function () {
      await expect(evoting.connect(admin).startElection())
        .to.emit(evoting, "ElectionStarted");
      expect(await evoting.isElectionOpen()).to.be.true;

      await expect(evoting.connect(admin).endElection())
        .to.emit(evoting, "ElectionEnded");
      expect(await evoting.isElectionOpen()).to.be.false;
    });

    it("Non-admin cannot start or end election", async function () {
      await expect(evoting.connect(voter1).startElection())
        .to.be.revertedWith("EVoting: Caller is not the admin");

      await evoting.connect(admin).startElection();

      await expect(evoting.connect(voter1).endElection())
        .to.be.revertedWith("EVoting: Caller is not the admin");
    });

    it("Cannot start election if already open", async function () {
      await evoting.connect(admin).startElection();
      await expect(evoting.connect(admin).startElection())
        .to.be.revertedWith("EVoting: Election is already open");
    });

    it("Cannot end election if already closed", async function () {
      await expect(evoting.connect(admin).endElection())
        .to.be.revertedWith("EVoting: Election is already closed");
    });
  });

  describe("Ballot Casting & Security Constraints", function () {
    beforeEach(async function () {
      await evoting.connect(admin).addVoter(voter1.address);
      await evoting.connect(admin).startElection();
    });

    it("Whitelisted voter can successfully cast an encrypted vote", async function () {
      const mockCiphertext = "98273491823749182374918237491283749182374";
      await expect(evoting.connect(voter1).castVote(mockCiphertext))
        .to.emit(evoting, "VoteCast")
        .withArgs(voter1.address, mockCiphertext);

      expect(await evoting.hasVoted(voter1.address)).to.be.true;
      const votes = await evoting.getEncryptedVotes();
      expect(votes.length).to.equal(1);
      expect(votes[0]).to.equal(mockCiphertext);
    });

    it("Double voting is strictly prevented", async function () {
      const mockCiphertext = "123456789";
      await evoting.connect(voter1).castVote(mockCiphertext);

      await expect(
        evoting.connect(voter1).castVote(mockCiphertext)
      ).to.be.revertedWith("EVoting: Sender has already cast a vote");
    });

    it("Non-whitelisted address cannot cast a vote", async function () {
      await expect(
        evoting.connect(nonVoter).castVote("123456789")
      ).to.be.revertedWith("EVoting: Sender is not whitelisted");
    });

    it("Cannot vote when election is closed", async function () {
      await evoting.connect(admin).endElection();
      await expect(
        evoting.connect(voter1).castVote("123456789")
      ).to.be.revertedWith("EVoting: Election is not open");
    });

    it("Cannot submit empty encrypted vote string", async function () {
      await expect(
        evoting.connect(voter1).castVote("")
      ).to.be.revertedWith("EVoting: Encrypted vote cannot be empty");
    });
  });

  describe("End-to-End Paillier Homomorphic Tallying Workflow", function () {
    it("Correctly aggregates encrypted votes and decrypts multi-candidate tally (Radix scheme)", async function () {
      const { publicKey, privateKey } = paillierKeyPair;

      // Publish public key and start election
      await evoting.connect(admin).setPaillierPublicKey(
        publicKey.n.toString(),
        publicKey.g.toString()
      );
      await evoting.connect(admin).batchAddVoters([voter1.address, voter2.address, voter3.address]);
      await evoting.connect(admin).startElection();

      // Candidates:
      // Candidate 0: Alice   (base^0 = 1)
      // Candidate 1: Bob     (base^1 = 10000)
      // Candidate 2: Charlie (base^2 = 100000000)
      const BASE = 10000n;

      // Voter 1 votes for Alice (0) -> message = 1n
      // Voter 2 votes for Bob (1)   -> message = 10000n
      // Voter 3 votes for Bob (1)   -> message = 10000n
      const m1 = 1n;
      const m2 = 10000n;
      const m3 = 10000n;

      const c1 = publicKey.encrypt(m1);
      const c2 = publicKey.encrypt(m2);
      const c3 = publicKey.encrypt(m3);

      // Submit encrypted ballots to smart contract
      await evoting.connect(voter1).castVote(c1.toString());
      await evoting.connect(voter2).castVote(c2.toString());
      await evoting.connect(voter3).castVote(c3.toString());

      // Admin ends election
      await evoting.connect(admin).endElection();

      // Retrieve all encrypted votes from smart contract
      const onChainEncryptedVotes = await evoting.getEncryptedVotes();
      expect(onChainEncryptedVotes.length).to.equal(3);

      // Admin performs off-chain homomorphic addition:
      // c_sum = c1 * c2 * c3 mod n^2
      let cSum = BigInt(onChainEncryptedVotes[0]);
      for (let i = 1; i < onChainEncryptedVotes.length; i++) {
        cSum = publicKey.addition(cSum, BigInt(onChainEncryptedVotes[i]));
      }

      // Admin decrypts aggregate ciphertext using Paillier private key
      const decryptedSum = privateKey.decrypt(cSum);
      expect(decryptedSum).to.equal(20001n); // 1 + 10000 + 10000 = 20001

      // Extract individual candidate totals:
      const aliceVotes = decryptedSum % BASE;
      const bobVotes = (decryptedSum / BASE) % BASE;
      const charlieVotes = (decryptedSum / (BASE * BASE)) % BASE;

      expect(aliceVotes).to.equal(1n);
      expect(bobVotes).to.equal(2n);
      expect(charlieVotes).to.equal(0n);

      // Verify Bob wins!
      expect(bobVotes > aliceVotes).to.be.true;
    });

    it("Correctly aggregates 2-candidate linear scheme (Candidate A = 1, Candidate B = 2)", async function () {
      const { publicKey, privateKey } = paillierKeyPair;

      await evoting.connect(admin).batchAddVoters([voter1.address, voter2.address, voter3.address]);
      await evoting.connect(admin).startElection();

      // Candidate A = 1, Candidate B = 2
      // Voter 1: A (1)
      // Voter 2: B (2)
      // Voter 3: B (2)
      const c1 = publicKey.encrypt(1n);
      const c2 = publicKey.encrypt(2n);
      const c3 = publicKey.encrypt(2n);

      await evoting.connect(voter1).castVote(c1.toString());
      await evoting.connect(voter2).castVote(c2.toString());
      await evoting.connect(voter3).castVote(c3.toString());

      await evoting.connect(admin).endElection();

      const votes = await evoting.getEncryptedVotes();
      let cSum = BigInt(votes[0]);
      for (let i = 1; i < votes.length; i++) {
        cSum = publicKey.addition(cSum, BigInt(votes[i]));
      }

      const totalSum = privateKey.decrypt(cSum);
      expect(totalSum).to.equal(5n); // 1 + 2 + 2 = 5

      // Linear tally resolution:
      // N_A + N_B = totalVoters (3)
      // 1*N_A + 2*N_B = totalSum (5)
      // N_B = totalSum - totalVoters = 5 - 3 = 2
      // N_A = totalVoters - N_B = 3 - 2 = 1
      const totalVoters = BigInt(votes.length);
      const countB = totalSum - totalVoters;
      const countA = totalVoters - countB;

      expect(countA).to.equal(1n);
      expect(countB).to.equal(2n);
    });
  });
});
