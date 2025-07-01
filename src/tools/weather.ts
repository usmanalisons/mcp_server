import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { WeatherArgsSchema, type WeatherArgs } from '../types/index.js';

export const weatherTool: Tool = {
  name: 'weather',
  description: 'Get weather information for a location',
  inputSchema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'Location to get weather for (city, country)',
      },
    },
    required: ['location'],
  },
};

export async function handleWeather(args: WeatherArgs): Promise<string> {
  try {
    // Mock weather data (in production, integrate with a real weather API)
    const mockWeatherData = {
      location: args.location,
      temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
      condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
    };

    return `Weather for ${mockWeatherData.location}:
Temperature: ${mockWeatherData.temperature}°C
Condition: ${mockWeatherData.condition}
Humidity: ${mockWeatherData.humidity}%
Wind Speed: ${mockWeatherData.windSpeed} km/h

Note: This is mock data. Integrate with a real weather API for production use.`;
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
  }
}