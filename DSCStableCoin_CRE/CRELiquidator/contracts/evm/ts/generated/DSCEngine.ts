// Code generated — DO NOT EDIT.
import {
  decodeEventLog,
  decodeFunctionResult,
  encodeEventTopics,
  encodeFunctionData,
  zeroAddress,
} from 'viem'
import type { Address, Hex } from 'viem'
import {
  bytesToHex,
  encodeCallMsg,
  EVMClient,
  hexToBase64,
  LAST_FINALIZED_BLOCK_NUMBER,
  prepareReportRequest,
  type EVMLog,
  type Runtime,
} from '@chainlink/cre-sdk'

export interface DecodedLog<T> extends Omit<EVMLog, 'data'> { data: T }

const encodeTopicValue = (t: Hex | Hex[] | null): string[] => {
  if (t == null) return []
  if (Array.isArray(t)) return t.map(hexToBase64)
  return [hexToBase64(t)]
}





/**
 * Filter params for CollateralDeposited. Only indexed fields can be used for filtering.
 * Indexed string/bytes must be passed as keccak256 hash (Hex).
 */
export type CollateralDepositedTopics = {
  user?: `0x${string}`
  token?: `0x${string}`
  amount?: bigint
}

/**
 * Decoded CollateralDeposited event data.
 */
export type CollateralDepositedDecoded = {
  user: `0x${string}`
  token: `0x${string}`
  amount: bigint
}


/**
 * Filter params for CollateralRedeemed. Only indexed fields can be used for filtering.
 * Indexed string/bytes must be passed as keccak256 hash (Hex).
 */
export type CollateralRedeemedTopics = {
  redeemedFrom?: `0x${string}`
  redeemedTo?: `0x${string}`
  token?: `0x${string}`
}

/**
 * Decoded CollateralRedeemed event data.
 */
export type CollateralRedeemedDecoded = {
  redeemedFrom: `0x${string}`
  redeemedTo: `0x${string}`
  token: `0x${string}`
  amount: bigint
}


