import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ---------------------------------------------------------------------------
// HiggsField wrapper — generates images and videos via Playwright automation
// ---------------------------------------------------------------------------

const PROFILE_DIR =
  "C:/Users/bryso/.claude/playwright-profiles/higgsfield";
const CHROME_PATH =
  "C:/Program Files/Google/Chrome/Application/chrome.exe";

interface HiggsFieldVideoOptions {
  prompt: string;
  model?: string; // default "Kling 3.0"
  duration?: string; // "5s" | "10s"
  aspectRatio?: string; // "16:9" | "9:16" | "1:1"
  resolution?: string; // "720p" | "1080p"
  startFrame?: string; // path to image
  outputDir?: string;
}

interface HiggsFieldImageOptions {
  prompt: string;
  model?: string; // default "seedream"
  aspectRatio?: string; // "1:1" | "16:9" etc
  resolution?: string; // "1K" | "2K" | "4K"
  outputDir?: string;
}

export interface HiggsFieldResult {
  success: boolean;
  filePath?: string;
  cdnUrl?: string;
  error?: string;
}

// Map friendly model names to URL slugs (images)
const IMAGE_MODEL_SLUGS: Record<string, string> = {
  seedream: "seedream",
  "soul 2.0": "soul_2",
  "soul cinema": "soul_cinema",
  "flux 2": "flux_2",
  "gpt image": "gpt_image",
  "nano banana": "nano_banana_2",
};

function buildPythonScript(actionCode: string): string {
  return `
import asyncio
import glob
import os
import time
from playwright.async_api import async_playwright

PROFILE_DIR = "${PROFILE_DIR.replace(/\\/g, "/")}"

chrome_paths = glob.glob("C:/Program Files/Google/Chrome/Application/chrome.exe") + \\
               glob.glob("C:/Program Files (x86)/Google/Chrome/Application/chrome.exe")
CHROME = chrome_paths[0] if chrome_paths else None

async def run():
    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            headless=False,
            executable_path=CHROME,
            viewport={"width": 1280, "height": 900},
            args=["--disable-blink-features=AutomationControlled"],
        )
        page = context.pages[0] if context.pages else await context.new_page()

${actionCode}

        await context.close()

asyncio.run(run())
`;
}

function runPython(script: string, timeoutMs: number): string {
  const tmpFile = path.join(os.tmpdir(), `hf_${Date.now()}.py`);
  fs.writeFileSync(tmpFile, script, "utf8");
  try {
    const output = execSync(`python "${tmpFile}"`, {
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
    });
    return output;
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      // ignore cleanup errors
    }
  }
}

