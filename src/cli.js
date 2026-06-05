#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function printHelp() {
  console.log(`Usage:
  srtgen transcribe <input-video> [options]
 
Options:
  --embed                 Generate an MP4 with the SRT embedded as a subtitle track
  --overwrite-original    Replace the original input video with the embedded MP4
  --output-dir <dir>      Output directory for the .srt file (default: beside the input)
  --model <name>          Whisper model name (default: turbo)
  --language <code>       Whisper language hint (optional)
  --help                  Show this help message
 
Examples:
  srtgen transcribe ./demo.mp4
  srtgen transcribe ./demo.mp4 --embed
  srtgen transcribe ./demo.mp4 --embed --overwrite-original
  srtgen transcribe ./demo.mp4 --output-dir ./out --model base
`);
}
 
function parseArgs(argv) {
  const args = { command: null, input: null, embed: false, overwriteOriginal: false, outputDir: null, model: 'turbo', language: null };
 
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === 'transcribe') {
      args.command = 'transcribe';
      continue;
    }

    if (token === '--embed') {
      args.embed = true;
      continue;
    }

    if (token === '--overwrite-original') {
      args.overwriteOriginal = true;
      continue;
    }

    if (token === '--output-dir') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('Missing value for --output-dir');
      }
      args.outputDir = next;
      i += 1;
      continue;
    }

    if (token === '--model') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('Missing value for --model');
      }
      args.model = next;
      i += 1;
      continue;
    }

    if (token === '--language') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('Missing value for --language');
      }
      args.language = next;
      i += 1;
      continue;
    }

    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }

    if (!args.command) {
      args.command = token;
      continue;
    }

    if (!args.input) {
      args.input = token;
    }
  }

  return args;
}

function resolvePath(value) {
  return path.resolve(process.cwd(), value);
}

function buildOutputPaths(inputPath, outputDir, options = {}) {
  const inputName = path.basename(inputPath, path.extname(inputPath));
  const targetDir = outputDir || path.dirname(inputPath);
  const srtPath = path.join(targetDir, `${inputName}.srt`);
  const embedPath = options.overwriteOriginal
    ? path.join(targetDir, `${inputName}-srt.mp4.tmp`)
    : path.join(targetDir, `${inputName}-srt.mp4`);

  return { srtPath, embedPath, targetDir };
}

function findExecutable(commandNames) {
  for (const commandName of commandNames) {
    const result = spawnSync(commandName, ['--help'], { shell: false, stdio: 'ignore' });
    if (result.status === 0) {
      return { command: commandName, args: [] };
    }
  }

  return null;
}

function findWhisperCommand() {
  const direct = findExecutable(['whisper']);
  if (direct) return direct;

  const pythonCandidates = ['python', 'python3', 'py'];
  for (const python of pythonCandidates) {
    const result = spawnSync(python, ['-m', 'whisper', '--help'], { shell: false, stdio: 'ignore' });
    if (result.status === 0) {
      return { command: python, args: ['-m', 'whisper'] };
    }
  }

  return null;
}

function supportsSubtitleFilter(commandName) {
  const result = spawnSync(commandName, ['-hide_banner', '-filters'], {
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error || result.status !== 0) {
    return false;
  }

  return result.stdout.toString().includes('subtitles');
}

function findFfmpegCommand() {
  const candidates = [
    'ffmpeg-full',
    'ffmpeg',
    '/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg',
    '/usr/local/opt/ffmpeg-full/bin/ffmpeg',
  ];

  for (const candidate of candidates) {
    if (supportsSubtitleFilter(candidate)) {
      return { command: candidate, args: [] };
    }
  }

  return findExecutable(['ffmpeg-full', 'ffmpeg']);
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    cwd: options.cwd || process.cwd(),
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function validateInput(inputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }
}

function runTranscribe(inputPath, options) {
  validateInput(inputPath);

  const whisper = findWhisperCommand();
  if (!whisper) {
    throw new Error('Whisper CLI was not found. Install it with: pip install -U openai-whisper');
  }

  const ffmpeg = options.embed ? findFfmpegCommand() : null;
  if (options.embed && !ffmpeg) {
    throw new Error('FFmpeg was not found. Install it first: brew install ffmpeg (macOS), winget install Gyan.dev.FFmpeg (Windows), or apt install ffmpeg (Linux).');
  }

  const outputDir = options.outputDir ? resolvePath(options.outputDir) : path.dirname(inputPath);
  fs.mkdirSync(outputDir, { recursive: true });

  const { srtPath } = buildOutputPaths(inputPath, outputDir, { overwriteOriginal: options.overwriteOriginal });
  const whisperArgs = [
    path.resolve(inputPath),
    '--model', options.model,
    '--output_format', 'srt',
    '--output_dir', outputDir,
  ];

  if (options.language) {
    whisperArgs.push('--language', options.language);
  }

  runCommand(whisper.command, [...whisper.args, ...whisperArgs]);

  if (!fs.existsSync(srtPath)) {
    throw new Error(`Expected SRT file was not generated at ${srtPath}`);
  }

  console.log(`Created SRT: ${srtPath}`);

  if (options.embed) {
    const { embedPath } = buildOutputPaths(inputPath, outputDir, { overwriteOriginal: options.overwriteOriginal });
    const tempOutputPath = options.overwriteOriginal
      ? path.join(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}-srt.mp4.tmp`)
      : embedPath;
    const ffmpegArgs = [
      '-y',
      '-i', path.resolve(inputPath),
      '-i', srtPath,
      '-map', '0',
      '-map', '1',
      '-c', 'copy',
      '-c:s', 'mov_text',
      path.resolve(tempOutputPath),
    ];

    runCommand(ffmpeg.command, [...ffmpeg.args, ...ffmpegArgs]);

    if (options.overwriteOriginal) {
      fs.rmSync(path.resolve(inputPath), { force: true });
      fs.renameSync(path.resolve(tempOutputPath), path.resolve(inputPath));
      console.log(`Updated original video with embedded captions: ${inputPath}`);
    } else {
      console.log(`Created MP4 with embedded captions: ${embedPath}`);
    }
  }
}

function main(argv = process.argv.slice(2)) {
  try {
    const args = parseArgs(argv);

    if (args.help || !args.command) {
      printHelp();
      return;
    }

    if (args.command !== 'transcribe') {
      console.error('Unknown command. Use: srtgen transcribe <input-video>');
      process.exitCode = 1;
      return;
    }

    if (!args.input) {
      console.error('Missing input video path.');
      printHelp();
      process.exitCode = 1;
      return;
    }

    const inputPath = resolvePath(args.input);
    runTranscribe(inputPath, {
      embed: args.embed,
      overwriteOriginal: args.overwriteOriginal,
      outputDir: args.outputDir,
      model: args.model,
      language: args.language,
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  buildOutputPaths,
  findWhisperCommand,
  findFfmpegCommand,
  runTranscribe,
  main,
};
