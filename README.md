# node-gifsicle-stream

[![NPM Version][npm-badge]][npm-url] [![Build Status][travis-badge]][travis-url]

The gifsicle command line utility as a readable/writable stream.
Based heavily on [`node-jpegtran`](https://github.com/papandreou/node-jpegtran) which is written by [papandreou](https://github.com/papandreou).

## Installation

```sh
$ npm install gifsicle-stream
```

## Usage

The constructor accepts an optional array of command line options for the `gifsicle` binary:

```javascript
var Gifsicle = require('gifsicle-stream'),
  gifProcessor = new Gifsicle(['-w', '-O3']);

readStream.pipe(gifProcessor).pipe(writeStream);
```

[npm-badge]: https://img.shields.io/npm/v/gifsicle-stream.svg?style=flat
[npm-url]: https://www.npmjs.com/package/gifsicle-stream
[travis-badge]: https://img.shields.io/travis/oohnoitz/node-gifsicle-stream.svg?style=flat
[travis-url]: https://travis-ci.org/oohnoitz/node-gifsicle-stream
