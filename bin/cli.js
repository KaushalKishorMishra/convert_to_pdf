#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { Converter, Scanner } = require('../src/index');
const logger = require('../src/utils/logger'); // Keep internal logger for CLI

const program = new Command();

program
  .name('convert-to-pdf')
  .description('Convert Office documents to PDF (or other formats) using unoconv')
  .version('2.0.0');

program
  .command('convert')
  .argument('[input]', 'Input file or directory (default: ./data/input)')
  .option('-o, --output <dir>', 'Output directory', './data/output')
  .option('-f, --format <format>', 'Target format', 'pdf')
  .option('-r, --recursive', 'Recursively scan directories (not fully implemented)')
  .option('-d, --debug', 'Enable debug logging')
  .action(async (input, options) => {
    const inputPath = input ? path.resolve(input) : path.join(process.cwd(), 'data', 'input');
    const outputDir = path.resolve(options.output);
    const format = options.format;

    logger.header('📄 Office Document Converter');
    
    if (options.debug) {
      logger.info(`Input: ${inputPath}`);
      logger.info(`Output: ${outputDir}`);
      logger.info(`Format: ${format}`);
    }

    try {
      const converter = new Converter({
        outputDir,
        outputFormat: format,
        debug: options.debug
      });

      // Check availability
      logger.info('Checking unoconv availability...');
      const available = await converter.checkAvailability();
      if (!available) {
        logger.error('unoconv is not installed or not in PATH.');
        logger.warning('Please install unoconv first (see README).');
        process.exit(1);
      }
      logger.success('unoconv is ready.');

      // Scan for files
      let filesToConvert = [];
      const stats = await fs.stat(inputPath);

      if (stats.isFile()) {
        filesToConvert.push(inputPath);
      } else if (stats.isDirectory()) {
        logger.info(`Scanning directory: ${inputPath}...`);
        const scanner = new Scanner({ recursive: options.recursive });
        const scannedFiles = await scanner.scan(inputPath);
        filesToConvert = scannedFiles.map(f => f.fullPath);
      } else {
        logger.error(`Invalid input path: ${inputPath}`);
        process.exit(1);
      }

      if (filesToConvert.length === 0) {
        logger.warning('No supported files found.');
        process.exit(0);
      }

      logger.success(`Found ${filesToConvert.length} file(s) to convert.`);
      logger.divider();

      // Convert
      let successCount = 0;
      let failCount = 0;

      for (const file of filesToConvert) {
        try {
          const relativePath = path.relative(process.cwd(), file);
          process.stdout.write(`Converting ${chalk.cyan(relativePath)}... `);
          
          await converter.convertFile(file, outputDir, format);
          
          console.log(chalk.green('✓ Done'));
          successCount++;
        } catch (error) {
          console.log(chalk.red('✗ Failed'));
          if (options.debug) {
            console.error(error);
          } else {
            logger.error(`Error: ${error.message}`);
          }
          failCount++;
        }
      }

      logger.divider();
      logger.log(`Total: ${filesToConvert.length}`);
      logger.log(chalk.green(`Success: ${successCount}`));
      if (failCount > 0) logger.log(chalk.red(`Failed: ${failCount}`));
      
      if (successCount > 0) {
        logger.success(`Files saved to: ${outputDir}`);
      }

    } catch (error) {
      logger.error(`Fatal error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
