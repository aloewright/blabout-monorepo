# Gamma API Documentation for Agents

## Overview

This document provides comprehensive guidance for AI agents interfacing with the Gamma API through the MCP server. The API enables generation of rich content including presentations, documents, and social media posts using AI.

## Authentication

The API requires an X-API-KEY header for authentication. This is automatically handled by the MCP server using the `GAMMA_API_KEY` environment variable.

## Base URL

```
https://public-api.gamma.app/v0.2
```

## API Parameters

### Required Parameters

#### inputText
- **Description**: The primary content input for generation
- **Type**: String
- **Character Limit**: 1-750,000 characters
- **Notes**: 
  - Can be brief topic description or detailed structured content
  - Support card splits using `\n---\n` delimiter
  - Requires proper JSON escaping

**Examples**:
```json
// Simple input
{
  "inputText": "Ways to use AI for productivity"
}

// Structured input with card breaks
{
  "inputText": "# The Final Frontier: Deep Sea Exploration\n* Less than 20% of our oceans have been explored\n---\n# Technological Breakthroughs\n* Advanced submersibles capable of withstanding extreme pressure"
}
```

### Optional Parameters

#### textMode
- **Default**: "generate"
- **Options**:
  - `generate`: Rewrites and expands the input content
  - `condense`: Summarizes the input content
  - `preserve`: Retains exact input text with minimal structuring
- **Usage**: Choose based on whether you want to expand, summarize, or preserve the input content

#### format
- **Default**: "presentation"
- **Options**: 
  - `presentation`: Slideshow-style output
  - `document`: Document-style output
  - `social`: Social media optimized output

#### themeName
- **Default**: Workspace default theme
- **Description**: Determines visual styling including colors and fonts
- **Note**: Custom themes take precedence over standard themes with the same name

#### numCards
- **Default**: 10
- **Range**: 1-60
- **Note**: Only applies when cardSplit is "auto"

#### cardSplit
- **Default**: "auto"
- **Options**:
  - `auto`: Uses numCards to determine divisions
  - `inputTextBreaks`: Uses `\n---\n` delimiters in input text
- **Behavior Matrix**:
| Input Has Breaks | cardSplit | numCards | Result |
|-----------------|-----------|-----------|---------|
| No | auto | 9 | 9 cards |
| No | auto | blank | 10 cards |
| No | inputTextBreaks | 9 | 1 card |
| Yes (5 breaks) | auto | 9 | 9 cards |
| Yes (5 breaks) | inputTextBreaks | 9 | 6 cards |

#### additionalInstructions
- **Character Limit**: 1-500
- **Purpose**: Fine-tune output characteristics
- **Best Practice**: Avoid conflicts with other parameters

#### exportAs
- **Options**: 
  - `pdf`: Export as PDF
  - `pptx`: Export as PowerPoint
- **Note**: Download links are temporary

### Text Options

#### textOptions.amount
- **Default**: "medium"
- **Options**:
  - `brief`
  - `medium`
  - `detailed`
  - `extensive`
- **Applies to**: generate and condense modes only

#### textOptions.tone
- **Character Limit**: 1-500
- **Purpose**: Define content voice/mood
- **Example**: "professional, upbeat, inspiring"
- **Applies to**: generate mode only

#### textOptions.audience
- **Character Limit**: 1-500
- **Purpose**: Target specific reader groups
- **Example**: "outdoors enthusiasts, adventure seekers"
- **Applies to**: generate mode only

#### textOptions.language
- **Default**: "en"
- **Note**: Controls output language regardless of input language

### Image Options

#### imageOptions.source
- **Default**: "aiGenerated"
- **Options**:

| Source | Description |
|--------|-------------|
| aiGenerated | AI-generated images (supports model and style) |
| pictographic | Pictographic library images |
| unsplash | Unsplash stock photos |
| giphy | GIF animations |
| webAllImages | Web images (any license) |
| webFreeToUse | Web images (personal use) |
| webFreeToUseCommercially | Web images (commercial use) |
| placeholder | Image placeholders |
| noImages | No images |

