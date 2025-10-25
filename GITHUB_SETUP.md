# 🚀 GitHub Setup & Installation Guide

This guide shows you how to upload this package to GitHub and install it in n8n.

---

## Part 1: Upload to GitHub

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository:
   - **Repository name**: `arman-telegram-automation`
   - **Description**: "Enhanced n8n Telegram automation with native channel filtering"
   - **Visibility**: Public (required for npm install)
   - ✅ **Do NOT** initialize with README (we already have one)
3. Click **Create repository**

### Step 2: Upload Files

#### Option A: Using GitHub Web Interface (Easiest)

1. In your new repository, click **uploading an existing file**
2. Drag and drop ALL files from the `arman-telegram-automation` folder
3. **Important**: Upload the entire folder structure, including:
   - `nodes/` folder
   - `credentials/` folder
   - `package.json`
   - `README.md`
   - `tsconfig.json`
   - `gulpfile.js`
   - `index.js`
   - `.gitignore`
   - `LICENSE.md`
4. Add commit message: "Initial commit: v0.6.0 with channel filtering"
5. Click **Commit changes**

#### Option B: Using Git Command Line

```bash
# Navigate to the package folder
cd /path/to/arman-telegram-automation

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: v0.6.0 with channel filtering"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOURUSERNAME/arman-telegram-automation.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Verify Upload

1. Go to your repository: `https://github.com/YOURUSERNAME/arman-telegram-automation`
2. Verify these files are present:
   - ✅ `package.json` (at root)
   - ✅ `nodes/` folder
   - ✅ `credentials/` folder
   - ✅ `README.md`
3. Check that `package.json` shows version `0.6.0`

---

## Part 2: Install in n8n

### Method 1: n8n GUI (Easiest)

1. Open your n8n instance
2. Click **Settings** (gear icon)
3. Go to **Community nodes**
4. Click **Install**
5. In the "npm Package Name" field, enter:
   ```
   YOURUSERNAME/arman-telegram-automation
   ```
   Replace `YOURUSERNAME` with your actual GitHub username
6. Click **Install**
7. Wait for installation (may take 2-3 minutes to build)
8. Restart n8n when prompted

### Method 2: Command Line

```bash
# Navigate to n8n nodes directory
cd ~/.n8n/nodes

# Install from GitHub
npm install github:YOURUSERNAME/arman-telegram-automation

# Restart n8n
# (How you restart depends on how you run n8n)
```

### Method 3: Docker

Add to your Dockerfile:

```dockerfile
FROM n8nio/n8n:latest

# Install the package from GitHub
RUN cd ~/.n8n/ && mkdir -p nodes && cd nodes && \
    npm install github:YOURUSERNAME/arman-telegram-automation

ENTRYPOINT ["tini", "--", "/docker-entrypoint.sh"]
```

Then rebuild your container:
```bash
docker build -t my-n8n .
docker run -it --rm --name n8n -p 5678:5678 my-n8n
```

---

## Part 3: Verify Installation

### Check if Node Appears

1. Open n8n
2. Create a new workflow
3. Click **Add Node** (+)
4. Search for "**Arman Telegram**"
5. You should see:
   - ✅ **Arman Telegram Trigger**
   - ✅ **Arman Telegram** (action node)

### Check Credentials

1. Go to **Credentials** → **Add New**
2. Search for "**Arman**"
3. You should see:
   - ✅ **Arman Telegram Automation API**

---

## Part 4: Configure & Test

### 1. Add Credentials

1. In n8n, go to **Credentials** → **Add New**
2. Select **Arman Telegram Automation API**
3. Fill in:
   - **App api_id**: Get from https://my.telegram.org
   - **App api_hash**: Get from https://my.telegram.org
   - **Phone Number**: Your Telegram phone (e.g., +1234567890)
4. Click **Save**

### 2. Create Test Workflow

1. Create new workflow
2. Add **Arman Telegram Trigger** node
3. Configure:
   - **Credentials**: Select your credentials
   - **Events**: `updateNewMessage`
   - **Options** → **Filter by Chat IDs**: (leave empty for now)
4. Add a simple node after (e.g., **No Operation**)
5. **Activate** the workflow
6. Send yourself a message on Telegram
7. Check if workflow executes

### 3. Add Channel Filtering

1. Find your channel ID:
   - Check the execution data from step 2
   - Look for `message.chat_id`
   - Note the number (e.g., `-1001234567890`)

