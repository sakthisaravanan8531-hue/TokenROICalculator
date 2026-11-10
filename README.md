# Token ROI Calculator

Compare model costs and estimate workload savings in the browser. The catalog uses the 10 November 2026 workbook snapshot. It contains all 622 master entries and one listing for each of the 55 additional IDs on the hosting sheet. Where a hosting-only ID has multiple complete rates, the displayed listing is the lowest for the workbook’s reference workload. The app also includes the eight alternate billing entries and all seven shortlists.

The ROI calculator uses entries with both input and output rates. It estimates base token charges before caching, batch discounts, and other fees. Verify rates with the provider before budgeting.

## Develop locally

Run `npm ci`, then `npm run dev`. Use `npm run build` to regenerate the static site in `docs/`.

## GitHub Pages

In the repository's **Settings → Pages**, select **Deploy from a branch**. Set the branch to **main** and the folder to **/docs**, then save. Commit the updated `docs/` files whenever you rebuild the site.
