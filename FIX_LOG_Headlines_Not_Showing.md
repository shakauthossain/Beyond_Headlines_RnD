# Issue Diagnosis & Fixes — Scraped Headlines Not Showing in Clusters

## 🐛 Root Cause Analysis

The system was successfully scraping headlines from news sources (6 headlines were fetched), but they were NOT being returned in cluster searches. Investigation revealed **three interconnected bugs**:

---

## Bug #1: Missing "Search" Category Selectors ❌ → ✅

**Problem:** 
- When user searches for "Strait of Hormuz", the scraper looks for `SelectorConfig` entries with `category='Search'`
- These configs define CSS selectors for each news source's search results page
- **The Search category selectors were never seeded into the database**
- Result: Scraper would find 0 matching elements and return empty results

**Fix Applied:**
1. **Added to `beyond-headlines-scraper/src/seed_selectors.ts`:**
   - Search category selectors for all 6 news sources (PROTHOM_ALO, DAILY_STAR, BDNEWS24, DHAKA_TRIBUNE, JUGANTOR, ITTEFAQ)
   - Added category-specific selectors (politics, business, finance, sports, technology, international)
   - Proper `{query}` placeholder in URLs for targeted search

2. **Updated `beyond-headlines-api/prisma/seed.ts`:**
   - Replaced hardcoded selector configs with comprehensive list
   - All categories now have proper selectors for each source
   - Selectors tested against actual website HTML structure

**Files Modified:**
- `/beyond-headlines-scraper/src/seed_selectors.ts` (reference file, not directly used)
- `/beyond-headlines-api/prisma/seed.ts` (primary seed file)

---

## Bug #2: Wrong Discovery Workflow — Broad Crawl Instead of Targeted Search ❌ → ✅

**Problem:**
- User searches for "Strait of Hormuz" (should trigger targeted search)
- Intent classification correctly identifies category as 'international'
- **BUT** discovery worker was triggering a generic 'General' category scrape instead
- This meant the scraper was crawling generic homepages, not searching for "Strait of Hormuz"

**Fix Applied:**
- Updated `beyond-headlines-api/src/workers/discovery.worker.ts`:
  ```typescript
  // BEFORE (wrong):
  const scrapeJob = await triggerScrapeJob(undefined, 'General');
  
  // AFTER (correct):
  const scrapeJob = await triggerScrapeJob(query, category);
  ```
- Now passes the actual search query and category to the scraper
- Triggers targeted search URLs instead of homepage crawls

**Files Modified:**
- `/beyond-headlines-api/src/workers/discovery.worker.ts`

---

## Bug #3: Poor Scraper Diagnostics ❌ → ✅

**Problem:**
- When selectors matched 0 elements, there was no logging to explain why
- Hard to debug when headlines exist on the page but scraper returns nothing

**Fix Applied:**
- Added detailed logging to `beyond-headlines-scraper/src/index.ts`:
  1. **Show selector match count:**
     ```
     [Scraper v6] PROTHOM_ALO selector matched 25 elements from: .md-story-title, h3 a, ...
     ```
  2. **Explain why headlines are filtered:**
     ```
     [Scraper v6] PROTHOM_ALO: Skipped short headline "..." (length: 8)
     ```
  3. Makes it much easier to identify selector issues

**Files Modified:**
- `/beyond-headlines-scraper/src/index.ts`

---

## ✅ What's Fixed Now

| Issue | Before | After |
|---|---|---|
| **Search selectors** | Missing from DB | ✅ All 6 sources seeded |
| **Discovery flow** | Generic crawl | ✅ Targeted search with query |
| **Scraper logs** | Vague "0 results" | ✅ Detailed selector matching info |
| **Category matching** | 'General' forced | ✅ Uses detected category |

---

## 🚀 How to Apply These Fixes

### Option 1: Rebuild Docker Images (Recommended)
```bash
cd /home/shakaut/Desktop/Beyond_Headlines

# Rebuild with fresh database
docker compose down -v
docker compose up --build

# This will:
# 1. Rebuild all images
# 2. Drop old database
# 3. Run migrations
# 4. Seed new SelectorConfigs
```

### Option 2: Manual Database Reset (if containers still running)
```bash
# Inside the running API container or any container with Prisma
npx prisma db push
npx prisma db seed

# This updates selectors without rebuilding
```

### Option 3: Just Reseed Selectors (if DB connection is healthy)
```bash
# Run the seed script directly
cd beyond-headlines-api
ts-node prisma/seed.ts
```

---

## 📋 Testing After Fix

1. **Search for "Strait of Hormuz":**
   - POST `/intelligence/scan` with `{ "query": "Strait of Hormuz" }`
   - Should return jobId

2. **Check discovery status:**
   - GET `/intelligence/status/{jobId}`
   - Wait for status to become 'SCRAPING_DONE'

3. **Fetch clusters:**
   - GET `/api/v1/clusters?emerging=false`
   - Should show multiple clusters with headlines

4. **Expect to see:**
   - Headlines from Daily Star, Prothom Alo, Dhaka Tribune, etc.
   - Proper full-text search matching
   - Clusters grouped by topic (e.g., "Hormuz Strait Naval Tension", "Global Oil Supply Concerns", etc.)

---

## 🔍 Key Learnings

1. **Composite Keys Matter**: SelectorConfig uses `(sourceName, category)` as unique constraint
2. **Workflow Context**: Discovery worker must pass query + category through the entire scraping pipeline
3. **Logging is Critical**: Detailed logs make debugging much faster

---

## 📚 Files Changed Summary

| File | Change | Impact |
|---|---|---|
| `discovery.worker.ts` | Pass query to scraper | Ensures targeted searches |
| `seed.ts` | Add all selector configs | DB has proper scrapers for all categories |
| `scraper/index.ts` | Add diagnostic logs | Better visibility into what's scraped |

---

## ⚠️ If Issues Persist

1. **Check if selectors are in DB:**
   ```sql
   SELECT sourceName, category, selector FROM SelectorConfig 
   WHERE category='Search' LIMIT 5;
   ```
   Should show 6 rows (one per source)

2. **Check if headlines are actually saved:**
   ```sql
   SELECT COUNT(*), category FROM ScrapedHeadline 
   GROUP BY category ORDER BY COUNT(*) DESC;
   ```

3. **Check scraper logs for selector match issues:**
   ```
   docker logs bh_worker_scrape | grep "selector matched"
   ```

4. **Validate CSS selectors live:**
   - Open news site in browser
   - Right-click on a headline
   - Inspect element → Find CSS selector in DevTools
   - Compare with config in database

---

**Status**: All fixes applied. Ready to rebuild and test.
