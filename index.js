const path = require('path');
const fs = require('fs-extra');
const logger = require('./utils/logger');
const fileScanner = require('./utils/fileScanner');
const documentConverter = require('./converters/documentConverter');

// Define input and output directories
const INPUT_DIR = path.join(__dirname, 'data', 'input');
const OUTPUT_DIR = path.join(__dirname, 'data', 'output');

/**
 * Main conversion process
 */
async function main() {
  try {
    logger.header('📄 Office Document to PDF Converter');
    logger.log('');

    // Step 1: Check unoconv installation
    logger.info('Checking unoconv installation...');
    const unoconvCheck = await documentConverter.checkInstallation();
    
    if (!unoconvCheck.isAvailable) {
      logger.error('unoconv is not installed or not found in PATH');
      logger.log('');
      logger.warning('Please install unoconv first:');
      logger.log('');
      logger.log('  Debian/Ubuntu/CentOS/RHEL:');
      logger.log('    sudo apt/yum install unoconv');
      logger.log('');
      logger.log('  Arch Linux:');
      logger.log('    sudo pacman -S unoconv');
      logger.log('');
      logger.log('  macOS:');
      logger.log('    brew install unoconv');
      logger.log('');
      process.exit(1);
    }

    logger.success(`unoconv found at: ${unoconvCheck.path}`);
    logger.log('');

    // Step 2: Ensure directories exist
    await fs.ensureDir(INPUT_DIR);
    await fs.ensureDir(OUTPUT_DIR);

    // Step 3: Scan input directory for files
    logger.info('Scanning input directory...');
    const files = await fileScanner.scanDirectory(INPUT_DIR);

    if (files.length === 0) {
      logger.warning('No files found to convert');
      logger.log('');
      logger.info(`Please place your files (.doc, .docx, .ppt, .pptx) in: ${INPUT_DIR}`);
      logger.log('');
      process.exit(0);
    }

    logger.success(`Found ${files.length} file${files.length > 1 ? 's' : ''} to convert`);
    logger.log('');

    // Step 4: Convert files
    logger.header('Converting documents to PDF...');
    logger.divider();

    const stats = {
      total: files.length,
      success: 0,
      failed: 0,
      skipped: 0
    };

    for (const file of files) {
      const result = await documentConverter.convertToPdf(file, OUTPUT_DIR);
      
      if (result.success) {
        logger.success(result.message);
        stats.success++;
      } else {
        logger.error(result.message);
        stats.failed++;
      }
    }

    logger.log('');

    // Step 5: Display summary
    logger.summary(stats);

    if (stats.success > 0) {
      logger.log('');
      logger.success(`Conversion complete! Check ${OUTPUT_DIR} for PDFs.`);
      logger.log('');
    }

  } catch (error) {
    logger.log('');
    logger.error(`Fatal error: ${error.message}`);
    logger.log('');
    process.exit(1);
  }
}

// Run the main function
main();
