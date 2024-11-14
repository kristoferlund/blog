---
title: "Build Chain Fusion Blockchain Applications with Ic-Alloy and the Internet Computer"
description: ""
pubDate: "2024-11-13"
heroImage: "/241112-hero.jpg"
---

[Dfinity](https://dfinity.org/) recently published [Ic-Alloy](https://ic-alloy.dev), a fork of the Rust based Ethereum support library [Alloy](https://alloy.rs). The goal the Ic-Alloy fork is to vastly simplify interactions with EVM based blockchains from the [Internet Computer](https://internetcomputer.org/).

In this article, we will explore the features of the Ic-Alloy library, how you can use it to interact with Ethereum, and what kind of chain fusion use cases it enables.

**TL;DR:** 
- Ic-Alloy extends Alloy with the following features:
  - **ICP Transport Layer**: Routes requests through the IC EVM RPC canister or an external RPC proxy.
  - **ICP Signer**: Abstracts away the complexity of signing EVM messages and transactions on ICP.
  - **ICP Provider**: Provides a simple interface for interacting with the IC EVM RPC canister.
- Ic-Alloy has examples!
  - [ic-alloy-toolkit](https://github.com/ic-alloy/ic-alloy-toolkit): A collection of examples on how to perform common EVM operations. [Live demo](https://u4yi6-xiaaa-aaaap-aib2q-cai.icp0.io)
  - [ic-alloy-basic-wallet](https://github.com/ic-alloy/ic-alloy-basic-wallet): A basic Ethereum multi-user wallet. [Live demo](https://7vics-6yaaa-aaaai-ap7lq-cai.icp0.io)
  - [ic-alloy-dca](https://github.com/ic-alloy/ic-alloy-dca): A semi autonomous agent, swapping tokens on Uniswap for you. 


## Introduction

One of the major strengths the Internet Computer (ICP) has over other blockchains is its ability to **hold Ethereum, Bitcoin, and other assets natively**. Not only can ICP smart contracts hold these assets, but they can also interact with smart contracts on other chains.

Before we dive into the details of the Ic-Alloy, let's first talk about what we mean when we say that that ICP can hold assets natively on other chains.

## What Does It Mean to Hold Assets on a Blockchain?

Basics first, here is a refresher on what it means to hold assets on a blockchain. If you are a seasoned blockchain developer you might consider skipping this section.

When you hold an asset on a blockchain, it means you have a balance connected to an address that you control. The address is derived from a cryptographic hash of a public key, while the balance is simply a number representing the amount of the asset you own.

The balance is recorded on the blockchain’s ledger, and you can transfer it to other addresses by signing transactions with your private key. Whoever controls the private key linked to an address effectively controls the assets at that address.

Each blockchain uses a cryptographic scheme that defines how keys and addresses are generated, how messages are signed, and how signatures are verified.

The key to ICP being able to hold assets natively on other chains is that **ICP supports more than one cryptographic scheme!** In addition to the scheme used by ICP itself, ICP also supports the following schemes:

- **ECDSA**: This scheme allows ICP smart contracts to securely hold Bitcoin, and interact with Ethereum and other EVM chains such as: **Avalanche, Cardano, Cosmos, Dogecoin, Filecoin, Hedera, Polkadot, Stacks and XRP**.
- **BIP340**: A scheme used in Bitcoin, especially in Taproot-related protocols like **Ordinals, Runes, and BRC-20 tokens**.
- **Ed25519**: A scheme used in **Solana, Stellar, Toncoin, Cardano, Polkadot, and Ripple**.

ICP supports a powerful cryptographic technology called **threshold signatures** that allows multiple parties to collaboratively sign messages without exposing their private keys. This technology enables ICP smart contracts to securely derive addresses on behalf of users and sign transactions on other blockchains. Users in turn authenticate and interact with these smart contracts to manage their assets.

To learn more about this, check out my recent article: [What the Schnorr?! Threshold Signatures on the Internet Computer](https://kristoferlund.se/blog/241112-what-the-schnorr).

## Introducing Ic-Alloy

[Alloy](https://alloy.rs) is a Rust library providing a comprehensive toolset for encoding, decoding, and constructing various Ethereum-specific data types, including transaction and contract objects. Alloy supports the creation of Ethereum-compatible applications by offering developers a type-safe, performant, and ergonomic API for interfacing with Ethereum’s core primitives and executing tasks like building, signing, and decoding transactions.

Alloy is a great library for Rust developers working with Ethereum, but it lacks built in support for ICP. This is where [Ic-Alloy](https://ic-alloy.dev) comes in.

Luckily, Alloy is designed to be modular and easily extensible. This makes it possible to fork Alloy and add support for ICP without having to rewrite the entire library from scratch.


### 1. An ICP Transport Layer

Smart contracts on ICP are called "canisters". Canisters are composable and can call each other, making it possible to build complex applications by combining multiple canisters.

To interact with Ethereum, application canisters make calls to the EVM RPC canister. This canister acts as a gateway between the Internet Computer and Ethereum, allowing canisters to send requests to Ethereum's JSON-RPC API and receive responses.

The EVM RPC canister in turn uses another core feature of ICP - [HTTPS Outcalls](https://internetcomputer.org/https-outcalls) - making it possible for smart contracts to communicate with the outside world.

Ic-Alloy adds an ICP Transport Layer to Alloy, abstracting away the complexity of routing requests through the EVM RPC canister or an external RPC proxy. This layer ensures that all requests to Ethereum are routed correctly, that requests and responses are properly typed, serialized, etc.

### 2. An ICP Signer

Alloy signers are responsible for .. you guessed it .. signing transactions. Alloy offers some built in signers for using Ledger and Trezor physical wallets, as well as various software signers for signing transactions in memory where the private key is accessible to the program.

Ic-Alloy extends Alloy with an ICP Signer that taps into the [threshold signature](https://internetcomputer.org/how-it-works/chain-key-technology) capabilities of ICP. A canister never has direct access to the private keys used to sign transactions. Instead, the canister sends a request to the subnet nodes, which collaboratively generate the signature using a threshold signing protocol.

### 3. An ICP Provider

Alloy providers facilitate the interaction with Ethereum by managing JSON-RPC requests and responses. Providers offer utility functions for common tasks like querying the state of a smart contract, sending transactions, and estimating gas costs.

The ICP Provider in Ic-Alloy extends the Alloy provider with ICP specific functionality. For example, ICP canisters cannot easily work with the popular Rust library Tokio, as it is not fully compatible with the Internet Computer. Instead, ICP canisters have to rely on [IC timers](https://internetcomputer.org/docs/current/developer-docs/smart-contracts/advanced-features/periodic-tasks/) to do things like waiting for a transaction to be mined or subscribing to log events.

## Show Me Some Code Already!

Let's do a walk through of how to use Ic-Alloy to get the balance of an ERC-20 token on Ethereum. This should give you a good idea of how Ic-Alloy works and how you can use it in your own projects.

You find more docs, examples etc on the [Ic-Alloy website](https://ic-alloy.dev).

### Add Ic-Alloy to Your Project

To use the ICP enabled fork of Alloy in your project, add this to `Cargo.toml`:

```toml
alloy = { git = "https://github.com/ic-alloy/ic-alloy.git", tag = "v0.3.5-icp.0", features = ["icp"]}
```

### Read and Parse the IERC20 Source Code

One of the greatest features of the Alloy library is the [`sol!()`](https://docs.rs/alloy-sol-macro/latest/alloy_sol_macro/macro.sol.html) macro that let's you read and parse Solidity source code. This means we can head over to [Etherscan](https://sepolia.etherscan.io/address/0x1c7d4b196cb0c7b01d743fbc6116a902379c7238#code) and just copy the interfaces we are interested in. Alloy does all the heavy lifting, converting the interfaces into Rust code that we can use in our project.

```rust
sol!(
    #[sol(rpc)]
    "sol/IERC20.sol"
);
```

### The `get_balance` function

Before we break down the code, here is the full `get_balance` function:

```Rust
#[ic_cdk::update]
async fn get_balance(address: String) -> Result<String, String> {
    let address = address.parse::<Address>().map_err(|e| e.to_string())?;
    let rpc_service = RpcService::EthSepolia(EthSepoliaService::Alchemy);
    let config = IcpConfig::new(rpc_service);
    let provider = ProviderBuilder::new().on_icp(config);

    let usdc = IERC20::new(token_address, provider);

    let result = usdc.balanceOf(address).call().await;
    match result {
        Ok(balance) => Ok(balance._0.to_string()),
        Err(e) => Err(e.to_string()),
    }    
}
```

#### 1. Parse address

```Rust
let address = address.parse::<Address>().map_err(|e| e.to_string())?;
```

First, we parse the address string into an Alloy `Address` type. This ensures that the address is valid and causes the function to return an error if it is not.

#### 2. Create a RPC service

```Rust
let rpc_service = RpcService::EthSepolia(EthSepoliaService::Alchemy);
```

Next, we create a `RpcService` that instructs the EVM RPC canister to use Alchemy as the RPC provider. See the [list of RPC providers](https://internetcomputer.org/docs/current/developer-docs/multi-chain/ethereum/evm-rpc/overview) the EVM RPC canister supports.

#### 3. Create a config object

```Rust
let config = IcpConfig::new(rpc_service);
```

The config object determines the behaviour of the ICP provider and transport when making the request. The `new` function takes the `RpcService` we created in the previous step and uses default values for the other fields.

#### 4. Create a provider

```Rust
let provider = ProviderBuilder::new().on_icp(config);
```

The `ProviderBuilder` is a helper that allows you to create a provider with a specific configuration. In this case, we use the `on_icp` method to create a provider that uses the ICP transport layer.

#### 5. Creating an instance of the IERC20 contract

```Rust
let usdc = IERC20::new(token_address, provider);
```

**How great is this!?** We can just create an instance of the IERC20 contract by calling the `new` method on the `IERC20` struct. The `new` method takes the address of the contract and the provider we created in the previous step.

Once setup, we have access to all contract methods defined in the IERC20 interface.

#### 6. Get the balance

```Rust
let result = usdc.balanceOf(address).call().await;
```

Finally, we call the `balanceOf` method on the contract to get the balance of the address. The method returns a `Result` that we can match on to get the balance or an error.

## Building Chain Fusion Applications

You have seen how the threshold signature technology of ICP together with Ic-Alloy makes it super easy to interact with Ethereum from ICP smart contracts. 

Using Internet Computer lingo, we call these kinds of applications  “[chain fusion](https://internetcomputer.org/chainfusion)” applications. By chain fusion we mean applications that seamlessly interact with multiple blockchains without the need for intermediaries. 

Examples of chain fusion use cases include:
1. **Decentralized Exchanges (DEXs)**: Canisters can securely hold assets from multiple chains and facilitate trustless swaps between them.
2. **Cross-Chain Messaging**: Canisters can send messages and trigger actions on other chains, enabling complex workflows and interoperability.
3. **Multi-Asset Wallets**: Canisters can manage a diverse portfolio of assets across various blockchains, providing users with a unified interface for asset management.
4. **Co-processing and off-chain computation**: Canisters can offload heavy computations to other chains, and use the results in their own computations.
5. **Autonomous agents and smart contracts**: Canisters can act as autonomous agents, interacting with other chains on behalf of users.

Ic-Alloy comes with a collection of examples on how to perform common EVM operations, how to build wallets and even autonomous agents:
1. [ic-alloy-toolkit](https://github.com/ic-alloy/ic-alloy-toolkit): A collection of examples on how to perform common EVM operations. [Live demo](https://u4yi6-xiaaa-aaaap-aib2q-cai.icp0.io)
2. [ic-alloy-basic-wallet](https://github.com/ic-alloy/ic-alloy-basic-wallet): A basic Ethereum multi-user wallet. [Live demo](https://7vics-6yaaa-aaaai-ap7lq-cai.icp0.io)
3. [ic-alloy-dca](https://github.com/ic-alloy/ic-alloy-dca): A semi autonomous agent, swapping tokens on Uniswap for you. 

**Let's build!**
