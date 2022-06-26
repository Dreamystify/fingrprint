<div align="center">
  <br/>
  <img src="./img/logo.png" width="300" />
  <br/>
  <br/>
  <p>
    A distributed, k-sortable unique ID generation system using Redis and Lua, inspired by Icicle.
  </p>
</div>

Fingrprint is a node module to generate 64-bit, k-sortable unique IDs in a distributed fashion by using Redis' Lua scripting, and javascripts new BigInt numeric type

# Installation

For Node

```js
npm install @dreamystify/fingrprint
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
const ids = fingrprint.getId();
// 6936951099534350941n

const ids = fingrprint.getIds();
// [6936951099534350941n]

const ids = fingrprint.getIds(3);
// [6936951099534350941n, 6936951099534350942n, 6936951099534350943n]
```

# Kudos

The project was inspired by [Icicle](https://github.com/intenthq/icicle), just setup for node.js.

