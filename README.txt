STAR ARTIST FOUNDING BETA — FIXED SELF-CONTAINED BUILD

The main index.html is now self-contained:
- all landing-page CSS is embedded directly in index.html
- official Star Artist wordmark and star PNGs are embedded directly in index.html
- landing-page JavaScript is embedded directly in index.html

This avoids the resource-loading problem seen when previewing only index.html in an isolated preview pane.

For GitHub Pages, upload the contents of this folder to the repository root. Keep CNAME at the root.
The additional styles.css and assets/ files remain for the Privacy / Terms / Contact pages and as source files, but the landing page no longer depends on them for its styling or branding imagery.
