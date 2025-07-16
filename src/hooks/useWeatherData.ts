import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';

interface ForecastDay {
  date: string;
  dayName: string;
  high: number;
  low: number;
  condition: string;
  description: string;
  icon: string;
  rainProbability: number;
}

interface WeatherData {
  temp: string;
  condition: string;
  description: string;
}

interface UseWeatherDataResult {
  weather: WeatherData;
  forecast: ForecastDay[];
  hourlyForecast: any[];
  isLoading: boolean;
  hasError: boolean;
}

// OpenWeather API configuration
const OPENWEATHER_API_KEY = 'd52188171339c7c268d503e4e1122c12';
const OPENWEATHER_API_ONECALL = 'https://api.openweathermap.org/data/3.0/onecall';

// Cache for coordinates to avoid multiple geocoding requests
const cityCoordinatesCache: Record<string, {lat: number, lon: number}> = {};

export const useWeatherData = (
  city?: string,
  state?: string,
  initialWeather?: WeatherData
): UseWeatherDataResult => {
  const [weather, setWeather] = useState<WeatherData>(initialWeather || {
    temp: "71",
    condition: "Clouds",
    description: "scattered clouds"
  });
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const toast = useToast();

  // Helper function to get coordinates for a city
  const getCoordinates = async (city: string, state?: string) => {
    const locationKey = `${city},${state || ''}`;
    
    // Return cached coordinates if available
    if (cityCoordinatesCache[locationKey]) {
      return cityCoordinatesCache[locationKey];
    }
    
    // For Greensboro, North Carolina - hardcoded coordinates
    if (city.toLowerCase() === 'greensboro' && state?.toLowerCase() === 'north carolina') {
      const coords = { lat: 36.0726, lon: -79.7920 };
      cityCoordinatesCache[locationKey] = coords;
      return coords;
    }
    
    try {
      const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}${state ? `,${state}` : ''},us&limit=1&appid=${OPENWEATHER_API_KEY}`;
      const response = await fetch(geocodingUrl);
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error(`No coordinates found for ${city}, ${state || ''}`);
      }
      
      const coords = { lat: data[0].lat, lon: data[0].lon };
      cityCoordinatesCache[locationKey] = coords;
      return coords;
    } catch (error) {
      console.error('Error getting coordinates:', error);
      throw error;
    }
  };

  // Fetch weather data
  useEffect(() => {
    if (!city) return;
    
    const fetchWeatherData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        if (!OPENWEATHER_API_KEY) {
          console.warn('OpenWeather API key is missing. Weather data will not be fetched.');
          setHasError(true);
          return;
        }
        
        const { lat, lon } = await getCoordinates(city, state);
        const url = `${OPENWEATHER_API_ONECALL}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(`Invalid API key. Please check your One Call API 3.0 subscription.`);
          } else {
            throw new Error(`Weather API error: ${response.status}`);
          }
        }
        
        const data = await response.json();
        
        // Set current weather
        setWeather({
          temp: Math.round(data.current.temp).toString(),
          condition: data.current.weather[0].main,
          description: data.current.weather[0].description
        });
        
        // Process hourly forecast data (next 24 hours)
        if (data.hourly && data.hourly.length > 0) {
          const hourlyData = data.hourly.slice(0, 24).map((hour: any) => {
            const date = new Date(hour.dt * 1000);
            return {
              time: date.toISOString(),
              hour: date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
              temp: Math.round(hour.temp),
              condition: hour.weather[0].main,
              description: hour.weather[0].description,
              icon: hour.weather[0].icon,
              rainProbability: Math.round((hour.pop || 0) * 100)
            };
          });
          setHourlyForecast(hourlyData);
        }

        // Process forecast data (next 5 days)
        if (data.daily && data.daily.length > 0) {
          const forecastData = data.daily.slice(0, 5).map((day: any, index: number) => {
            const date = new Date(day.dt * 1000);
            return {
              date: date.toISOString().split('T')[0],
              dayName: index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
              high: Math.round(day.temp.max),
              low: Math.round(day.temp.min),
              condition: day.weather[0].main,
              description: day.weather[0].description,
              icon: day.weather[0].icon,
              rainProbability: Math.round((day.pop || 0) * 100)
            };
          });
          setForecast(forecastData);
        }
        
      } catch (error) {
        console.error('Error fetching weather:', error);
        setHasError(true);
        
        if (process.env.NODE_ENV === 'development') {
          toast({
            title: 'Weather data unavailable',
            description: error instanceof Error ? error.message : 'Unknown error',
            status: 'warning',
            duration: 5000,
            isClosable: true
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWeatherData();
  }, [city, state, toast]);

  return {
    weather,
    forecast,
    hourlyForecast,
    isLoading,
    hasError
  };
}; 