var inherits = require('util').inherits,
    memoize = require('memoizeasync'),
    Stream = require('stream').Stream,
    spawn = require('child_process').spawn,
    which = require('which');

function Gifsicle(args) {
  Stream.call(this);

  this.args = args;
  this.writable = this.readable = true;
  this.finished = this.seenOutput = false;
}

inherits(Gifsicle, Stream);

Gifsicle.findBinary = memoize(function(callback) {
  which('gifsicle', function(err, path) {
    if (err) {
      path = require('gifsicle');
    }

    if (path) {
      callback(null, path);
    } else {
      callback(new Error('Unable to locate the gifsicle binary file.'));
    }
  });
});

Gifsicle.prototype._error = function(msg) {
  if (!this.finished) {
    this.finished = true;
    this.emit('error', msg);
  }
};

Gifsicle.prototype.write = function(chunk) {
  if (this.process) {
    this.process.stdin.write(chunk);
  } else {
    if (!this.bufferedChunks) {
      this.bufferedChunks = [];
      Gifsicle.findBinary(function(err, binary) {
        if (err) {
          return this._error(err);
        }

        this.process = spawn(binary, this.args);

        // error
        this.process.on('error', this._error.bind(this));
        this.process.stdin.on('error', function() {});

        // exit
        this.process.on('exit', function(exitCode) {
          if (exitCode > 0 && !this.finished) {
            this._error(new Error('The gifsicle process exited with a non-zero exit code: ' + exitCode));
            this.finished = true;
          }
        }.bind(this));

        // stdout
        this.process.stdout
          .on('data', function(chunk) {
            this.seenOutput = true;
            this.emit('data', chunk);
          }.bind(this))
          .on('end', function() {
            if (!this.finished) {
              if (this.seenOutput) {
                this.emit('end');
              } else {
                this._error(new Error('Gifsicle: STDOUT stream ended without emitting any data.'));
              }
              this.finished = true;
            }
          }.bind(this));

        if (this.isPaused) {
          this.process.stdout.pause();
        }

        this.bufferedChunks.forEach(function(chunk) {
          if (chunk !== null) {
            this.process.stdin.write(chunk);
          } else {
            this.process.stdin.end();
          }
        }, this);
        this.bufferedChunks = null;
      }.bind(this));
    }

    this.bufferedChunks.push(chunk);
  }
};

Gifsicle.prototype.end = function(chunk) {
  if (chunk) {
    this.write(chunk);
  }

  if (this.process) {
    this.process.stdin.end();
  } else {
    if (!this.bufferedChunks) {
      this.write(new Buffer(0));
    }

    this.bufferedChunks.push(null);
  }
};

Gifsicle.prototype.destroy = function () {
    this.finished = true;
    if (this.process) {
        this.process.kill();
        this.process = null;
    }
    this.bufferedChunks = null;
};

Gifsicle.prototype.pause = function() {
  if (this.process) {
    this.process.stdout.pause();
  }
  this.isPaused = true;
};

Gifsicle.prototype.resume = function() {
  if (this.process) {
    this.process.stdout.resume();
  }
  this.isPaused = false;
};

module.exports = Gifsicle;
