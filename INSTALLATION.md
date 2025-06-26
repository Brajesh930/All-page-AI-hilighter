# 🧠 AI Concept Highlighter - Installation & Setup Guide

## 📋 Prerequisites

Before installing the AI Concept Highlighter extension, make sure you have:

1. **Google Chrome Browser** (version 88 or later)
2. **Google Gemini API Key** (free from Google AI Studio)
3. **Internet Connection** (for AI analysis)

## 🔑 Getting Your Google Gemini API Key

1. **Visit Google AI Studio**: Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. **Sign In**: Use your Google account to sign in
3. **Create API Key**: Click "Create API Key" button
4. **Copy the Key**: Save your API key securely (you'll need it for the extension)

> **Note**: The Gemini API has a generous free tier, but be aware of usage limits. Check the [Google AI pricing page](https://ai.google.dev/pricing) for current limits.

## 🚀 Installation Methods

### Method 1: Load Unpacked Extension (Recommended for Development)

1. **Download the Extension**:
   - Clone this repository or download as ZIP
   - Extract to a folder on your computer

2. **Open Chrome Extensions Page**:
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top right corner

4. **Load the Extension**:
   - Click "Load unpacked" button
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

5. **Pin the Extension** (Optional):
   - Click the puzzle piece icon in Chrome toolbar
   - Find "AI Concept Highlighter" and click the pin icon

### Method 2: Chrome Web Store (Future Release)

*The extension will be available on the Chrome Web Store in the future. This section will be updated when available.*

## ⚙️ Initial Configuration

### First-Time Setup

1. **Navigate to Any Website**:
   - Go to any webpage with text content
   - For testing, you can use the included `test-page.html`

2. **Find the Floating Icon**:
   - Look for a floating brain icon (🧠) in the top-right corner of the page
   - If you don't see it, try refreshing the page

3. **Open Configuration**:
   - Click the floating brain icon
   - A configuration modal will appear

4. **Enter Your API Key**:
   - Paste your Google Gemini API key in the "API Key" field
   - The extension will validate the key automatically

5. **Add Your Concepts**:
   - Enter concepts you want to highlight, separated by commas
   - Example: `machine learning, artificial intelligence, neural networks, deep learning`
   - Be specific but not too narrow

6. **Enable the Extension**:
   - Toggle the "Enable on Current Tab" switch
   - Click "Save & Analyze"

### Alternative Configuration via Extension Popup

1. **Click Extension Icon**:
   - Click the AI Concept Highlighter icon in your Chrome toolbar
   - If you don't see it, click the puzzle piece icon first

2. **Configure Settings**:
   - Enter your API key and concepts in the popup
   - Toggle the extension on/off
   - View statistics about highlights

## 🎯 Usage Guide

### Basic Usage

1. **Automatic Analysis**:
   - Once configured, the extension automatically analyzes new pages
   - Wait a few seconds for analysis to complete
   - Relevant text will be highlighted with a gradient background

2. **Manual Control**:
   - Use the floating icon to enable/disable on specific pages
   - Clear highlights using the "Clear Highlights" button
   - Reconfigure concepts anytime

### Understanding Highlights

- **Gradient Background**: Text related to your concepts
- **Hover Effects**: Hover over highlights to see related concepts
- **Target Icon**: Small target icon appears on hover
- **Color Coding**: Different shades may indicate relevance strength

### Managing Concepts

**Good Concept Examples**:
- `machine learning` - Specific technology
- `climate change` - Broad topic
- `React.js` - Specific framework
- `quantum computing` - Emerging field

**Tips for Better Results**:
- Use 3-8 concepts for best performance
- Mix broad and specific terms
- Include synonyms and variations
- Update concepts based on your interests

## 🔧 Troubleshooting

### Common Issues

**Extension Not Working**:
- ✅ Check if the extension is enabled in `chrome://extensions/`
- ✅ Refresh the webpage after enabling
- ✅ Verify your API key is valid and has quota remaining
- ✅ Check browser console for error messages

**No Floating Icon Visible**:
- ✅ The icon might be hidden behind other page elements
- ✅ Try scrolling or zooming to locate it
- ✅ Some websites may have conflicting CSS
- ✅ Check if the page allows content scripts

**API Key Issues**:
- ✅ Verify the API key is copied correctly (no extra spaces)
- ✅ Check if the Gemini API is enabled in your Google Cloud project
- ✅ Ensure you haven't exceeded your API quota
- ✅ Try generating a new API key

**No Highlights Appearing**:
- ✅ Make sure your concepts are relevant to the page content
- ✅ Try broader concept terms
- ✅ Check if the page has sufficient text content
- ✅ Wait for analysis to complete (may take 5-10 seconds)

**Performance Issues**:
- ✅ Large pages may take longer to analyze
- ✅ Reduce the number of concepts if analysis is slow
- ✅ Clear highlights and re-analyze if needed

### Error Messages

**"API key not configured"**:
- Enter your Google Gemini API key in the configuration

**"No concepts configured"**:
- Add at least one concept to highlight

**"Analysis failed"**:
- Check your internet connection and API key validity

**"Page content too short"**:
- The page doesn't have enough text for meaningful analysis

## 🔒 Privacy & Security

### Data Handling
- **API Key Storage**: Encrypted and stored locally in Chrome
- **Content Analysis**: Page content sent to Google Gemini API for analysis
- **No Data Collection**: The extension doesn't collect or store user data
- **Local Processing**: All highlighting happens locally in your browser

### Permissions Explained
- **storage**: Save your configuration settings
- **activeTab**: Access current tab for highlighting
- **scripting**: Inject highlighting scripts
- **tabs**: Manage tab interactions
- **host_permissions**: Access web pages for content analysis

## 📊 Performance Tips

### Optimizing Performance
1. **Limit Concepts**: Use 3-8 concepts for best performance
2. **Specific Terms**: More specific concepts yield better results
3. **Page Size**: Large pages may take longer to analyze
4. **API Limits**: Be mindful of your Gemini API quota

### Best Practices
- **Regular Updates**: Update concepts based on your current interests
- **Test Pages**: Use the included test page to verify functionality
- **Monitor Usage**: Check API usage in Google AI Studio
- **Feedback**: Report issues or suggestions for improvement

## 🆘 Getting Help

### Support Resources
1. **Test Page**: Use `test-page.html` to verify installation
2. **Browser Console**: Check for error messages (F12 → Console)
3. **Extension Page**: Visit `chrome://extensions/` for extension details
4. **API Documentation**: [Google Gemini API Docs](https://ai.google.dev/docs)

### Reporting Issues
When reporting issues, please include:
- Chrome version
- Extension version
- Error messages from browser console
- Steps to reproduce the issue
- Example webpage where the issue occurs

---

**🎉 You're all set! Start exploring the web with intelligent concept highlighting powered by AI.**
