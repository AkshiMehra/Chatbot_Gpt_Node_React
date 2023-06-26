import React, { useState, useEffect } from 'react';

function App() {
  // State variables

  // Stores the user's input message
  const [message, setMessage] = useState('');  

  // Stores the chat history
  const [chats, setChats] = useState([]);  

  // Indicates if the AI is typing a response
  const [isTyping, setIsTyping] = useState(false);  

  // Indicates if the speech synthesis is paused
  const [isPaused, setIsPaused] = useState(false);  

  // Stores the speech synthesis utterance
  const [utterance, setUtterance] = useState(null);  

  // Stores the speech recognition instance
  const [recognition, setRecognition] = useState(null);  

  //...

  useEffect(() => {
    if (utterance && !isPaused) {
      // Execute this effect when `utterance` or `isPaused` changes

      // Callback function triggered when the speech synthesis utterance ends
      utterance.onend = () => {
        setIsTyping(false);  // Set `isTyping` to false
        if (utterance.role === 'ai') {
          return;  // If the role is 'ai', do not send the message
        }
        sendMessage(utterance.text);  // Send the user's message to the server
      };

      speechSynthesis.speak(utterance);  // Initiate speech synthesis
    }
  }, [utterance, isPaused]);

  useEffect(() => {
    if (recognition) {
      // Execute this effect when `recognition` changes

      // Callback function triggered when speech recognition produces a result
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');

        setMessage(transcript);  // Update the `message` state with the recognized transcript
      };

      // Callback function triggered when speech recognition ends
      recognition.onend = () => {
        setIsTyping(false);  // Set `isTyping` to false
        if (message) {
          // Automatically submit the form after speaking
          sendMessage(message);  
        }
      };
    }
  }, [recognition, message]);

  const startRecognition = () => {
    /*
      The startRecognition function is responsible for 
      initiating the speech recognition process.
    */
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    /*It checks if the SpeechRecognition API is supported by the 
    browser, using the window.SpeechRecognition object. 
    If not supported, it falls back to the webkitSpeechRecognition object (for compatibility with older versions of Chrome). */
    const recognition = new SpeechRecognition();
    
    
    /*It creates a new instance of the speech recognition 
    object using new SpeechRecognition(). */
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.lang = 'en-US';

    /*The properties interimResults, continuous, and lang are set to configure the speech recognition behavior. interimResults enables receiving intermediate results while the user is speaking, continuous allows continuous speech recognition, and lang sets the language to 'en-US'. */
    setRecognition(recognition);
    recognition.start();

    /*The new instance of recognition is stored in the recognition state using setRecognition().
Finally, the speech recognition is started by calling recognition.start(). */
  };

  
  const stopRecognition = () => {
    /*The stopRecognition function is responsible for stopping the speech recognition process. */
    if (recognition) {

      /*It checks if recognition exists (is not null).
        If recognition exists, it calls recognition.stop() to stop the speech recognition.
        It resets the recognition state to null using setRecognition(null) */
      recognition.stop();
      setRecognition(null);
    }
    
  };

  const sendMessage = (message) => {

    // Create a local copy of the `chats` state
    let msgs = chats;  

    // If no message is provided, return early
    if (!message) return;  

    // Set `isTyping` state to indicate that the AI is typing
    setIsTyping(true);  
  
    msgs.push({ role: 'user', content: message });  // Add the user message to `msgs`
    setChats(msgs);  // Update the `chats` state with the new message
  
    // Clear the `message` state for the input field
    setMessage('');  
  
    // Send a POST request to the chatbot API endpoint
    fetch('https://chatbot-gpt-node-react-fpdz.onrender.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },

      // Send the updated `chats` as the request body
      body: JSON.stringify({
        chats,  
      }),
    })
      .then((response) => response.json())  // Parse the response as JSON
      .then((data) => {
        // Add the AI response to `msgs`
        msgs.push(data.output);  

        // Update the `chats` state with the AI response
        setChats(msgs);  
  
        // Create a speech message for the AI response
        const speechMessage = new SpeechSynthesisUtterance(data.output.content);

        // Set the role of the speech message to 'ai'
        speechMessage.role = 'ai';  
        
        // Set the `utterance` state with the speech message
        setUtterance(speechMessage);  

        // Set `isTyping` state to indicate that the AI is typing
        setIsTyping(true);  
      })
      .catch((error) => {

        // Log any errors that occur during the request
        console.log(error);  
      });
  };
  

  const handleSpeechRecognition = () => {
    if (recognition) {
      // If recognition exists (speech recognition is already active),
      // stop the recognition by calling stopRecognition()
      stopRecognition();
    } else {
      // If recognition doesn't exist (speech recognition is not active),
      // start the recognition by calling startRecognition()
      startRecognition();
    }
  };
  
  const togglePause = () => {
    if (isPaused) {
      // If isPaused is true (speech synthesis is currently paused),
      // resume speech synthesis by setting isPaused to false and
      // speaking the current utterance if it exists
      setIsPaused(false);
      if (utterance) {
        speechSynthesis.speak(utterance);
      }
    } else {
      // If isPaused is false (speech synthesis is currently active),
      // pause speech synthesis by setting isPaused to true and
      // canceling the current speech synthesis
      setIsPaused(true);
      speechSynthesis.cancel();
    }
  };
  

  // Returning the template
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
