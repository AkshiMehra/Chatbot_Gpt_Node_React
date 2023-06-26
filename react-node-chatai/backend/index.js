// Import required dependencies
// Import the Configuration and OpenAIApi classes from the "openai" package
import { Configuration, OpenAIApi } from "openai";

// Import the express framework for creating the server
import express from "express";  

// Import the body-parser middleware for parsing request bodies
import bodyParser from "body-parser";  

// Import the cors middleware for enabling Cross-Origin Resource Sharing
import cors from "cors";  

// Create an instance of the Express app
const app = express();

// Set the port for the server
const port = 8000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Enable CORS
app.use(cors());

// Create a configuration object with API key and organization
const configuration = new Configuration({
  // Use the API key from environment variable
  apiKey: process.env.OPENAI_API_KEY,  

  // Use the organization from environment variable
  organization: process.env.organization,  
});

// Create an instance of OpenAIApi with the configuration
const openai = new OpenAIApi(configuration);

// Define a route for handling POST requests
app.post("/", async (request, response) => {
  const { chats } = request.body;
  
  // Call OpenAI's createChatCompletion method to generate a chat response
  const result = await openai.createChatCompletion({

    // Specify the GPT model to use for generating the chat response
    model: "gpt-3.5-turbo",  
    
    messages: [
      {
        role: "system",
        content: "Answer the below queries.",
      },
      ...chats,
    ],
  });

  // Send the chat response as JSON
  response.json({
    output: result.data.choices[0].message,
  });
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server Running`);
});
