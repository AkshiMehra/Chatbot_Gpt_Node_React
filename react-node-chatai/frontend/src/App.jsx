import React, { useState, useEffect } from 'react';

function App() {
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [utterance, setUtterance] = useState(null);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (utterance && !isPaused) {
      utterance.onend = () => {
        setIsTyping(false);
        if (utterance.role === 'ai') {
          return;
        }
        sendMessage(utterance.text);
      };
      speechSynthesis.speak(utterance);
    }
  }, [utterance, isPaused]);

  useEffect(() => {
    if (recognition) {
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');

        setMessage(transcript);
      };

      recognition.onend = () => {
        setIsTyping(false);
        if (message) {
          sendMessage(message); // Automatically submit the form after speaking
        }
      };
    }
  }, [recognition, message]);

  const startRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.lang = 'en-US';
    setRecognition(recognition);
    recognition.start();
  };

  const stopRecognition = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
  };

  const sendMessage = (message) => {
    let msgs = chats;
    if (!message) return;
    setIsTyping(true);
    msgs.push({ role: 'user', content: message });
    setChats(msgs);

    setMessage('');
    fetch('http://localhost:8000/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chats,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        msgs.push(data.output);
        setChats(msgs);

        const speechMessage = new SpeechSynthesisUtterance(data.output.content);
        speechMessage.role = 'ai';
        setUtterance(speechMessage);
        setIsTyping(true);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleSpeechRecognition = () => {
    if (recognition) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      if (utterance) {
        speechSynthesis.speak(utterance);
      }
    } else {
      setIsPaused(true);
      speechSynthesis.cancel();
    }
  };

  return (
    <main>
      <h1>ChaiBot-Gpt</h1>

      <section>
        {chats && chats.length ? (
          chats.map((chat, index) => (
            <p key={index} className={chat.role === 'user' ? 'user_msg' : ''}>
              <span>
                <b>{chat.role.toUpperCase()}</b>
              </span>
              <span>:</span>
              <span>{chat.content}</span>
            </p>
          ))
        ) : (
          <p>No messages</p>
        )}
      </section>

      <div className={isTyping ? '' : 'hide'}>
        <p>
          <i>{isTyping ? 'Typing...' : ''}</i>
        </p>
      </div>

      <form
        action=""
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(message);
        }}
      >
        <input
          type="text"
          name="message"
          value={message}
          placeholder="Speak or type a message here and hit Enter..."
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="button" onClick={handleSpeechRecognition}>
          {recognition ? 'Stop' : 'Speak'}
        </button>
      </form>

      <button id="btn" onClick={togglePause}>
        {isPaused ? 'Resume' : 'Pause'}
      </button>
    </main>
  );
}

export default App;
