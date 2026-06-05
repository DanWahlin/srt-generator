const test = require('node:test');
const assert = require('node:assert/strict');

const { parseArgs, buildOutputPaths } = require('../src/cli.js');

test('parseArgs handles defaults and embed flag', () => {
  const args = parseArgs(['transcribe', './demo.mp4', '--embed', '--overwrite-original', '--output-dir', './out', '--model', 'base', '--language', 'en']);

  assert.equal(args.command, 'transcribe');
  assert.equal(args.input, './demo.mp4');
  assert.equal(args.embed, true);
  assert.equal(args.overwriteOriginal, true);
  assert.equal(args.outputDir, './out');
  assert.equal(args.model, 'base');
  assert.equal(args.language, 'en');
});

test('parseArgs rejects missing values for option flags', () => {
  assert.throws(() => parseArgs(['transcribe', './demo.mp4', '--model']), /Missing value for --model/);
  assert.throws(() => parseArgs(['transcribe', './demo.mp4', '--output-dir', '--language', 'en']), /Missing value for --output-dir/);
  assert.throws(() => parseArgs(['transcribe', './demo.mp4', '--language']), /Missing value for --language/);
});

test('buildOutputPaths generates SRT and MP4 names in the target directory', () => {
  const paths = buildOutputPaths('/tmp/demo.mp4', '/tmp/out');

  assert.equal(paths.srtPath, '/tmp/out/demo.srt');
  assert.equal(paths.embedPath, '/tmp/out/demo-srt.mp4');
  assert.equal(paths.targetDir, '/tmp/out');
});

 test('buildOutputPaths uses a temporary path when overwriting the source video', () => {
  const paths = buildOutputPaths('/tmp/demo.mp4', '/tmp/out', { overwriteOriginal: true });

  assert.equal(paths.embedPath, '/tmp/out/demo-srt.mp4.tmp');
 });
