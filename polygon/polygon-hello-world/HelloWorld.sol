// SPDX-License-Identifier: MIT

/**
 * @title HelloWorld type of contract for deploying on Polygon blockchain
 * @dev Store & retrieve a message in a variable
 *
 * Video tutorial: https://youtu.be/rr53j7V3ffg
 * Related article: https://www.quicknode.com/guides/smart-contract-development/how-to-deploy-a-smart-contract-on-maticpolygon
 *
 * What you will learn from the video and article above, based on this contract:
 * - How to create a simple smart contract
 * - How to add Polygon blockchain networks to Metamask
 * - How to get test MATIC token to deploy the contract
 * - How to deploy a smart contract to Polygon using Remix
 */

pragma solidity ^0.8.17;

contract HelloWorld {
    string private message;

    constructor() {
        message = "Hello, World!";
    }

    /**
     * @dev Store message in variable
     * @param _message a message to to store
     */
    function setMessage(string memory _message) public {
        message = _message;
    }

    /**
     * @dev Return message
     * @return value of 'message' variable
     */
    function getMessage() public view returns (string memory) {
        return message;
    }
}
