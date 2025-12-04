# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-04

### Added
- Initial release of Peep system monitor
- Real-time CPU monitoring with usage percentage and core count
- Memory usage tracking with total, used, and free metrics
- Disk I/O monitoring (placeholder for future implementation)
- Network I/O monitoring with RX/TX statistics
- Process list view with sortable columns
- Process management with ability to kill processes
- Rust native module for efficient system information collection
- Electron-based desktop application
- React UI with modern gradient design
- Support for macOS (Intel and Apple Silicon)
- Comprehensive README with installation and usage instructions
- MIT License
- Contributing guidelines

### Technical Stack
- Electron for desktop framework
- React + TypeScript for UI
- Rust + Neon for native module
- sysinfo crate for system metrics
- Webpack for bundling

### Known Limitations
- Disk I/O metrics are placeholders (returns 0)
- Currently macOS only
- No historical data tracking
- No customizable refresh intervals
- No theme switching

## [Unreleased]

### Planned
- Historical charts for CPU, memory, and network
- Real disk I/O monitoring
- System temperature monitoring
- Battery information for laptops
- Customizable refresh intervals
- Dark/light theme toggle
- Export functionality for system reports
- Linux support
- Windows support
- Alert notifications for high resource usage
- Process search and filtering
