// AI Concept Highlighter - Background Service Worker

// Extension installation and update handling
chrome.runtime.onInstalled.addListener((details) => {
  console.log('AI Concept Highlighter installed/updated');
  
  // Initialize default settings
  chrome.storage.sync.get(['aiConceptSettings'], (result) => {
    if (!result.aiConceptSettings) {
      const defaultSettings = {
        apiKey: '',
        concepts: [],
        enabled: false,
        highlightColor: '#a8edea',
        autoAnalyze: true
      };
      
      chrome.storage.sync.set({ aiConceptSettings: defaultSettings }, () => {
        console.log('Default settings initialized');
      });
    }
  });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'analyzeContent':
      handleContentAnalysis(request.data, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'getSettings':
      chrome.storage.sync.get(['aiConceptSettings'], (result) => {
        sendResponse(result.aiConceptSettings || {});
      });
      return true;
      
    case 'saveSettings':
      chrome.storage.sync.set({ aiConceptSettings: request.settings }, () => {
        sendResponse({ success: true });
        // Notify all tabs about settings change
        notifyTabsSettingsChanged(request.settings);
      });
      return true;
      
    case 'validateApiKey':
      validateGeminiApiKey(request.apiKey, sendResponse);
      return true;

    case 'generateSummary':
      handleSummaryGeneration(request.data, sendResponse);
      return true;

    default:
      sendResponse({ error: 'Unknown action' });
  }
});

// Generate page summary using Google Gemini AI
async function handleSummaryGeneration(data, sendResponse) {
  try {
    const settings = await getStoredSettings();

    if (!settings.apiKey) {
      sendResponse({ error: 'API key not configured' });
      return;
    }

    // Extract concept texts for summary
    const conceptTexts = data.concepts ? data.concepts.map(c =>
      typeof c === 'string' ? c : c.text
    ) : [];

    const summaryResult = await generateSummaryWithGemini(
      data.content,
      conceptTexts,
      settings.apiKey
    );

    sendResponse({
      success: true,
      summary: summaryResult.summary
    });

  } catch (error) {
    console.error('Summary generation error:', error);
    sendResponse({
      error: error.message || 'Summary generation failed'
    });
  }
}

// Analyze content using Google Gemini AI
async function handleContentAnalysis(data, sendResponse) {
  try {
    console.log('🎯 BACKGROUND SCRIPT: Starting content analysis');
    console.log('📄 Received data:', {
      contentLength: data.content ? data.content.length : 0,
      contentPreview: data.content ? data.content.substring(0, 200) + '...' : 'No content'
    });

    const settings = await getStoredSettings();
    console.log('⚙️ Current settings:', {
      hasApiKey: !!settings.apiKey,
      apiKeyLength: settings.apiKey ? settings.apiKey.length : 0,
      conceptsCount: settings.concepts ? settings.concepts.length : 0,
      concepts: settings.concepts
    });

    if (!settings.apiKey) {
      console.error('❌ No API key configured');
      sendResponse({ error: 'API key not configured' });
      return;
    }

    if (!settings.concepts || settings.concepts.length === 0) {
      console.error('❌ No concepts configured');
      sendResponse({ error: 'No concepts configured' });
      return;
    }

    // Extract concept texts for analysis
    const conceptTexts = settings.concepts ? settings.concepts.map(c =>
      typeof c === 'string' ? c : c.text
    ) : [];

    console.log('📋 Extracted concept texts for AI:', conceptTexts);
    console.log('📄 Content being sent to AI:');
    console.log('   - Full length:', data.content.length);
    console.log('   - First 300 characters:', data.content.substring(0, 300));
    console.log('   - Last 300 characters:', data.content.substring(Math.max(0, data.content.length - 300)));

    console.log('🚀 Calling analyzeWithGemini...');
    const analysisResult = await analyzeWithGemini(
      data.content,
      conceptTexts,
      settings.apiKey
    );

    console.log('🤖 AI Analysis Result:', analysisResult);
    console.log('📊 Analysis Summary:', {
      success: !!analysisResult.highlights,
      highlightsCount: analysisResult.highlights ? analysisResult.highlights.length : 0,
      conceptsFoundCount: analysisResult.conceptsFound ? analysisResult.conceptsFound.length : 0,
      conceptsFound: analysisResult.conceptsFound
    });

    if (analysisResult.highlights) {
      console.log('🎯 Individual highlights:');
      analysisResult.highlights.forEach((highlight, index) => {
        console.log(`   ${index + 1}. "${highlight.text}" - Concepts: [${highlight.concepts.join(', ')}] - Relevance: ${highlight.relevance || 'not specified'}`);
      });
    }

    const response = {
      success: true,
      highlights: analysisResult.highlights,
      conceptsFound: analysisResult.conceptsFound
    };

    console.log('📤 Sending response back to content script:', response);
    sendResponse(response);
    
  } catch (error) {
    console.error('Content analysis error:', error);
    sendResponse({ 
      error: error.message || 'Analysis failed' 
    });
  }
}

