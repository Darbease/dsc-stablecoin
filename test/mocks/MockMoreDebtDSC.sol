// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {ERC20Burnable, ERC20} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MockV3Aggregator} from "./MockV3Aggregator.sol";

/**
 * @title MockMoreDebtDSC
 * @notice DSC clone whose `burn` crashes the configured price feed to $0 before performing
 * the burn. Used to force `DSCEngine.liquidate` to fail its post-liquidation health-factor
 * check and revert with DSCEngine__HealthFactorNotImproved.
 */
contract MockMoreDebtDSC is ERC20Burnable, Ownable {
    error DecentralizedStableCoin__MustBeAboveZero();
    error DecentralizedStableCoin__BurnAmountExceedsBalance();
    error DecentralizedStableCoin__NotZeroAddress();

    address private immutable i_mockAggregator;

    constructor(address _mockAggregator) ERC20("DecentralizedStableCoin", "DSC") {
        i_mockAggregator = _mockAggregator;
    }

    function burn(uint256 _amount) public override onlyOwner {
        // Side-effect: tank the oracle so the engine's post-burn health-factor recheck fails.
        MockV3Aggregator(i_mockAggregator).updateAnswer(0);
        uint256 balance = balanceOf(msg.sender);
        if (_amount == 0) {
            revert DecentralizedStableCoin__MustBeAboveZero();
        }
        if (balance < _amount) {
            revert DecentralizedStableCoin__BurnAmountExceedsBalance();
        }
        super.burn(_amount);
    }

    function mint(address _to, uint256 _amount) external onlyOwner returns (bool) {
        if (_to == address(0)) {
            revert DecentralizedStableCoin__NotZeroAddress();
        }
        if (_amount == 0) {
            revert DecentralizedStableCoin__MustBeAboveZero();
        }
        _mint(_to, _amount);
        return true;
    }
}
