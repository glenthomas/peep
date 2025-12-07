# Contributing to Peep

Thank you for your interest in contributing to Peep! This document provides guidelines and information for contributors.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/peep.git
   cd peep
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Project**
   ```bash
   npm run build
   ```

## Development Workflow

### Building Components

- **Native Module**: `npm run build:native` - Builds the Rust native module
- **TypeScript**: `npm run build:ts` - Compiles the Electron main process, preload script, and shared modules
- **Renderer**: `npm run build:renderer` - Builds the React frontend with webpack
- **Everything**: `npm run build` - Builds all components

### Running the Application

```bash
npm start
```

For development with hot reload on the renderer:
```bash
# Terminal 1
npm run dev:renderer

# Terminal 2
npm run build:ts && electron .
```

## Code Style

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic

### Rust
- Follow Rust naming conventions
- Use `cargo fmt` before committing
- Add documentation comments for public functions

### React
- Use functional components with hooks
- Keep components focused and reusable
- Extract complex logic into custom hooks

## Adding Features

### New System Metrics

To add a new system metric:

1. **Native Module** (`native/src/lib.rs`):
   - Add a function to collect the metric
   - Export it in the `main` function

2. **Main Process** (`src/main/main.ts`):
   - Add an IPC handler for the metric
   - Call the native function

3. **Preload Script** (`src/main/preload.ts`):
   - Expose the IPC method to the renderer

4. **React Component**:
   - Create a new component in `src/renderer/components/`
   - Add it to the dashboard in `App.tsx`

### Example: Adding Temperature Monitoring

1. In `native/src/lib.rs`:
```rust
fn get_temperature_info(mut cx: FunctionContext) -> JsResult<JsObject> {
    // Implementation
}

// In main:
cx.export_function("getTemperatureInfo", get_temperature_info)?;
```

2. In `src/main/main.ts`:
```typescript
ipcMain.handle('get-temperature', async () => {
    return native.getTemperatureInfo();
});
```

3. In `src/main/preload.ts`:
```typescript
getTemperature: () => ipcRenderer.invoke('get-temperature')
```

4. Create `src/renderer/components/TemperatureMonitor.tsx`

## Testing

Currently, the project uses manual testing. When running:

```bash
npm start
```

Verify:
- CPU usage is displayed and updates
- Memory usage is accurate
- Process list loads
- Process killing works (be careful!)

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Build and test: `npm run build && npm start`
4. Commit with a clear message
5. Push and create a pull request
6. Describe your changes in detail

## Platform-Specific Development

### macOS
The primary development platform. All features should work here.

### Linux (Future)
When adding Linux support:
- Test on Ubuntu, Fedora, and Arch
- Handle different desktop environments
- Update build scripts for `.deb`, `.rpm`, `.AppImage`

### Windows (Future)
When adding Windows support:
- Test on Windows 10 and 11
- Handle administrator permissions for process killing
- Update build scripts for `.exe` installer

## Performance Guidelines

- The native module should use minimal CPU (< 2%)
- Memory usage should stay under 150MB
- UI updates should not block the main thread
- Use debouncing for frequent updates

## Security Considerations

- Never expose unsafe operations without user confirmation
- Validate all IPC inputs
- Use context isolation in Electron
- Keep dependencies updated

## Creating a Release

Releases are automated via GitHub Actions. When a version tag is pushed, the CI/CD pipeline will:
1. Build for both Intel (x64) and Apple Silicon (arm64) Macs
2. Create `.dmg` and `.zip` artifacts for each architecture
3. Publish a GitHub Release with all artifacts

### Steps to Create a Release

1. **Update the version** in `package.json`:
   ```bash
   npm version <major|minor|patch>
   # Example: npm version 1.1.0
   ```

2. **Push the tag** to GitHub:
   ```bash
   git push origin v1.1.0
   ```

3. The GitHub Actions workflow will automatically:
   - Build the application for all supported platforms
   - Create a draft release with generated release notes
   - Attach all build artifacts

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes or major new features
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes, backwards compatible

### Pre-releases

For beta or alpha releases, use pre-release tags:
```bash
npm version 1.1.0-beta.1
git push origin v1.1.0-beta.1
```

These will be marked as pre-releases on GitHub.

## Getting Help

- Open an issue for bugs
- Start a discussion for feature ideas
- Ask questions in pull requests

## Code of Conduct

Be respectful and constructive. We're all here to build something great together.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
