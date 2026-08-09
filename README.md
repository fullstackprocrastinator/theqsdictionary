# The QS Dictionary

A static QS Collection reference site for quantity surveying, commercial, construction, contract, measurement and M&E terms.

## Structure

- `index.html` contains the page structure, navigation, dictionary UI and submission form.
- `styles.css` contains the responsive QS Collection visual system.
- `script.js` loads the dictionary data, powers search, filters, deep links and submissions.
- `terms.json` is the structured term database used by the site.
- `terms.html` is retained as the legacy source that was migrated into structured data.
- `tools/build-terms-data.cjs` rebuilds `terms.json` from the legacy card markup if needed.

## Local Preview

Serve the folder with any static web server, then open the local URL in a browser. The site fetches `terms.json`, so opening `index.html` directly from the file system may not load the dictionary data in every browser.
