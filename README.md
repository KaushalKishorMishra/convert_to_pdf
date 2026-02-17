# Office Document Converter

A robust, production-ready Node.js library and CLI tool to convert Office documents (.doc, .docx, .ppt, .pptx, .xls, .xlsx, .odt, etc.) to PDF and other formats using `unoconv` (LibreOffice).

## Features

- **Format Support**: Converts Word, PowerPoint, Excel, and OpenDocument formats.
- **Output Formats**: Supports PDF, HTML, JPG, PNG, TXT, and more.
- **Batch Processing**: Convert entire directories at once.
- **CLI Interface**: Easy-to-use command-line tool.
- **Programmatic API**: Clean Node.js API for integration into your applications.
- **Events**: Event-driven API for progress tracking.
- **Robust**: Handles errors gracefully and supports debug logging.

## Prerequisites

This tool requires `unoconv` (which depends on LibreOffice) to be installed on your system.

### Linux (Debian/Ubuntu)
```bash
sudo apt install unoconv
```

### macOS
```bash
brew install unoconv
```

### Windows
You need to install LibreOffice and the unoconv python script manually, or run via WSL.

## Installation

```bash
npm install convert-to-pdf
```

## CLI Usage

The package includes a CLI tool `convert-to-pdf`.

```bash
# Convert a single file to PDF
convert-to-pdf convert document.docx

# Convert all files in a directory to PDF
convert-to-pdf convert ./input-files

# Specify output directory
convert-to-pdf convert document.docx -o ./output

# Convert to a different format (e.g., jpg)
convert-to-pdf convert presentation.pptx -f jpg

# Debug mode
convert-to-pdf convert document.docx --debug
```

## Programmatic API

### Basic Usage

```javascript
const { Converter } = require('convert-to-pdf');

const converter = new Converter({
  outputDir: './output',
  outputFormat: 'pdf'
});

(async () => {
  try {
    const outputPath = await converter.convertFile('./input/document.docx');
    console.log(`Converted to: ${outputPath}`);
  } catch (err) {
    console.error(err);
  }
})();
```

### Batch Conversion with Events

```javascript
const { Converter, Scanner } = require('convert-to-pdf');

const converter = new Converter();
const scanner = new Scanner();

converter.on('start', (data) => console.log(`Starting: ${data.file}`));
converter.on('success', (data) => console.log(`Finished: ${data.output}`));
converter.on('error', (data) => console.error(`Error: ${data.error}`));

(async () => {
  const files = await scanner.scan('./input');
  const filePaths = files.map(f => f.fullPath);
  
  const results = await converter.convertFiles(filePaths);
  console.log('Batch complete:', results);
})();
```

### Low-level Access

```javascript
const { Unoconv } = require('convert-to-pdf');

const unoconv = new Unoconv();
const buffer = await fs.readFile('doc.docx');
const pdfBuffer = await unoconv.convert(buffer, 'pdf', 'doc.docx');
```

## Configuration

### Converter Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `outputDir` | string | `./output` | Directory to save converted files |
| `outputFormat` | string | `pdf` | Target format (pdf, jpg, html, etc.) |
| `binaryPath` | string | `unoconv` | Path to unoconv binary |
| `debug` | boolean | `false` | Enable verbose logging |

### Scanner Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `extensions` | string[] | `['.doc', ...]` | List of supported extensions |
| `recursive` | boolean | `false` | Scan subdirectories |

## License

MIT
