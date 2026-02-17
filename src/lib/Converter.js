const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');
const Unoconv = require('./Unoconv');

/**
 * High-level converter class that handles batch processing and events.
 * 
 * @extends EventEmitter
 */
class Converter extends EventEmitter {
  /**
   * @param {Object} options Configuration options
   * @param {string} [options.outputFormat='pdf'] Default output format (e.g., 'pdf', 'jpg')
   * @param {string} [options.outputDir='./output'] Default output directory
   * @param {string} [options.binaryPath='unoconv'] Path to unoconv binary
   * @param {boolean} [options.debug=false] Enable debug logging
   */
  constructor(options = {}) {
    super();
    this.outputFormat = options.outputFormat || 'pdf';
    this.outputDir = options.outputDir || './output';
    this.unoconv = new Unoconv({ binaryPath: options.binaryPath, debug: options.debug });
  }

  /**
   * Check if unoconv is available.
   * @returns {Promise<boolean>} True if available.
   */
  async checkAvailability() {
    return this.unoconv.checkAvailability();
  }

  /**
   * Convert a single file.
   * @param {string} inputPath Path to the input file.
   * @param {string} [outputDir=this.outputDir] Output directory.
   * @param {string} [format=this.outputFormat] Target format.
   * @returns {Promise<string>} Path to the converted file.
   */
  async convertFile(inputPath, outputDir = this.outputDir, format = this.outputFormat) {
    try {
      if (!await fs.pathExists(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }

      await fs.ensureDir(outputDir);

      const fileName = path.basename(inputPath);
      const baseName = path.basename(fileName, path.extname(fileName));
      const outputFileName = `${baseName}.${format}`;
      const outputPath = path.join(outputDir, outputFileName);

      this.emit('start', { file: inputPath });

      const inputBuffer = await fs.readFile(inputPath);
      const outputBuffer = await this.unoconv.convert(inputBuffer, format, fileName);

      await fs.writeFile(outputPath, outputBuffer);

      this.emit('success', { file: inputPath, output: outputPath });
      
      return outputPath;
    } catch (error) {
      this.emit('error', { file: inputPath, error: error.message });
      throw error;
    }
  }

  /**
   * Batch convert multiple files.
   * @param {string[]} filePaths List of file paths to convert.
   * @param {string} [outputDir=this.outputDir] Output directory.
   * @param {string} [format=this.outputFormat] Target format.
   * @returns {Promise<Object>} Results summary { success: [], errors: [] }
   */
  async convertFiles(filePaths, outputDir = this.outputDir, format = this.outputFormat) {
    const results = {
      success: [],
      errors: []
    };

    for (const file of filePaths) {
      try {
        const output = await this.convertFile(file, outputDir, format);
        results.success.push({ file, output });
      } catch (error) {
        results.errors.push({ file, error: error.message });
      }
    }

    this.emit('complete', results);
    return results;
  }
}

module.exports = Converter;
