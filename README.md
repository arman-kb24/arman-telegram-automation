# Arman's Telegram User Automation

[![npm version](https://img.shields.io/badge/version-0.6.0-blue.svg)](https://github.com/yourusername/arman-telegram-automation)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

Enhanced n8n node for Telegram automation with **native channel/chat filtering** that eliminates 98% of unnecessary workflow executions.

## 🚀 Key Feature: Native Channel Filtering

**The Problem**: Original TelePilot receives ALL Telegram events, requiring IF nodes to filter, causing thousands of wasted executions.

**The Solution**: Filter at the trigger level - only execute workflows for specified channels.

### Performance Impact
```
Before: 1000 events → 1000 executions → 980 filtered → 20 useful (2% efficiency)
After:  1000 events → 20 executions → 0 filtered → 20 useful (100% efficiency)
Result: 98% reduction in wasted executions
```

---

## 📦 Installation

### Method 1: Install from GitHub (Recommended)

#### In n8n GUI:
1. Go to **Settings** → **Community nodes**
2. Click **"Install"**
3. Enter: `yourusername/arman-telegram-automation`
4. Click **Install**
5. Restart n8n

#### Via Command Line:
```bash
cd ~/.n8n/nodes
npm install github:yourusername/arman-telegram-automation
```

#### In n8n Docker:
```dockerfile
FROM n8nio/n8n:latest
RUN cd ~/.n8n/ && mkdir -p nodes && cd nodes && \
    npm install github:yourusername/arman-telegram-automation
ENTRYPOINT ["tini", "--", "/docker-entrypoint.sh"]
```

### Method 2: Clone and Install
```bash
cd ~/.n8n/nodes
git clone https://github.com/yourusername/arman-telegram-automation.git
cd arman-telegram-automation
npm install
```

---

## ⚙️ Configuration

### 1. Get Telegram API Credentials
1. Visit https://my.telegram.org
2. Log in with your phone number
3. Go to **API development tools**
4. Create an application
5. Copy your `api_id` and `api_hash`

### 2. Add Credentials in n8n
1. Go to **Credentials** → **Add**
2. Search for "Arman Telegram Automation API"
3. Enter:
   - **App api_id**: Your api_id
   - **App api_hash**: Your api_hash
   - **Phone Number**: Your Telegram phone (e.g., +1234567890)
4. Save

---

## 🎯 Usage

### Basic Example: Monitor Specific Channels

```yaml
Node: Arman Telegram Trigger
├─ Credentials: [Your Telegram credentials]
├─ Events: updateNewMessage
└─ Options:
    ├─ Filter by Chat IDs: -1001234567890, -1009876543210
    └─ Filter Mode: Include Only (Whitelist)
```

**Result**: Workflow triggers ONLY for messages from those 2 channels.

### Filter Modes

#### Whitelist (Include Only)
```yaml
Filter by Chat IDs: -1001234567890, -1009876543210
Filter Mode: Include Only
```
✅ Triggers for: Channel 1, Channel 2  
❌ Ignores: All other channels

#### Blacklist (Exclude)
```yaml
Filter by Chat IDs: -1001111111111
Filter Mode: Exclude
```
✅ Triggers for: All channels EXCEPT the specified one  
❌ Ignores: Channel 1111111111

---

## 🔍 Finding Chat IDs

### Method 1: Use the Trigger Node
1. Create workflow with Arman Telegram Trigger
2. Set Events to `updateNewMessage`
3. Leave filters empty
4. Activate workflow
5. Send message in target channel
6. Check execution data for `message.chat_id`

### Method 2: Use a Bot
1. Add [@getidsbot](https://t.me/getidsbot) to your channel
2. Forward a message from the channel
3. Bot shows the `chat_id`

### Chat ID Format
- **Channels/Groups**: Negative numbers (e.g., `-1001234567890`)
- **Private chats**: Positive numbers (e.g., `123456789`)

---

## 📊 Features

### Trigger Node
- ✨ **Native Channel Filtering** (NEW!)
  - Whitelist specific channels
  - Blacklist specific channels
  - Comma-separated list support
- 🎯 Event type filtering (updateNewMessage, updateMessageContent, etc.)
- 🚫 Ignore groups option
- ⚡ Filters BEFORE workflow execution

### Action Node
All standard Telegram operations:
- Send/receive messages
- File operations
- User management
- Group management
- Custom TDLib operations

---

## 💡 Use Cases

### 1. Channel News Aggregator
```
Monitor: 5 news channels
Action: Save to database
Executions: 100/day (instead of 5000/day)
```

### 2. Alert System
```
Monitor: 1 important channel
Action: Send to Slack/Email
Executions: 10/day (instead of 1000/day)
```

### 3. Content Filter
```
Monitor: All channels EXCEPT spam
Action: Process messages
Executions: 900/day (instead of 1000/day)
```

---

## 🛠️ Advanced Configuration

### Combining Filters
```yaml
Options:
  ├─ Filter by Chat IDs: -1001234567890, -1009876543210
  ├─ Filter Mode: Include Only
  └─ Ignore Groups Events: ✓
```

### Multiple Workflows
Create separate workflows for different channel groups:
```
Workflow 1: News channels → Database
Workflow 2: Support channels → Alert system
Workflow 3: Internal channels → Slack
```

---

## 🐛 Troubleshooting

### Not Receiving Events?
1. ✅ Verify credentials are correct
2. ✅ Ensure you're logged in (use Login action first)
3. ✅ Check chat_id format (negative for channels)
4. ✅ Verify Filter Mode is correct

### Enable Debug Logging
```bash
DEBUG=telepilot-trigger,tdl N8N_LOG_LEVEL=debug n8n start
```

### Common Issues

**Q: Filter not working?**  
A: Ensure comma-separated list has no extra spaces, verify chat_id is correct format

**Q: Still getting all messages?**  
A: Check that "Filter by Chat IDs" field is filled in and Filter Mode is set

**Q: Can't find chat_id?**  
A: Leave filters empty initially, trigger on any message, check execution data

---

## 🏗️ Development

### Build from Source
```bash
git clone https://github.com/yourusername/arman-telegram-automation.git
cd arman-telegram-automation
npm install
npm run build
```

### Project Structure
```
arman-telegram-automation/
├── nodes/
│   └── TelePilot/
│       ├── TelePilot.node.ts         # Action node
│       ├── TelePilotTrigger.node.ts  # Trigger node (with filtering)
│       └── tdlib/                     # TDLib types
├── credentials/
│   └── TelePilotApi.credentials.ts   # Credential definition
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔄 Migration from Original TelePilot

### Backward Compatible
- ✅ Same credential structure
- ✅ Existing workflows work without changes
- ✅ All original features available

### To Add Filtering
1. Open your trigger node
2. Add Options → "Filter by Chat IDs"
3. Enter your channel IDs
4. Save and activate

---

## 📋 System Requirements

- **n8n**: v1.0.0+
- **Node.js**: v14+
- **Platform**: Linux, macOS (Docker recommended)

### Compatibility

| Platform | Architecture | Status |
|----------|--------------|--------|
| Docker   | x64          | ✅ YES |
| Docker   | arm64        | ✅ YES |
| Linux    | x64          | ✅ YES |
| Linux    | arm64        | ✅ YES |
| macOS    | x64          | ✅ YES |
| macOS    | arm64        | ✅ YES |
| Windows  | x64          | ❌ NO  |
| Windows  | arm64        | ❌ NO  |

---

## 📄 License

MIT License - See [LICENSE.md](LICENSE.md)

---

## 🙏 Credits

- **Based on**: [TelePilot](https://github.com/telepilotco/n8n-nodes-telepilot) v0.5.2
- **Enhanced by**: Arman
- **Key Addition**: Native channel filtering for 98% performance improvement

---

## 📝 Changelog

### v0.6.0 (Current)
- ✨ Added native channel/chat ID filtering
- ✨ Whitelist/blacklist filter modes
- ✨ Rebranded as "Arman's Telegram User Automation"
- 🚀 98% reduction in unnecessary executions
- 📝 Enhanced documentation

### Based on TelePilot v0.5.2
- Original TelePilot functionality
- TDLib integration
- MTProto support

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 💬 Support

- 📖 [Documentation](https://github.com/yourusername/arman-telegram-automation)
- 🐛 [Issues](https://github.com/yourusername/arman-telegram-automation/issues)
- 💡 [Discussions](https://github.com/yourusername/arman-telegram-automation/discussions)

---

## ⭐ Show Your Support

If this project helped you, please consider giving it a ⭐ on GitHub!

---

**Made with ❤️ for the n8n community**

*Transform your Telegram automation with efficient channel filtering!*
