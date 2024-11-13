---
title: "What the Schnorr?! Threshold Signatures on the Internet Computer"
description: "Interact natively with other blockchains using threshold signatures on the Internet Computer. Ethereum, Bitcoin, Solana, and more than twenty other chains are supported."
pubDate: "2024-11-12"
heroImage: "/241112-hero.jpg"
---

The Internet Computer (ICP) recently added support for Threshold Schnorr signatures alongside its existing Threshold ECDSA support. 

What is that anyway?! **Schnorr what?!**

This article explains these complex cryptographic concepts simply, highlighting the use cases they unlock.

**TL;DR:**
- Threshold signatures allow ICP smart contracts (canisters) to **securely derive addresses on other blockchains** and sign transactions on their behalf.
- ICP supports signature schemes compatible with widely used blockchains, including **Bitcoin, Ethereum, Solana and more than twenty other chains**.
- With this support, a canister on ICP can **natively hold Bitcoin, Ethereum, and other assets**, and sign transactions directly on those chains without intermediaries.

First, let’s understand the basics of threshold signatures, a powerful technology that enables secure, multi-party signing without exposing private keys.

## Threshold Signatures: A Primer

In traditional digital signatures, a single private key is used to sign a message, and the corresponding public key can be used to verify the signature. In a blockchain context, the public key is used to derive an address, and the private key is used to sign transactions. If you are using Ledger to interact with a blockchain, the private key is stored on the device. If you use Metamask, the private key is stored in your browser.

In threshold signatures, the private key is instead divided into multiple shares, and a subset of these shares is required to collectively sign a message. This approach offers several advantages:

1. **Enhanced Security**: Since no single entity possesses the entire private key, the risk of a single point of failure or compromise is reduced.
2. **Resilience**: Even if some key shares are compromised, the threshold number of shares required for signing ensures that the signature remains secure.
3. **Flexibility**: Threshold signatures can be used for multi-signature schemes, where multiple parties collectively sign a message, or for threshold schemes where a subset of nodes in a network collaboratively sign transactions.

On ICP, the nodes of the subnet hosting a canister hold the key shares. These nodes are collectively responsible for generating and managing the key shares required for threshold signatures. 

## Unique Public Keys for Canister Identity and Security

Every canister on the Internet Computer has its own unique public key, acting as its secure identifier. Canisters never have direct access to their private keys, ensuring that sensitive operations remain protected. When a canister needs to sign a transaction or message, it sends a request to the subnet nodes, which collaboratively generate the signature using a threshold signing protocol. 

To interact with other blockchains, a canister can derive addresses on those chains based on its public key. This capability allows a canister to hold assets on other chains and even sign transactions directly on their behalf, **as long as it supports the same signature scheme**.

Public key cryptography uses various forms of mathematical curves to generate keys and signatures. On top of these curves, different signature schemes are built, each with its own encoding and security properties. **A cryptographic scheme defines how keys are generated, how messages are signed, and how signatures are verified**.

Let’s explore the two signature schemes supported by ICP and the blockchains they enable canisters to interact with.

## Threshold ECDSA

The first signature scheme supported by ICP was Threshold ECDSA. This scheme allows canisters to securely hold Bitcoin, interact with Ethereum and other EVM chains, and sign transactions on these chains using ECDSA signatures. 

![241112-secp256k1](/241112-secp256k1.png)

ECDSA relies on the elliptic curve **secp256k1**, a curve chosen for its efficiency and security in cryptographic applications. Developed by the Standards for Efficient Cryptography Group (SECG), secp256k1 was selected by Bitcoin’s creator, Satoshi Nakamoto, for its strong security properties and computational efficiency, making it ideal for digital signatures. Its designation as a Koblitz curve means it has certain mathematical properties that optimize performance, especially for fast computation, which is crucial in high-transaction environments like Bitcoin. The curve’s 256-bit length offers robust protection, balancing security with practical speed for modern cryptographic needs.

