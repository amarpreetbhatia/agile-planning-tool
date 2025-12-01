/**
 * Utility functions for parsing and validating external tool embed URLs
 */

export type EmbedType = 'miro' | 'figma' | 'google-docs' | 'google-sheets';

export interface ParsedEmbed {
  type: EmbedType;
  url: string;
  embedUrl: string;
  title: string;
  isValid: boolean;
  error?: string;
}

/**
 * Parse a Miro board URL and generate embed URL
 * Example: https://miro.com/app/board/uXjVKxxxxxx=/
 */
export function parseMiroUrl(url: string): ParsedEmbed {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a Miro URL
    if (!urlObj.hostname.includes('miro.com')) {
      return {
        type: 'miro',
        url,
        embedUrl: '',
        title: '',
        isValid: false,
        error: 'Invalid Miro URL. Must be from miro.com',
      };
    }

    // Extract board ID from path
    const boardIdMatch = url.match(/\/board\/([^\/\?]+)/);
    if (!boardIdMatch) {
      return {
        type: 'miro',
        url,
        embedUrl: '',
        title: '',
        isValid: false,
        error: 'Could not extract board ID from URL',
      };
    }

    const boardId = boardIdMatch[1];
    const embedUrl = `https://miro.com/app/live-embed/${boardId}/`;
    
    return {
      type: 'miro',
      url,
      embedUrl,
      title: 'Miro Board',
      isValid: true,
    };
  } catch (error) {
    return {
      type: 'miro',
      url,
      embedUrl: '',
      title: '',
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Parse a Figma file URL and generate embed URL
 * Example: https://www.figma.com/file/xxxxx/File-Name
 * Example: https://www.figma.com/design/xxxxx/File-Name
 */
export function parseFigmaUrl(url: string): ParsedEmbed {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a Figma URL
    if (!urlObj.hostname.includes('figma.com')) {
      return {
        type: 'figma',
        url,
        embedUrl: '',
        title: '',
        isValid: false,
        error: 'Invalid Figma URL. Must be from figma.com',
      };
    }

    // Extract file ID and name from path
    const fileMatch = url.match(/\/(file|design)\/([^\/]+)\/([^\/\?]+)/);
    if (!fileMatch) {
      return {
        type: 'figma',
        url,
        embedUrl: '',
        title: '',
        isValid: false,
        error: 'Could not extract file information from URL',
      };
    }

    const fileId = fileMatch[2];
    const fileName = decodeURIComponent(fileMatch[3].replace(/-/g, ' '));
    
    // Figma embed URL format
    const embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
    
    return {
      type: 'figma',
      url,
      embedUrl,
      title: fileName || 'Figma Design',
      isValid: true,
    };
  } catch (error) {
    return {
      type: 'figma',
      url,
      embedUrl: '',
      title: '',
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Parse a Google Docs URL and generate embed URL
 * Example: https://docs.google.com/document/d/xxxxx/edit
 */
export function parseGoogleDocsUrl(url: string): ParsedEmbed {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a Google Docs URL
    if (!urlObj.hostname.includes('docs.google.com')) {
      return {
        type: 'google-docs',
        url,
        embedUrl: '',
        title: '',
        isValid: false,
        error: 'Invalid Google Docs URL. Must be from docs.google.com',
      };
    }

    // Extract document ID from path
    const docIdMatch = url.match(/\/document\/d\/([^\/]+)/);
    if (!docIdMatch) {
      return {
        type: 'google-docs',
        url,
        embedUrl: '',
        title: '',
        isValid: false,
        error: 'Could not extract document ID from URL',
      };
    }

    const docId = docIdMatch[1];
    const embedUrl = `https://docs.google.com/document/d/${docId}/preview`;
    
    return {
      type: 'google-docs',
      url,
      embedUrl,
      title: 'Google Doc',
      isValid: true,
    };
  } catch (error) {
    return {
      type: 'google-docs',
      url,
      embedUrl: '',
      title: '',
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Parse a Google Sheets URL and generate embed URL
 * Example: https://docs.google.com/spreadsheets/d/xxxxx/edit
 */
export function parseGoogleSheetsUrl(url: string): ParsedEmbed {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a Google Sheets URL
    if (!urlObj.hostname.includes('docs.google.com')) {
      return {
        type: 'google-sheets',
        url,
        embedUrl: '',
        title: '',
        isValid: false,
        error: 'Invalid Google Sheets URL. Must be from docs.google.com',
      };
    }

    // Extract spreadsheet ID from path
    const sheetIdMatch = url.match(/\/spreadsheets\/d\/([^\/]+)/);
    if (!sheetIdMatch) {
      return {
        type: 'google-sheets',
        url,
        embedUrl: '',
        title: '',
        isValid: false,
        error: 'Could not extract spreadsheet ID from URL',
      };
    }

    const sheetId = sheetIdMatch[1];
    const embedUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/preview`;
    
    return {
      type: 'google-sheets',
      url,
      embedUrl,
      title: 'Google Sheet',
      isValid: true,
    };
  } catch (error) {
    return {
      type: 'google-sheets',
      url,
      embedUrl: '',
      title: '',
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Detect embed type from URL and parse accordingly
 */
export function parseEmbedUrl(url: string): ParsedEmbed {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes('miro.com')) {
      return parseMiroUrl(url);
    } else if (hostname.includes('figma.com')) {
      return parseFigmaUrl(url);
    } else if (hostname.includes('docs.google.com')) {
      // Determine if it's Docs or Sheets
      if (url.includes('/document/')) {
        return parseGoogleDocsUrl(url);
      } else if (url.includes('/spreadsheets/')) {
        return parseGoogleSheetsUrl(url);
      }
    }

    return {
      type: 'miro', // Default type
      url,
      embedUrl: '',
      title: '',
      isValid: false,
      error: 'Unsupported URL. Please use Miro, Figma, Google Docs, or Google Sheets URLs.',
    };
  } catch (error) {
    return {
      type: 'miro',
      url,
      embedUrl: '',
      title: '',
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Validate if a URL is supported for embedding
 */
export function isSupportedEmbedUrl(url: string): boolean {
  const parsed = parseEmbedUrl(url);
  return parsed.isValid;
}

/**
 * Get embed type from URL
 */
export function getEmbedType(url: string): EmbedType | null {
  const parsed = parseEmbedUrl(url);
  return parsed.isValid ? parsed.type : null;
}
