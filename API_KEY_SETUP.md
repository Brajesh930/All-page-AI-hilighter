# 🔑 Google Gemini API Key Setup Guide

## 🎯 Quick Setup (5 minutes)

### Step 1: Get Your API Key

1. **Visit Google AI Studio**: Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. **Sign In**: Use your Google account
3. **Create API Key**: Click "Create API Key" button
4. **Copy the Key**: Save it securely (you'll need it for the extension)

### Step 2: Verify API Access

1. **Check API Status**: Ensure the Gemini API is enabled
2. **Billing Setup**: Set up billing if required (free tier available)
3. **Test the Key**: Use the extension's validation feature

## 🔧 Detailed Setup Instructions

### Creating Your Google AI Studio Account

1. **Navigate to Google AI Studio**:
   - Open [https://aistudio.google.com](https://aistudio.google.com)
   - Click "Get started" or "Sign in"

2. **Sign in with Google**:
   - Use your existing Google account
   - Or create a new Google account if needed

3. **Accept Terms of Service**:
   - Read and accept the Google AI Studio terms
   - Complete any required setup steps

### Generating Your API Key

1. **Go to API Key Section**:
   - Visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Or navigate: AI Studio → Get API Key

2. **Create New API Key**:
   - Click "Create API Key" button
   - Choose "Create API key in new project" (recommended)
   - Or select an existing Google Cloud project

3. **Copy Your API Key**:
   - Copy the generated API key immediately
   - Store it securely (you won't be able to see it again)
   - The key should look like: `AIzaSyA...` (39 characters)

### Setting Up Billing (If Required)

1. **Check Free Tier**:
   - Gemini API has a generous free tier
   - 15 requests per minute, 1500 requests per day
   - 1 million tokens per month

2. **Enable Billing (Optional)**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to your project
   - Enable billing for higher limits

## 🚨 Common API Key Issues

### Issue 1: 404 Error - "API endpoint not found"

**Cause**: Using wrong API key type or expired key

**Solutions**:
1. **Verify Key Source**: Ensure you got the key from Google AI Studio, not Google Cloud Console
2. **Check Key Format**: Should start with `AIzaSy` and be 39 characters long
3. **Generate New Key**: Create a fresh API key if the old one doesn't work

### Issue 2: 403 Error - "Access denied"

**Cause**: API key doesn't have proper permissions or billing issues

**Solutions**:
1. **Check API Status**: Ensure Gemini API is enabled in your project
2. **Billing Setup**: Set up billing if you've exceeded free tier
3. **Project Permissions**: Verify the API key has access to Gemini API

### Issue 3: 400 Error - "Invalid request"

**Cause**: Malformed API key or request

**Solutions**:
1. **Key Validation**: Check for extra spaces or characters in the API key
2. **Copy Correctly**: Re-copy the API key from Google AI Studio
3. **Fresh Key**: Generate a new API key

## 🔍 Testing Your API Key

### Method 1: Using the Extension

1. **Install Extension**: Load the AI Concept Highlighter
2. **Open Configuration**: Click the floating brain icon
3. **Enter API Key**: Paste your key in the API key field
4. **Automatic Validation**: The extension will test the key automatically

### Method 2: Manual Testing (Advanced)

You can test your API key manually using curl:

```bash
curl -X POST \
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello"
      }]
    }]
  }'
```

Replace `YOUR_API_KEY` with your actual API key.

## 📊 API Usage and Limits

### Free Tier Limits
- **Rate Limit**: 15 requests per minute
- **Daily Limit**: 1,500 requests per day
- **Monthly Limit**: 1 million tokens per month

### Monitoring Usage
1. **Google AI Studio**: Check usage in the dashboard
2. **Google Cloud Console**: Detailed usage metrics
3. **Extension Notifications**: The extension will warn about rate limits

### Optimizing Usage
- **Efficient Concepts**: Use 3-8 specific concepts
- **Page Selection**: Don't analyze every page
- **Content Length**: Extension automatically limits content to 8000 characters

## 🔒 Security Best Practices

### Protecting Your API Key
1. **Never Share**: Don't share your API key publicly
2. **Secure Storage**: The extension encrypts and stores your key locally
3. **Regular Rotation**: Generate new keys periodically
4. **Monitor Usage**: Watch for unexpected usage spikes

### Key Management
1. **Multiple Keys**: Create separate keys for different projects
2. **Naming Convention**: Use descriptive names in Google Cloud Console
3. **Access Control**: Limit key permissions to only required APIs

## 🆘 Troubleshooting

### If Your API Key Isn't Working

1. **Double-check the Source**:
   - ✅ From Google AI Studio: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - ❌ Not from Google Cloud Console API keys

2. **Verify Key Format**:
   - ✅ Starts with `AIzaSy`
   - ✅ Exactly 39 characters long
   - ❌ No extra spaces or characters

3. **Check API Status**:
   - ✅ Gemini API is enabled
   - ✅ Project has billing set up (if needed)
   - ✅ No quota exceeded

4. **Test Connection**:
   - ✅ Internet connection working
   - ✅ No firewall blocking API requests
   - ✅ Try from different network if needed

### Getting Help

If you're still having issues:

1. **Extension Console**: Check browser console for detailed error messages
2. **Google AI Studio**: Check the status page and documentation
3. **API Documentation**: Visit [Google AI documentation](https://ai.google.dev/docs)

## 📝 Quick Reference

### Important URLs
- **Get API Key**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Google AI Studio**: [https://aistudio.google.com](https://aistudio.google.com)
- **Documentation**: [https://ai.google.dev/docs](https://ai.google.dev/docs)
- **Google Cloud Console**: [https://console.cloud.google.com](https://console.cloud.google.com)

### API Key Format
```
AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S
```
- Starts with: `AIzaSy`
- Length: 39 characters
- Contains: Letters, numbers, and some special characters

---

**🎉 Once you have your API key, you're ready to use the AI Concept Highlighter extension!**