Many other chains also build on ECDSA, making it a widely used signature scheme in the blockchain space. Some other chains that use ECDSA include: **Avalanche, Cardano, Cosmos, Dogecoin, Filecoin, Hedera, Polkadot, Stacks and XRP**.

[Learn more about Threshold ECDSA](https://internetcomputer.org/docs/current/developer-docs/smart-contracts/signatures/t-ecdsa)

## Threshold Schnorr

With the recent introduction of the threshold Schnorr signature scheme, ICP expands its cryptographic capabilities by enabling canisters to sign messages on two different curves: **secp256k1** (following BIP340 standards) and **Curve25519**. This allows for even greater flexibility and compatibility across blockchain ecosystems.

![241112-curve25519](/241112-curve25519.png)

Curve25519 is a slightly newer elliptic curve that offers similar security properties to secp256k1 but with different performance characteristics. It’s optimized for both speed and security, making it efficient and resistant to certain implementation vulnerabilities. Curve25519’s structure also makes it faster for verification, making it ideal for high-performance applications.

Threshold Schnorr on ICP supports two main algorithms, each with its own signature encoding:

1. **BIP340** on secp256k1: This curve and encoding are widely used in Bitcoin, especially in Taproot-related protocols like **Ordinals, Runes, and BRC-20 tokens**. This compatibility allows ICP canisters to directly interact with Bitcoin’s Taproot features.
2. **Ed25519**: Ed25519 is a signature scheme that builds on Curve25519, using it in the Edwards form. This option provides compatibility with protocols and ecosystems that rely on Ed25519-based signatures. Ed25519 is a specific implementation of EdDSA (Edwards-curve Digital Signature Algorithm), a more general signature scheme known for its strong security and high performance.

Offering EdDSA opens up support for a wide range of additional chains, including **Solana, Stellar, Toncoin, Cardano, Polkadot, and Ripple**. 

[Learn more about Threshold Schnorr](https://internetcomputer.org/docs/current/developer-docs/smart-contracts/signatures/t-schnorr)

## Putting Threshold Signatures to Work

Let's wrap up this short article. 

You have learnt how threshold signatures allow ICP canisters to interact natively with other blockchains, securely holding assets and signing transactions. This capability opens up a world of possibilities for decentralized applications and cross-chain interactions.

Using Internet Computer lingo, we call this capability “[chain fusion](https://internetcomputer.org/chainfusion)”, where different blockchains can seamlessly interact and share assets without the need for intermediaries. 

Examples of chain fusion use cases include:
1. **Decentralized Exchanges (DEXs)**: Canisters can securely hold assets from multiple chains and facilitate trustless swaps between them.
2. **Cross-Chain Messaging**: Canisters can send messages and trigger actions on other chains, enabling complex workflows and interoperability.
3. **Multi-Asset Wallets**: Canisters can manage a diverse portfolio of assets across various blockchains, providing users with a unified interface for asset management.

A number of projects are already using threshold Schnorr!
1. **[Bioniq](https://bioniq.io)**: Bioniq is the fastest Ordinals marketplace. Buy, sell, and trade with no gas fees, near instant finality, and decentralized secure token bridging.
2. **[Bitfinity](https://bitfinity.network)**: Bitfinity is a blazingly-fast, next-gen EVM Network, serving as a Layer Two for Bitcoin - utilizing threshold signatures for security.
3. **[Omnity Bridge](https://bridge.omnity.network/runes)**: On-chain interoperable omnichain protocol operating without the need for any off-chain components such as relayers or indexers. 
4. **[Loka Mining](https://www.lokamining.com/)**: Maximize your Bitcoin mining profits with Loka's unbiased pool comparison and easy switching.

## Conclusion

Chain fusion and threshold signatures are exciting developments promising a future where blockchains can seamlessly interact and share assets in a trustless, secure manner. With support for both Threshold ECDSA and Threshold Schnorr signatures, the Internet Computer now supports most major blockchains.

The [internetcomputer.org](https://internetcomputer.org/docs/current/developer-docs/getting-started/network-overview) website provides detailed documentation on how to implement threshold signatures in your smart contracts. 

**Let's build!**