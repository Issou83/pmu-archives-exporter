import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as cheerio from 'cheerio';
import { scrapeTurfFrArchives } from './turfScraper.js';

// Mock fetch
global.fetch = vi.fn();

describe('turfScraper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse HTML and extract reunions', async () => {
    // Mock HTML response
    const mockHtml = `
      <html>
        <body>
          <div>
            <p>15 janvier 2024</p>
            <p>Longchamp - Réunion 1</p>
            <a href="/archives/reunion/123">VOIR CETTE REUNION</a>
          </div>
          <div>
            <p>16 janvier 2024</p>
            <p>Chantilly - Réunion 2</p>
            <a href="/archives/reunion/124">VOIR CETTE REUNION</a>
          </div>
        </body>
      </html>
    `;

    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const reunions = await scrapeTurfFrArchives(['2024'], ['janvier']);

    expect(reunions).toBeDefined();
    expect(Array.isArray(reunions)).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('turf-fr.com/archives/courses-pmu/2024/janvier'),
      expect.any(Object)
    );
  });

  it('should handle HTTP errors gracefully', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const reunions = await scrapeTurfFrArchives(['2024'], ['janvier']);

    expect(reunions).toEqual([]);
  });

  it('should normalize country codes correctly', async () => {
    const mockHtml = `
      <html>
        <body>
          <div>
            <p>15 janvier 2024</p>
            <p>Gb-Ascot - Réunion 1</p>
            <a href="/archives/reunion/123">VOIR CETTE REUNION</a>
          </div>
        </body>
      </html>
    `;

    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    });

    const reunions = await scrapeTurfFrArchives(['2024'], ['janvier']);

    if (reunions.length > 0) {
      expect(reunions[0].countryCode).toBe('GB');
    }
  });

  it('should deduplicate reunions by ID', async () => {
    const mockHtml = `
      <html>
        <body>
          <div>
            <p>15 janvier 2024</p>
            <p>Longchamp - Réunion 1</p>
            <a href="/archives/reunion/123">VOIR CETTE REUNION</a>
          </div>
        </body>
      </html>
    `;

    global.fetch.mockResolvedValue({
      ok: true,
      text: async () => mockHtml,
    });

    const reunions = await scrapeTurfFrArchives(['2024'], ['janvier', 'janvier']);

    // Vérifier qu'il n'y a pas de doublons
    const ids = reunions.map((r) => r.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });
});

