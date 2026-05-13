import { describe, expect } from "bun:test";
import { newTestRuntime, test, EvmMock } from "@chainlink/cre-sdk/test";
import { onCronTrigger, initWorkflow } from "./main";
import type { Config } from "./main";
import { newDSCEngineMock } from "./contracts/evm/ts/generated/DSCEngine_mock";

// Sepolia chain selector (matches @chainlink/cre-sdk ethereum-testnet-sepolia)
const SEPOLIA_CHAIN_SELECTOR = "16015286601757825753";
const ENGINE = "0x000000000000000000000000000000000000DEAD" as const;
const USER_HEALTHY = "0x0000000000000000000000000000000000000001" as const;
const USER_UNDERWATER = "0x0000000000000000000000000000000000000002" as const;

const MIN_HEALTH_FACTOR = 10n ** 18n; // 1e18

const baseConfig = (trackedUsers: `0x${string}`[]): Config => ({
  schedule: "*/30 * * * * *",
  chainSelector: SEPOLIA_CHAIN_SELECTOR,
  dscEngineAddress: ENGINE,
  trackedUsers,
});

describe("onCronTrigger", () => {
  test("reports OK when all tracked users have healthy positions", async () => {
    const runtime = newTestRuntime();
    runtime.config = baseConfig([USER_HEALTHY]);

    const evm = EvmMock.testInstance(BigInt(SEPOLIA_CHAIN_SELECTOR));
    const dsce = newDSCEngineMock(ENGINE, evm);
    dsce.getMinHealthFactor = () => MIN_HEALTH_FACTOR;
    dsce.getHealthFactor = () => 5n * MIN_HEALTH_FACTOR; // very healthy
    dsce.getAccountInformation = () => [100n * 10n ** 18n, 20_000n * 10n ** 18n];

    const result = onCronTrigger(runtime);

    expect(result).toContain("none underwater");
  });

  test("detects underwater users and selects collateral for liquidation", async () => {
    // Note: this test exercises the detection + collateral-selection path. It does NOT
    // validate the consensus + Forwarder dispatch (which requires runtime.report and
    // client.writeReport mocks that aren't exposed on the contract-level mock surface).
    // The "0/N executed" result is expected here — the LIQUIDATE log proves the
    // workflow correctly identified the position and picked the right collateral token.
    const runtime = newTestRuntime();
    runtime.config = baseConfig([USER_UNDERWATER]);

    const WETH = "0x0000000000000000000000000000000000000010" as `0x${string}`;
    const WBTC = "0x0000000000000000000000000000000000000020" as `0x${string}`;

    const evm = EvmMock.testInstance(BigInt(SEPOLIA_CHAIN_SELECTOR));
    const dsce = newDSCEngineMock(ENGINE, evm);
    dsce.getMinHealthFactor = () => MIN_HEALTH_FACTOR;
    dsce.getHealthFactor = () => MIN_HEALTH_FACTOR / 2n; // 0.5e18 — broken
    dsce.getAccountInformation = () => [100n * 10n ** 18n, 180n * 10n ** 18n];
    dsce.getCollateralTokens = () => [WETH, WBTC];
    // User holds WETH but no WBTC — workflow should pick WETH as liquidation collateral.
    dsce.getCollateralBalanceOfUser = (_user, token) => (token === WETH ? 10n * 10n ** 18n : 0n);

    onCronTrigger(runtime);

    const logs = runtime.getLogs();
    const liquidateLog = logs.find((l) => l.includes(`LIQUIDATE user=${USER_UNDERWATER}`));
    expect(liquidateLog).toBeDefined();
    expect(liquidateLog).toContain(`collateral=${WETH}`);
    expect(liquidateLog).toContain("debtToCover=100000000000000000000");
  });
});

describe("initWorkflow", () => {
  test("returns one handler with the configured cron schedule", () => {
    const config = baseConfig([USER_HEALTHY]);
    const handlers = initWorkflow(config);

    expect(handlers).toBeArray();
    expect(handlers).toHaveLength(1);
    expect(handlers[0].trigger.config.schedule).toBe(config.schedule);
  });
});
