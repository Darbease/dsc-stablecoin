import { CronCapability, EVMClient, handler, Runner, type Runtime } from "@chainlink/cre-sdk";
import { DSCEngine } from "./contracts/evm/ts/generated";

// Sepolia: 16015286601757825753n
// Anvil (local devnet): see anvil-devnet chain selector in the SDK
export type Config = {
  schedule: string;
  chainSelector: string;            // numeric chain selector as string (JSON-safe)
  dscEngineAddress: `0x${string}`;
  trackedUsers: `0x${string}`[];
};

type Underwater = {
  user: `0x${string}`;
  healthFactor: bigint;
  totalDscMinted: bigint;
  collateralValueInUsd: bigint;
};

export const onCronTrigger = (runtime: Runtime<Config>): string => {
  const config = runtime.config;
  const chainSelector = BigInt(config.chainSelector);

  const client = new EVMClient(chainSelector);
  const dsce = new DSCEngine(client, config.dscEngineAddress);

  const minHealthFactor = dsce.getMinHealthFactor(runtime);
  runtime.log(`MIN_HEALTH_FACTOR = ${minHealthFactor.toString()}`);
  runtime.log(`Tracked users: ${config.trackedUsers.length}`);

  const underwater: Underwater[] = [];

  for (const user of config.trackedUsers) {
    const healthFactor = dsce.getHealthFactor(runtime, user);
    const [totalDscMinted, collateralValueInUsd] = dsce.getAccountInformation(runtime, user);

    runtime.log(
      `user=${user} hf=${healthFactor.toString()} dsc=${totalDscMinted.toString()} collateralUsd=${collateralValueInUsd.toString()}`,
    );

    if (healthFactor < minHealthFactor) {
      underwater.push({ user, healthFactor, totalDscMinted, collateralValueInUsd });
    }
  }

  if (underwater.length === 0) {
    return `OK: ${config.trackedUsers.length} users checked, none underwater`;
  }

  const collateralTokens = dsce.getCollateralTokens(runtime);
  let liquidated = 0;

  for (const u of underwater) {
    // Pick the first collateral token where this user has a non-zero balance.
    // Production: would iterate to find the most profitable collateral after bonus.
    let collateralToken: `0x${string}` | undefined;
    for (const token of collateralTokens) {
      const balance = dsce.getCollateralBalanceOfUser(runtime, u.user, token);
      if (balance > 0n) {
        collateralToken = token;
        break;
      }
    }

    if (!collateralToken) {
      runtime.log(`SKIP user=${u.user}: no collateral balance found`);
      continue;
    }

    runtime.log(
      `LIQUIDATE user=${u.user} collateral=${collateralToken} debtToCover=${u.totalDscMinted.toString()}`,
    );

    try {
      dsce.writeReportFromLiquidate(runtime, collateralToken, u.user, u.totalDscMinted);
      liquidated += 1;
      runtime.log(`LIQUIDATED user=${u.user}`);
    } catch (err) {
      runtime.log(`FAILED user=${u.user} err=${(err as Error).message}`);
    }
  }

  return `Done: ${liquidated}/${underwater.length} liquidations executed (of ${config.trackedUsers.length} tracked)`;
};

export const initWorkflow = (config: Config) => {
  const cron = new CronCapability();

  return [
    handler(
      cron.trigger({ schedule: config.schedule }),
      onCronTrigger,
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