#### imageOptions.model
- **Applies to**: aiGenerated source only
- **Note**: Auto-selected if not specified

#### imageOptions.style
- **Character Limit**: 1-500
- **Purpose**: Define visual style for AI-generated images
- **Example**: "minimal, black and white, line art"
- **Applies to**: aiGenerated source only

### Card Options

#### cardOptions.dimensions
Format-specific options:
- **Presentation**: 
  - `fluid` (default)
  - `16x9`
  - `4x3`
- **Document**:
  - `fluid` (default)
  - `pageless`
  - `letter`
  - `a4`
- **Social**:
  - `1x1`
  - `4x5` (default)
  - `9x16`

### Sharing Options

#### sharingOptions.workspaceAccess
- **Default**: Workspace settings
- **Options**:
  - `noAccess`
  - `view`
  - `comment`
  - `edit`
  - `fullAccess`

#### sharingOptions.externalAccess
- **Default**: Workspace settings
- **Options**:
  - `noAccess`
  - `view`
  - `comment`
  - `edit`

## Usage Through MCP

### Basic Example
```typescript
await mcp.invoke('gamma.generate', {
  inputText: "Ways to use AI for productivity",
  format: "presentation",
  numCards: 5
});
```

### Comprehensive Example
```typescript
await mcp.invoke('gamma.generate', {
  inputText: "Best hikes in the United States",
  textMode: "generate",
  format: "presentation",
  themeName: "Oasis",
  numCards: 10,
  cardSplit: "auto",
  additionalInstructions: "Make the titles catchy",
  exportAs: "pdf",
  textOptions: {
    amount: "detailed",
    tone: "professional, inspiring",
    audience: "outdoors enthusiasts, adventure seekers",
    language: "en"
  },
  imageOptions: {
    source: "aiGenerated",
    model: "imagen-4-pro",
    style: "photorealistic"
  },
  cardOptions: {
    dimensions: "fluid"
  },
  sharingOptions: {
    workspaceAccess: "view",
    externalAccess: "noAccess"
  }
});
```

## Best Practices

1. **Input Text Preparation**
   - Properly escape JSON strings
   - Use clear structure for better results
   - Include card breaks (`\n---\n`) when specific divisions are needed

2. **Image Generation**
   - Always specify style for consistent visuals
   - Use appropriate model for content type
   - Consider licensing requirements

3. **Content Generation**
   - Match textMode to input type
   - Ensure additionalInstructions don't conflict with other parameters
   - Consider audience and tone for targeted content

4. **Error Handling**
   - Handle temporary export URLs promptly
   - Verify parameter combinations are valid
   - Check character limits before submission

5. **Performance**
   - Use appropriate card counts for content volume
   - Consider format and dimensions for intended use
   - Balance detail level with generation time

## Common Use Cases

1. **Presentation Creation**
```typescript
await mcp.invoke('gamma.generate', {
  inputText: "Quarterly Business Review Q3 2025",
  format: "presentation",
  themeName: "Corporate",
  numCards: 15,
  textOptions: {
    amount: "detailed",
    tone: "professional"
  }
});
```

2. **Social Media Content**
```typescript
await mcp.invoke('gamma.generate', {
  inputText: "Tech Trends 2025",
  format: "social",
  cardOptions: {
    dimensions: "4x5"  // Instagram-optimized
  },
  imageOptions: {
    source: "aiGenerated",
    style: "modern, minimalist"
  }
});
```

3. **Document Generation**
```typescript
await mcp.invoke('gamma.generate', {
  inputText: "Complete Guide to Machine Learning",
  format: "document",
  textMode: "generate",
  exportAs: "pdf",
  textOptions: {
    amount: "extensive",
    audience: "technical professionals"
  }
});
```