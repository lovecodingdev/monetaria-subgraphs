/* eslint-disable @typescript-eslint/no-inferrable-types */
import { ReserveInitialized } from '../../../generated/templates/LendingPoolConfigurator/LendingPoolConfigurator';
import { IERC20Detailed } from '../../../generated/templates/LendingPoolConfigurator/IERC20Detailed';
import { IERC20DetailedBytes } from '../../../generated/templates/LendingPoolConfigurator/IERC20DetailedBytes';
import {
  MToken as MTokenContract,
  StableDebtToken as STokenContract,
  VariableDebtToken as VTokenContract,
} from '../../../generated/templates';
import {
  createMapContractToPool,
  getOrInitMToken,
  getOrInitSToken,
  getOrInitVToken,
  getOrInitReserve,
} from '../../helpers/initializers';
export {
  handleReserveInterestRateStrategyChanged,
  handleBorrowingDisabledOnReserve,
  handleBorrowingEnabledOnReserve,
  handleStableRateDisabledOnReserve,
  handleStableRateEnabledOnReserve,
  handleReserveActivated,
  handleReserveDeactivated,
  handleReserveFreezed,
  handleReserveUnfreezed,
  handleVariableDebtTokenUpgraded,
  handleStableDebtTokenUpgraded,
  handleMTokenUpgraded,
  handleReserveDecimalsChanged,
  handleReserveFactorChanged,
  handleCollateralConfigChanged,
} from './lending-pool-configurator';
import { saveReserve, updateInterestRateStrategy } from './lending-pool-configurator';

export function handleReserveInitialized(event: ReserveInitialized): void {
  let underlyingAssetAddress = event.params.asset; //_reserve;
  let reserve = getOrInitReserve(underlyingAssetAddress, event);

  let ERC20MTokenContract = IERC20Detailed.bind(event.params.mToken);
  let ERC20ReserveContract = IERC20Detailed.bind(underlyingAssetAddress);
  let ERC20DetailedBytesContract = IERC20DetailedBytes.bind(underlyingAssetAddress);

  let nameStringCall = ERC20ReserveContract.try_name();
  if (nameStringCall.reverted) {
    let bytesNameCall = ERC20DetailedBytesContract.try_name();
    if (bytesNameCall.reverted) {
      reserve.name = '';
    } else {
      reserve.name = bytesNameCall.value.toString();
    }
  } else {
    reserve.name = nameStringCall.value;
  }

  reserve.symbol = ERC20MTokenContract.symbol().slice(1);

  reserve.decimals = ERC20ReserveContract.decimals();

  updateInterestRateStrategy(reserve, event.params.interestRateStrategyAddress, true);

  MTokenContract.create(event.params.mToken);
  createMapContractToPool(event.params.mToken, reserve.pool);
  let mToken = getOrInitMToken(event.params.mToken);
  mToken.underlyingAssetAddress = reserve.underlyingAsset;
  mToken.underlyingAssetDecimals = reserve.decimals;
  mToken.pool = reserve.pool;
  mToken.save();

  STokenContract.create(event.params.stableDebtToken);
  createMapContractToPool(event.params.stableDebtToken, reserve.pool);
  let sToken = getOrInitSToken(event.params.stableDebtToken);
  sToken.underlyingAssetAddress = reserve.underlyingAsset;
  sToken.underlyingAssetDecimals = reserve.decimals;
  sToken.pool = reserve.pool;
  sToken.save();

  VTokenContract.create(event.params.variableDebtToken);
  createMapContractToPool(event.params.variableDebtToken, reserve.pool);
  let vToken = getOrInitVToken(event.params.variableDebtToken);
  vToken.underlyingAssetAddress = reserve.underlyingAsset;
  vToken.underlyingAssetDecimals = reserve.decimals;
  vToken.pool = reserve.pool;
  vToken.save();

  reserve.mToken = mToken.id;
  reserve.sToken = sToken.id;
  reserve.vToken = vToken.id;
  reserve.isActive = true;
  saveReserve(reserve, event);
}
