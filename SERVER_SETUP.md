# Server Setup Guide: Office Document to PDF Converter

This guide details how to set up the Office Document to PDF Converter on a Linux server.

## Prerequisites

- **Operating System**: Linux (Ubuntu, Debian, CentOS, RHEL, or similar)
- **Node.js**: Version 14.0.0 or higher
- **unoconv**: Used as a wrapper for LibreOffice conversion

## 1. System Dependencies Installation

### Update System Packages

First, update your package lists to ensure you install the latest versions.

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt upgrade -y
```

**CentOS/RHEL:**
```bash
sudo yum update -y
```

### Install Node.js (if not already installed)

We recommend using NodeSource for the latest Node.js versions.

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**CentOS/RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

Verify Node.js installation:
```bash
node -v
npm -v
```

### Install unoconv

This application relies on `unoconv` for document conversion, which in turn uses LibreOffice.

**Ubuntu/Debian:**
```bash
sudo apt install -y unoconv
```

**CentOS/RHEL:**
```bash
sudo yum install -y unoconv
```

Verify unoconv installation:
```bash
unoconv --version
```

## 2. Application Setup

### Clone the Repository

Navigate to your desired application directory (e.g., `/opt` or `/var/www`):

```bash
cd /opt
git clone <your-repository-url> convert-to-pdf
cd convert-to-pdf
```

### Install Application Dependencies

Install the required Node.js packages:

```bash
npm install --production
```

## 3. Environment Validation

Before running the application, run the included validation script to ensure your environment is correctly configured. This checks for:
- Node.js version compatibility
- unoconv availability in system PATH
- Write permissions for input/output directories

```bash
npm run check-env
```

If any checks fail, the script will output an error message guiding you to the fix.

## 4. Running the Application

### Basic Usage

To run the converter once (it will process all files in `data/input` and then exit):

1.  Place your `.doc`, `.docx`, `.ppt`, or `.pptx` files in `data/input/`.
2.  Run the start command:

```bash
npm start
```

3.  Collect your converted PDF files from `data/output/`.

### Automated Processing (Cron Job)

To run the converter periodically (e.g., every 5 minutes) to process new files:

1.  Open the crontab editor:
    ```bash
    crontab -e
    ```

2.  Add the following line (adjust path to your installation):
    ```cron
    */5 * * * * cd /opt/convert-to-pdf && npm start >> /var/log/pdf-converter.log 2>&1
    ```

## 5. Cleaning Up Old Implementation

If you previously had the standalone LibreOffice implementation and want to remove the specific headless packages that are no longer directly used:

```bash
npm run cleanup-libreoffice
```

**Warning**: `unoconv` requires LibreOffice components. Use this script only if you are sure your system has the necessary dependencies for `unoconv` or if you are doing a full system cleanup.

## 6. Troubleshooting

-   **"unoconv not found"**: Ensure `unoconv` is in your global `PATH`. You can check this with `which unoconv`.
-   **Permission Denied**: Ensure the user running the script has read/write permissions for `data/input` and `data/output`.
    ```bash
    sudo chown -R $USER:$USER data/
    chmod -R 755 data/
    ```
-   **Timeout / Hangs**: Large files may take time. Ensure your server has sufficient RAM (at least 2GB recommended for conversion operations).
