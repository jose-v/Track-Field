import { supabase } from '../lib/supabase';
import { dateUtils } from '../utils/date';

// Interfaces for file processing
export interface WorkoutExtraction {
  name: string;
  type: string;
  date: string;
  duration: string;
  exercises: ExtractedExercise[];
  notes?: string;
  time?: string;
  location?: string;
}

export interface ExtractedExercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  rest?: number;
  distance?: number;
  notes?: string;
}

// OpenAI API configuration
// To use the OpenAI integration:
// 1. Create a .env file in the web/ directory
// 2. Add the line: VITE_OPENAI_API_KEY=your_actual_api_key_here
// 3. Restart your development server
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Main service for processing workout files
export const fileProcessingService = {
  /**
   * Extract text content from a file URL
   */
  async extractTextFromFile(fileUrl: string, fileType: string): Promise<string> {
    try {
      // For now, simulate text extraction with a mock response
      // In a real implementation, this would use document parsing libraries
      console.log(`Extracting text from ${fileUrl} of type ${fileType}`);
      
      // Ensure we're working with a public URL
      if (!fileUrl) {
        throw new Error('No file URL provided');
      }
      
      // Simulate different extraction based on file type
      let extractedText = '';
      
      if (fileType.includes('pdf') || fileUrl.includes('.pdf')) {
        extractedText = await this.mockPdfExtraction(fileUrl);
      } else if (fileType.includes('word') || fileUrl.includes('.doc')) {
        extractedText = await this.mockDocExtraction(fileUrl);
      } else {
        extractedText = await this.mockTextExtraction(fileUrl);
      }
      
      // Make sure we have some text to process
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Extracted text is empty');
      }
      
      return extractedText;
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw new Error('Failed to extract text from file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },
  
  /**
   * Process text content and extract workout information using OpenAI
   */
  async processWorkoutText(text: string): Promise<WorkoutExtraction> {
    try {
      console.log('Processing text with AI:', text.substring(0, 100) + '...');
      
      if (!OPENAI_API_KEY) {
        console.warn('OpenAI API key not found, falling back to mock processing');
        return await this.mockAiProcessing(text);
      }
      
      // Define the prompt for OpenAI
      const prompt = `
        Extract workout information from the following text. 
        Return a JSON object with the following structure:
        {
          "name": "Name of the workout",
          "type": "Strength, Running, Recovery, or Custom",
          "date": "YYYY-MM-DD format",
          "time": "Start time if available",
          "duration": "Duration in minutes or formatted time",
          "location": "Location if mentioned",
          "notes": "Any additional notes or instructions",
          "exercises": [
            {
              "name": "Name of exercise",
              "sets": number of sets (if applicable),
              "reps": number of reps per set (if applicable),
              "weight": weight in kg (if applicable),
              "distance": distance in meters (if applicable),
              "rest": rest time in seconds (if applicable),
              "notes": "Any notes specific to this exercise"
            }
          ]
        }
        
        Only include fields if they are mentioned in the text. Analyze the content to determine the workout type.
        Here is the text to analyze:
        
        ${text}
      `;
      
      try {
        // Call OpenAI API
        const response = await fetch(OPENAI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4', // Or gpt-3.5-turbo for a less expensive option
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that extracts structured workout information from text.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3, // Lower temperature for more consistent results
            max_tokens: 1000,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('OpenAI API error:', errorData);
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content;
        
        if (!aiResponse) {
          throw new Error('No response from OpenAI API');
        }
        
        // Extract the JSON object from the response
        // The AI might include explanatory text, so we need to extract just the JSON part
        let jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Could not extract JSON from OpenAI response');
        }
        
        const workoutData = JSON.parse(jsonMatch[0]);
        console.log('AI processed workout data:', workoutData);
        
        // Ensure the data has the expected structure
        return this.normalizeWorkoutData(workoutData);
      } catch (error) {
        console.error('Error with OpenAI API:', error);
        // Fall back to mock processing if OpenAI fails
        console.warn('Falling back to mock processing');
        return await this.mockAiProcessing(text);
      }
    } catch (error) {
      console.error('Error processing workout text:', error);
      throw new Error('Failed to process workout text: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  },
  
  /**
   * Normalize workout data to ensure it has the expected structure
   */
  normalizeWorkoutData(data: any): WorkoutExtraction {
    // Ensure all required fields exist
    const normalizedData: WorkoutExtraction = {
      name: data.name || 'Untitled Workout',
      type: data.type || 'Custom',
      date: data.date || dateUtils.localDateString(new Date()),
      duration: data.duration || '60 minutes',
      exercises: [],
      notes: data.notes,
      time: data.time,
      location: data.location
    };
    
    // Normalize exercises
    if (Array.isArray(data.exercises)) {
      normalizedData.exercises = data.exercises.map((exercise: any) => ({
        name: exercise.name || 'Unknown exercise',
        sets: exercise.sets ? Number(exercise.sets) : undefined,
        reps: exercise.reps ? Number(exercise.reps) : undefined,
        weight: exercise.weight ? Number(exercise.weight) : undefined,
        rest: exercise.rest ? Number(exercise.rest) : undefined,
        distance: exercise.distance ? Number(exercise.distance) : undefined,
        notes: exercise.notes
      }));
    }
    
    // If no exercises were provided, add a placeholder
    if (normalizedData.exercises.length === 0) {
      normalizedData.exercises.push({
        name: `${normalizedData.type} exercise`,
        sets: 3,
        reps: 10
      });
    }
    
    return normalizedData;
  },
  
  /**
   * Complete file processing pipeline
   */
  async processWorkoutFile(fileUrl: string, fileType: string, fileName: string): Promise<WorkoutExtraction> {
    try {
      console.log('Processing file:', { fileUrl, fileType, fileName });
      
      // 1. Extract text from file
      let extractedText;
      try {
        extractedText = await this.extractTextFromFile(fileUrl, fileType);
        console.log('Successfully extracted text from file');
      } catch (extractError) {
        console.error('Text extraction failed:', extractError);
        throw new Error('Failed to extract text from file: ' + 
          (extractError instanceof Error ? extractError.message : 'Unknown error'));
      }
      
      // 2. Process text to extract workout information
      try {
        const workoutData = await this.processWorkoutText(extractedText);
        console.log('Successfully processed workout data');
        
        // 3. Return structured workout data
        return workoutData;
      } catch (processError) {
        console.error('Workout text processing failed:', processError);
        throw new Error('Failed to process workout data: ' + 
          (processError instanceof Error ? processError.message : 'Unknown error'));
      }
    } catch (error) {
      console.error('Error in workflow processing pipeline:', error);
      throw error; // Rethrow the specific error with details
    }
  },
  
  // Mock implementations for development/demo purposes
  
  async mockPdfExtraction(fileUrl: string): Promise<string> {
    // Simulate PDF extraction delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return `Track Workout
Date: ${dateUtils.localDateString(new Date())}
Coach: John Smith

Warm-up: 10 minutes easy jog followed by dynamic stretching
Main Set:
- 4 x 400m at 80% effort with 2 min rest
- 8 x 200m at 90% effort with 90 sec rest
- 4 x 100m at 95% effort with 60 sec rest
Cool-down: 10 minutes easy jog
Total duration: 75 minutes
Location: Main Track`;
  },
  
  async mockDocExtraction(fileUrl: string): Promise<string> {
    // Simulate DOC extraction delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return `STRENGTH WORKOUT
DATE: ${dateUtils.localDateString(new Date())}
TIME: 4:00 PM
LOCATION: Weight Room

EXERCISES:
1. Squats: 4 sets of 8 reps at 70% 1RM, 2 min rest
2. Bench Press: 3 sets of 10 reps, 90 sec rest
3. Deadlifts: 3 sets of 6 reps, 3 min rest
4. Pull-ups: 3 sets to failure, 2 min rest
5. Core circuit: 3 rounds of:
   - Planks: 45 seconds
   - Russian twists: 20 reps
   - Mountain climbers: 30 seconds

Notes: Focus on proper form rather than weight. Increase weight only when form is perfect.`;
  },
  
  async mockTextExtraction(fileUrl: string): Promise<string> {
    // Simulate text extraction delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return `Recovery Day
Date: ${dateUtils.localDateString(new Date())}
Type: Recovery
Duration: 45 minutes

Exercises:
1. Foam rolling - 10 minutes
2. Static stretching - 15 minutes
3. Light yoga - 20 minutes

Notes: Keep intensity low. This is meant to be a recovery session.`;
  },
  
  async mockAiProcessing(text: string): Promise<WorkoutExtraction> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a workout extraction based on text content
    // In a real implementation, this would be parsed by an AI model
    const isStrength = text.toLowerCase().includes('strength') || 
                        text.toLowerCase().includes('weight') ||
                        text.toLowerCase().includes('squat');
                        
    const isRunning = text.toLowerCase().includes('track') || 
                       text.toLowerCase().includes('run') ||
                       text.toLowerCase().includes('jog');
    
    const isRecovery = text.toLowerCase().includes('recovery') || 
                        text.toLowerCase().includes('yoga') ||
                        text.toLowerCase().includes('stretch');
    
    const type = isStrength ? 'Strength' : 
                 isRunning ? 'Running' : 
                 isRecovery ? 'Recovery' : 'Custom';
    
    // Extract name from first line
    const firstLine = text.split('\n')[0].trim();
    const name = firstLine.length > 0 ? firstLine : `${type} Workout`;
    
    // Try to extract date
    const dateMatch = text.match(/date:?\s*([^\n]+)/i);
    const date = dateMatch ? dateMatch[1].trim() : dateUtils.localDateString(new Date());
    
    // Try to extract duration
    const durationMatch = text.match(/duration:?\s*([^\n]+)/i);
    const duration = durationMatch ? durationMatch[1].trim() : '60 minutes';
    
    // Try to extract location
    const locationMatch = text.match(/location:?\s*([^\n]+)/i);
    const location = locationMatch ? locationMatch[1].trim() : undefined;
    
    // Try to extract time
    const timeMatch = text.match(/time:?\s*([^\n]+)/i);
    const time = timeMatch ? timeMatch[1].trim() : undefined;
    
    // Extract notes - anything after "Notes:" or similar
    const notesMatch = text.match(/notes:?\s*([^\n]+(?:\n(?!.*:)[^\n]+)*)/i);
    const notes = notesMatch ? notesMatch[1].trim() : undefined;
    
    // Extract exercises - this is a simplified approach
    const exercises: ExtractedExercise[] = [];
    
    // Look for numbered lists or bullet points
    const exerciseRegex = /(?:^|\n)(?:\d+\.|\*)\s*([^\n]+)/g;
    let exerciseMatch;
    
    while ((exerciseMatch = exerciseRegex.exec(text)) !== null) {
      const exerciseText = exerciseMatch[1].trim();
      
      // Try to extract sets, reps, and other details
      const setsMatch = exerciseText.match(/(\d+)\s*(?:sets|set)/i);
      const repsMatch = exerciseText.match(/(\d+)\s*(?:reps|rep)/i);
      const weightMatch = exerciseText.match(/(\d+(?:\.\d+)?)\s*(?:kg|lb|pounds)/i);
      const restMatch = exerciseText.match(/(\d+)\s*(?:sec|min)(?:\s+rest)/i);
      const distanceMatch = exerciseText.match(/(\d+(?:\.\d+)?)\s*(?:m|km|miles)/i);
      
      // Extract the name (assume it's at the beginning before any numbers)
      const nameParts = exerciseText.split(/\d+\s*(?:sets|set|reps|rep)/i)[0].trim();
      
      exercises.push({
        name: nameParts || exerciseText,
        sets: setsMatch ? parseInt(setsMatch[1]) : undefined,
        reps: repsMatch ? parseInt(repsMatch[1]) : undefined,
        weight: weightMatch ? parseFloat(weightMatch[1]) : undefined,
        rest: restMatch ? parseInt(restMatch[1]) : undefined,
        distance: distanceMatch ? parseFloat(distanceMatch[1]) : undefined,
      });
    }
    
    // If no exercises were found, create a default one
    if (exercises.length === 0) {
      exercises.push({
        name: `${type} exercise`,
        sets: 3,
        reps: 10
      });
    }
    
    return {
      name,
      type,
      date,
      duration,
      exercises,
      notes,
      time,
      location
    };
  }
}; 