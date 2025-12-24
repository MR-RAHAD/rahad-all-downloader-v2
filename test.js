const fs = require("fs");
const { alldl } = require("./index.js");

const testLinks = [
  { name: "YouTube", url: "https://youtu.be/LmutL0qyN7U?si=IjbsFUdw5QFshtzY" },
  { name: "Pinterest", url: "https://pin.it/3jRjsAhi2" },
  { name: "TikTok", url: "https://vt.tiktok.com/ZSPXtXcfb/" },
  { name: "Facebook", url: "https://www.facebook.com/share/v/17gbKNtZgp/" },
  { name: "Instagram", url: "https://www.instagram.com/reel/DSbsFLOkvUR/" },
  { name: "Likee", url: "https://l.likee.video/v/gNvkdm" },
  { name: "Capcut", url: "https://www.capcut.com/tv2/ZSP4bTSPV/" },
  { name: "Threads", url: "https://www.threads.net/@imjeyyyps/post/DSaf4ioExBD" }
];

async function runTests() {
  console.log("🚀 Starting All-in-One Downloader Tests...\n");

  const allResults = [];

  for (const link of testLinks) {
    const status = {
      platform: link.name,
      inputUrl: link.url,
    };

    try {
      console.log(`🔍 Testing ${link.name}...`);

      const result = await alldl(link.url);

      console.log("✅ Success!");
      status.success = true;
      status.response = result;
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
      status.success = false;
      status.error = err.message;
    }

    allResults.push(status);
    console.log("----------------------------------------");
  }

  
  fs.writeFileSync("result.json", JSON.stringify(allResults, null, 2));
  console.log("💾 All test results saved to rs.json");
}

runTests();
