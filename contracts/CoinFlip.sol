// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CoinFlip {
    address public owner;

    event BetPlaced(address indexed player, uint256 amount, bool won);
    event FundsDeposited(address indexed sender, uint256 amount);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    // Fallback function to receive ETH
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }

    // Function to place a bet
    function placeBet(bool guess) external payable {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(address(this).balance >= msg.value * 2, "Not enough balance in contract");

        bool outcome = random() == 1;
        bool won = (outcome == guess);

        if (won) {
            payable(msg.sender).transfer(msg.value * 2);
        }

        emit BetPlaced(msg.sender, msg.value, won);
    }

    // Function to withdraw contract funds
    function withdraw(uint256 amount) external {
        require(msg.sender == owner, "Only the owner can withdraw");
        require(address(this).balance >= amount, "Not enough balance in contract");
        payable(owner).transfer(amount);
        emit FundsWithdrawn(owner, amount);
    }

    // Generate a pseudo-random number (0 or 1)
    function random() private view returns (uint8) {
        return uint8(uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp))) % 2);
    }
}
