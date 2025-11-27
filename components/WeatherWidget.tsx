import React from 'react';
import { WeatherData } from '../types';

interface WeatherWidgetProps {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather, loading, error }) => {
  const getGreeting = (temp: number) => {
    if (temp < 10) return { text: "Brr, it's chilly! ❄️", advice: "Layer up with a cute coat and scarf." };
    if (temp < 20) return { text: "It's crisp outside! 🍂", advice: "A light jacket or sweater is perfect." };
    if (temp < 25) return { text: "Beautiful weather! ☀️", advice: "T-shirt and jeans weather!" };
    return { text: "It's getting hot! 🔥", advice: "Stay cool in a flowy dress or shorts." };
  };

  if (loading) return <div className="animate-pulse h-32 bg-pink-100 rounded-3xl mx-4 my-6"></div>;

  if (error || !weather) {
    return (
      <div className="bg-gradient-to-r from-pink-400 to-rose-400 rounded-3xl p-6 mx-4 my-6 text-white shadow-lg shadow-pink-200">
        <p className="font-bold text-lg">Hi gorgeous! 👋</p>
        <p className="opacity-90">Can't see the weather right now, but you look great anyway!</p>
      </div>
    );
  }

  const { text, advice } = getGreeting(weather.temperature);

  return (
    <div className="bg-gradient-to-br from-pink-400 via-rose-400 to-purple-400 rounded-3xl p-6 mx-4 my-6 text-white shadow-xl shadow-pink-200 transform transition-all hover:scale-[1.02]">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold mb-1">{Math.round(weather.temperature)}°C</h2>
          <p className="font-medium opacity-90 text-lg mb-4">{text}</p>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 inline-block">
             <p className="text-sm font-medium">💡 Hint: {advice}</p>
          </div>
        </div>
        <div className="text-5xl filter drop-shadow-md">
           {/* Simple mapping for weather codes */}
           {weather.weatherCode <= 3 ? (weather.isDay ? '☀️' : '🌙') : 
            weather.weatherCode <= 60 ? '☁️' : '🌧️'}
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
