

import { test, expect, BrowserContext, Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

test.describe('Comment Notifications E2E', () => {
  let contextA: BrowserContext;
  let contextB: BrowserContext;
  let pageA: Page;
  let pageB: Page;
  let testPostUrl: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(90000);
    // Launch two contexts for User A and User B
    contextA = await browser.newContext();
    contextB = await browser.newContext();

    pageA = await contextA.newPage();
    pageB = await contextB.newPage();

    // Log in User A (Arina)
    await pageA.goto('http://localhost:3000/login');
    await pageA.waitForLoadState('networkidle');
    await pageA.locator('input#email').fill(process.env.USER_A_EMAIL || 'fdnon@gmail.com');
    await pageA.locator('input#password').fill(process.env.USER_A_PASSWORD || 'aswer@A143');
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // Log in User B (Anjali)
    await pageB.goto('http://localhost:3000/login');
    await pageB.waitForLoadState('networkidle');
    await pageB.locator('input#email').fill(process.env.USER_B_EMAIL || 'anjalitask22@gmail.com');
    await pageB.locator('input#password').fill(process.env.USER_B_PASSWORD || '@Njali33');
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // Create a post as User A
    await pageA.goto('http://localhost:3000/dashboard');
    await pageA.click('text=Start a post');
    await pageA.fill('textarea[placeholder*="What do you want to talk about?"]', `Automated test post ${Date.now()}`);
    await pageA.click('button:has-text("Post")');

    // Get the post URL
    await pageA.waitForSelector('article');
    const postLink = await pageA.locator('article').first().locator('a.timestamp').getAttribute('href');
    testPostUrl = `http://localhost:3000${postLink}`;

    // User B goes to the post and creates a root comment
    await pageB.goto(testPostUrl);
    await pageB.fill('input[placeholder*="Add a comment..."]', 'Root comment by User B');
    await pageB.click('button:has-text("Comment")');
    await expect(pageB.locator('text=Root comment by User B')).toBeVisible();
  });

  test.afterAll(async () => {
    // Delete the test post as User A
    if (testPostUrl) {
      try {
        await pageA.goto(testPostUrl);
        await pageA.click('[aria-label="Post Options"]');
        await pageA.click('text=Delete post');
        await pageA.click('text=Confirm');
      } catch { /* ignore cleanup error */ }
    }

    await contextA?.close();
    await contextB?.close();
  });

  test('COMMENT LIKED 1: User A likes User B\'s comment', async () => {
    // User A navigates to post and likes User B's comment
    await pageA.goto(testPostUrl);
    const commentNode = pageA.locator('text=Root comment by User B').locator('..');
    await commentNode.locator('button:has-text("Like")').first().click();

    // Verify Notification on User B's end
    await pageB.goto('http://localhost:3000/notifications');
    const notification = pageB.locator('text=liked your comment');
    await expect(notification).toBeVisible();

    // Ensure red heart icon is visible
    await expect(notification.locator('.text-red-500')).toBeVisible(); // Assuming red heart has text-red-500
  });

  test('COMMENT LIKED 2: User A likes their own comment', async () => {
    // User A creates their own comment
    await pageA.goto(testPostUrl);
    await pageA.fill('input[placeholder*="Add a comment..."]', 'User A self comment');
    await pageA.click('button:has-text("Comment")');
    await expect(pageA.locator('text=User A self comment')).toBeVisible();

    // User A likes their own comment
    const selfCommentNode = pageA.locator('text=User A self comment').locator('..');
    await selfCommentNode.locator('button:has-text("Like")').first().click();

    // Verify no notification on User A's end
    await pageA.goto('http://localhost:3000/notifications');
    const selfNotif = pageA.locator('text=liked your comment');
    await expect(selfNotif).not.toBeVisible();
  });

  test('COMMENT LIKED 3 & 4: Unlike and re-like deduplication', async () => {
    // User A unlikes then relikes User B's comment
    await pageA.goto(testPostUrl);
    const commentNode = pageA.locator('text=Root comment by User B').locator('..');

    // Unlike
    await commentNode.locator('button:has-text("Unlike")').first().click();
    await pageA.waitForTimeout(1000);
    // Relike
    await commentNode.locator('button:has-text("Like")').first().click();

    // Verify Notification count is exactly 1 (deduplication)
    await pageB.goto('http://localhost:3000/notifications');
    const count = await pageB.locator('text=liked your comment').count();
    expect(count).toBe(1);
  });

  test('COMMENT LIKED 5: Scroll-to-comment functionality', async () => {
    await pageB.goto('http://localhost:3000/notifications');
    await pageB.click('text=liked your comment');

    // Should navigate to post and highlight comment
    await expect(pageB).toHaveURL(/.*commentId=.*/);

    // Wait for the comment to be highlighted
    const highlightedComment = pageB.locator('.bg-yellow-100'); // Assuming highlight class
    await expect(highlightedComment).toBeVisible();
  });

  test('COMMENT REPLIED 6: User A replies to User B\'s comment', async () => {
    await pageA.goto(testPostUrl);
    const commentNode = pageA.locator('text=Root comment by User B').locator('..');
    await commentNode.locator('button:has-text("Reply")').first().click();
    await commentNode.locator('input[placeholder*="Reply to"]').fill('Reply by User A');
    await commentNode.locator('button:has-text("Reply")').click();

    // Verify Notification on User B's end
    await pageB.goto('http://localhost:3000/notifications');
    const notification = pageB.locator('text=replied to your comment');
    await expect(notification).toBeVisible();
  });

  test('COMMENT REPLIED 9: Scroll-to-reply functionality', async () => {
    await pageB.goto('http://localhost:3000/notifications');
    await pageB.click('text=replied to your comment');

    // Should navigate to post and highlight reply
    await expect(pageB).toHaveURL(/.*replyId=.*/);

    const highlightedReply = pageB.locator('.bg-yellow-100'); // Assuming highlight class
    await expect(highlightedReply).toBeVisible();
  });

  test('EDGE CASE 10: Deleted comment before click', async () => {
    // User A replies, then deletes the reply
    await pageA.goto(testPostUrl);
    const commentNode = pageA.locator('text=Root comment by User B').locator('..');
    await commentNode.locator('button:has-text("Reply")').first().click();
    await commentNode.locator('input[placeholder*="Reply to"]').fill('Ephemeral Reply');
    await commentNode.locator('button:has-text("Reply")').click();

    // Wait for B to get notif
    await pageB.goto('http://localhost:3000/notifications');
    await expect(pageB.locator('text=Ephemeral Reply').first()).toBeVisible();

    // User A deletes the reply
    await pageA.goto(testPostUrl);
    const replyNode = pageA.locator('text=Ephemeral Reply').locator('..');
    await replyNode.locator('[aria-label="Delete comment"]').click();

    // User B clicks notif
    await pageB.goto('http://localhost:3000/notifications');
    await pageB.click('text=replied to your comment');

    // Should not crash, just loads post
    await expect(pageB).toHaveURL(/.*replyId=.*/);
    const highlightedReply = pageB.locator('.bg-yellow-100');
    await expect(highlightedReply).not.toBeVisible();
  });
});