// Analyze large content with multiple queries
async function analyzeWithMultipleQueries(content, concepts, apiKey, maxChunkSize) {
  console.log('🔄 MULTIPLE QUERIES: Starting analysis with content splitting');

  // Split content into manageable chunks
  const chunks = splitContentIntoChunks(content, maxChunkSize);
  console.log(`📊 Split content into ${chunks.length} chunks`);

  const allHighlights = [];
  const allConceptsFound = new Set();

  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    console.log(`🔍 Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);

    try {
      const chunkResult = await analyzeSingleChunk(chunks[i], concepts, apiKey, i + 1);

      if (chunkResult.highlights) {
        allHighlights.push(...chunkResult.highlights);
      }

      if (chunkResult.conceptsFound) {
        chunkResult.conceptsFound.forEach(concept => allConceptsFound.add(concept));
      }

      // Add delay between requests to avoid rate limiting
      if (i < chunks.length - 1) {
        console.log('⏳ Waiting 1 second before next chunk...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`❌ Error processing chunk ${i + 1}:`, error);
      // Continue with other chunks even if one fails
    }
  }

  console.log(`✅ MULTIPLE QUERIES COMPLETE: Found ${allHighlights.length} total highlights`);

  return {
    highlights: allHighlights.slice(0, 50), // Limit total highlights
    conceptsFound: Array.from(allConceptsFound)
  };
}

// Split content into chunks while preserving section boundaries
function splitContentIntoChunks(content, maxChunkSize) {
  const chunks = [];

  // For Google Patents, try to split by sections first
  if (content.includes('TITLE:') && content.includes('ABSTRACT:')) {
    const sections = content.split(/\n\n(?=TITLE:|ABSTRACT:|CLAIMS:|DESCRIPTION:)/);

    let currentChunk = '';
    for (const section of sections) {
      if (currentChunk.length + section.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = section;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + section;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  } else {
    // For regular content, split by paragraphs
    const paragraphs = content.split('\n\n');
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  }

  return chunks.filter(chunk => chunk.length > 0);
}

// Analyze a single chunk
async function analyzeSingleChunk(chunk, concepts, apiKey, chunkNumber) {
  console.log(`🤖 CHUNK ${chunkNumber}: Analyzing ${chunk.length} characters`);

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  const prompt = `
    Analyze the following text chunk and identify segments that are related to these concepts: ${concepts.join(', ')}.

    This is chunk ${chunkNumber} of a larger document. Focus on finding relevant content within this section.

    For each relevant text segment, provide:
    1. The exact text that should be highlighted (keep it concise, max 100 characters)
    2. Which concept(s) it relates to
    3. A brief explanation of the relevance
    4. A relevance score: "high", "medium", or "low"

    Relevance scoring guidelines:
    - HIGH: Direct mentions, key definitions, core examples, primary focus areas
    - MEDIUM: Related discussions, supporting examples, indirect references
    - LOW: Tangential mentions, background context, minor connections

    Important guidelines:
    - Only highlight text that is directly and clearly related to the concepts
    - Prefer shorter, more specific text segments over long paragraphs
    - Avoid highlighting common words or phrases unless they're specifically relevant
    - Maximum 15 highlights per chunk
    - Be precise with relevance scoring

    Return the response as a JSON object with this structure:
    {
      "highlights": [
        {
          "text": "exact text to highlight",
          "concepts": ["related concept 1", "related concept 2"],
          "explanation": "brief explanation",
          "relevance": "high|medium|low"
        }
      ],
      "conceptsFound": ["concept1", "concept2"]
    }

    Text chunk to analyze:
    ${chunk}
  `;

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    }
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`API error for chunk ${chunkNumber}: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.candidates[0].content.parts[0].text;

  // Parse JSON response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn(`⚠️ No JSON found in chunk ${chunkNumber} response`);
    return { highlights: [], conceptsFound: [] };
  }

  const result = JSON.parse(jsonMatch[0]);
  console.log(`✅ CHUNK ${chunkNumber}: Found ${result.highlights?.length || 0} highlights`);

  return {
    highlights: result.highlights || [],
    conceptsFound: result.conceptsFound || []
  };
}

