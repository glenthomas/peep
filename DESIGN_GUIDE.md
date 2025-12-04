# Peep System Monitor - Visual Design

## Application Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚡ Peep                                                         │
│  System Monitor - Real-time performance insights                │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────┬───────────────────────────────────────┐
│  🖥️ CPU Usage           │  💾 Memory Usage                      │
│  ───────────────────    │  ───────────────────                  │
│  Current Usage          │  Used / Total                         │
│  10.8%                  │  1.94 GB / 8.33 GB                    │
│  ▓▓░░░░░░░░░░░░░░░░░░   │  ▓▓░░░░░░░░░░░░░░░░░░                │
│                         │                                       │
│  CPU Cores: 2           │  Usage: 23.3%                         │
└─────────────────────────┴───────────────────────────────────────┘
┌─────────────────────────┬───────────────────────────────────────┐
│  💿 Disk I/O            │  🌐 Network I/O                       │
│  ───────────────────    │  ───────────────────                  │
│  Read Speed             │  Download (RX)                        │
│  0.00 B/s               │  0.00 B/s                             │
│                         │                                       │
│  Write Speed            │  Upload (TX)                          │
│  0.00 B/s               │  0.00 B/s                             │
│                         │                                       │
│  Total: 0.00 B/s        │  Total: 0.00 B/s                      │
└─────────────────────────┴───────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  📋 Running Processes (329)                                     │
│  ───────────────────────────────────────────────────────────    │
│  PID ↓   Name              User    CPU %    Memory %   Action   │
│  ─────   ────              ────    ─────    ────────   ──────   │
│  1       systemd           root    0.0%     0.1%       [Kill]   │
│  2       kthreadd          root    0.0%     0.0%       [Kill]   │
│  106     kworker/1:1H      0       0.0%     0.0%       [Kill]   │
│  ...     ...               ...     ...      ...        ...      │
│  ▼ Show top 20 by CPU usage                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Color Scheme

### Primary Gradient
- Background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Purple to violet gradient

### Card Colors
- Card background: `#ffffff`
- Card shadow: `rgba(0, 0, 0, 0.1)`
- Progress bar fill: Matches header gradient

### Text Colors
- Headings: `#667eea` (purple)
- Primary text: `#333333`
- Secondary text: `#666666`

## Interactions

### Dashboard Cards
- Hover: Lift slightly with shadow increase
- Progress bars: Smooth 0.3s transitions
- Values: Update every 2 seconds

### Process Table
- Sortable columns: Click to toggle sort direction
- Hover: Light gray background on rows
- Kill button: Red (#dc3545), confirms before action

## Responsive Behavior

### Desktop (> 800px)
- 2-column grid for metric cards
- Full table width
- All features visible

### Minimum (800x600)
- Cards may stack on narrow screens
- Table scrolls horizontally if needed
- Maintains usability

## Typography

### Fonts
- System fonts: `-apple-system, BlinkMacSystemFont, 'Segoe UI', ...`
- Smooth rendering on macOS

### Sizes
- Header title: 28px, bold
- Card titles: 18px, semibold
- Metric values: 20px, bold
- Body text: 14px, regular

## Accessibility

### Features
- Semantic HTML structure
- Clear visual hierarchy
- High contrast text
- Keyboard navigation support
- Screen reader friendly

## Animation

### Transitions
- Card hover: 0.2s transform and shadow
- Progress bars: 0.3s width change
- Smooth, non-jarring updates

### Update Frequency
- System metrics: 2000ms interval
- Visual feedback: Immediate
- No flicker or jank

## Platform-Specific

### macOS
- Hidden inset title bar for native feel
- Follows macOS HIG guidelines
- Gradient matches macOS Big Sur+ aesthetics
- Smooth animations at 60fps
