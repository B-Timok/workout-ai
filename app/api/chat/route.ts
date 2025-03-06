import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// Initialize the OpenAI client with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the POST handler for the chat API endpoint
export async function POST(req: Request) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Parse the JSON body from the request
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body));
    
    const { message } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      console.error('Invalid message format:', message);
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Convert the single message string into the expected messages array format
    const messages: { role: 'user'; content: string }[] = [{ role: 'user', content: message }];

    // Call the OpenAI API to generate a chat completion
    console.log('Calling OpenAI API with messages:', JSON.stringify(messages));
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // You can use 'gpt-4' for more advanced capabilities
      messages: messages,
      temperature: 0.7, // Controls randomness (0-1)
      max_tokens: 1000, // Limits the response length
    });

    console.log('OpenAI API response:', JSON.stringify(response.choices[0].message));

    // Return the AI's response
    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    // Log detailed error information
    console.error('Error in chat API:', error);
    
    let errorMessage = 'Failed to generate AI response';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific OpenAI error types
      if (errorMessage.includes('API key')) {
        errorMessage = 'Invalid or missing API key';
        statusCode = 401;
      } else if (errorMessage.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
        statusCode = 429;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
