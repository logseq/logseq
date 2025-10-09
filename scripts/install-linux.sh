#!/bin/bash

# Logseq Linux Installer Script
# This script installs Logseq on Linux systems
# Usage: ./install-linux.sh [version]

set -e  # Exit on any error

# Default values
DEFAULT_VERSION="latest"
INSTALL_DIR="/opt/logseq"
BIN_DIR="/usr/local/bin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << HELP
Logseq Linux Installer

This script installs Logseq on Linux systems.

USAGE:
    $0 [VERSION] [OPTIONS]
    $0 uninstall

COMMANDS:
    install (default)   Install Logseq
    uninstall           Removes Logseq installation (keeps user data)

ARGUMENTS:
    VERSION    Version to install (e.g., "0.10.14"). Default: latest

OPTIONS:
    --help, -h          Show this help message
    --prefix DIR        Installation prefix (default: /opt/logseq)
    --user              Install for current user only
    --no-desktop        Skip desktop integration
    --verbose, -v       Verbose output

EXAMPLES:
    $0                    # Install latest version
    $0 0.10.14           # Install specific version
    $0 --user            # Install for current user
    $0 --prefix ~/.local/share/logseq  # Custom install location

For more information, visit: https://github.com/logseq/logseq
HELP
}

uninstall() {
    log_info "Searching for Logseq installations..."
    
    local user_removed=false
    local system_removed=false
    
    # User installation paths
    local -a user_paths=(
        "$HOME/.local/share/logseq"
        "$HOME/.local/bin/logseq"
        "$HOME/.local/share/applications/logseq.desktop"
        "$HOME/.local/share/icons/hicolor/512x512/apps/logseq.png"
    )
    
    # System installation paths
    local -a system_paths=(
        "/opt/logseq"
        "/usr/local/bin/logseq"
        "/usr/share/applications/logseq.desktop"
        "/usr/share/icons/hicolor/512x512/apps/logseq.png"
    )
    
    # Remove user installation
    log_info "Checking user installation..."
    for path in "${user_paths[@]}"; do
        if [[ -e "$path" ]] || [[ -L "$path" ]]; then
            log_info "Removing: $path"
            rm -rf "$path"
            user_removed=true
        fi
    done
    
    # Remove system installation
    log_info "Checking system-wide installation..."
    for path in "${system_paths[@]}"; do
        if [[ -e "$path" ]] || [[ -L "$path" ]]; then
            if [[ "$EUID" -ne 0 ]]; then
                log_warn "System-wide installation found at $path, but root privileges required"
                log_warn "Run with sudo to uninstall system-wide installation"
            else
                log_info "Removing: $path"
                rm -rf "$path"
                system_removed=true
            fi
        fi
    done
    
    # Update desktop databases
    if [[ "$user_removed" == true ]] && [[ -d "$HOME/.local/share/applications" ]]; then
        update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
    fi
    
    if [[ "$system_removed" == true ]]; then
        update-desktop-database /usr/share/applications 2>/dev/null || true
    fi
    
    # Final status message
    if [[ "$user_removed" == true ]] || [[ "$system_removed" == true ]]; then
        log_info "Logseq has been uninstalled successfully!"
    else
        log_warn "No Logseq installation found in default locations"
    fi
}

# Parse command line arguments
VERSION="$DEFAULT_VERSION"
USER_INSTALL=false
SKIP_DESKTOP=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --prefix)
            INSTALL_DIR="$2"
            shift 2
            ;;
        --user)
            USER_INSTALL=true
            shift
            ;;
        --no-desktop)
            SKIP_DESKTOP=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        uninstall)
            uninstall
            exit 0
            ;;
        -*)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            VERSION="$1"
            shift
            ;;
    esac
done

# Set installation paths based on user/system install
if [[ "$USER_INSTALL" == true ]]; then
    INSTALL_DIR="${INSTALL_DIR/#\/opt\/logseq/$HOME/.local/share/logseq}"
    BIN_DIR="$HOME/.local/bin"
    mkdir -p "$BIN_DIR"
    
    # Add local bin to PATH if not already there
    if ! echo "$PATH" | grep -q "$HOME/.local/bin"; then
        log_info "Adding $HOME/.local/bin to PATH..."
        export PATH="$HOME/.local/bin:$PATH"
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    fi
fi

log_info "Installing Logseq $VERSION to $INSTALL_DIR"

# Check if running as root for system-wide installation
if [[ "$USER_INSTALL" == false && $EUID -ne 0 ]]; then
    log_warn "System-wide installation requires root privileges"
    log_warn "Run with sudo or use --user for user-specific installation"
    exit 1
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
if [[ "$VERBOSE" == true ]]; then
    log_info "Using temporary directory: $TEMP_DIR"
fi

cd "$TEMP_DIR"

