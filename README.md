# GST Invoice Generator

Static GitHub Pages deployment package for the GST invoice generator.

## Publish on GitHub Pages

1. Create or open the GitHub repository you want to use.
2. Upload these files to the repository root:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `.nojekyll`
3. In GitHub, open `Settings > Pages`.
4. Select `Deploy from a branch`, branch `main`, folder `/root`.
5. Save and wait for GitHub Pages to publish.

The app is fully static. Drafts, masters, settings, invoices, reports, and
backup data are stored in the user's browser local storage unless exported.

Includes Excel-inspired invoice templates based on the supplied Shalini Mittal
and S.Mittal & Co. `.xlsm` invoice samples.
