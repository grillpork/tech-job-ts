const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBuKlIkdwb9M4QLptMIJw-Fj8Ll0Vc1VnM";
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
  method: "POST", headers: {"Content-Type": "application/json"},
  body: JSON.stringify({contents: [{parts: [{text: "Hello"}]}]})
}).then(r => r.json()).then(console.log).catch(console.error);
