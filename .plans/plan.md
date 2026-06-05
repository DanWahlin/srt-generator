# SRT Generator CLI Plan

## Objective

Create a small cross-platform CLI that wraps existing OSS tools so users can:

1. generate an `.srt` caption file from a video
2. optionally generate an MP4 with the captions embedded

The wrapper should not reimplement transcription. It should call proven tools such as:

- Whisper CLI for speech-to-text / `.srt` generation
- FFmpeg for embed/burn-in operations

## Recommended design

### CLI shape

```bash
srtgen transcribe input.mp4
srtgen transcribe input.mp4 --embed
srtgen transcribe input.mp4 --output-dir ./out --model turbo
```

### Modes

- `srt-only` (default)
  - create `input.srt`
- `srt-plus-mp4` (`--embed`)
  - create `input.srt`
  - create `input-with-captions.mp4`

### Backend choice

Use Whisper CLI as the primary transcription backend because it is already widely used and works well for `.srt`. A future option can be Whisper.cpp for more offline/local execution.

## High-level implementation plan

### Phase 1: Foundation

- create the CLI project structure
- choose a cross-platform runtime
  - preferred: Node.js CLI for easy packaging and installation on macOS / Windows / Linux
- add dependency checks for:
  - `ffmpeg`
  - `whisper`

### Phase 2: Core command flow

1. accept input video path
2. validate file exists
3. run Whisper CLI with `--output_format srt`
4. write output to the chosen directory
5. if `--embed` is set, run FFmpeg using the generated `.srt`
6. print a clear summary of created files

### Phase 3: Cross-platform polish

- detect platform and provide friendly install guidance if tools are missing
- support common output naming conventions
- implement `--language`, `--model`, `--output-dir`, and `--embed`
- add help text and examples

### Phase 4: Packaging

- package the CLI for global install
  - npm global install is the simplest first option
- optionally add `pipx` packaging later if a Python-based wrapper is preferred

## Suggested internal flow

```text
input.mp4
  -> whisper -> input.srt
  -> if embed -> ffmpeg -> input-with-captions.mp4
```

## Tooling and dependencies

### Required

- Node.js 18+ (recommended for cross-platform tooling)
- FFmpeg
- Whisper CLI

### Optional future enhancement

- Whisper.cpp backend for fully local/offline transcription

## Risks and mitigations

- missing FFmpeg or Whisper on user machine
  - mitigation: preflight checks + install guidance
- model download time on first run
  - mitigation: default to `turbo` and document model selection
- subtitle formatting differences across platforms
  - mitigation: keep FFmpeg flags simple and test on macOS, Windows, and Linux

## Success criteria

The CLI should be able to:

- generate a valid `.srt` file from a supported video/audio input
- generate an embedded MP4 when requested
- run on macOS, Windows, and Linux with clear setup docs

## Recommended first milestone

Build the wrapper around existing `whisper` and `ffmpeg` commands first. Only add custom transcription logic if the default OSS path proves insufficient.