// Analyze content with Google Gemini AI
async function analyzeWithGemini(content, concepts, apiKey) {
  console.log('🤖 GEMINI AI: Starting analysis');
  console.log('📋 Input parameters:', {
    contentLength: content ? content.length : 0,
    conceptsCount: concepts ? concepts.length : 0,
    concepts: concepts,
    apiKeyLength: apiKey ? apiKey.length : 0
  });

  // Input validation
  if (!content || typeof content !== 'string') {
    console.error('❌ Invalid content provided for analysis');
    throw new Error('Invalid content provided for analysis');
  }

  if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
    console.error('❌ No concepts provided for analysis');
    throw new Error('No concepts provided for analysis');
  }

  if (!apiKey || typeof apiKey !== 'string') {
    console.error('❌ Invalid API key provided');
    throw new Error('Invalid API key provided');
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  console.log('🌐 API URL (without key):', apiUrl.replace(/key=.*$/, 'key=***'));

  // Check if this is Google Patents content (don't truncate)
  const isGooglePatents = content.includes('TITLE:') && content.includes('ABSTRACT:') && content.includes('CLAIMS:');

  // Set content length limits based on content type
  const maxContentLength = isGooglePatents ? 30000 : 8000; // Larger limit for patents

  console.log('✂️ Content processing:', {
    originalLength: content.length,
    isGooglePatents: isGooglePatents,
    maxAllowed: maxContentLength,
    needsMultipleQueries: content.length > maxContentLength
  });

  // If content is too large, split into multiple queries
  if (content.length > maxContentLength) {
    console.log('📄 Content too large, splitting into multiple queries...');
    return await analyzeWithMultipleQueries(content, concepts, apiKey, maxContentLength);
  }

  const truncatedContent = content;

  const prompt = `
    Analyze the following text and identify segments that are related to these concepts: ${concepts.join(', ')}.

    For each relevant text segment, provide:
    1. The exact text that should be highlighted (keep it concise, max 100 characters)
    2. Which concept(s) it relates to
    3. A brief explanation of the relevance
    4. A relevance score: "high", "medium", or "low"

    Relevance scoring guidelines:
    - HIGH: Direct mentions, key definitions, core examples, primary focus areas
    - MEDIUM: Related discussions, supporting examples, indirect references
    - LOW: Tangential mentions, background context, minor connections

    Important guidelines:
    - Only highlight text that is directly and clearly related to the concepts
    - Avoid highlighting common words or phrases unless they're specifically relevant
    - Prefer shorter, more specific text segments over long paragraphs
    - Maximum 20 highlights per analysis
    - Be precise with relevance scoring

    Return the response as a JSON object with this structure:
    {
      "highlights": [
        {
          "text": "exact text to highlight",
          "concepts": ["related concept 1", "related concept 2"],
          "explanation": "brief explanation",
          "relevance": "high|medium|low"
        }
      ],
      "conceptsFound": ["concept1", "concept2"]
    }

    Text to analyze:
    ${truncatedContent}
  `;

  console.log('📝 FULL PROMPT being sent to AI:');
  console.log('=====================================');
  console.log(prompt);
  console.log('=====================================');
  console.log('📊 Prompt statistics:', {
    promptLength: prompt.length,
    conceptsInPrompt: concepts.join(', '),
    contentLengthInPrompt: truncatedContent.length
  });

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    }
  };

  console.log('📤 REQUEST BODY being sent to Gemini API:');
  console.log('==========================================');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('==========================================');
  console.log('📊 Request statistics:', {
    requestBodySize: JSON.stringify(requestBody).length,
    temperature: requestBody.generationConfig.temperature,
    maxOutputTokens: requestBody.generationConfig.maxOutputTokens
  });

  try {
    console.log('🚀 Sending request to Gemini API...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Received response from Gemini API:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error response:', errorText);
      console.error('❌ Response details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.status === 400) {
        throw new Error('Invalid request to Gemini API. Please check your API key and try again.');
      } else if (response.status === 403) {
        throw new Error('API key access denied. Please verify your Gemini API key permissions.');
      } else if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status >= 500) {
        throw new Error('Gemini API server error. Please try again later.');
      } else {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
    }

    console.log('✅ Successfully received response from Gemini API');
    const data = await response.json();

    console.log('📥 RAW RESPONSE from Gemini API:');
    console.log('=================================');
    console.log(JSON.stringify(data, null, 2));
    console.log('=================================');

    // Validate response structure
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      throw new Error('No analysis results returned from Gemini API');
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts)) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const responseText = candidate.content.parts[0].text;

    console.log('📄 RAW TEXT RESPONSE from Gemini:');
    console.log('==================================');
    console.log(responseText);
    console.log('==================================');

    if (!responseText) {
      console.error('❌ Empty response from Gemini API');
      throw new Error('Empty response from Gemini API');
    }

    // Parse the JSON response
    try {
      console.log('🔍 Attempting to extract JSON from response...');
      // Extract JSON from response (Gemini might include extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ No JSON found in Gemini response:', responseText);
        return { highlights: [], conceptsFound: [] };
      }

      console.log('📋 EXTRACTED JSON:');
      console.log('==================');
      console.log(jsonMatch[0]);
      console.log('==================');

      const analysisResult = JSON.parse(jsonMatch[0]);
      console.log('✅ Successfully parsed JSON response:', analysisResult);

      // Validate and sanitize response structure
      if (!analysisResult || typeof analysisResult !== 'object') {
        throw new Error('Invalid analysis result format');
      }

      // Ensure highlights is an array
      if (!Array.isArray(analysisResult.highlights)) {
        analysisResult.highlights = [];
      }

      // Ensure conceptsFound is an array
      if (!Array.isArray(analysisResult.conceptsFound)) {
        analysisResult.conceptsFound = [];
      }

      // Validate and clean highlights
      const originalHighlightsCount = analysisResult.highlights.length;
      analysisResult.highlights = analysisResult.highlights
        .filter(highlight =>
          highlight &&
          typeof highlight === 'object' &&
          typeof highlight.text === 'string' &&
          highlight.text.trim().length > 0 &&
          highlight.text.length <= 200 // Reasonable length limit
        )
        .slice(0, 20); // Limit to 20 highlights max

      // Clean concepts found
      const originalConceptsCount = analysisResult.conceptsFound.length;
      analysisResult.conceptsFound = analysisResult.conceptsFound
        .filter(concept => typeof concept === 'string' && concept.trim().length > 0)
        .slice(0, 10); // Limit concepts

      console.log('🧹 CLEANED AND VALIDATED RESULT:');
      console.log('=================================');
      console.log('📊 Processing summary:', {
        originalHighlights: originalHighlightsCount,
        filteredHighlights: analysisResult.highlights.length,
        originalConcepts: originalConceptsCount,
        filteredConcepts: analysisResult.conceptsFound.length
      });

      console.log('🎯 Final highlights:');
      analysisResult.highlights.forEach((highlight, index) => {
        console.log(`   ${index + 1}. "${highlight.text}"`);
        console.log(`      Concepts: [${highlight.concepts ? highlight.concepts.join(', ') : 'none'}]`);
        console.log(`      Relevance: ${highlight.relevance || 'not specified'}`);
        console.log(`      Explanation: ${highlight.explanation || 'none'}`);
      });

      console.log('📋 Final concepts found:', analysisResult.conceptsFound);
      console.log('=================================');

      return analysisResult;

    } catch (parseError) {
      console.error('❌ PARSE ERROR: Failed to parse Gemini response');
      console.error('❌ Raw response text:', responseText);
      console.error('❌ Parse error details:', parseError);
      console.error('❌ Error stack:', parseError.stack);
      throw new Error('Failed to parse AI response. The response format may be invalid.');
    }

  } catch (networkError) {
    console.error('❌ NETWORK ERROR during Gemini API call');
    console.error('❌ Error details:', networkError);
    console.error('❌ Error name:', networkError.name);
    console.error('❌ Error message:', networkError.message);
    console.error('❌ Error stack:', networkError.stack);

    if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Gemini API. Please check your internet connection.');
    }

    throw networkError;
  }
}

