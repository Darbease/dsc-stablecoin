// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// Invariants — properties that must always hold across any valid sequence of
// actions taken against the protocol:
//
//   1. The total USD value of collateral held by the engine must always be
//      >= the USD value of the total DSC supply (the protocol must never be
//      undercollateralized).
//   2. Every parameterless view ("getter") must be safe to call in any state.
//
// The fuzzer drives state via `Handler` (see `targetContract(address(handler))`)
// so each call represents a valid action rather than random argument noise.

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {console} from "forge-std/console.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {DeployDSC} from "../../script/DeployDSC.s.sol";
import {HelperConfig} from "../../script/HelperConfig.s.sol";
import {DSCEngine} from "../../src/DSCEngine.sol";
import {DecentralizedStableCoin} from "../../src/DecentralizedStableCoin.sol";
import {Handler} from "./Handler.t.sol";

contract InvariantsTest is StdInvariant, Test {
    DeployDSC deployer;
    DSCEngine dsce;
    DecentralizedStableCoin dsc;
    HelperConfig config;
    Handler handler;

    address weth;
    address wbtc;

    function setUp() external {
        deployer = new DeployDSC();
        (dsc, dsce, config) = deployer.run();
        (,, weth, wbtc,) = config.activeNetworkConfig();

        handler = new Handler(dsce, dsc);
        targetContract(address(handler));
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

    function invariant_gettersShouldNotRevert() public view {
        dsce.getAdditionalFeedPrecision();
        dsce.getCollateralTokens();
        dsce.getLiquidationBonus();
        dsce.getLiquidationThreshold();
        dsce.getLiquidationPrecision();
        dsce.getMinHealthFactor();
        dsce.getPrecision();
        dsce.getDsc();
    }
}
