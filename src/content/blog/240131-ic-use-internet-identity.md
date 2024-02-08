---
title: 'ic-use-internet-identity'
description: 'A React Hook for easy integration of Internet Identity' 
pubDate: 'Jan 31 2024'
---
This package is a companion hook to [ic-use-actor](https://forum.dfinity.org/t/announcing-ic-use-actor-a-react-hook-to-simplify-communicating-with-canisters/26730). The hook makes it easy to integrate Internet Identity into your React application. It provides a simple interface for logging in and out with the Internet Identity service.

The goal of this hook is not to provide the most customisable II integration, it is to make it super easy to add login features to React ICP apps. Try it out and let me know what you think! Any features missing? 

- GitHub: https://github.com/kristoferlund/ic-use-internet-identity

- NPM: https://www.npmjs.com/package/ic-use-internet-identity

The easiest way to try it out is to fork the demo/template application. It is built with TS, Vite and TailwindCSS.

- Demo/template: https://github.com/kristoferlund/ic-use-internet-identity-demo

- **Live demo:** https://x2jdf-giaaa-aaaal-qc66a-cai.icp0.io/

![header|619x500](upload://6oZrFq7zIjPzSKkjq2NJ0y2wcZW.jpeg)


## Features

- **Cached Identity**: The identity is cached in local storage and restored on page load. This allows the user to stay logged in even if the page is refreshed.
- **Login progress**: State varibles are provided to indicate whether the user is logged in, logging in, or logged out.
- **Works with ic-use-actor**: Plays nicely with [ic-use-actor](https://www.npmjs.com/package/ic-use-actor) that provides easy access to canister methods.

## Installation

```bash
npm install ic-use-internet-identity
```

## Usage

> [!TIP]
> For a complete example, see the [ic-use-internet-identity-demo](https://github.com/kristoferlund/ic-use-internet-identity-demo) demo project.

To use `ic-use-internet-identity` in your React application, follow these steps:

### 1. Setup the `InternetIdentityProvider` component

Wrap your application's root component with `InternetIdentityProvider` to provide all child components access to the identity context.

```jsx
// main.tsx

import { InternetIdentityProvider } from "ic-use-internet-identity";
import React from "react";
import ReactDOM from "react-dom/client";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <InternetIdentityProvider>
      <App />
    </InternetIdentityProvider>
  </React.StrictMode>
);
```

### 2. Connect the `login()` function to a button

Calling `login()` opens up the Internet Identity service in a new window where the user is asked to sign in. Once signed in, the window closes and the identity is stored in local storage. The identity is then available in the `identity` context variable.

Use the `loginStatus` state variable to track the status of the login process. The `loginStatus` can be one of the following values: `idle`, `logging-in`, `success`, or `error`.

```jsx
// LoginButton.tsx

import { useInternetIdentity } from "ic-use-internet-identity";

export function LoginButton() {
  const { login, loginStatus } = useInternetIdentity();

  const disabled = loginStatus === "logging-in" || loginStatus === "success";
  const text = loginStatus === "logging-in" ? "Logging in..." : "Login";

  return (
    <button onClick={login} disabled={disabled}>
      {text}
    </button>
  );
}
```

### 3. Use the `identity` context variable to access the identity

The `identity` context variable contains the identity of the currently logged in user. The identity is available after successfully loading the identity from local storage or completing the login process.

The preferred way to use the identity is to connect it to the [ic-use-actor](https://www.npmjs.com/kristoferlund/ic-use-actor) hook. The hook provides a typed interface to the canister methods as well as interceptor functions for handling errors etc.

```jsx
// Actors.tsx

import { ReactNode } from "react";
import {
  ActorProvider,
  createActorContext,
  createUseActorHook,
} from "ic-use-actor";
import {
  canisterId,
  idlFactory,
} from "path-to/your-service/index";
import { _SERVICE } from "path-to/your-service.did";
import { useInternetIdentity } from "ic-use-internet-identity";

const actorContext = createActorContext<_SERVICE>();
export const useActor = createUseActorHook<_SERVICE>(actorContext);

export default function Actors({ children }: { children: ReactNode }) {
  const { identity } = useInternetIdentity();

  return (
    <ActorProvider<_SERVICE>
      canisterId={canisterId}
      context={actorContext}
      identity={identity}
      idlFactory={idlFactory}
    >
      {children}
    </ActorProvider>
  );
}
```

🌱