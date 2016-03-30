var Gifsicle = require('../lib/Gifsicle'),
    expect = require('expect.js'),
    path = require('path'),
    fs = require('fs');

describe('Gifsicle', function() {
  it('should produce a smaller file when used with -O3', function(done) {
    var gifsicle = new Gifsicle(['-w', '-O3']), chunks = [];

    fs.createReadStream(path.resolve(__dirname, 'nom.gif'))
      .pipe(gifsicle)
      .on('error', done)
      .on('data', function(chunk) {
        chunks.push(chunk);
      })
      .on('end', function() {
        var output = Buffer.concat(chunks);
        expect(output.length).to.be.greaterThan(0);
        expect(output.length).to.be.lessThan(2093064);
        done();
      });
  });

  it('should not emit data events while stream is paused', function(done) {
    var gifsicle = new Gifsicle(['-w', '-O3']), chunks = [];

    var fail = function() {
      done(new Error('Gifsicle emitted data events while stream was paused.'));
    };

    gifsicle.pause();
    gifsicle.on('data', fail).on('error', done);

    fs.createReadStream(path.resolve(__dirname, 'nom.gif')).pipe(gifsicle);

    setTimeout(function() {
      gifsicle.removeListener('data', fail);
      gifsicle
        .on('data', function(chunk) {
          chunks.push(chunk);
        })
        .on('end', function() {
          var output = Buffer.concat(chunks);
          expect(output.length).to.be.greaterThan(0);
          expect(output.length).to.be.lessThan(2093064);
          done();
        });

      gifsicle.resume();
    }, 1000);
  });

  it('should emit an error when processing an invalid image', function(done) {
    var gifsicle = new Gifsicle();

    gifsicle
      .on('error', function() {
        done();
      })
      .on('data', function() {
        done(new Error('Gifsicle emitted a `data` event when an error was expected.'));
      })
      .on('end', function() {
        done(new Error('Gifsicle emitted a `end` event when an error was expected.'));
      });

    gifsicle.end(new Buffer('finished', 'utf-8'));
  });

  it('should emit an error when processing with an invalid option', function(done) {
    var gifsicle = new Gifsicle(['--unrecognized-option']), seenError = false;

    gifsicle
      .on('error', function(err) {
        if (seenError) {
          done(new Error('More than one error event was emitted.'));
        } else {
          seenError = true;
          setTimeout(done, 100);
        }
      })
      .on('data', function() {
        done(new Error('Gifsicle emitted a `data` event when an error was expected.'));
      })
      .on('end', function() {
        done(new Error('Gifsicle emitted a `end` event when an error was expected.'));
      });

    gifsicle.end(new Buffer('finished', 'utf8'));
  });

  describe('#destroy', function() {
    describe('when called before the child process is launched', function() {
      it('should kill the underlying child process', function() {
        var gifsicle = new Gifsicle(['-w', '-O3']);

        gifsicle.write('GIF89a');
        gifsicle.destroy();
        expect(gifsicle.process).not.to.be.ok();
        expect(gifsicle.bufferedChunks).not.to.be.ok();
      });
    });

    describe('when called after the child process is launched', function() {
      it('should kill the underlying child process', function(done) {
        var gifsicle = new Gifsicle(['-w', '-O3']);

        gifsicle.write('GIF89a');
        setTimeout(function waitForChildProcess() {
          if (gifsicle.process) {
            gifsicle.destroy();
            expect(gifsicle.process).not.to.be.ok();
            expect(gifsicle.bufferedChunks).not.to.be.ok();
            done();
          } else {
            setTimeout(waitForChildProcess, 20);
          }
        }, 20);
      });
    });
  });
});
