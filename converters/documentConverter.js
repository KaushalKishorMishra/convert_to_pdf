const fs = require('fs-extra');
const path = require('path');
const unoconvConverter = require('./unoconvConverter'); 
const { promisify } = require('util');

/**
 * Document converter using unoconv
 */
class DocumentConverter {
  constructor() {
    this.binaryPath = 'unoconv';
  }

  /**
   * Convert a document file to PDF
   * @param {Object} file - File object with metadata
   * @param {string} outputDir - Output directory path
   * @returns {Promise<Object>} Conversion result with status and message
   */
  async convertToPdf(file, outputDir) {
    try {
      // Read the input file
      const inputBuffer = await fs.readFile(file.fullPath);

      // Convert to PDF using unoconv converter
      const pdfBuffer = await unoconvConverter.convert(inputBuffer, 'pdf', file.name, this.binaryPath);

      // Generate output file path
      const outputFileName = `${file.baseName}.pdf`;
      const outputPath = path.join(outputDir, outputFileName);
      
      // Write the PDF file
      await fs.writeFile(outputPath, pdfBuffer);

      return {
        success: true,
        inputFile: file.name,
        outputFile: outputFileName,
        message: `${file.name} → ${outputFileName}`
      };
    } catch (error) {
      return {
        success: false,
        inputFile: file.name,
        error: error.message,
        message: `${file.name} → Error: ${error.message}`
      };
    }
  }

  /**
   * Check if unoconv is available
   * @returns {Promise<Object>} Object with isAvailable boolean and path/error message
   */
  async checkInstallation() {
    const { exec } = require('child_process');
    const execPromise = promisify(exec);

    try {
      // Check for unoconv
      const { stdout } = await execPromise('which unoconv || where unoconv');
      const unoconvPath = stdout.trim();
      
      if (unoconvPath) {
        this.binaryPath = unoconvPath;
        return {
          isAvailable: true,
          path: unoconvPath
        };
      } else {
         throw new Error('Not found');
      }
    } catch (error) {
      return {
        isAvailable: false,
        error: 'unoconv not found in system PATH'
      };
    }
  }
}

module.exports = new DocumentConverter();

