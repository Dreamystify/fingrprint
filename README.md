<div align="center">
  <br/>
  <img src="./img/logo.png" width="300" />
  <br/>
  <br/>
  <p>
    A distributed, k-sortable unique ID generation system using Redis and Lua, inspired by Icicle.
  </p>
  <p>
  <a href="https://badge.fury.io/js/@dreamystify%2Ffingrprint"><img src="https://badge.fury.io/js/@dreamystify%2Ffingrprint.svg" alt="npm version" height="18"></a>
  <a href='https://coveralls.io/github/Dreamystify/fingrprint?branch=main'><img src='https://coveralls.io/repos/github/Dreamystify/fingrprint/badge.svg?branch=main' alt='Coverage Status' /></a>
  </p>
</div>

Fingrprint is a node module to generate 64-bit, k-sortable unique IDs in a distributed fashion by using Redis' Lua scripting, and javascripts new BigInt numeric type

# Getting started

**Prerequisites**

* Node.js v12+
* Redis v6+

# Installation

```js
npm install @dreamystify/fingrprint
```

To build the package locally with the TypeScript compiler, run:

```js
npm run compile
```

# Usage

```js
import Fingrprint from '@dreamystify/fingrprint';

const fingrprint = new Fingrprint({
    host: `localhost`,
    port: 6379,
    username: `username`,
    password: `password`
});
```

And to use it,

```js
const id = await fingrprint.getId();
// 6936951099534350941n

const ids = await fingrprint.getIds(); // defaults to 1
// [6936951099534350941n]

const ids = await fingrprint.getIds(3);
// [6936951099534350941n, 6936951099534350942n, 6936951099534350943n]
```

# Kudos

The project was inspired by [Icicle](https://github.com/intenthq/icicle), just setup for node.js.
