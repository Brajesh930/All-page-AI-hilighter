# 🧠 AI Concept Highlighter

A sophisticated Chrome browser extension that leverages Google's Gemini AI to intelligently identify and highlight concept-related content on web pages.

## ✨ Features

- **AI-Powered Page Summaries**: Click the floating icon to get intelligent summaries of any webpage
- **Concept-Focused Summaries**: Summaries automatically highlight content related to your configured concepts
- **Smart Summary Panel**: Elegant interface with quick actions and settings access
- **Draggable Floating Icon**: Unobtrusive floating brain icon that you can drag to any position
- **Dynamic Concept Management**: Add, remove, and manage concepts individually with intuitive interface
- **Custom Color Coding**: Choose unique colors for each concept to visually distinguish different topics
- **Smart Configuration**: Easy setup for Google Gemini API key and concepts
- **Intelligent Highlighting**: AI-powered concept detection with relevance-based visual highlighting (High/Medium/Low)
- **Google Patents Integration**: Specialized parsing for Google Patents pages extracting title, abstract, claims, and description
- **Flexible Analysis Control**: Choose between automatic analysis or manual trigger
- **Customizable Concepts**: Define any concepts you want to track and highlight
- **Toggle Control**: Enable/disable highlighting per page or globally
- **Visual Feedback**: Beautiful highlighting with hover effects and concept indicators
- **Position Memory**: Icon remembers your preferred position across page reloads
- **Edge Snapping**: Icon automatically snaps to screen edges for optimal positioning

## 🚀 Installation

### From Source (Development)

1. **Clone or Download** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in the top right)
4. **Click "Load unpacked"** and select the extension directory
5. **Pin the extension** to your toolbar for easy access

### Get Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key (choose "Create API key in new project")
4. Copy the API key for use in the extension

**Important**: Make sure to get your API key from Google AI Studio, not Google Cloud Console. The key should start with `AIzaSy` and be 39 characters long.

## 🔧 Configuration

### First Time Setup

1. **Click the floating brain icon** (🧠) that appears on any webpage
2. **Enter your Google Gemini API Key** in the configuration modal
3. **Add your concepts** - separate multiple concepts with commas
   - Example: `machine learning, artificial intelligence, neural networks, deep learning`
4. **Enable the extension** using the toggle switch
5. **Click "Save & Analyze"** to start highlighting

### Using the Extension Popup

You can also configure the extension by:
1. **Clicking the extension icon** in your Chrome toolbar
2. **Configuring settings** in the popup interface
3. **Viewing statistics** about highlights and concepts found

## 💡 Usage

### Automatic Highlighting
- Once configured, the extension automatically analyzes page content
- Relevant text segments are highlighted with a beautiful gradient
- Hover over highlights to see concepts, relevance levels, and AI explanations

### Manual Control
- **Toggle on/off**: Use the floating icon or popup to enable/disable
- **Clear highlights**: Remove all highlights from the current page
- **Edit concepts**: Update your concepts anytime through the configuration

### Visual Indicators
- **Green floating icon**: Extension is active and highlighting
- **Blue floating icon**: Extension is configured but disabled
- **Gradient highlights**: AI-identified concept-related content
- **Hover effects**: Additional context on highlighted text

## 🎯 How It Works

1. **Content Extraction**: The extension extracts meaningful text from web pages
2. **AI Analysis**: Sends content to Google Gemini AI for concept analysis
3. **Smart Highlighting**: Identifies and highlights relevant text segments
4. **Visual Enhancement**: Applies beautiful styling to highlighted content
5. **User Interaction**: Provides hover effects and concept information

## 📄 Google Patents Integration

The extension provides specialized support for Google Patents pages with intelligent content extraction:

### **Automatic Detection**
- Recognizes Google Patents URLs (`patents.google.com/patent/`)
- Automatically switches to patent-specific parsing mode
- Extracts only relevant patent sections for analysis

### **Targeted Content Extraction**
- **Title**: Patent title and main heading
- **Abstract**: Patent abstract and summary
- **Claims**: All patent claims (independent and dependent)
- **Description**: Detailed technical description and background

### **Benefits for Patent Analysis**
- **Focused Analysis**: Only analyzes relevant patent content, ignoring navigation and metadata
- **Comprehensive Coverage**: Captures all key patent sections for thorough concept analysis
- **Improved Accuracy**: Better AI analysis results due to structured, relevant content input
- **Efficient Processing**: Faster analysis by excluding irrelevant page elements

## 🛠️ Technical Details

### Architecture
- **Manifest V3**: Modern Chrome extension architecture
- **Content Scripts**: Injected into all web pages for highlighting
- **Background Service Worker**: Handles AI API communication
- **Popup Interface**: Extension toolbar popup for configuration
- **Chrome Storage API**: Persistent settings storage

### AI Integration
- **Google Gemini Pro**: Advanced language model for concept detection
- **Intelligent Parsing**: Extracts JSON responses from AI analysis
- **Error Handling**: Robust error handling for API failures
- **Rate Limiting**: Respects API usage limits and quotas

### Security & Privacy
- **API Key Encryption**: Secure storage of API credentials
- **Local Processing**: Content analysis happens via secure API calls
- **No Data Collection**: Extension doesn't collect or store user data
- **Permissions**: Minimal required permissions for functionality

## 🔒 Permissions

The extension requires these permissions:
- **storage**: Save your configuration and settings
- **activeTab**: Access current tab for highlighting
- **scripting**: Inject content scripts for highlighting
- **tabs**: Manage tab interactions
- **host_permissions**: Access web pages for content analysis

## 🐛 Troubleshooting

### Common Issues

**Extension not working on a page:**
- Check if the page allows content scripts (some sites block extensions)
- Refresh the page after enabling the extension
- Check browser console for any error messages

**API key validation fails:**
- Verify your API key is correct and active
- Check your Google Cloud billing and quotas
- Ensure the Gemini API is enabled in your Google Cloud project

**No highlights appearing:**
- Make sure your concepts are relevant to the page content
- Try broader or more specific concept terms
- Check if the page has sufficient text content

**Floating icon not visible:**
- The icon might be hidden behind other page elements
- Try scrolling or zooming to locate it
- Check if the page has conflicting CSS styles

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key and quota limits
3. Try disabling and re-enabling the extension
4. Test with different websites and concepts

## 🚀 Future Enhancements

- **Multiple AI Providers**: Support for other AI services
- **Custom Highlighting Styles**: User-defined colors and styles
- **Export Functionality**: Save highlighted content and analysis
- **Batch Processing**: Analyze multiple pages simultaneously
- **Concept Suggestions**: AI-powered concept recommendations
- **Analytics Dashboard**: Detailed usage and discovery statistics

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

---

**Made with ❤️ for better web content discovery**
