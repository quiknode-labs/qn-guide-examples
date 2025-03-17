// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {FunctionsClient} from "@chainlink/contracts/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES HARDCODED VALUES FOR CLARITY.
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */
contract RiskBasedStaking is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    // Chainlink Functions variables
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    // Staking variables
    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public riskScores; // 0 means not checked yet
    uint256 public totalStaked;
    uint256 public riskThreshold = 30; // Addresses with risk scores below this can't stake (lower = higher risk)

    // Request tracking
    mapping(bytes32 => address) public requestToUser;
    mapping(address => bool) public pendingRequests;

    // Events
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RiskScoreUpdated(address indexed user, uint256 score);
    event Response(bytes32 indexed requestId, bytes response, bytes err);
    event RiskCheckRequested(address indexed user, bytes32 requestId);

    // Errors
    error UnexpectedRequestID(bytes32 requestId);
    error PendingRiskCheck(address user);
    error RiskyAddress(address user, uint256 score);
    error InsufficientBalance(uint256 requested, uint256 available);
    error NoRiskScore(address user);

    constructor(address router) FunctionsClient(router) ConfirmedOwner(msg.sender) {}

    /**
     * @notice Check if an address passes the risk assessment
     * @param user Address to check
     * @return Whether the address is allowed to stake
     */
    function isAllowedToStake(address user) public view returns (bool) {
        // If risk score is 0, it means not yet checked
        // If risk score is < threshold, it's too risky
        return riskScores[user] > 0 && riskScores[user] >= riskThreshold;
    }

    /**
     * @notice Send a simple request
     * @param source JavaScript source code
     * @param encryptedSecretsUrls Encrypted URLs where to fetch user secrets
     * @param donHostedSecretsSlotID Don hosted secrets slotId
     * @param donHostedSecretsVersion Don hosted secrets version
     * @param args List of arguments accessible from within the source code
     * @param bytesArgs Array of bytes arguments, represented as hex strings
     * @param subscriptionId Billing ID
     */
    function sendRequest(
        string memory source,
        bytes memory encryptedSecretsUrls,
        uint8 donHostedSecretsSlotID,
        uint64 donHostedSecretsVersion,
        string[] memory args,
        bytes[] memory bytesArgs,
        uint64 subscriptionId,
        uint32 gasLimit,
        bytes32 donID
    ) external onlyOwner returns (bytes32 requestId) {
        // Make sure args contains exactly one address
        require(args.length == 1, "Must provide exactly one address argument");

        // Convert the string address from args[0] to address type
        address user = addressFromString(args[0]);

        // Make sure user doesn't have a pending request
        require(!pendingRequests[user], "Risk check already pending");

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        if (encryptedSecretsUrls.length > 0) {
            req.addSecretsReference(encryptedSecretsUrls);
        } else if (donHostedSecretsVersion > 0) {
            req.addDONHostedSecrets(donHostedSecretsSlotID, donHostedSecretsVersion);
        }
        if (args.length > 0) req.setArgs(args);
        if (bytesArgs.length > 0) req.setBytesArgs(bytesArgs);

        s_lastRequestId = _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donID);

        // // Track the request
        requestToUser[s_lastRequestId] = user;
        pendingRequests[user] = true;

        emit RiskCheckRequested(user, s_lastRequestId);

        return s_lastRequestId;
    }

    /**
     * @notice Stake ETH after passing risk assessment
     */
    function stake() external payable {
        address user = msg.sender;
        uint256 amount = msg.value;

        // Check if user has a risk score
        if (riskScores[user] == 0) {
            if (pendingRequests[user]) {
                revert PendingRiskCheck(user);
            } else {
                revert NoRiskScore(user);
            }
        }

        // Check if user passes risk assessment (higher score is better)
        if (riskScores[user] < riskThreshold) {
            revert RiskyAddress(user, riskScores[user]);
        }

        // Update balances
        stakedBalances[user] += amount;
        totalStaked += amount;

        emit Staked(user, amount);
    }

    /**
     * @notice Withdraw staked ETH
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external {
        address user = msg.sender;

        // Check if user has enough balance
        if (stakedBalances[user] < amount) {
            revert InsufficientBalance(amount, stakedBalances[user]);
        }

        // Update balances
        stakedBalances[user] -= amount;
        totalStaked -= amount;

        // Transfer ETH
        (bool success,) = payable(user).call{value: amount}("");
        require(success, "ETH transfer failed");

        emit Withdrawn(user, amount);
    }

    /**
     * @notice Set the risk threshold
     * @param newThreshold New threshold value (0-100)
     */
    function setRiskThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold <= 100, "Threshold must be 0-100");
        riskThreshold = newThreshold;
    }

    /**
     * @notice Store risk score from Chainlink Functions response
     * @param requestId The request ID, returned by requestRiskAssessment()
     * @param response Aggregated response from the user code
     * @param err Aggregated error from the user code or from the execution pipeline
     */
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        // Store the response
        s_lastRequestId = requestId;
        s_lastResponse = response;
        s_lastError = err;

        // Get user address from request
        address user = requestToUser[requestId];

        // Clear pending request flag
        pendingRequests[user] = false;

        // If there's no error, process the risk score
        if (err.length == 0 && response.length > 0) {
            uint256 riskScore = abi.decode(response, (uint256));
            riskScores[user] = riskScore;
            emit RiskScoreUpdated(user, riskScore);
        }

        emit Response(requestId, response, err);
    }

    /**
     * @notice Send a pre-encoded CBOR request (keeping for compatibility)
     * @param request CBOR-encoded request data
     * @param subscriptionId Billing ID
     * @param gasLimit The maximum amount of gas the request can consume
     * @param donID ID of the job to be invoked
     * @return requestId The ID of the sent request
     */
    function sendRequestCBOR(bytes memory request, uint64 subscriptionId, uint32 gasLimit, bytes32 donID)
        external
        onlyOwner
        returns (bytes32 requestId)
    {
        s_lastRequestId = _sendRequest(request, subscriptionId, gasLimit, donID);
        return s_lastRequestId;
    }

    // Helper function to convert string address to address type
    function addressFromString(string memory _addr) private pure returns (address) {
        bytes memory addrBytes = bytes(_addr);
        require(addrBytes.length == 42, "Invalid address length");
        require(addrBytes[0] == "0" && addrBytes[1] == "x", "Invalid address prefix");

        uint160 addr = 0;
        for (uint256 i = 2; i < 42; i++) {
            uint8 b = uint8(addrBytes[i]);
            if (b >= 48 && b <= 57) {
                addr = addr * 16 + (b - 48);
            } else if (b >= 65 && b <= 70) {
                addr = addr * 16 + (b - 55);
            } else if (b >= 97 && b <= 102) {
                addr = addr * 16 + (b - 87);
            } else {
                revert("Invalid address character");
            }
        }
        return address(addr);
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
