#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Helper function for logging
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check directory
if [ ! -f "package.json" ]; then
    log_error "Please run this script from the project root directory."
    exit 1
fi

# Check for sudo
if [ "$EUID" -ne 0 ]; then
  if command -v sudo &> /dev/null; then
    SUDO="sudo"
    log_info "Running with sudo privileges..."
  else
    log_error "This script requires root privileges or sudo access to install system packages."
    exit 1
  fi
else
  SUDO=""
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
elif [ -f /etc/redhat-release ]; then
    OS="rhel"
elif [ "$(uname)" == "Darwin" ]; then
    OS="macos"
else
    OS="unknown"
fi

log_info "Detected OS: $OS"

install_dependencies() {
    case "$OS" in
        ubuntu|debian|pop|linuxmint|kali)
            log_info "Updating package lists..."
            $SUDO apt-get update

            # Check/Install Node.js
            if ! command -v node &> /dev/null; then
                log_info "Installing Node.js..."
                $SUDO apt-get install -y curl
                curl -fsSL https://deb.nodesource.com/setup_18.x | $SUDO -E bash -
                $SUDO apt-get install -y nodejs
            else
                log_info "Node.js is already installed ($(node -v))."
            fi

            # Check/Install LibreOffice
            if ! command -v libreoffice &> /dev/null && ! command -v soffice &> /dev/null; then
                log_info "Installing LibreOffice..."
                $SUDO apt-get install -y libreoffice-core libreoffice-common libreoffice-headless libreoffice-writer libreoffice-impress
            else
                log_info "LibreOffice is already installed."
            fi
            ;;
        
        centos|rhel|fedora|almalinux|rocky)
            log_info "Updating package lists..."
            if command -v dnf &> /dev/null; then
                PKG_MGR="dnf"
            else
                PKG_MGR="yum"
            fi
            
            $SUDO $PKG_MGR update -y

            # Check/Install Node.js
            if ! command -v node &> /dev/null; then
                log_info "Installing Node.js..."
                curl -fsSL https://rpm.nodesource.com/setup_18.x | $SUDO bash -
                $SUDO $PKG_MGR install -y nodejs
            else
                log_info "Node.js is already installed ($(node -v))."
            fi

            # Check/Install LibreOffice
            if ! command -v libreoffice &> /dev/null && ! command -v soffice &> /dev/null; then
                log_info "Installing LibreOffice..."
                $SUDO $PKG_MGR install -y libreoffice-headless libreoffice-writer libreoffice-impress
            else
                log_info "LibreOffice is already installed."
            fi
            ;;

        arch|manjaro)
             log_info "Updating package lists..."
             $SUDO pacman -Syu --noconfirm

             # Check/Install Node.js
             if ! command -v node &> /dev/null; then
                 log_info "Installing Node.js..."
                 $SUDO pacman -S --noconfirm nodejs npm
             else
                 log_info "Node.js is already installed ($(node -v))."
             fi
             
             # Check/Install LibreOffice
             if ! command -v libreoffice &> /dev/null && ! command -v soffice &> /dev/null; then
                 log_info "Installing LibreOffice..."
                 $SUDO pacman -S --noconfirm libreoffice-fresh
             else
                 log_info "LibreOffice is already installed."
             fi
             ;;
             
        macos)
            if ! command -v brew &> /dev/null; then
                log_error "Homebrew is required for macOS installation. Please install it first: https://brew.sh/"
                exit 1
            fi
            
            # Check/Install Node.js
            if ! command -v node &> /dev/null; then
                log_info "Installing Node.js..."
                brew install node
            else
                log_info "Node.js is already installed ($(node -v))."
            fi

            # Check/Install LibreOffice
            if ! command -v libreoffice &> /dev/null && ! command -v soffice &> /dev/null; then
                log_info "Installing LibreOffice..."
                brew install --cask libreoffice
            else
                 log_info "LibreOffice is already installed."
            fi
            ;;

        *)
            log_warn "Unsupported or unknown operating system: $OS."
            log_warn "Please ensure Node.js (v14+) and LibreOffice are installed manually."
            ;;
    esac
}

# Run the installation
install_dependencies

# Install NPM dependencies
log_info "Installing project dependencies..."
npm install

# Setup directories if they don't exist
log_info "Setting up directories..."
mkdir -p data/input data/output
chmod 755 data/input data/output

# Run environment check
log_info "Verifying installation..."
npm run check-env

echo ""
log_info "============================================================"
log_info "  Installation Complete!"
log_info "============================================================"
log_info "You can now run the converter with:"
echo -e "  ${YELLOW}npm start${NC}"
echo ""
