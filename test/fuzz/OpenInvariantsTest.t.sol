// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// Open (un-handled) invariant test — kept for pedagogical contrast with
// `InvariantsTest.t.sol`.
//
// `targetContract(address(dsce))` lets the fuzzer call random external
// functions on DSCEngine directly with random arguments. Most calls revert
// (random address not a registered collateral, no balance to redeem,
// health factor breaks on naked mint, etc.), so the protocol's state never
// progresses past its initial empty configuration. With `fail_on_revert = false`
// the suite still passes — but the invariant `collateralValue >= totalSupply`
// is vacuously true because `totalSupply` stays at 0 the entire run.
//
// The handler-based suite in `InvariantsTest.t.sol` is what actually drives
// state through valid sequences. This file exists to illustrate why a handler
// is necessary, not as a useful regression test.

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {console} from "forge-std/console.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {DeployDSC} from "../../script/DeployDSC.s.sol";
import {HelperConfig} from "../../script/HelperConfig.s.sol";
import {DSCEngine} from "../../src/DSCEngine.sol";
import {DecentralizedStableCoin} from "../../src/DecentralizedStableCoin.sol";

contract OpenInvariantsTest is StdInvariant, Test {
    DeployDSC deployer;
    DSCEngine dsce;
    DecentralizedStableCoin dsc;
    HelperConfig config;

    address weth;
    address wbtc;

    function setUp() external {
        deployer = new DeployDSC();
        (dsc, dsce, config) = deployer.run();
        (,, weth, wbtc,) = config.activeNetworkConfig();

        // Open targeting: the fuzzer can call any external function on dsce
        // with any random arguments. No handler bounds the inputs.
        targetContract(address(dsce));
    }

    function invariant_protocolMustHaveMoreValueThanTotalSupply() public view {
        uint256 totalSupply = dsc.totalSupply();
        uint256 wethDeposited = IERC20(weth).balanceOf(address(dsce));
        uint256 wbtcDeposited = IERC20(wbtc).balanceOf(address(dsce));

        uint256 wethValueUsd = dsce.getUsdValue(weth, wethDeposited);
        uint256 wbtcValueUsd = dsce.getUsdValue(wbtc, wbtcDeposited);

        console.log("weth USD: %s", wethValueUsd);
        console.log("wbtc USD: %s", wbtcValueUsd);
        console.log("total DSC: %s", totalSupply);

        assert(wethValueUsd + wbtcValueUsd >= totalSupply);
    }
}
