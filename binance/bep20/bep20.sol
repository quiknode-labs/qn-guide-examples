// contracts/BEP20.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BEP20 is ERC20 {
    constructor(uint256 initialSupply) ERC20("BEP20Test", "BPT") {
        _mint(msg.sender, initialSupply);
    }
}