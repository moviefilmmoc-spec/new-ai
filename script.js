let transcript = '';
let recognition;
let isListening = false; // flag to control mic state

// 🎤 Start listening
function startListening() {
  transcript = '';
  document.getElementById('transcript').innerText = '🎤 Listening...';

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition not supported in this browser.");
    return;
  }

  if (recognition) {
    recognition.stop();
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isListening = true;
    console.log("Mic is now active and listening.");
    document.getElementById('transcript').innerText = '🎤 Mic is active and listening...';
  };

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        transcript += event.results[i][0].transcript + ' ';
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    document.getElementById('transcript').innerText = transcript + interim;
  };

  recognition.onerror = (event) => {
    console.error('Recognition error:', event.error);
    isListening = false;
    document.getElementById('transcript').innerText = '❌ Mic error: ' + event.error;
    if (event.error === 'not-allowed') {
        alert("Microphone access was denied. Please allow microphone permissions in your browser settings to use this feature.");
    }
  };

  recognition.onend = () => {
    console.log("Recognition service ended.");
    if (isListening) {
      recognition.start(); // 🔄 Restart automatically
    } else {
      document.getElementById('transcript').innerText += '\n🛑 Mic stopped.';
    }
  };

  isListening = true;
  recognition.start();
}

// 🛑 Stop listening
function stopListening() {
  if (recognition) {
    isListening = false;
    recognition.stop();
  }
}

// 🤖 This is the updated sendToAI function
async function sendToAI() {
  if (!transcript.trim()) {
    alert('Transcript is empty. Try listening again.');
    return;
  }

  const prompt = `Give a short, human-like answer (10-16 lines max) to this interview question. 
  If asked for a coding question, give a code with proper comments and time complexity:\n"${transcript.trim()}"`;

  document.getElementById('response').innerText = '⏳ Thinking...';

  // ⚠️ Important: Replace with your actual Gemini API key from Google AI Studio.
  const apiKey = "AIzaSyBCwd7YfuucLqnp08Q_zQuPaux_LHAHdcE"; // <-- Replace this with your new, valid key

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey // 🔑 This is the key change from the curl command
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (answer) {
        document.getElementById('response').innerText = '✅ ' + answer;
      } else {
        document.getElementById('response').innerText = '❌ No answer received.';
        console.error('Gemini API response data:', data);
      }
    } else {
      const errorData = await response.json();
      document.getElementById('response').innerText = '❌ API Error: ' + response.status;
      console.error('API Error details:', errorData);
    }
  } catch (err) {
    console.error('Network or CORS error:', err);
    document.getElementById('response').innerText = '❌ Error fetching AI response. Check your browser console for details.';
  }
}