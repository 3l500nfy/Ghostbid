const ethers = require('ethers');

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
    const selector = hash.slice(0, 10);
    console.log(`${selector} : ${err}`);
});
