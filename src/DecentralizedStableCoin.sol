// SPDX-License-Identifier: MIT

// This is considered an Exogenous, Decentralized, Anchored (pegged), Crypto Collateralized low volitility coin

// Layout of Contract:
// version
// imports
// interfaces, libraries, contracts
// errors
// Type declarations
// State variables
// Events
// Modifiers
// Functions

// Layout of Functions:
// constructor
// receive function (if exists)
// fallback function (if exists)
// external
// public
// internal
// private
// view & pure functions

pragma solidity 0.8.19;

import {ERC20, ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 *  @title Decentralized Stable Coin
 * @author DARB
 * @notice This contract is for the Decentralized Stable Coin (DSC)
 * @dev This is a mintable and burnable ERC20 token. Only the owner can mint and burn tokens.
 */

contract DecentralizedStableCoin is ERC20Burnable, Ownable {
    // Errors
    error DecentralizedStableCoin__MustBeAboveZero();
    error DecentralizedStableCoin__NotZeroAddress();

    // Events
    event Minted(address indexed minter, uint256 _amount);
    event Burned(address indexed burner, uint256 _amount);

    constructor() ERC20("Decentralized Stable Coin", "DSC") {}

    function mint(address _to, uint256 _amount) external onlyOwner returns (bool) {
        if (_amount == 0) {
            revert DecentralizedStableCoin__MustBeAboveZero();
        }
        if (_to == address(0)) {
            revert DecentralizedStableCoin__NotZeroAddress();
        }
        _mint(_to, _amount);
        emit Minted(_to, _amount);
        return true;
    }

    function burn(uint256 _amount) public override {
        if (_amount == 0) {
            revert DecentralizedStableCoin__MustBeAboveZero();
        }
        super.burn(_amount);
        emit Burned(msg.sender, _amount);
    }

    function burnFrom(address account, uint256 _amount) public override {
        if (_amount == 0) {
            revert DecentralizedStableCoin__MustBeAboveZero();
        }
        super.burnFrom(account, _amount);
        emit Burned(account, _amount);
    }
}
