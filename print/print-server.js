// print-server.js
import express from "express";
import puppeteer from "puppeteer";
import bodyParser from "body-parser";

const app = express();

const sizePresets = {
  A4: { width: 2480, height: 3508 },      // 210x297mm @300dpi
  Polaroid: { width: 2550, height: 3300 }, // 85x110mm @300dpi
  "Instax Mini": { width: 637, height: 1016 } // 54x86mm @300dpi
};

app.use(bodyParser.json({ limit: "1mb" }));

app.post("/api/print-map", async (req, res) => {
  const { locations, title, description, styleKey, camera, mapSize } = req.body;
  console.log(camera);
  // 1) Launch Puppeteer with no navigation timeouts
  const browser = await puppeteer.launch({
    // you can add '--no-sandbox' if your env requires it
    args: ["--disable-gpu"],
    defaultViewport: null,
    timeout: 0,
    devtools:true,
    headless: false,       // disable launch timeout
  });
  const page = await browser.newPage();

  const { width, height } = sizePresets[mapSize] || sizePresets.A4;

  await page.setViewport({
    width,
    height,
    deviceScaleFactor: 1, // Use 1:1 pixels since we're setting true dimensions
  });

  // 3) Build editor URL with your query params
  const editorUrl = new URL("http://localhost:5173/");
  editorUrl.searchParams.set("screenshot", "true");
  editorUrl.searchParams.set("style", styleKey);
  editorUrl.searchParams.set("title", title);
  editorUrl.searchParams.set("description", description);
  editorUrl.searchParams.set("locs", JSON.stringify(locations));

  if (camera) {
    editorUrl.searchParams.set("center", JSON.stringify(camera.center));
    editorUrl.searchParams.set("zoom", camera.zoom);
    editorUrl.searchParams.set("bearing", camera.bearing);
    editorUrl.searchParams.set("pitch", camera.pitch);
    editorUrl.searchParams.set("bounds", JSON.stringify(camera.bounds));
  }
  editorUrl.searchParams.set("size", mapSize);

  // once finalized, let's log the url
  console.log(editorUrl.href);
  
  // 4) Go there & wait for network idle
  await page.goto(editorUrl.href, { waitUntil: "networkidle2", timeout: 0 });

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
  
  // await browser.close();

  // 8) Return the PNG
  res.set("Content-Type", "image/png");
  res.send(buffer);
});

app.listen(4000, () => console.log("Print server running on http://localhost:4000"));