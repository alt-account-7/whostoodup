import { test, expect } from '@playwright/test';

test.describe('WhoStoodUp site', () => {
  test('homepage loads with Day N counter', async ({ page }) => {
    await page.goto('/');
    const dayN = page.locator('#day-n');
    await expect(dayN).toBeVisible();
    const text = await dayN.textContent();
    expect(parseInt(text, 10)).toBeGreaterThanOrEqual(1);
  });

  test('LIVE indicator is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.live-label')).toContainText('LIVE');
  });

  test('IdolCheck section heading is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.section-heading')).toContainText('IdolCheck');
  });

  test('entries table renders', async ({ page }) => {
    await page.goto('/');
    const table = page.locator('#entries-table');
    await expect(table).toBeVisible();
  });

  test('filter bar is present with all stance options', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.filter-btn[data-value="all"]').first()).toBeVisible();
    await expect(page.locator('.filter-btn[data-value="support"]').first()).toBeVisible();
    await expect(page.locator('.filter-btn[data-value="opposition"]').first()).toBeVisible();
    await expect(page.locator('.filter-btn[data-value="concern"]').first()).toBeVisible();
  });

  test('quote ticker shows a quote', async ({ page }) => {
    await page.goto('/');
    const quote = page.locator('#quote-body');
    await expect(quote).toBeVisible();
    const text = await quote.textContent();
    expect(text.length).toBeGreaterThan(5);
  });

  test('summary counts are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#support-count')).toBeVisible();
    await expect(page.locator('#opposition-count')).toBeVisible();
    await expect(page.locator('#total-count')).toBeVisible();
  });

  test('sort by date works', async ({ page }) => {
    await page.goto('/');
    // Click sort button and verify sort indicator changes
    await page.locator('.sort-btn[data-sort="timestamp"]').click();
    const indicator = page.locator('.sort-btn[data-sort="timestamp"] .sort-indicator');
    const text = await indicator.textContent();
    expect(['↑', '↓']).toContain(text.trim());
  });

  test('footer has contribute link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.site-footer')).toBeVisible();
    await expect(page.locator('.site-footer .btn-cta').first()).toBeVisible();
  });

  test('why page loads', async ({ page }) => {
    await page.goto('/why.html');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Why');
  });

  test('why page has back link to tracker', async ({ page }) => {
    await page.goto('/why.html');
    await expect(page.locator('a[href="index.html"]').first()).toBeVisible();
  });

  test('robots.txt is accessible', async ({ page }) => {
    const res = await page.goto('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('User-agent');
    expect(body).toContain('Allow');
    expect(body).toContain('Sitemap');
  });

  test('sitemap.xml is accessible and valid', async ({ page }) => {
    const res = await page.goto('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('<loc>');
    expect(body).toContain('index.html');
  });

  test('llms.txt is accessible', async ({ page }) => {
    const res = await page.goto('/llms.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('WhoStoodUp');
    expect(body).toContain('entries.json');
  });

  test('entries.json is accessible with correct schema', async ({ page }) => {
    const res = await page.goto('/entries.json');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.schema_version).toBe('1');
    expect(json.generated_at).toBeTruthy();
    expect(Array.isArray(json.entries)).toBe(true);
  });

  test('JSON-LD structured data is present in head', async ({ page }) => {
    await page.goto('/');
    const ldJson = await page.locator('script[type="application/ld+json"]').textContent();
    const parsed = JSON.parse(ldJson);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@graph']).toBeInstanceOf(Array);
  });

  test('filter by stance updates the table', async ({ page }) => {
    await page.goto('/');
    // Get initial row count
    const initialRows = await page.locator('#entries-tbody tr').count();
    // Click "SUPPORT" filter — row count should be ≤ initial
    await page.locator('.filter-btn[data-filter="stance"][data-value="support"]').click();
    const filteredRows = await page.locator('#entries-tbody tr').count();
    expect(filteredRows).toBeLessThanOrEqual(initialRows);
    // All visible rows should have stance-support class (if any)
    const nonSupport = await page.locator('#entries-tbody tr:not(.stance-support)').count();
    expect(nonSupport).toBe(0);
  });

  test.describe('prefers-reduced-motion', () => {
    test('ticker animation is disabled', async ({ browser }) => {
      const context = await browser.newContext({
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto('/');
      const ticker = page.locator('.ticker-inner');
      const animDuration = await ticker.evaluate(el =>
        window.getComputedStyle(el).animationDuration
      );
      // 1ms means effectively disabled (per our CSS media query override)
      expect(['0s', '1ms', '0.001s']).toContain(animDuration);
      await context.close();
    });
  });

  test('pause on hover stops ticker', async ({ page }) => {
    await page.goto('/');
    const ticker = page.locator('.ticker-inner');
    await page.locator('.ticker-strip').hover();
    const playState = await ticker.evaluate(el =>
      window.getComputedStyle(el).animationPlayState
    );
    expect(playState).toBe('paused');
  });
});
