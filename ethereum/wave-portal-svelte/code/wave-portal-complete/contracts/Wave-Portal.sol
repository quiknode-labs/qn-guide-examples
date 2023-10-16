/**
 *Submitted for verification at Etherscan.io on 2021-09-12
*/

// SPDX-License-Identifier: UNLICENSE

pragma solidity ^0.8.0;

contract WavePortal {
	enum Reaction {
		Wave,
		Cake,
		Hype
	}

	struct Wave {
		Reaction reaction;
		string message;
		address waver;
		uint256 timestamp;
	}

	uint256 totalWaves;
	uint256 private seed;

	Wave[] public waveList;
	mapping(address => uint256) public lastWavedAt;

	event NewWave(
		Reaction reaction,
		string message,
		address indexed from,
		uint256 timestamp
	);

	constructor() payable {}

	function wave(Reaction _reaction, string memory _message) public {
		totalWaves += 1;
		waveList.push(Wave(_reaction, _message, msg.sender, block.timestamp));
		emit NewWave(_reaction, _message, msg.sender, block.timestamp);
	}

	function getAllWaves() public view returns (Wave[] memory) {
		return waveList;
	}

	function getTotalWaves() public view returns (uint256) {
		return waveList.length;
	}
}