2. Update the trigger:
   - **Options** → **Add Option**
   - Select **Filter by Chat IDs**
   - Enter your channel ID: `-1001234567890`
   - **Filter Mode**: `Include Only (Whitelist)`

3. Test:
   - Send message in the filtered channel → Should trigger ✅
   - Send message elsewhere → Should NOT trigger ❌

---

## Troubleshooting

### Installation Issues

**Error: "Build failed"**
```bash
# Try manual build
cd ~/.n8n/nodes/arman-telegram-automation
npm install
npm run build
```

**Error: "Module not found"**
- Ensure `package.json` is in the repository root
- Verify repository is public
- Check GitHub username is correct

**Error: "Cannot find module '@telepilotco/tdl'"**
```bash
# Reinstall dependencies
cd ~/.n8n/nodes/arman-telegram-automation
rm -rf node_modules
npm install
```

### Node Not Appearing

1. **Check installation location**:
   ```bash
   ls ~/.n8n/nodes/
   # Should show: arman-telegram-automation
   ```

2. **Check dist folder exists**:
   ```bash
   ls ~/.n8n/nodes/arman-telegram-automation/dist
   # Should show compiled .js files
   ```

3. **Rebuild if needed**:
   ```bash
   cd ~/.n8n/nodes/arman-telegram-automation
   npm run build
   ```

4. **Restart n8n completely**:
   ```bash
   # Stop n8n
   # Start n8n again
   ```

### Credentials Issues

**"Not logged in" error**:
1. Use the **Arman Telegram** (action) node
2. Select **Resource**: `Login`
3. Select **Operation**: `Login with Phone Number`
4. Execute to login first
5. Then use the trigger node

---

## Updating the Package

### When You Make Changes

1. Update version in `package.json`:
   ```json
   "version": "0.6.1"
   ```

2. Commit and push changes:
   ```bash
   git add .
   git commit -m "Update to v0.6.1: [describe changes]"
   git push
   ```

3. Create a GitHub release (optional but recommended):
   - Go to repository → **Releases** → **Create new release**
   - Tag: `v0.6.1`
   - Title: `Version 0.6.1`
   - Description: List changes

4. Update in n8n:
   ```bash
   cd ~/.n8n/nodes/arman-telegram-automation
   git pull
   npm install
   npm run build
   ```

---

## Installation URL Formats

You can use any of these formats in n8n:

```bash
# Full GitHub URL
github:YOURUSERNAME/arman-telegram-automation

# Short format (n8n GUI)
YOURUSERNAME/arman-telegram-automation

# With branch
YOURUSERNAME/arman-telegram-automation#main

# With specific version tag
YOURUSERNAME/arman-telegram-automation#v0.6.0

# Full git URL
git+https://github.com/YOURUSERNAME/arman-telegram-automation.git
```

---

## Pro Tips

### 1. Add Topics to Repository
On GitHub, add these topics to your repository for discoverability:
- `n8n`
- `n8n-nodes`
- `telegram`
- `telegram-bot`
- `automation`
- `community-node`

### 2. Enable Issues
Go to **Settings** → **Features** → Enable **Issues** for support

### 3. Add Repository Description
Click **"About"** → Add:
```
Enhanced n8n Telegram node with native channel filtering. Reduces workflow executions by 98%.
```

### 4. Pin Repository
Go to your profile → **Customize pins** → Pin this repository

### 5. Add Badge to README
The README already includes badges, but you can customize them:
```markdown
![npm version](https://img.shields.io/badge/version-0.6.0-blue.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
```

---

## Success Checklist

Before you're done, verify:

- ✅ Repository created on GitHub
- ✅ All files uploaded (especially `package.json`, `nodes/`, `credentials/`)
- ✅ Repository is **Public**
- ✅ Installed in n8n via GitHub
- ✅ Node appears in n8n interface
- ✅ Credentials work
- ✅ Test workflow triggers successfully
- ✅ Channel filtering works as expected

---

## Need Help?

1. Check the main README.md for usage documentation
2. Check GitHub Issues in your repository
3. Verify all files are in the repository root
4. Make sure TypeScript compiled successfully (check dist/ folder)

---

**You're all set! Your package is now on GitHub and installable in any n8n instance! 🎉**

Install command for others:
```
YOURUSERNAME/arman-telegram-automation
```
