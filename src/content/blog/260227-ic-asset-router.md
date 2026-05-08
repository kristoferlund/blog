---
title: "Announcing ic-asset-router"
description: "A Rust library that brings file-based routing, automatic response certification, typed parameters, scoped middleware, and configurable security headers to ICP canisters."
pubDate: "2026-02-27"
---

I just released `ic-asset-router` v0.1.1, a Rust library that brings file-based routing conventions, like Next.js and SvelteKit, to ICP canisters. Drop handler files into `src/routes/`, deploy, and your endpoints are live.

- **GitHub:** https://github.com/kristoferlund/ic-asset-router
- **Crates.io:** https://crates.io/crates/ic-asset-router
- **Docs:** https://docs.rs/ic-asset-router

## Why I built this

The primary motivation was a problem every ICP developer building React SPAs runs into: search engines and social networks need server-rendered `index.html` files with proper `<meta>` tags per route to generate previews. Without server-side rendering, every route on your SPA returns the same generic HTML. No custom OG images, no per-route titles or descriptions, nothing for crawlers to work with.

`ic-asset-router` solves this by letting you generate a dynamic `index.html` at the canister level for each route, with the right meta tags baked in, while the React app still runs as a normal SPA in the browser. You get dynamic OG images and social previews for every route without leaving the IC.

Beyond that, it eliminates the boilerplate that comes with writing IC HTTP handlers: manual routing logic, manually certifying each response, manually wiring up `http_request` and `http_request_update`. Every new canister starts with the same scaffolding. `ic-asset-router` eliminates all of that.

## Real-world example: Promptathon Showcase

The library powers [Promptathon Showcase](https://github.com/kristoferlund/promptathon-showcase), a recently published ICP application, and it illustrates exactly what you can build with it.

The app uses `ic-asset-router` in two ways simultaneously, much like how you would use Next.js:

1. **Frontend serving**: the canister serves a dynamically generated `index.html` for each route of the React SPA, with route-specific meta tags and OG images pre-rendered server-side.
2. **Backend API**: the same canister exposes a JSON API that the React frontend calls to load application data and serve dynamically generated results.

One canister. One library. Both the frontend shell and the backend API, just like a full-stack Next.js app, except it is Rust, compiled to Wasm, running fully on-chain.

## How it works

The build script scans your `src/routes/` directory and generates a route tree at compile time. Each file becomes an endpoint. Export a `pub fn get`, `pub fn post`, etc., and it is registered automatically.

```
src/routes/
├── index.rs           → GET /
├── about.rs           → GET /about
├── posts/
│   ├── index.rs       → GET /posts
│   └── _postId/
│       └── index.rs   → GET /posts/:postId
├── middleware.rs      → wraps everything below
└── not_found.rs       → custom 404
```

Your handler receives a typed `RouteContext<P>` with path params, search params, headers, body, and the full URL:

```rust
// src/routes/posts/_postId/index.rs
use super::Params; // generated: pub struct Params { pub post_id: String }

pub fn get(ctx: RouteContext<Params>) -> HttpResponse<'static> {
    let id = &ctx.params.post_id;
    let html = format!(
        r#"<!DOCTYPE html><html><head>
        <meta property="og:title" content="Post {id}" />
        <meta property="og:image" content="/posts/{id}/og.png" />
        </head><body>...</body></html>"#
    );
    // return your response
}
```

Dotted filenames work too. Name a file `og.png.rs` and it serves at `/posts/:id/og.png`. Combine this with an image generation library to serve dynamically rendered OG images per route:

```rust
// src/routes/posts/_postId/og.png.rs → serves at /posts/:id/og.png
pub fn get(ctx: RouteContext<Params>) -> HttpResponse<'static> {
    let png_bytes = generate_og_image(&ctx.params.post_id);
    HttpResponse::builder()
        .with_status_code(StatusCode::OK)
        .with_headers(vec![("content-type".into(), "image/png".into())])
        .with_body(Cow::Owned(png_bytes))
        .build()
}
```

## Response certification: automatic by default

Every response is certified by default in ResponseOnly mode. No setup needed. The library handles `http_request` vs `http_request_update` routing, certificate tree management, and cache invalidation.

For routes where certification does not apply, such as health checks and authenticated endpoints, mark them with `#[route(certification = "skip")]` and they behave like Candid query calls, with no consensus overhead.

For user-specific data that must be tamper-proof:

```rust
#[route(certification = "authenticated")]
pub fn get(_ctx: RouteContext<()>) -> HttpResponse<'static> {
    // Authorization header is included in the certificate
    // User A can't receive User B's cached response
}
```

## Middleware

Place a `middleware.rs` in any directory to wrap all handlers below it. Middleware composes root-to-leaf automatically:

```
root middleware → /api middleware → /api/v2 middleware → handler
```

Classic use case: CORS headers in 15 lines:

```rust
pub fn middleware(
    req: HttpRequest,
    params: &RouteParams,
    next: &dyn Fn(HttpRequest, &RouteParams) -> HttpResponse<'static>,
) -> HttpResponse<'static> {
    if req.method().as_str() == "OPTIONS" {
        return HttpResponse::builder()
            .with_status_code(StatusCode::NO_CONTENT)
            .with_headers(vec![("access-control-allow-origin".into(), "*".into())])
            .build();
    }
    next(req, params)
}
```

## 10 ready-to-deploy examples

| Example | What it shows |
|----|----|
| `askama-basic` | Compile-time HTML templates |
| `tera-basic` | Runtime HTML templates |
| `htmx-app` | Server-rendered blog with HTMX partial updates |
| `json-api` | RESTful JSON API with CRUD and CORS |
| `react-app` | React SPA with TanStack Router/Query, per-route SEO meta tags |
| `certification-modes` | All four certification modes |
| `api-authentication` | Auth-gated endpoints with skip certification |
| `security-headers` | Header presets: strict, permissive, custom |
| `cache-invalidation` | TTL-based expiry and explicit invalidation |
| `custom-404` | Styled 404 via `not_found.rs` |

Clone and `dfx deploy` from any example directory.

## Getting started

```toml
# Cargo.toml
[dependencies]
ic-asset-router = "0.1.1"

[build-dependencies]
ic-asset-router = "0.1.1"
```

The [README](https://github.com/kristoferlund/ic-asset-router) has a complete quick-start walkthrough from zero to a running canister in about 30 lines of code.

## Built with the RALPH loop

This library was built almost entirely using an AI coding agent, OpenCode, and the **RALPH loop** technique, a method introduced by [Geoffrey Huntley](https://ghuntley.com/loop) for producing high-quality AI-generated code by keeping the agent's context window focused on one task at a time.

The idea is simple: divide the work into small, well-specified tasks, each defined as a self-contained markdown file with clear acceptance criteria. A `loop.sh` script feeds one spec per session to the agent, which implements the tasks, runs verification with `cargo check` and `cargo test`, commits the result, and stops. Clean context every time, no quality degradation from overloaded sessions.

If you are looking to explore the RALPH loop yourself, this repo is a good starting point. Everything is in the open:

- [`RALPH.md`](https://github.com/kristoferlund/ic-asset-router/blob/main/RALPH.md): how the technique was applied to this project
- [`PROMPT.md`](https://github.com/kristoferlund/ic-asset-router/blob/main/PROMPT.md): the reusable session prompt fed to the agent each iteration
- [`specs/`](https://github.com/kristoferlund/ic-asset-router/tree/main/specs): all 30+ spec documents used across 6 phases, from foundations to polish

