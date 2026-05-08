---
title: "Introducing ic-sql-migrate"
description: "A lightweight Rust migration library for running SQLite and Turso database migrations inside Internet Computer canisters."
pubDate: "2025-10-01"
---

I built `ic-sql-migrate`, a lightweight database migration library for Internet Computer canisters with support for SQLite and Turso databases.

The library embeds SQL migration files into your canister at compile time, tracks which migrations have already been applied, and runs pending migrations automatically during canister initialization and upgrade. It is designed for canisters that want normal database migration workflows without hand-rolling migration state, ordering, and execution logic.

This has become practical thanks to [`wasi2ic`](https://github.com/wasm-forge/wasi2ic), built by [@sgaflv](https://forum.dfinity.org/u/sgaflv). `wasi2ic` makes it possible to run Wasm binaries compiled for WASI on the Internet Computer by replacing WASI-specific function calls with IC-compatible polyfill implementations. That opens the door for projects that compile to WASI, including SQLite, to run inside canisters.

- **Crates.io:** https://crates.io/crates/ic-sql-migrate
- **SQLite on ICP setup:** https://forum.dfinity.org/t/creating-rust-canisters-with-sqlite-support/58403

## Features

- **Multi-database support:** works with SQLite via `ic-rusqlite` and Turso databases.
- **Compile-time embedding:** migration files are embedded into your canister at compile time.
- **Automatic migration:** tracks and applies migrations automatically on canister init and upgrade.
- **Transactional:** all migrations run in transactions for safety.
- **ICP-native:** designed specifically for Internet Computer canisters.

## Quick start

### Prerequisites

You must enable exactly one database feature, either `sqlite` or `turso`. There is no default feature.

For SQLite support, you also need the Rust toolchain, `dfx`, and `wasi2ic`:

```bash
cargo install wasi2ic
```

### Configure dfx.json for SQLite

For SQLite support, configure `dfx.json` to compile for the `wasm32-wasip1` target and use `wasi2ic` to process the binary:

```json
{
  "canisters": {
    "your_canister": {
      "candid": "your_canister.did",
      "package": "your_canister",
      "type": "custom",
      "build": [
        "cargo build --target wasm32-wasip1 --release",
        "wasi2ic target/wasm32-wasip1/release/your_canister.wasm target/wasm32-wasip1/release/your_canister-wasi2ic.wasm"
      ],
      "wasm": "target/wasm32-wasip1/release/your_canister-wasi2ic.wasm"
    }
  }
}
```

This configuration compiles your canister for the `wasm32-wasip1` target, converts WASI function calls to IC-compatible polyfills, and points `dfx` to the processed Wasm file for deployment.

Turso canisters use the standard `wasm32-unknown-unknown` target and do not require `wasi2ic` processing.

### Install the crate

Add `ic-sql-migrate` to both `[dependencies]` and `[build-dependencies]` in your `Cargo.toml`.

For SQLite support:

```toml
[dependencies]
ic-sql-migrate = { version = "0.0.4", features = ["sqlite"] }
ic-rusqlite = { version = "0.4.2", features = ["precompiled"], default-features = false }
ic-cdk = "0.18.7"

[build-dependencies]
ic-sql-migrate = "0.0.4"
```

For Turso support:

```toml
[dependencies]
ic-sql-migrate = { version = "0.0.4", features = ["turso"] }
turso = "0.1.4"
ic-cdk = "0.18.7"

[build-dependencies]
ic-sql-migrate = "0.0.4"
```

The features are mutually exclusive. Choose exactly one of `sqlite` or `turso`.

## Basic usage

### 1. Create migration files

Create a `migrations/` directory with SQL files. Each migration should be:

- **Numbered sequentially**, for example `000_initial.sql` or `001_add_users.sql`.
- **Idempotent when possible**, using clauses such as `IF NOT EXISTS`.
- **Forward-only**, since the library does not support rollbacks.

```sql
-- migrations/000_initial.sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT
);
```

### 2. Set up build.rs

The `list()` function scans your migrations directory at compile time and generates code to embed the SQL files into your canister binary. This makes the migrations available as static data in your compiled canister:

```rust
fn main() {
    ic_sql_migrate::list(Some("migrations")).unwrap();
}
```

### 3. Run migrations in your canister

The `include!()` macro incorporates the migrations discovered by `list()` in `build.rs`. It creates a static array of `Migration` objects containing your SQL files, which you pass to `up()` to execute them.

SQLite example:

```rust
use ic_cdk::{init, post_upgrade, pre_upgrade};
use ic_rusqlite::{close_connection, with_connection, Connection};

static MIGRATIONS: &[ic_sql_migrate::Migration] = ic_sql_migrate::include!();

fn run_migrations() {
    with_connection(|mut conn| {
        let conn: &mut Connection = &mut conn;
        ic_sql_migrate::sqlite::up(conn, MIGRATIONS).unwrap();
    });
}

#[init]
fn init() {
    run_migrations();
}

#[pre_upgrade]
fn pre_upgrade() {
    close_connection();
}

#[post_upgrade]
fn post_upgrade() {
    run_migrations();
}
```

Turso example:

```rust
use ic_cdk::{init, post_upgrade};

static MIGRATIONS: &[ic_sql_migrate::Migration] = ic_sql_migrate::include!();

async fn run_migrations() {
    let mut conn = get_connection().await;
    ic_sql_migrate::turso::up(&mut conn, MIGRATIONS).await.unwrap();
}

#[init]
async fn init() {
    run_migrations().await;
}

#[post_upgrade]
async fn post_upgrade() {
    run_migrations().await;
}
```

## Examples

Complete working examples are provided for both database backends.

### SQLite example: advanced database operations

The [SQLite example](https://github.com/kristoferlund/ic-sql-migrate/tree/main/examples/sqlite) showcases high-performance SQLite on ICP with the full Chinook database.

It demonstrates:

- Complete database import with 11 tables and thousands of records.
- Complex queries with multi-table joins, aggregations, and analytics.
- Read operations for top customer analysis, genre and artist revenue analytics, sales trends, and employee performance metrics.
- Write operations for bulk invoice generation and playlist creation.
- Performance tracking with instruction counts.
- Stress testing with operations that process thousands of records and complex transactions.

```bash
cd examples/sqlite
dfx start --clean
dfx deploy
dfx canister call sqlite run
dfx canister call sqlite test1
dfx canister call sqlite test2
dfx canister call sqlite test3
dfx canister call sqlite test4
dfx canister call sqlite test5
```

The SQLite example shows that complex, production-grade databases can run efficiently on the Internet Computer, with operations processing thousands of records in a single call while tracking instruction usage.

### Turso example: basic migration demo

The [Turso example](https://github.com/kristoferlund/ic-sql-migrate/tree/main/examples/turso) shows Turso database usage in an ICP canister.

It demonstrates:

- Async migration execution.
- Stable memory persistence.
- A simple person table with basic operations.
- A smaller setup suitable for simpler use cases.

```bash
cd examples/turso
dfx start --clean
dfx deploy
dfx canister call turso run
```

The SQLite example demonstrates more advanced capabilities, making it the recommended choice for complex database operations on ICP.
