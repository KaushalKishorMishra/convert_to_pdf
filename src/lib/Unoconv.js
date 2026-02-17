const { exec } = require('child_process');
const util = require('util');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const execPromise = util.promisify(exec);

/**
 * Wrapper for the unoconv command-line tool.
 */
class Unoconv {
  /**
   * @param {Object} options Configuration options
   * @param {string} [options.binaryPath='unoconv'] Path to the unoconv binary
   * @param {boolean} [options.debug=false] Enable debug logging
   */
  constructor(options = {}) {
    this.binaryPath = options.binaryPath || 'unoconv';
    this.debug = options.debug || false;
  }

  /**
   * Check if unoconv is installed and available.
   * @returns {Promise<boolean>} True if available, false otherwise.
   */
  async checkAvailability() {
    try {
      const { stdout } = await execPromise(`which "${this.binaryPath}" || where "${this.binaryPath}"`);
      return !!stdout.trim();
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert a file buffer to the specified format.
   * @param {Buffer} inputBuffer The input file content.
   * @param {string} format The target format (e.g., 'pdf', 'jpg', 'html').
   * @param {string} [originalFilename='document.docx'] The original filename (to preserve extension for unoconv detection).
   * @param {Object} [options] Additional conversion options.
   * @returns {Promise<Buffer>} The converted file content.
   */
  async convert(inputBuffer, format, originalFilename = 'document.docx', options = {}) {
    let tempDir = null;

    try {
      // Create a temporary directory
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'unoconv-'));
      
      const inputPath = path.join(tempDir, originalFilename);
      await fs.writeFile(inputPath, inputBuffer);
      
      const baseName = path.basename(originalFilename, path.extname(originalFilename));
      const outputFileName = `${baseName}.${format}`;
      const outputPath = path.join(tempDir, outputFileName);
      
      // Construct command
      // unoconv -f format -o output_path input_path
      // Add optional args if needed in future
      const command = `"${this.binaryPath}" -f ${format} -o "${outputPath}" "${inputPath}"`;
      
      if (this.debug) {
        console.log(`Executing: ${command}`);
      }

      try {
        await execPromise(command);
      } catch (error) {
        throw new Error(`unoconv command failed: ${error.message}
Stderr: ${error.stderr}`);
      }
      
      if (!await fs.pathExists(outputPath)) {
        throw new Error('Conversion failed: Output file was not created by unoconv.');
      }
      
      return await fs.readFile(outputPath);
      
    } finally {
      if (tempDir) {
        try {
          await fs.remove(tempDir);
        } catch (e) {
          // Ignore cleanup errors
          if (this.debug) console.error('Failed to clean up temp dir:', e);
        }
      }
    }
  }
}

module.exports = Unoconv;