# Determine download URL
if [[ "$VERSION" == "latest" ]]; then
    log_info "Fetching latest release information..."
    LATEST_RELEASE=$(curl -s https://api.github.com/repos/logseq/logseq/releases/latest)
    DOWNLOAD_URL=$(echo "$LATEST_RELEASE" | grep -o '"browser_download_url": "[^"]*Logseq-linux-x64-[^"]*\.zip"' | cut -d'"' -f4)
    
    if [[ -z "$DOWNLOAD_URL" ]]; then
        log_error "Could not find download URL for latest version"
        exit 1
    fi
else
    DOWNLOAD_URL="https://github.com/logseq/logseq/releases/download/${VERSION}/Logseq-linux-x64-${VERSION}.zip"
fi

log_info "Download URL: $DOWNLOAD_URL"

# Download Logseq
log_info "Downloading Logseq..."
if ! wget -q --show-progress -O logseq.zip "$DOWNLOAD_URL"; then
    log_error "Failed to download Logseq $VERSION"
    log_error "Please check if version $VERSION exists on GitHub releases"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Extract archive
log_info "Extracting archive..."
unzip -q logseq.zip

# Find the extracted directory
EXTRACTED_DIR=$(find . -maxdepth 2 -type d -name "Logseq-linux-x64*" | head -1)

if [[ -z "$EXTRACTED_DIR" ]]; then
    log_error "Could not find extracted Logseq directory"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Install files
log_info "Installing files..."
if [[ "$USER_INSTALL" == false ]]; then
    mkdir -p "$INSTALL_DIR"
    cp -r "$EXTRACTED_DIR"/* "$INSTALL_DIR/"
    chmod +x "$INSTALL_DIR/Logseq"
    ln -sf "$INSTALL_DIR/Logseq" "$BIN_DIR/logseq"
else
    mkdir -p "$INSTALL_DIR"
    cp -r "$EXTRACTED_DIR"/* "$INSTALL_DIR/"
    chmod +x "$INSTALL_DIR/Logseq"
    ln -sf "$INSTALL_DIR/Logseq" "$BIN_DIR/logseq"
fi

# Fix sandbox permissions
if [[ "$USER_INSTALL" == false && -f "$INSTALL_DIR/chrome-sandbox" ]]; then
    log_info "Setting sandbox permissions..."
    chown root:root "$INSTALL_DIR/chrome-sandbox"
    chmod 4755 "$INSTALL_DIR/chrome-sandbox"
fi

# Desktop integration
if [[ "$SKIP_DESKTOP" == false ]]; then
    log_info "Creating desktop integration..."

    DESKTOP_FILE="/usr/share/applications/logseq.desktop"
    if [[ "$USER_INSTALL" == true ]]; then
        mkdir -p ~/.local/share/applications/
        DESKTOP_FILE="$HOME/.local/share/applications/logseq.desktop"
    fi

    # Copy icon to standard location
    ICON_DIR="/usr/share/icons/hicolor/512x512/apps/"
    if [[ "$USER_INSTALL" == true ]]; then
        ICON_DIR="$HOME/.local/share/icons/hicolor/512x512/apps/"
        mkdir -p "$ICON_DIR"
    fi
    
    # Create desktop file
    cat > "$DESKTOP_FILE" << DESKTOP_EOF
[Desktop Entry]
Version=1.0
Name=Logseq
Comment=Logseq - A privacy-first, open-source platform for knowledge management and collaboration
Exec=$INSTALL_DIR/Logseq $([ "$USER_INSTALL" = true ] && echo "--no-sandbox") %U
Icon=$ICON_DIR/logseq.png
Terminal=false
Type=Application
Categories=Office;Productivity;Utility;TextEditor;
MimeType=application/x-logseq;
StartupWMClass=Logseq
DESKTOP_EOF
    
    # Make desktop file executable
    chmod +x "$DESKTOP_FILE"
    
    if [[ -f "$INSTALL_DIR/resources/app.asar.unpacked/dist/icon.png" ]]; then
        
        cp "$INSTALL_DIR/resources/app.asar.unpacked/dist/icon.png" "$ICON_DIR/logseq.png"
        
        # Update desktop file to use the copied icon
        if [[ "$USER_INSTALL" == false ]]; then
            sed -i 's|Icon=$INSTALL_DIR/resources/app.asar.unpacked/dist/icon.png|Icon=logseq|' "$DESKTOP_FILE"
        fi
    fi
    if [[ "$USER_INSTALL" == true && -f "$INSTALL_DIR/resources/app/icon.png" ]]; then
        cp "$INSTALL_DIR/resources/app/icon.png" "$ICON_DIR/logseq.png"
    fi
    
    # Update desktop database
    if [[ "$USER_INSTALL" == false ]]; then
        update-desktop-database /usr/share/applications/ 2>/dev/null || true
    else
        update-desktop-database ~/.local/share/applications/ 2>/dev/null || true
    fi
fi

# Clean up
rm -rf "$TEMP_DIR"

# Verify installation
if command -v logseq >/dev/null 2>&1; then
    INSTALLED_VERSION=$(logseq --version 2>/dev/null | head -1 || echo "unknown")
    log_info "Logseq installed successfully!"
    log_info "Version: $INSTALLED_VERSION"
    log_info "Location: $INSTALL_DIR"
    log_info "Command: logseq"
    
    if [[ "$SKIP_DESKTOP" == false ]]; then
        log_info "Desktop integration: Enabled"
        log_info "You can find Logseq in your applications menu"
    fi
else
    log_error "Installation completed but 'logseq' command not found in PATH"
    log_info "You may need to restart your terminal or add $BIN_DIR to your PATH"
fi

log_info "Installation completed successfully!"