// Generate summary with Google Gemini AI
async function generateSummaryWithGemini(content, concepts, apiKey) {
  // Input validation
  if (!content || typeof content !== 'string') {
    throw new Error('Invalid content provided for summary');
  }

  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('Invalid API key provided');
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  // Limit content length for summary
  const maxContentLength = 6000;
  const truncatedContent = content.length > maxContentLength
    ? content.substring(0, maxContentLength) + '...'
    : content;

  // Create prompt based on whether concepts are provided
  let prompt;
  if (concepts && concepts.length > 0) {
    prompt = `
      Please provide a comprehensive summary of the following text with special focus on these concepts: ${concepts.join(', ')}.

      Instructions:
      1. Create a clear, well-structured summary (200-300 words)
      2. Pay special attention to content related to: ${concepts.join(', ')}
      3. Highlight key points, main ideas, and important details
      4. If the concepts appear in the text, explain their context and significance
      5. Use clear, engaging language that's easy to understand
      6. Structure the summary with clear paragraphs

      Text to summarize:
      ${truncatedContent}
    `;
  } else {
    prompt = `
      Please provide a comprehensive summary of the following text.

      Instructions:
      1. Create a clear, well-structured summary (200-300 words)
      2. Identify and highlight the main topics, key points, and important details
      3. Use clear, engaging language that's easy to understand
      4. Structure the summary with clear paragraphs
      5. Focus on the most important and relevant information

      Text to summarize:
      ${truncatedContent}
    `;
  }

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      topK: 1,
      topP: 1,
      maxOutputTokens: 1024,
    }
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);

      if (response.status === 400) {
        throw new Error('Invalid request to Gemini API. Please check your API key and try again.');
      } else if (response.status === 403) {
        throw new Error('API key access denied. Please verify your Gemini API key permissions.');
      } else if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status >= 500) {
        throw new Error('Gemini API server error. Please try again later.');
      } else {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();

    // Validate response structure
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      throw new Error('No summary generated from Gemini API');
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts)) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const summary = candidate.content.parts[0].text;

    if (!summary) {
      throw new Error('Empty summary from Gemini API');
    }

    return { summary: summary.trim() };

  } catch (networkError) {
    console.error('Network error during Gemini API call:', networkError);

    if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Gemini API. Please check your internet connection.');
    }

    throw networkError;
  }
}

