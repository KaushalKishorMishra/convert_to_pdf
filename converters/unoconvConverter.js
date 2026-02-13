const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const os = require('os');

const execPromise = util.promisify(exec);

class UnoconvConverter {
  /**
   * Convert a document buffer to PDF using unoconv
   * @param {Buffer} inputBuffer - The input document buffer
   * @param {string} format - The target format (e.g., 'pdf')
   * @param {string} fileName - Original filename (optional, to preserve extension)
   * @param {string} binaryPath - Path to unoconv binary (default: 'unoconv')
   * @returns {Promise<Buffer>} The converted file buffer
   */
  async convert(inputBuffer, format, fileName = 'document.docx', binaryPath = 'unoconv') {
    let tempDir = null;

    try {
      // Create a temporary directory
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'unoconv-'));
      
      // Determine input file path
      const inputPath = path.join(tempDir, fileName);
      
      // Write input buffer to file
      await fs.writeFile(inputPath, inputBuffer);
      
      // Determine output file path
      const baseName = path.basename(fileName, path.extname(fileName));
      const outputFileName = `${baseName}.${format}`;
      const outputPath = path.join(tempDir, outputFileName);
      
      // Construct command
      // unoconv -f format -o output_path input_path
      const command = `"${binaryPath}" -f ${format} -o "${outputPath}" "${inputPath}"`;
      
      // Execute command
      try {
        await execPromise(command);
      } catch (error) {
        throw new Error(`unoconv command failed: ${error.message}`);
      }
      
      // Check if output file exists
      if (!await fs.pathExists(outputPath)) {
        throw new Error('Conversion failed: Output file not created');
      }
      
      // Read the output file
      const outputBuffer = await fs.readFile(outputPath);
      
      return outputBuffer;
      
    } finally {
      // Cleanup temporary directory
      if (tempDir) {
        await fs.remove(tempDir);
      }
    }
  }
}

module.exports = new UnoconvConverter();
