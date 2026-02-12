const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const os = require('os');

const execPromise = util.promisify(exec);

class LibreOfficeConverter {
  /**
   * Convert a document buffer to PDF
   * @param {Buffer} inputBuffer - The input document buffer
   * @param {string} format - The target format (e.g., 'pdf')
   * @param {string} fileName - Original filename (optional, to preserve extension)
   * @param {string} binaryPath - Path to LibreOffice binary (default: 'libreoffice')
   * @returns {Promise<Buffer>} The converted file buffer
   */
  async convert(inputBuffer, format, fileName = 'document.docx', binaryPath = 'libreoffice') {
    let tempDir = null;

    try {
      // Create a temporary directory
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'libreoffice-'));
      
      // Determine input file path
      const inputPath = path.join(tempDir, fileName);
      
      // Write input buffer to file
      await fs.writeFile(inputPath, inputBuffer);
      
      // Determine output directory (same as input for simplicity)
      const outputDir = tempDir;
      
      // Construct command
      // We use --outdir to specify where the output file should go
      const command = `"${binaryPath}" --headless --convert-to ${format} --outdir "${outputDir}" "${inputPath}"`;
      
      // Execute command
      try {
        await execPromise(command);
        // Note: libreoffice often prints to stderr even on success, so we don't treat stderr as fatal
      } catch (error) {
        // If the command fails strictly (exit code != 0), we throw
        throw new Error(`LibreOffice command failed: ${error.message}`);
      }
      
      // Determine output file path
      // LibreOffice replaces the extension with the new format
      const inputExt = path.extname(fileName);
      const baseName = path.basename(fileName, inputExt);
      const outputFileName = `${baseName}.${format}`;
      const outputPath = path.join(outputDir, outputFileName);
      
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

module.exports = new LibreOfficeConverter();
