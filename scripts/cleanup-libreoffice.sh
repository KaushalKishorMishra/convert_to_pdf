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

log_warn "CRITICAL WARNING: unoconv relies on LibreOffice components to function."
log_warn "Uninstalling LibreOffice packages will break the current PDF conversion implementation."
echo -n "Are you sure you want to proceed with uninstallation? (y/N): "
read -r response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    log_info "Cleanup aborted."
    exit 0
fi

# Check for sudo
if [ "$EUID" -ne 0 ]; then
  if command -v sudo &> /dev/null; then
    SUDO="sudo"
  else
    log_error "This script requires root privileges or sudo access."
    exit 1
  fi
else
  SUDO=""
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
elif [ "$(uname)" == "Darwin" ]; then
    OS="macos"
else
    OS="unknown"
fi

log_info "Detected OS: $OS"

cleanup_dependencies() {
    case "$OS" in
        ubuntu|debian|pop|linuxmint|kali)
            log_info "Removing LibreOffice packages..."
            $SUDO apt-get purge -y libreoffice-core libreoffice-common libreoffice-headless libreoffice-writer libreoffice-impress
            $SUDO apt-get autoremove -y
            ;;
        
        centos|rhel|fedora|almalinux|rocky)
            log_info "Removing LibreOffice packages..."
            if command -v dnf &> /dev/null; then
                PKG_MGR="dnf"
            else
                PKG_MGR="yum"
            fi
            $SUDO $PKG_MGR remove -y libreoffice-headless libreoffice-writer libreoffice-impress
            ;;

        arch|manjaro)
             log_info "Removing LibreOffice packages..."
             $SUDO pacman -Rs --noconfirm libreoffice-fresh
             ;;
             
        macos)
            log_info "Removing LibreOffice cask..."
            brew uninstall --cask libreoffice
            ;;

        *)
            log_error "Unsupported OS for automated cleanup: $OS"
            exit 1
            ;;
    esac
}

cleanup_dependencies

log_info "============================================================"
log_info "  Cleanup Complete!"
log_info "============================================================"
log_info "LibreOffice packages have been removed."
log_warn "Note: You may still need to manually remove configuration folders like ~/.config/libreoffice if they exist."