export const DSCEngineABI = [{"type":"constructor","inputs":[{"name":"tokenAddresses","type":"address[]","internalType":"address[]"},{"name":"priceFeedAddresses","type":"address[]","internalType":"address[]"},{"name":"dscAddress","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"burnDsc","inputs":[{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"calculateHealthFactor","inputs":[{"name":"totalDscMinted","type":"uint256","internalType":"uint256"},{"name":"collateralValueInUsd","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"pure"},{"type":"function","name":"depositCollateral","inputs":[{"name":"tokenCollateralAddress","type":"address","internalType":"address"},{"name":"amountCollateral","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"depositCollateralAndMintDsc","inputs":[{"name":"tokenCollateralAddress","type":"address","internalType":"address"},{"name":"amountCollateral","type":"uint256","internalType":"uint256"},{"name":"amountDscToMint","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"getAccountCollateralValue","inputs":[{"name":"user","type":"address","internalType":"address"}],"outputs":[{"name":"totalCollateralValueInUsd","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getAccountInformation","inputs":[{"name":"user","type":"address","internalType":"address"}],"outputs":[{"name":"totalDscMinted","type":"uint256","internalType":"uint256"},{"name":"collateralValueInUsd","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getAdditionalFeedPrecision","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"pure"},{"type":"function","name":"getCollateralBalanceOfUser","inputs":[{"name":"user","type":"address","internalType":"address"},{"name":"token","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getCollateralTokenPriceFeed","inputs":[{"name":"token","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"getCollateralTokens","inputs":[],"outputs":[{"name":"","type":"address[]","internalType":"address[]"}],"stateMutability":"view"},{"type":"function","name":"getDsc","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"getHealthFactor","inputs":[{"name":"user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getLiquidationBonus","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"pure"},{"type":"function","name":"getLiquidationPrecision","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"pure"},{"type":"function","name":"getLiquidationThreshold","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"pure"},{"type":"function","name":"getMinHealthFactor","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"pure"},{"type":"function","name":"getPrecision","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"pure"},{"type":"function","name":"getTokenAmountFromUsd","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"usdAmountInWei","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getUsdValue","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"liquidate","inputs":[{"name":"collateral","type":"address","internalType":"address"},{"name":"user","type":"address","internalType":"address"},{"name":"debtToCover","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"mintDsc","inputs":[{"name":"amountDscToMint","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"redeemCollateral","inputs":[{"name":"tokenCollateralAddress","type":"address","internalType":"address"},{"name":"amountCollateral","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"redeemCollateralForDsc","inputs":[{"name":"tokenCollateralAddress","type":"address","internalType":"address"},{"name":"amountCollateral","type":"uint256","internalType":"uint256"},{"name":"amountDscToBurn","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"CollateralDeposited","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"token","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":true,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"CollateralRedeemed","inputs":[{"name":"redeemedFrom","type":"address","indexed":true,"internalType":"address"},{"name":"redeemedTo","type":"address","indexed":true,"internalType":"address"},{"name":"token","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"error","name":"DSCEngine__BreaksHealthFactor","inputs":[{"name":"healthFactor","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"DSCEngine__HealthFactorNotImproved","inputs":[]},{"type":"error","name":"DSCEngine__HealthFactorOk","inputs":[]},{"type":"error","name":"DSCEngine__MintFailed","inputs":[]},{"type":"error","name":"DSCEngine__NeedsMoreThanZero","inputs":[]},{"type":"error","name":"DSCEngine__NotAllowedToken","inputs":[]},{"type":"error","name":"DSCEngine__TokenAddressesAndPriceFeedAddressesMustBeSameLength","inputs":[]},{"type":"error","name":"DSCEngine__TransferFailed","inputs":[]}] as const

export class DSCEngine {
  constructor(
    private readonly client: EVMClient,
    public readonly address: Address,
  ) {}

  calculateHealthFactor(
    runtime: Runtime<unknown>,
    totalDscMinted: bigint,
    collateralValueInUsd: bigint,
  ): bigint {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'calculateHealthFactor' as const,
      args: [totalDscMinted, collateralValueInUsd],
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'calculateHealthFactor' as const,
      data: bytesToHex(result.data),
    }) as bigint
  }

  getAccountCollateralValue(
    runtime: Runtime<unknown>,
    user: `0x${string}`,
  ): bigint {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'getAccountCollateralValue' as const,
      args: [user],
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'getAccountCollateralValue' as const,
      data: bytesToHex(result.data),
    }) as bigint
  }

  getAccountInformation(
    runtime: Runtime<unknown>,
    user: `0x${string}`,
  ): readonly [bigint, bigint] {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'getAccountInformation' as const,
      args: [user],
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'getAccountInformation' as const,
      data: bytesToHex(result.data),
    }) as readonly [bigint, bigint]
  }

  getAdditionalFeedPrecision(
    runtime: Runtime<unknown>,
  ): bigint {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'getAdditionalFeedPrecision' as const,
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'getAdditionalFeedPrecision' as const,
      data: bytesToHex(result.data),
    }) as bigint
  }

  getCollateralBalanceOfUser(
    runtime: Runtime<unknown>,
    user: `0x${string}`,
    token: `0x${string}`,
  ): bigint {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'getCollateralBalanceOfUser' as const,
      args: [user, token],
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'getCollateralBalanceOfUser' as const,
      data: bytesToHex(result.data),
    }) as bigint
  }

  getCollateralTokenPriceFeed(
    runtime: Runtime<unknown>,
    token: `0x${string}`,
  ): `0x${string}` {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'getCollateralTokenPriceFeed' as const,
      args: [token],
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'getCollateralTokenPriceFeed' as const,
      data: bytesToHex(result.data),
    }) as `0x${string}`
  }

  getCollateralTokens(
    runtime: Runtime<unknown>,
  ): readonly `0x${string}`[] {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'getCollateralTokens' as const,
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'getCollateralTokens' as const,
      data: bytesToHex(result.data),
    }) as readonly `0x${string}`[]
  }

  getDsc(
    runtime: Runtime<unknown>,
  ): `0x${string}` {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'getDsc' as const,
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'getDsc' as const,
      data: bytesToHex(result.data),
    }) as `0x${string}`
  }

  getHealthFactor(
    runtime: Runtime<unknown>,
    user: `0x${string}`,
  ): bigint {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'getHealthFactor' as const,
      args: [user],
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'getHealthFactor' as const,
      data: bytesToHex(result.data),
    }) as bigint
  }

  getLiquidationBonus(
    runtime: Runtime<unknown>,
  ): bigint {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'getLiquidationBonus' as const,
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'getLiquidationBonus' as const,
      data: bytesToHex(result.data),
    }) as bigint
  }

  getLiquidationPrecision(
    runtime: Runtime<unknown>,
  ): bigint {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'getLiquidationPrecision' as const,
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'getLiquidationPrecision' as const,
      data: bytesToHex(result.data),
    }) as bigint
  }

  getLiquidationThreshold(
    runtime: Runtime<unknown>,
  ): bigint {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'getLiquidationThreshold' as const,
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'getLiquidationThreshold' as const,
      data: bytesToHex(result.data),
    }) as bigint
  }

  getMinHealthFactor(
    runtime: Runtime<unknown>,
  ): bigint {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'getMinHealthFactor' as const,
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'getMinHealthFactor' as const,
      data: bytesToHex(result.data),
    }) as bigint
  }

  getPrecision(
    runtime: Runtime<unknown>,
  ): bigint {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'getPrecision' as const,
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'getPrecision' as const,
      data: bytesToHex(result.data),
    }) as bigint
  }

  getTokenAmountFromUsd(
    runtime: Runtime<unknown>,
    token: `0x${string}`,
    usdAmountInWei: bigint,
  ): bigint {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'getTokenAmountFromUsd' as const,
      args: [token, usdAmountInWei],
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'getTokenAmountFromUsd' as const,
      data: bytesToHex(result.data),
    }) as bigint
  }

  getUsdValue(
    runtime: Runtime<unknown>,
    token: `0x${string}`,
    amount: bigint,
  ): bigint {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'getUsdValue' as const,
      args: [token, amount],
    })

    const result = this.client
      .callContract(runtime, {
        call: encodeCallMsg({ from: zeroAddress, to: this.address, data: callData }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    return decodeFunctionResult({
      abi: DSCEngineABI,
      functionName: 'getUsdValue' as const,
      data: bytesToHex(result.data),
    }) as bigint
  }

  writeReportFromBurnDsc(
    runtime: Runtime<unknown>,
    amount: bigint,
    gasConfig?: { gasLimit?: string },
  ) {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'burnDsc' as const,
      args: [amount],
    })

    const reportResponse = runtime
      .report(prepareReportRequest(callData))
      .result()

    return this.client
      .writeReport(runtime, {
        receiver: this.address,
        report: reportResponse,
        gasConfig,
      })
      .result()
  }

  writeReportFromDepositCollateral(
    runtime: Runtime<unknown>,
    tokenCollateralAddress: `0x${string}`,
    amountCollateral: bigint,
    gasConfig?: { gasLimit?: string },
  ) {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'depositCollateral' as const,
      args: [tokenCollateralAddress, amountCollateral],
    })

    const reportResponse = runtime
      .report(prepareReportRequest(callData))
      .result()

    return this.client
      .writeReport(runtime, {
        receiver: this.address,
        report: reportResponse,
        gasConfig,
      })
      .result()
  }

  writeReportFromDepositCollateralAndMintDsc(
    runtime: Runtime<unknown>,
    tokenCollateralAddress: `0x${string}`,
    amountCollateral: bigint,
    amountDscToMint: bigint,
    gasConfig?: { gasLimit?: string },
  ) {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'depositCollateralAndMintDsc' as const,
      args: [tokenCollateralAddress, amountCollateral, amountDscToMint],
    })

    const reportResponse = runtime
      .report(prepareReportRequest(callData))
      .result()

    return this.client
      .writeReport(runtime, {
        receiver: this.address,
        report: reportResponse,
        gasConfig,
      })
      .result()
  }

  writeReportFromLiquidate(
    runtime: Runtime<unknown>,
    collateral: `0x${string}`,
    user: `0x${string}`,
    debtToCover: bigint,
    gasConfig?: { gasLimit?: string },
  ) {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'liquidate' as const,
      args: [collateral, user, debtToCover],
    })

    const reportResponse = runtime
      .report(prepareReportRequest(callData))
      .result()

    return this.client
      .writeReport(runtime, {
        receiver: this.address,
        report: reportResponse,
        gasConfig,
      })
      .result()
  }

  writeReportFromMintDsc(
    runtime: Runtime<unknown>,
    amountDscToMint: bigint,
    gasConfig?: { gasLimit?: string },
  ) {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'mintDsc' as const,
      args: [amountDscToMint],
    })

    const reportResponse = runtime
      .report(prepareReportRequest(callData))
      .result()

    return this.client
      .writeReport(runtime, {
        receiver: this.address,
        report: reportResponse,
        gasConfig,
      })
      .result()
  }

  writeReportFromRedeemCollateral(
    runtime: Runtime<unknown>,
    tokenCollateralAddress: `0x${string}`,
    amountCollateral: bigint,
    gasConfig?: { gasLimit?: string },
  ) {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'redeemCollateral' as const,
      args: [tokenCollateralAddress, amountCollateral],
    })

    const reportResponse = runtime
      .report(prepareReportRequest(callData))
      .result()

    return this.client
      .writeReport(runtime, {
        receiver: this.address,
        report: reportResponse,
        gasConfig,
      })
      .result()
  }

  writeReportFromRedeemCollateralForDsc(
    runtime: Runtime<unknown>,
    tokenCollateralAddress: `0x${string}`,
    amountCollateral: bigint,
    amountDscToBurn: bigint,
    gasConfig?: { gasLimit?: string },
  ) {
    const callData = encodeFunctionData({
      abi: DSCEngineABI,
      functionName: 'redeemCollateralForDsc' as const,
      args: [tokenCollateralAddress, amountCollateral, amountDscToBurn],
    })

    const reportResponse = runtime
      .report(prepareReportRequest(callData))
      .result()

    return this.client
      .writeReport(runtime, {
        receiver: this.address,
        report: reportResponse,
        gasConfig,
      })
      .result()
  }

  writeReport(
    runtime: Runtime<unknown>,
    callData: Hex,
    gasConfig?: { gasLimit?: string },
  ) {
    const reportResponse = runtime
      .report(prepareReportRequest(callData))
      .result()

    return this.client
      .writeReport(runtime, {
        receiver: this.address,
        report: reportResponse,
        gasConfig,
      })
      .result()
  }

  /**
   * Creates a log trigger for CollateralDeposited events.
   * The returned trigger's adapt method decodes the raw log into CollateralDepositedDecoded,
   * so the handler receives typed event data directly.
   * When multiple filters are provided, topic values are merged with OR semantics (match any).
   */
  logTriggerCollateralDeposited(
    filters?: CollateralDepositedTopics[],
  ) {
    let topics: { values: string[] }[]
    if (!filters || filters.length === 0) {
      const encoded = encodeEventTopics({
        abi: DSCEngineABI,
        eventName: 'CollateralDeposited' as const,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else if (filters.length === 1) {
      const f = filters[0]
      const args = {
        user: f.user,
        token: f.token,
        amount: f.amount,
      }
      const encoded = encodeEventTopics({
        abi: DSCEngineABI,
        eventName: 'CollateralDeposited' as const,
        args,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else {
      const allEncoded = filters.map((f) => {
        const args = {
          user: f.user,
          token: f.token,
          amount: f.amount,
        }
        return encodeEventTopics({
          abi: DSCEngineABI,
          eventName: 'CollateralDeposited' as const,
          args,
        })
      })
      topics = allEncoded[0].map((_, i) => ({
        values: [...new Set(allEncoded.flatMap((row) => encodeTopicValue(row[i])))],
      }))
    }
    const baseTrigger = this.client.logTrigger({
      addresses: [hexToBase64(this.address)],
      topics,
    })
    const contract = this
    return {
      capabilityId: () => baseTrigger.capabilityId(),
      method: () => baseTrigger.method(),
      outputSchema: () => baseTrigger.outputSchema(),
      configAsAny: () => baseTrigger.configAsAny(),
      adapt: (rawOutput: EVMLog): DecodedLog<CollateralDepositedDecoded> => contract.decodeCollateralDeposited(rawOutput),
    }
  }

  /**
   * Decodes a log into CollateralDeposited data, preserving all log metadata.
   */
  decodeCollateralDeposited(log: EVMLog): DecodedLog<CollateralDepositedDecoded> {
    const decoded = decodeEventLog({
      abi: DSCEngineABI,
      data: bytesToHex(log.data),
      topics: log.topics.map((t) => bytesToHex(t)) as [Hex, ...Hex[]],
    })
    const { data: _, ...rest } = log
    return { ...rest, data: decoded.args as unknown as CollateralDepositedDecoded }
  }

  /**
   * Creates a log trigger for CollateralRedeemed events.
   * The returned trigger's adapt method decodes the raw log into CollateralRedeemedDecoded,
   * so the handler receives typed event data directly.
   * When multiple filters are provided, topic values are merged with OR semantics (match any).
   */
  logTriggerCollateralRedeemed(
    filters?: CollateralRedeemedTopics[],
  ) {
    let topics: { values: string[] }[]
    if (!filters || filters.length === 0) {
      const encoded = encodeEventTopics({
        abi: DSCEngineABI,
        eventName: 'CollateralRedeemed' as const,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else if (filters.length === 1) {
      const f = filters[0]
      const args = {
        redeemedFrom: f.redeemedFrom,
        redeemedTo: f.redeemedTo,
        token: f.token,
      }
      const encoded = encodeEventTopics({
        abi: DSCEngineABI,
        eventName: 'CollateralRedeemed' as const,
        args,
      })
      topics = encoded.map((t) => ({ values: encodeTopicValue(t) }))
    } else {
      const allEncoded = filters.map((f) => {
        const args = {
          redeemedFrom: f.redeemedFrom,
          redeemedTo: f.redeemedTo,
          token: f.token,
        }
        return encodeEventTopics({
          abi: DSCEngineABI,
          eventName: 'CollateralRedeemed' as const,
          args,
        })
      })
      topics = allEncoded[0].map((_, i) => ({
        values: [...new Set(allEncoded.flatMap((row) => encodeTopicValue(row[i])))],
      }))
    }
    const baseTrigger = this.client.logTrigger({
      addresses: [hexToBase64(this.address)],
      topics,
    })
    const contract = this
    return {
      capabilityId: () => baseTrigger.capabilityId(),
      method: () => baseTrigger.method(),
      outputSchema: () => baseTrigger.outputSchema(),
      configAsAny: () => baseTrigger.configAsAny(),
      adapt: (rawOutput: EVMLog): DecodedLog<CollateralRedeemedDecoded> => contract.decodeCollateralRedeemed(rawOutput),
    }
  }

  /**
   * Decodes a log into CollateralRedeemed data, preserving all log metadata.
   */
  decodeCollateralRedeemed(log: EVMLog): DecodedLog<CollateralRedeemedDecoded> {
    const decoded = decodeEventLog({
      abi: DSCEngineABI,
      data: bytesToHex(log.data),
      topics: log.topics.map((t) => bytesToHex(t)) as [Hex, ...Hex[]],
    })
    const { data: _, ...rest } = log
    return { ...rest, data: decoded.args as unknown as CollateralRedeemedDecoded }
  }
}

