const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const util = require('util');

const execPromise = util.promisify(exec);
const accessPromise = util.promisify(fs.access);

const MIN_NODE_VERSION = '14.0.0';

// ANSI colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, type = 'info') {
    const color = type === 'success' ? colors.green :
                  type === 'error' ? colors.red :
                  type === 'warning' ? colors.yellow :
                  colors.cyan;
    console.log(`${color}${message}${colors.reset}`);
}

async function checkNodeVersion() {
    const currentVersion = process.versions.node;
    log(`Checking Node.js version (Current: ${currentVersion}, Required: >=${MIN_NODE_VERSION})...`);
    
    if (parseFloat(currentVersion) < parseFloat(MIN_NODE_VERSION)) {
        log(`Error: Node.js version ${MIN_NODE_VERSION} or higher is required.`, 'error');
        return false;
    }
    log('✓ Node.js version is compatible.', 'success');
    return true;
}

async function checkUnoconv() {
    log('Checking unoconv installation...');
    try {
        const { stdout } = await execPromise('which unoconv || where unoconv');
        const unoconvPath = stdout.trim();
        if (unoconvPath) {
            log(`✓ unoconv found at: ${unoconvPath}`, 'success');
            return true;
        }
    } catch (e) {
    }
    
    log('Error: unoconv not found in PATH.', 'error');
    log('Please install unoconv and ensure it is in your system PATH.', 'warning');
    return false;
}

async function checkDirectoryPermissions(dirPath, label) {
    log(`Checking write permissions for ${label} (${dirPath})...`);
    try {
        await accessPromise(dirPath, fs.constants.W_OK);
        log(`✓ Write access confirmed for ${label}.`, 'success');
        return true;
    } catch (e) {
        log(`Error: No write access to ${label}.`, 'error');
        return false;
    }
}

async function main() {
    console.log('Starting Environment Check...\n');
    
    let allChecksPassed = true;

    if (!await checkNodeVersion()) allChecksPassed = false;
    if (!await checkUnoconv()) allChecksPassed = false;

    // Check project directories
    const inputDir = path.join(__dirname, '..', 'data', 'input');
    const outputDir = path.join(__dirname, '..', 'data', 'output');
    const tmpDir = os.tmpdir();

    // Ensure data directories exist first (or check parent if they don't, but script assumes structure)
    // We can try to create them if they don't exist to verify write access to parent
    const dataDir = path.join(__dirname, '..', 'data');
    
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        if (!fs.existsSync(inputDir)) {
            fs.mkdirSync(inputDir);
        }
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
    } catch (e) {
        log(`Error creating data directories: ${e.message}`, 'error');
        allChecksPassed = false;
    }

    if (!await checkDirectoryPermissions(inputDir, 'Input Directory')) allChecksPassed = false;
    if (!await checkDirectoryPermissions(outputDir, 'Output Directory')) allChecksPassed = false;
    if (!await checkDirectoryPermissions(tmpDir, 'System Temp Directory')) allChecksPassed = false;

    console.log('\n----------------------------------------');
    if (allChecksPassed) {
        log('All checks passed! The environment is ready.', 'success');
        process.exit(0);
    } else {
        log('Some checks failed. Please fix the issues above.', 'error');
        process.exit(1);
    }
}

main();
