// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract test {
    
    uint256 private count = 0;

    function increment() public {
        count += 1;
    }
    
    function getCount() public view returns (uint256) {
        return count;
    }

}