// Validate Google Gemini API key
async function validateGeminiApiKey(apiKey, sendResponse) {
  try {
    // Validate API key format first
    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 20) {
      sendResponse({
        valid: false,
        error: 'Invalid API key format. Please check your Google Gemini API key.'
      });
      return;
    }

    // Try the correct Gemini API endpoint
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const testRequest = {
      contents: [{
        parts: [{
          text: "Test"
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 10
      }
    };

    console.log('Testing API key with URL:', testUrl.replace(apiKey, 'API_KEY_HIDDEN'));

    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });

    const responseText = await response.text();
    console.log('API validation response status:', response.status);

    if (response.ok) {
      sendResponse({ valid: true });
    } else {
      let errorMessage = `API validation failed (${response.status})`;

      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      } catch (parseError) {
        // Use default error message
      }

      if (response.status === 400) {
        errorMessage = 'Invalid API key or request format. Please verify your Google Gemini API key.';
      } else if (response.status === 403) {
        errorMessage = 'API key access denied. Please check your API key permissions and billing status.';
      } else if (response.status === 404) {
        errorMessage = 'API endpoint not found. Please verify your API key is for Google Gemini API.';
      } else if (response.status === 429) {
        errorMessage = 'API rate limit exceeded. Please wait and try again.';
      }

      sendResponse({
        valid: false,
        error: errorMessage
      });
    }

  } catch (error) {
    console.error('API key validation error:', error);
    sendResponse({
      valid: false,
      error: `Network error: ${error.message}. Please check your internet connection.`
    });
  }
}

// Get stored settings
function getStoredSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['aiConceptSettings'], (result) => {
      resolve(result.aiConceptSettings || {});
    });
  });
}

// Notify all tabs about settings changes
function notifyTabsSettingsChanged(settings) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'settingsChanged',
        settings: settings
      }).catch(() => {
        // Ignore errors for tabs that don't have content script
      });
    });
  });
}

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && 
      (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
    
    // Check if extension is enabled
    getStoredSettings().then(settings => {
      if (settings.enabled) {
        // Content script should already be injected via manifest
        // This is just for additional initialization if needed
        chrome.tabs.sendMessage(tabId, {
          action: 'initializeExtension',
          settings: settings
        }).catch(() => {
          // Ignore errors for tabs that don't support content scripts
        });
      }
    });
  }
});
