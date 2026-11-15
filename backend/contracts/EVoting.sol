// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EVoting
 * @notice Production-grade Decentralized Electronic Voting Smart Contract
 * @dev Employs Paillier Homomorphic Encryption for ballot privacy and off-chain aggregation
 */
contract EVoting {
    // --- State Variables ---

    address public admin;

    enum ElectionState {
        Closed,
        Open
    }
    ElectionState public electionState;
    bool public isElectionOpen;

    // Mapping for whitelisted voters
    mapping(address => bool) public isWhitelisted;

    // Mapping to prevent double voting
    mapping(address => bool) public hasVoted;

    // Array of strings storing Paillier encrypted votes (ciphertexts)
    string[] public encryptedVotes;

    // Admin's Paillier Public Key (stored on-chain for transparent voter access)
    string public paillierPublicKeyN;
    string public paillierPublicKeyG;

    // --- Events ---

    event ElectionStarted();
    event ElectionEnded();
    event VoterAdded(address indexed voter);
    event VotersBatchAdded(uint256 count);
    event VoteCast(address indexed voter, string encryptedVote);
    event PaillierPublicKeySet(string n, string g);

    // --- Modifiers ---

    modifier onlyAdmin() {
        require(msg.sender == admin, "EVoting: Caller is not the admin");
        _;
    }

    modifier electionOpen() {
        require(isElectionOpen && electionState == ElectionState.Open, "EVoting: Election is not open");
        _;
    }

    // --- Constructor ---

    constructor() {
        admin = msg.sender;
        electionState = ElectionState.Closed;
        isElectionOpen = false;
    }

    // --- Admin Functions ---

    /**
     * @notice Whitelist an individual voter
     * @param _voter Address of the voter to whitelist
     */
    function addVoter(address _voter) external onlyAdmin {
        require(_voter != address(0), "EVoting: Invalid voter address");
        require(!isWhitelisted[_voter], "EVoting: Voter is already whitelisted");
        isWhitelisted[_voter] = true;
        emit VoterAdded(_voter);
    }

    /**
     * @notice Whitelist multiple voters in a single batch transaction
     * @param _voters Array of voter addresses to whitelist
     */
    function batchAddVoters(address[] calldata _voters) external onlyAdmin {
        for (uint256 i = 0; i < _voters.length; i++) {
            address voter = _voters[i];
            if (voter != address(0) && !isWhitelisted[voter]) {
                isWhitelisted[voter] = true;
                emit VoterAdded(voter);
            }
        }
        emit VotersBatchAdded(_voters.length);
    }

    /**
     * @notice Set or update the election Paillier Public Key
     * @param _n Modulus n in string format
     * @param _g Generator g in string format
     */
    function setPaillierPublicKey(string calldata _n, string calldata _g) external onlyAdmin {
        require(bytes(_n).length > 0 && bytes(_g).length > 0, "EVoting: Invalid public key parameters");
        paillierPublicKeyN = _n;
        paillierPublicKeyG = _g;
        emit PaillierPublicKeySet(_n, _g);
    }

    /**
     * @notice Open the election for voting
     */
    function startElection() external onlyAdmin {
        require(!isElectionOpen, "EVoting: Election is already open");
        electionState = ElectionState.Open;
        isElectionOpen = true;
        emit ElectionStarted();
    }

    /**
     * @notice Close the election to prevent further votes and allow tallying
     */
    function endElection() external onlyAdmin {
        require(isElectionOpen, "EVoting: Election is already closed");
        electionState = ElectionState.Closed;
        isElectionOpen = false;
        emit ElectionEnded();
    }

    // --- Voter Functions ---

    /**
     * @notice Cast an encrypted ballot
     * @param _encryptedVote The Paillier ciphertext as a numeric string
     */
    function castVote(string memory _encryptedVote) external electionOpen {
        require(isWhitelisted[msg.sender], "EVoting: Sender is not whitelisted");
        require(!hasVoted[msg.sender], "EVoting: Sender has already cast a vote");
        require(bytes(_encryptedVote).length > 0, "EVoting: Encrypted vote cannot be empty");

        hasVoted[msg.sender] = true;
        encryptedVotes.push(_encryptedVote);

        emit VoteCast(msg.sender, _encryptedVote);
    }

    // --- View Functions ---

    /**
     * @notice Get all encrypted votes stored on-chain
     * @return Array of encrypted ballot ciphertexts
     */
    function getEncryptedVotes() external view returns (string[] memory) {
        return encryptedVotes;
    }

    /**
     * @notice Get total number of ballots cast
     * @return Number of encrypted votes in storage
     */
    function getVotesCount() external view returns (uint256) {
        return encryptedVotes.length;
    }

    /**
     * @notice Retrieve the published Paillier Public Key
     * @return n The modulus n
     * @return g The generator g
     */
    function getPaillierPublicKey() external view returns (string memory n, string memory g) {
        return (paillierPublicKeyN, paillierPublicKeyG);
    }

    /**
     * @notice Check voter eligibility and voting status
     * @param _voter Address to inspect
     * @return whitelisted Whether address is authorized
     * @return voted Whether address has already voted
     */
    function getVoterStatus(address _voter) external view returns (bool whitelisted, bool voted) {
        return (isWhitelisted[_voter], hasVoted[_voter]);
    }
}
