import { ethers } from 'ethers';

const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/vkyx7QIpqK-hnwwqoQMpV';
const KMS_PROXY = '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A';

// ERC1967 beacon storage slot: keccak256("eip1967.proxy.beacon") - 1
const BEACON_SLOT = '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50';

async function findPublicKey() {
    console.log('🔍 Reading ERC1967 beacon slot...\n');

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Read beacon address from storage
    const beaconData = await provider.getStorage(KMS_PROXY, BEACON_SLOT);
    const beaconAddress = ethers.getAddress('0x' + beaconData.slice(-40));
    console.log('✅ Beacon address:', beaconAddress);

    // Call beacon.implementation()
    const implData = await provider.call({
        to: beaconAddress,
        data: '0x5c60da1b' // implementation()
    });
    const implAddress = ethers.getAddress('0x' + implData.slice(-40));
    console.log('✅ Implementation address:', implAddress);
    console.log('   View on Etherscan: https://sepolia.etherscan.io/address/' + implAddress + '#code\n');

    // Check implementation code
    const code = await provider.getCode(implAddress);
    console.log('📋 Implementation code length:', code.length, 'bytes\n');

    // Try to find public key in implementation
    console.log('🔍 Searching for public key in implementation...\n');

    const attempts = [
        { name: 'publicKey()', selector: '0x63ffab05' },
        { name: 'getPublicKey()', selector: '0x857cdbb8' },
        { name: 'PUBLIC_KEY()', selector: '0x88a65f46' },
        { name: 'kmsVerifier()', selector: '0x8c564c4a' },
        { name: 'getKMSVerifier()', selector: '0x7c1f72a0' },
    ];

    for (const attempt of attempts) {
        try {
            console.log(`Trying ${attempt.name} on implementation...`);
            const result = await provider.call({
                to: implAddress,
                data: attempt.selector
            });

            if (result && result !== '0x' && result.length > 2) {
                console.log(`✅ ${attempt.name} returned:`, result.slice(0, 66) + (result.length > 66 ? '...' : ''));
                console.log('   Total length:', result.length, 'characters');
                console.log('   Bytes:', (result.length - 2) / 2, 'bytes\n');

                // If it looks like a large bytes array, it might be the public key!
                if (result.length > 200) {
                    console.log('🎉 This might be the public key! Saving to file...');
                    const fs = await import('fs');
                    fs.writeFileSync('public_key_data.txt', result);
                    console.log('✅ Saved to public_key_data.txt\n');
                }
            }
        } catch (error: any) {
            console.log(`❌ ${attempt.name} failed:`, error.code || error.message.split('\n')[0]);
        }
    }
}

findPublicKey().catch(console.error);
