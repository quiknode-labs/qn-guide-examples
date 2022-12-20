// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GLDToken is ERC20 {
    constructor() ERC20("QuickNode Coin", "QKC") {
        _mint(msg.sender, 10000 * 10 ** decimals());
    }
}