function parseResult(output: string): HiggsFieldResult {
  if (output.includes("NOT_LOGGED_IN")) {
    return { success: false, error: "Not logged in to HiggsField. Run /higgsfield login first." };
  }

  // Check for image result
  const imgSaved = output.match(/IMAGE_SAVED:\s*(.+)/);
  const imgUrl = output.match(/IMAGE_URL:\s*(.+)/);
  if (imgSaved) {
    return {
      success: true,
      filePath: imgSaved[1].trim(),
      cdnUrl: imgUrl ? imgUrl[1].trim() : undefined,
    };
  }

  // Check for video result
  const vidSaved = output.match(/VIDEO_SAVED:\s*(.+)/);
  if (vidSaved) {
    return { success: true, filePath: vidSaved[1].trim() };
  }

  // Check for errors
  if (output.includes("ERROR")) {
    return { success: false, error: output.slice(0, 500) };
  }

  return { success: false, error: "Unknown result from HiggsField" };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateImage(
  options: HiggsFieldImageOptions,
): Promise<HiggsFieldResult> {
  const modelSlug =
    IMAGE_MODEL_SLUGS[options.model?.toLowerCase() ?? "seedream"] ?? "seedream";
  const outputDir = options.outputDir ?? os.tmpdir();

  const actionCode = `
        MODEL_SLUG = "${modelSlug}"
        PROMPT = """${options.prompt.replace(/"""/g, "\\\"\\\"\\\"").replace(/\\/g, "\\\\")}"""
        OUTPUT_DIR = """${outputDir.replace(/\\/g, "/")}"""
        ASPECT_RATIO = ${options.aspectRatio ? `"${options.aspectRatio}"` : "None"}
        RESOLUTION = ${options.resolution ? `"${options.resolution}"` : "None"}
        COUNT = 1

        await page.goto(f"https://higgsfield.ai/image/{MODEL_SLUG}", wait_until="domcontentloaded")
        await page.wait_for_timeout(5000)

        try:
            login_btn = page.locator("a:has-text('Login'), button:has-text('Login')")
            for i in range(await login_btn.count()):
                if await login_btn.nth(i).is_visible(timeout=2000):
                    print("NOT_LOGGED_IN: Run /higgsfield login first.")
                    return
        except Exception:
            pass

        if ASPECT_RATIO:
            try:
                ar_btn = page.locator("button:has-text(':')").first
                await ar_btn.click()
                await page.wait_for_timeout(1000)
                option = page.locator(f"[role='option']:has-text('{ASPECT_RATIO}'), button:has-text('{ASPECT_RATIO}')").first
                await option.click()
                await page.wait_for_timeout(500)
            except Exception as e:
                print(f"ASPECT_RATIO_WARN: {e}")

        if RESOLUTION:
            try:
                res_btn = page.locator("button:has-text('K')").first
                await res_btn.click()
                await page.wait_for_timeout(1000)
                option = page.locator(f"[role='option']:has-text('{RESOLUTION}'), button:has-text('{RESOLUTION}')").first
                await option.click()
                await page.wait_for_timeout(500)
            except Exception as e:
                print(f"RESOLUTION_WARN: {e}")

        prompt_input = page.locator("[contenteditable='true']").first
        await prompt_input.wait_for(state="visible", timeout=10000)
        await prompt_input.click()
        await prompt_input.fill("")
        await page.keyboard.type(PROMPT, delay=10)
        await page.wait_for_timeout(1000)

        gen_btn = page.locator("button:has-text('Generate')").first
        await gen_btn.wait_for(state="visible", timeout=5000)
        await gen_btn.click()
        print("Generation started...")

        await page.wait_for_timeout(5000)
        for attempt in range(24):
            await page.wait_for_timeout(5000)
            try:
                loading = page.locator("[class*='loading'], [class*='spinner'], [class*='progress']")
                if await loading.count() == 0 or not await loading.first.is_visible(timeout=1000):
                    images = page.locator("img[src*='cdn'], img[src*='storage'], img[src*='higgsfield']")
                    if await images.count() > 0:
                        print("Generation complete!")
                        break
            except Exception:
                pass
            if attempt % 4 == 0:
                print(f"  Waiting for generation... ({attempt * 5}s)")

        await page.wait_for_timeout(3000)

        try:
            result_images = page.locator("img[src*='cdn'], img[src*='storage'], img[src*='higgsfield']")
            if await result_images.count() > 0:
                img_src = await result_images.first.get_attribute("src")
                if img_src:
                    import urllib.request
                    timestamp = int(time.time())
                    filename = f"higgsfield_{timestamp}.png"
                    filepath = os.path.join(OUTPUT_DIR, filename)
                    urllib.request.urlretrieve(img_src, filepath)
                    print(f"IMAGE_SAVED: {filepath}")
                    print(f"IMAGE_URL: {img_src}")
                else:
                    print("IMAGE_ERROR: Could not get image URL")
            else:
                print("IMAGE_ERROR: No images found in results")
        except Exception as e:
            print(f"DOWNLOAD_ERROR: {e}")
  `;

  const script = buildPythonScript(actionCode);
  console.log("[higgsfield] Generating image...");

  try {
    const output = runPython(script, 300_000);
    return parseResult(output);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function generateVideo(
  options: HiggsFieldVideoOptions,
): Promise<HiggsFieldResult> {
  const modelName = options.model ?? "Kling 3.0";
  const outputDir = options.outputDir ?? os.tmpdir();

  const actionCode = `
        MODEL_NAME = "${modelName}"
        PROMPT = """${options.prompt.replace(/"""/g, "\\\"\\\"\\\"").replace(/\\/g, "\\\\")}"""
        OUTPUT_DIR = """${outputDir.replace(/\\/g, "/")}"""
        DURATION = ${options.duration ? `"${options.duration}"` : "None"}
        ASPECT_RATIO = ${options.aspectRatio ? `"${options.aspectRatio}"` : "None"}
        RESOLUTION = ${options.resolution ? `"${options.resolution}"` : "None"}
        START_FRAME = ${options.startFrame ? `"${options.startFrame.replace(/\\/g, "/")}"` : "None"}
        END_FRAME = None

        await page.goto("https://higgsfield.ai/create/video", wait_until="domcontentloaded")
        await page.wait_for_timeout(5000)

        try:
            login_btn = page.locator("a:has-text('Login'), button:has-text('Login')")
            for i in range(await login_btn.count()):
                if await login_btn.nth(i).is_visible(timeout=2000):
                    print("NOT_LOGGED_IN: Run /higgsfield login first.")
                    return
        except Exception:
            pass

        if START_FRAME:
            try:
                file_inputs = page.locator("input[type='file']")
                await file_inputs.nth(0).set_input_files(START_FRAME)
                await page.wait_for_timeout(2000)
            except Exception as e:
                print(f"START_FRAME_WARN: {e}")

        if MODEL_NAME != "Kling 3.0":
            try:
                change_btn = page.locator("button:has-text('Change')").first
                await change_btn.click()
                await page.wait_for_timeout(2000)
                for _ in range(5):
                    try:
                        await page.locator("button:has-text('>')").first.click(timeout=1000)
                        await page.wait_for_timeout(300)
                    except:
                        break
                model_tab = page.locator(f"button:has-text('{MODEL_NAME}')").first
                await model_tab.click()
                await page.wait_for_timeout(2000)
                card = await page.evaluate(\"\"\"() => {
                    const els = document.querySelectorAll('div, a, img');
                    const c = Array.from(els).find(el => {
                        const r = el.getBoundingClientRect();
                        return r.x > 350 && r.y > 150 && r.y < 600 && r.width > 100 && r.height > 100 && el.offsetParent !== null;
                    });
                    if (!c) return null;
                    const r = c.getBoundingClientRect();
                    return { x: r.x + r.width/2, y: r.y + r.height/2 };
                }\"\"\")
                if card:
                    await page.mouse.click(card['x'], card['y'])
                    await page.wait_for_timeout(2000)
                await page.keyboard.press("Escape")
                await page.wait_for_timeout(1000)
            except Exception as e:
                print(f"MODEL_SELECT_WARN: {e}")

        if DURATION:
            try:
                dur_btn = page.locator("button:has-text('s')").first
                await dur_btn.click()
                await page.wait_for_timeout(1000)
                option = page.locator(f"[role='option']:has-text('{DURATION}'), button:has-text('{DURATION}')").first
                await option.click()
                await page.wait_for_timeout(500)
            except Exception as e:
                print(f"DURATION_WARN: {e}")

        if ASPECT_RATIO:
            try:
                ar_btn = page.locator("button:has-text(':')").first
                await ar_btn.click()
                await page.wait_for_timeout(1000)
                option = page.locator(f"[role='option']:has-text('{ASPECT_RATIO}'), button:has-text('{ASPECT_RATIO}')").first
                await option.click()
                await page.wait_for_timeout(500)
            except Exception as e:
                print(f"ASPECT_RATIO_WARN: {e}")

        prompt_input = page.locator("[contenteditable='true']").first
        await prompt_input.wait_for(state="visible", timeout=10000)
        await prompt_input.click()
        await prompt_input.fill("")
        await page.keyboard.type(PROMPT, delay=10)
        await page.wait_for_timeout(1000)

        gen_btn = page.locator("button:has-text('Generate')").first
        await gen_btn.click()
        print("Video generation started...")

        for attempt in range(60):
            await page.wait_for_timeout(5000)
            try:
                video = page.locator("video, a[href*='download'], a[href*='.mp4']")
                if await video.count() > 0:
                    print("Video generation complete!")
                    break
            except Exception:
                pass
            if attempt % 6 == 0:
                print(f"  Waiting for video... ({attempt * 5}s)")

        await page.wait_for_timeout(3000)

        try:
            video_el = page.locator("video source, video[src]").first
            video_src = await video_el.get_attribute("src")
            if video_src:
                import urllib.request
                timestamp = int(time.time())
                filename = f"higgsfield_video_{timestamp}.mp4"
                filepath = os.path.join(OUTPUT_DIR, filename)
                urllib.request.urlretrieve(video_src, filepath)
                print(f"VIDEO_SAVED: {filepath}")
            else:
                print("VIDEO_ERROR: Could not get video URL")
        except Exception as e:
            print(f"VIDEO_DOWNLOAD_ERROR: {e}")
  `;

  const script = buildPythonScript(actionCode);
  console.log("[higgsfield] Generating video (this takes 1-3 minutes)...");

  try {
    const output = runPython(script, 600_000);
    return parseResult(output);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
