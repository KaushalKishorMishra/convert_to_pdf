const fs = require('fs-extra');
const path = require('path');
const libreOfficeConverter = require('./libreOfficeConverter'); 
const { promisify } = require('util');

/**
 * Document converter using LibreOffice
 */
class DocumentConverter {
  constructor() {
    this.binaryPath = 'libreoffice';
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

      // Convert to PDF using custom LibreOffice converter
      const pdfBuffer = await libreOfficeConverter.convert(inputBuffer, 'pdf', file.name, this.binaryPath);

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
   * Check if LibreOffice is available
   * @returns {Promise<Object>} Object with isAvailable boolean and path/error message
   */
  async checkLibreOfficeInstallation() {
    const { exec } = require('child_process');
    const execPromise = promisify(exec);

    try {
      // Check for libreoffice or soffice
      // Try to find the binary path
      const { stdout } = await execPromise('which libreoffice || which soffice || where libreoffice || where soffice');
      const libreOfficePath = stdout.trim();
      
      if (libreOfficePath) {
        this.binaryPath = libreOfficePath;
        return {
          isAvailable: true,
          path: libreOfficePath
        };
      } else {
         throw new Error('Not found');
      }
    } catch (error) {
      return {
        isAvailable: false,
        error: 'LibreOffice not found in system PATH'
      };
    }
  }
}

module.exports = new DocumentConverter();

