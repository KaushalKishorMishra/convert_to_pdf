const fs = require('fs-extra');
const path = require('path');

// Default supported file extensions for various office formats
const DEFAULT_EXTENSIONS = [
  '.doc', '.docx', '.ppt', '.pptx', 
  '.xls', '.xlsx', '.odt', '.ods', '.odp', 
  '.rtf', '.txt', '.html', '.htm'
];

/**
 * Utility for finding supported files in directories.
 */
class Scanner {
  /**
   * @param {Object} options Configuration options
   * @param {string[]} [options.extensions=DEFAULT_EXTENSIONS] List of supported extensions (with dot)
   * @param {boolean} [options.recursive=false] Scan recursively (not yet implemented fully, but good for API)
   */
  constructor(options = {}) {
    this.extensions = options.extensions || DEFAULT_EXTENSIONS;
    this.recursive = options.recursive || false;
  }

  /**
   * Scan a directory for supported files.
   * @param {string} dirPath The directory to scan.
   * @returns {Promise<Object[]>} List of file objects with metadata.
   */
  async scan(dirPath) {
    try {
      if (!await fs.pathExists(dirPath)) {
        throw new Error(`Directory does not exist: ${dirPath}`);
      }

      const files = await fs.readdir(dirPath);

      const supportedFiles = [];
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
          if (this.recursive) {
            // Recursive scan logic would go here
            // const subFiles = await this.scan(fullPath);
            // supportedFiles.push(...subFiles);
          }
          continue; 
        }

        if (this.isSupported(file)) {
          supportedFiles.push({
            name: file,
            fullPath: fullPath,
            extension: path.extname(file).toLowerCase(),
            baseName: path.basename(file, path.extname(file)),
            size: stats.size
          });
        }
      }

      return supportedFiles;
    } catch (error) {
      throw new Error(`Failed to scan directory: ${error.message}`);
    }
  }

  /**
   * Check if a filename has a supported extension.
   * @param {string} filename The filename to check.
   * @returns {boolean} True if supported.
   */
  isSupported(filename) {
    const ext = path.extname(filename).toLowerCase();
    return this.extensions.includes(ext);
  }
}

module.exports = Scanner;
