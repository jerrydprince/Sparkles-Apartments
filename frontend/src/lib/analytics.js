/**
 * Initializes Google Ads Global Site Tag (gtag.js)
 * @param {string} measurementId - The Google Tag ID (e.g., AW-XXXXXXX or G-XXXXXXX)
 */
export const initGoogleAds = (measurementId) => {
  if (!measurementId) {
    console.log("No Google Tag ID provided. Analytics tracking is disabled.");
    return;
  }

  // Prevent multiple injections
  if (document.getElementById('google-ads-script')) return;

  // Inject the script
  const script = document.createElement('script');
  script.id = 'google-ads-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId);

  console.log(`Google Ads tracking initialized with ID: ${measurementId}`);
};

/**
 * Fires a conversion event to Google Ads
 * @param {string} eventName - The name of the event (e.g., 'purchase')
 * @param {number} value - The total value of the conversion
 * @param {string} currency - The currency code (e.g., 'NGN')
 * @param {string} transactionId - A unique ID for the transaction to prevent duplicates
 */
export const trackConversion = (eventName, value, currency = 'NGN', transactionId = '') => {
  if (window.gtag) {
    window.gtag('event', eventName, {
      value: Number(value),
      currency: currency,
      transaction_id: transactionId
    });
    console.log(`[Analytics] Tracked ${eventName} event: ${value} ${currency}`);
  }
};
