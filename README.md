node-gifsicle-stream
====================

The gifsicle command line utility as a readable/writable stream.
Based heavily on [`node-jpegtran`](https://github.com/papandreou/node-jpegtran) which is written by [papandreou](https://github.com/papandreou).

Usage
-------

The constructor accepts an optional array of command line options for the `gifsicle` binary:

```javascript
var Gifsicle = require('gifsicle-stream'),
  gifProcessor = new Gifsicle(['-w', '-O3']);

readStream.pipe(gifProcessor).pipe(writeStream);
```
