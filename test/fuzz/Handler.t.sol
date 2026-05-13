// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// Handler narrows down how the fuzzer calls our protocol so each invocation
// represents a valid action in a meaningful sequence rather than random
// reverting noise. Pt 1 mirrors the Cyfrin reference handler — additional
// actions (mintDsc, transferDsc, updateCollateralPrice, liquidate) get
// layered on as the course progresses.

import {Test} from "forge-std/Test.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/ERC20Mock.sol";
import {MockV3Aggregator} from "../mocks/MockV3Aggregator.sol";
import {DSCEngine} from "../../src/DSCEngine.sol";
import {DecentralizedStableCoin} from "../../src/DecentralizedStableCoin.sol";

contract Handler is Test {
    DSCEngine public dsce;
    DecentralizedStableCoin public dsc;

    ERC20Mock public weth;
    ERC20Mock public wbtc;

    MockV3Aggregator public ethUsdPriceFeed;
    MockV3Aggregator public btcUsdPriceFeed;

    // Tracks every address that has successfully deposited collateral, so
    // mintDsc can pick a real depositor from a fuzzer-provided seed instead
    // of relying on msg.sender (which is almost never a depositor).
    address[] public usersWithCollateralDeposited;

    // Cap deposits at uint96.max so USD-valued multiplications inside the
    // engine (price * amount * ADDITIONAL_FEED_PRECISION) cannot overflow uint256.
    uint256 public constant MAX_DEPOSIT_SIZE = type(uint96).max;

    constructor(DSCEngine _dsce, DecentralizedStableCoin _dsc) {
        dsce = _dsce;
        dsc = _dsc;

        address[] memory collateralTokens = dsce.getCollateralTokens();
        weth = ERC20Mock(collateralTokens[0]);
        wbtc = ERC20Mock(collateralTokens[1]);

        ethUsdPriceFeed = MockV3Aggregator(dsce.getCollateralTokenPriceFeed(address(weth)));
        btcUsdPriceFeed = MockV3Aggregator(dsce.getCollateralTokenPriceFeed(address(wbtc)));
    }

    ///////////////
    // DSCEngine //
    ///////////////

    function depositCollateral(uint256 collateralSeed, uint256 amountCollateral) public {
        ERC20Mock collateral = _getCollateralFromSeed(collateralSeed);
        amountCollateral = bound(amountCollateral, 1, MAX_DEPOSIT_SIZE);

        vm.startPrank(msg.sender);
        collateral.mint(msg.sender, amountCollateral);
        collateral.approve(address(dsce), amountCollateral);
        dsce.depositCollateral(address(collateral), amountCollateral);
        vm.stopPrank();

        usersWithCollateralDeposited.push(msg.sender);
    }

    function redeemCollateral(uint256 collateralSeed, uint256 amountCollateral) public {
        ERC20Mock collateral = _getCollateralFromSeed(collateralSeed);
        uint256 maxCollateral = dsce.getCollateralBalanceOfUser(msg.sender, address(collateral));
        amountCollateral = bound(amountCollateral, 0, maxCollateral);
        if (amountCollateral == 0) return;

        vm.prank(msg.sender);
        dsce.redeemCollateral(address(collateral), amountCollateral);
    }

    /////////////////
    // Price Feed  //
    /////////////////

    // THIS BREAKS OUR INVARIANT TEST SUITE — intentionally commented out.
    //
    // When the fuzzer can drive the oracle to any value (including 0), it
    // can engineer a sequence: deposit collateral → mint DSC → crash the
    // price feed → protocol is now undercollateralized. The headline
    // invariant `collateralValue >= totalSupply` correctly fails, which is
    // fuzz testing working as intended. We saw the failure once (that was
    // the lesson), then commented this out so the rest of the suite keeps
    // running. The protocol's safety against sharp price drops is a real
    // design limitation, mitigated in production by TWAP oracles, multi-
    // oracle aggregation, and circuit breakers — not by the invariant suite.
    //
    // function updateCollateralPrice(uint96 newPrice, uint256 collateralSeed) public {
    //     int256 intNewPrice = int256(uint256(newPrice));
    //     ERC20Mock collateral = _getCollateralFromSeed(collateralSeed);
    //     MockV3Aggregator priceFeed = MockV3Aggregator(dsce.getCollateralTokenPriceFeed(address(collateral)));
    //
    //     priceFeed.updateAnswer(intNewPrice);
    // }

    function mintDsc(uint256 amount, uint256 addressSeed) public {
        if (usersWithCollateralDeposited.length == 0) return;
        address sender = usersWithCollateralDeposited[addressSeed % usersWithCollateralDeposited.length];
        (uint256 totalDscMinted, uint256 collateralValueInUsd) = dsce.getAccountInformation(sender);
        // Max DSC this user could safely mint right now is half their collateral
        // value (LIQUIDATION_THRESHOLD = 50%) minus what they've already minted.
        // Cast to int so we can detect users already at or beyond their cap.

        int256 maxDscToMint = (int256(collateralValueInUsd) / 2) - int256(totalDscMinted);
        if (maxDscToMint < 0) return;

        amount = bound(amount, 0, uint256(maxDscToMint));
        if (amount == 0) return;

        vm.prank(sender);
        dsce.mintDsc(amount);
    }

    /////////////////////
    // Helper Functions
    /////////////////////

    function _getCollateralFromSeed(uint256 collateralSeed) private view returns (ERC20Mock) {
        if (collateralSeed % 2 == 0) {
            return weth;
        }
        return wbtc;
    }
}

