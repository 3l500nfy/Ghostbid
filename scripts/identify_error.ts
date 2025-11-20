import { ethers } from 'ethers';

const errors = [
    'AuctionNotFound()',
    'InvalidWindow()',
    'NotSeller()',
    'NotManager()',
    'AuctionActive()',
    'AuctionClosed()',
    'AlreadyFinalized()',
    'BidLimitReached()',
    'DepositTooLow()',
    'AdapterNotSet()',
    'InvalidCiphertext()',
    'BidNotFound()'
];

console.log('Error Selectors:');
errors.forEach(err => {
    const hash = ethers.id(err);
    console.log(`${err}: ${hash.slice(0, 10)}`);
});
