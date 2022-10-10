import { Initialized as MTokenInitialized } from '../../../generated/templates/MToken/MToken';
import { Initialized as VTokenInitialized } from '../../../generated/templates/VariableDebtToken/VariableDebtToken';
import { Initialized as STokenInitialized } from '../../../generated/templates/StableDebtToken/StableDebtToken';
import { MonetariaIncentivesController as MonetariaIncentivesControllerTemplate } from '../../../generated/templates';
import { MonetariaIncentivesController as MonetariaIncentivesControllerC } from '../../../generated/templates/MonetariaIncentivesController/MonetariaIncentivesController';
import {
  ContractToPoolMapping,
  IncentivesController,
  MapAssetPool,
} from '../../../generated/schema';
import { Address, log } from '@graphprotocol/graph-ts';
import { IERC20Detailed } from '../../../generated/templates/MToken/IERC20Detailed';
import { zeroAddress } from '../../utils/converters';
export {
  handleMTokenBurn,
  handleMTokenMint,
  handleMTokenTransfer,
  handleVariableTokenBurn,
  handleVariableTokenMint,
  handleStableTokenMint,
  handleStableTokenBurn,
  handleStableTokenBorrowAllowanceDelegated,
  handleVariableTokenBorrowAllowanceDelegated,
} from './tokenization-avalanche';

function createIncentivesController(
  asset: Address,
  incentivesController: Address,
  underlyingAsset: Address,
  pool: Address
): void {
  if (incentivesController == zeroAddress()) {
    log.warning('Incentives controller is 0x0 for asset: {} | underlyingasset: {} | pool: {}', [
      asset.toHexString(),
      underlyingAsset.toHexString(),
      pool.toHexString(),
    ]);
    return;
  }
  let iController = IncentivesController.load(incentivesController.toHexString());
  if (!iController) {
    iController = new IncentivesController(incentivesController.toHexString());
    // get incentive reward info
    let MonetariaIncentivesControllerContract = MonetariaIncentivesControllerC.bind(incentivesController);
    let rewardToken = MonetariaIncentivesControllerContract.REWARD_TOKEN();
    let precision = MonetariaIncentivesControllerContract.PRECISION();
    let emissionEndTimestamp = MonetariaIncentivesControllerContract.DISTRIBUTION_END();
    let IERC20DetailedContract = IERC20Detailed.bind(rewardToken);
    let rewardTokenDecimals = IERC20DetailedContract.decimals();
    let rewardTokenSymbol = IERC20DetailedContract.symbol();
    iController.rewardToken = rewardToken;
    iController.rewardTokenDecimals = rewardTokenDecimals;
    iController.rewardTokenSymbol = rewardTokenSymbol;
    iController.precision = precision;
    iController.emissionEndTimestamp = emissionEndTimestamp.toI32();
    iController.save();
    MonetariaIncentivesControllerTemplate.create(incentivesController);
  }
  let poolAddressProvider = ContractToPoolMapping.load(pool.toHexString());
  if (poolAddressProvider != null) {
    // save asset pool mapping
    let mapAssetPool = new MapAssetPool(asset.toHexString());
    mapAssetPool.pool = poolAddressProvider.pool;
    mapAssetPool.underlyingAsset = underlyingAsset;
    mapAssetPool.save();
  }
}

export function handleMTokenInitialized(event: MTokenInitialized): void {
  // log.warning('Incentives controller is 0x0 for asset: {} | underlyingasset: {} | pool: {}', []);
  createIncentivesController(
    event.address,
    event.params.incentivesController,
    event.params.underlyingAsset,
    event.params.pool
  );
}

export function handleSTokenInitialized(event: STokenInitialized): void {
  createIncentivesController(
    event.address,
    event.params.incentivesController,
    event.params.underlyingAsset,
    event.params.pool
  );
}

export function handleVTokenInitialized(event: VTokenInitialized): void {
  createIncentivesController(
    event.address,
    event.params.incentivesController,
    event.params.underlyingAsset,
    event.params.pool
  );
}
