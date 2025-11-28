import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const encryptedAuction = await deploy('EncryptedAuction', {
    from: deployer,
    args: [deployer],
    log: true,
    waitConfirmations: 1
  });

  await deploy('AuctionManager', {
    from: deployer,
    args: [encryptedAuction.address],
    log: true,
    waitConfirmations: 1
  });

  const auctionContract = await ethers.getContractAt('EncryptedAuction', encryptedAuction.address);
  const managerDeployment = await deployments.get('AuctionManager');
  const managerContract = await ethers.getContractAt('AuctionManager', managerDeployment.address);
  const tx = await auctionContract.setManager(await managerContract.getAddress());
  await tx.wait();
};

export default func;
func.tags = ['GhostBid', 'Auction'];

