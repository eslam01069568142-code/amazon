export function buildAmazonAffiliateUrl(originalUrl: string, trackingId: string): string {
  if (!trackingId || !originalUrl) {
    return originalUrl;
  }

  try {
    // 1. Check for short links. 
    // Short links already contain their affiliate tags inside the redirect target.
    // Appending ?tag= to them might break the link or be ignored by Amazon.
    const isShortLink = /(?:link\.amazon|amzn\.to|amzlinks\.in)/i.test(originalUrl);
    if (isShortLink) {
      return originalUrl;
    }

    // 2. Parse the long URL
    let fullUrl = originalUrl;
    if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
       fullUrl = 'https://' + originalUrl;
    }
    const urlObj = new URL(fullUrl);
    
    // 3. Ensure we are dealing with an Amazon domain
    if (!urlObj.hostname.toLowerCase().includes('amazon')) {
      return originalUrl;
    }

    // 4. Handle the 'tag' query parameter
    const currentTag = urlObj.searchParams.get('tag');
    if (currentTag) {
      if (currentTag !== trackingId) {
        // Policy Decision: We override any existing tag with the Admin's tracking ID.
        // Reason: The Admin owns the site and should receive the commission for all long-form URLs.
        urlObj.searchParams.set('tag', trackingId);
      }
    } else {
      urlObj.searchParams.set('tag', trackingId);
    }

    // Keep original query params, just return the updated URL string
    return urlObj.toString();
  } catch (error) {
    // Fallback: If URL parsing fails, return original to avoid breaking the link
    console.error('Failed to parse URL for affiliate injection', error);
    return originalUrl;
  }
}
