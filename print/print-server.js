// print-server.js
import express from "express";
import puppeteer from "puppeteer";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
app.use(bodyParser.json({ limit: "1mb" }));

app.post("/api/print-map", async (req, res) => {
  const { locations, title, description, styleKey } = req.body;

  // 1) Launch Puppeteer with no navigation timeouts
  const browser = await puppeteer.launch({
    // you can add '--no-sandbox' if your env requires it
    args: ["--disable-gpu"],
    defaultViewport: null,
    timeout: 0,            // disable launch timeout
  });
  const page = await browser.newPage();

  // 2) Set A3 @300dpi viewport
  await page.setViewport({
    width: 1920 * 2,          // 3840px layout width
    height: 1080 * 2,         // 2160px layout height
    deviceScaleFactor: 2,     // Effective 4K resolution (7680x4320 if needed)
  });
  

  // 3) Build editor URL with your query params
  const editorUrl = new URL("http://localhost:5173/");
  editorUrl.searchParams.set("style", styleKey);
  editorUrl.searchParams.set("title", title);
  editorUrl.searchParams.set("description", description);
  editorUrl.searchParams.set("locs", JSON.stringify(locations));

  // 4) Go there & wait for network idle
  await page.goto(editorUrl.href, { waitUntil: "networkidle2", timeout: 0 });

  // 5) Hide sidebar & expand map-frame (same as before)
  await page.evaluate(() => {
    const left = document.querySelector(".left-panel");
    if (left) left.style.display = "none";

    const right = document.querySelector(".right-panel");
    if (right) {
      right.style.width = "100vw";
      right.style.padding = "0";
    }

    const frame = document.querySelector(".map-frame");
    if (frame) {
      frame.style.width = "100vw";
      frame.style.height = "100vh";
      frame.style.padding = "0";
      frame.style.display = "flex";
      frame.style.justifyContent = "center";
      frame.style.alignItems = "center";
    }
  });

  // 6) Wait for Mapbox GL to finish rendering via waitForFunction
  //    This polls window.__MAP__.loaded() until true.
  await page.waitForFunction(
    `window.__MAP__ && window.__MAP__.loaded() === true`,
    {
      polling: "raf",    // check on every animation frame
      timeout: 60000,    // up to 60s
    }
  );

  // Optional: give one extra second for final paint
  await new Promise((r) => setTimeout(r, 1000));

  // 7) Screenshot the inner poster element
  const posterHandle = await page.$(".map-inner");
  const buffer = await posterHandle.screenshot({ type: "png" });
  

    const debugPath = `./debug-screenshot-${Date.now()}.png`;
    fs.writeFileSync(debugPath, buffer);
    console.log(`✅ Debug screenshot saved to ${debugPath}`);
  await browser.close();

  // 8) Return the PNG
  res.set("Content-Type", "image/png");
  res.send(buffer);
});

app.listen(4000, () => console.log("Print server running on http://localhost:4000"));