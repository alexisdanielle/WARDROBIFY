import React, { useState, useEffect } from 'react';
import WeatherWidget from './components/WeatherWidget';
import Navigation from './components/Navigation';
import Wardrobe from './components/Wardrobe';
import Stylist from './components/Stylist';
import Wishlist from './components/Wishlist';
import { AppView, ClothingItem, WishlistItem, ScheduleEvent, WeatherData } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Data State
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([
    { id: '1', title: 'Coffee Date', time: '10:00', icon: '☕️' },
    { id: '2', title: 'Work', time: '14:00', icon: '💻' }
  ]);

  // Modal State for Schedule
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', time: '', icon: '' });
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  // Weather State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setWeatherError("Geolocation not supported");
      setWeatherLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Using Open-Meteo
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          const data = await response.json();
          setWeather({
            temperature: data.current_weather.temperature,
            weatherCode: data.current_weather.weathercode,
            isDay: data.current_weather.is_day === 1
          });
        } catch (err) {
          setWeatherError("Could not fetch weather");
        } finally {
          setWeatherLoading(false);
        }
      },
      () => {
        setWeatherError("Location access denied");
        setWeatherLoading(false);
      }
    );
  }, []);

  const addWardrobeItem = (item: ClothingItem) => {
    setWardrobe(prev => [item, ...prev]);
  };

  const deleteWardrobeItem = (id: string) => {
    setWardrobe(prev => prev.filter(item => item.id !== id));
  };

  const addToWishlist = (item: WishlistItem) => {
    setWishlist(prev => [item, ...prev]);
  };

  const deleteWishlistItem = (id: string) => {
    setWishlist(prev => prev.filter(item => item.id !== id));
  };

  const handleAddEventClick = () => {
    // Default time to next hour
    const date = new Date();
    date.setHours(date.getHours() + 1);
    const timeString = date.toTimeString().slice(0, 5);
    
    setNewEvent({ title: '', time: timeString, icon: '📅' });
    setIsEventModalOpen(true);
  };

  const saveNewEvent = () => {
    if (!newEvent.title) return;
    setEvents(prev => [...prev, {
      id: Date.now().toString(),
      title: newEvent.title,
      time: newEvent.time, // Storing as 24h format HH:MM
      icon: newEvent.icon || '📅'
    }]);
    setIsEventModalOpen(false);
  };

  const confirmDeleteEvent = () => {
    if (eventToDelete) {
        setEvents(prev => prev.filter(e => e.id !== eventToDelete));
        setEventToDelete(null);
    }
  };

  const getWeatherContextString = () => {
    if (!weather) return "Temperature is 20°C, clear skies.";
    const conditions = weather.weatherCode <= 3 ? "Clear/Sunny" : weather.weatherCode <= 60 ? "Cloudy" : "Rainy/Cold";
    return `Current weather is ${weather.temperature}°C and ${conditions}.`;
  };

  // Helper to format time 14:00 -> 2:00 PM
  const formatTimeDisplay = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const m = minutes;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans selection:bg-rose-200">
      
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-2xl overflow-hidden relative border-x border-stone-100">
        
        {/* Header Content varies by view, but Dashboard needs Weather */}
        {currentView === AppView.DASHBOARD && (
          <div className="pb-24">
             <header className="p-6 pb-2">
              <h1 className="text-3xl font-serif font-bold text-stone-900">Hello Gorgeous! ✨</h1>
            </header>
            
            <WeatherWidget weather={weather} loading={weatherLoading} error={weatherError} />

            <div className="px-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif font-bold text-xl text-stone-800">Schedule</h3>
                <button onClick={handleAddEventClick} className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
                  + Add
                </button>
              </div>
              
              {/* Editable Events */}
              <div className="space-y-3">
                 {sortedEvents.length === 0 ? (
                   <p className="text-stone-400 text-sm italic text-center py-4">No plans yet. Chill day? ☁️</p>
                 ) : (
                   sortedEvents.map(event => (
                    <div key={event.id} className="group relative bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex gap-4 items-center transition-all hover:border-rose-200">
                        <div className="bg-stone-100 w-12 h-12 rounded-lg flex items-center justify-center text-xl shadow-inner">{event.icon}</div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-stone-900">{event.title}</p>
                          <p className="text-xs text-rose-500 font-medium bg-rose-50 inline-block px-2 py-0.5 rounded-md mt-1">
                            {formatTimeDisplay(event.time)}
                          </p>
                        </div>
                        <button 
                          onClick={() => setEventToDelete(event.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete event"
                        >
                          ✕
                        </button>
                    </div>
                   ))
                 )}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                 <button 
                  onClick={() => setCurrentView(AppView.STYLIST)}
                  className="bg-stone-900 text-white py-4 px-4 rounded-xl font-bold shadow-lg shadow-stone-200 active:scale-95 transition-transform text-left flex flex-col justify-between h-32 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform origin-bottom-left">✨</span>
                  <span className="text-sm">Style Me<br/><span className="text-stone-400 font-normal">Get Inspired</span></span>
                 </button>

                 <button 
                  onClick={() => setCurrentView(AppView.WARDROBE)}
                  className="bg-rose-100 text-rose-900 py-4 px-4 rounded-xl font-bold shadow-sm active:scale-95 transition-transform text-left flex flex-col justify-between h-32"
                >
                   <span className="text-2xl">👚</span>
                   <span className="text-sm">Manage<br/><span className="text-rose-700/60 font-normal">Closet</span></span>
                 </button>
              </div>
            </div>
          </div>
        )}

        {currentView === AppView.WARDROBE && (
          <Wardrobe items={wardrobe} addItem={addWardrobeItem} deleteItem={deleteWardrobeItem} />
        )}

        {currentView === AppView.STYLIST && (
          <Stylist wardrobe={wardrobe} weatherContext={getWeatherContextString()} />
        )}

        {currentView === AppView.WISHLIST && (
          <Wishlist 
            wishlist={wishlist} 
            addToWishlist={addToWishlist} 
            removeFromWishlist={deleteWishlistItem}
            wardrobe={wardrobe} 
          />
        )}

        {/* Modal for New Event */}
        {isEventModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-lg font-bold text-stone-800 mb-4">New Plan ✨</h3>
              <div className="space-y-3">
                <div>
                    <label className="text-[10px] uppercase font-bold text-stone-400 ml-1">Event Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dinner" 
                      className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-300"
                      value={newEvent.title}
                      onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                      autoFocus
                    />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-stone-400 ml-1">Time</label>
                      <input 
                        type="time" 
                        className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-300"
                        value={newEvent.time}
                        onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                      />
                  </div>
                  <div className="w-20">
                      <label className="text-[10px] uppercase font-bold text-stone-400 ml-1">Icon</label>
                      <input 
                        type="text" 
                        placeholder="📅" 
                        className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-300 text-center"
                        value={newEvent.icon}
                        onChange={e => setNewEvent({...newEvent, icon: e.target.value})}
                      />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setIsEventModalOpen(false)}
                  className="flex-1 py-3 text-stone-500 font-medium hover:bg-stone-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveNewEvent}
                  className="flex-1 py-3 bg-stone-900 text-white font-bold rounded-xl shadow-lg hover:bg-stone-800 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Deleting Event */}
        {eventToDelete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center">
                <p className="text-lg font-bold text-stone-800 mb-2">Delete Event?</p>
                <p className="text-sm text-stone-500 mb-6">Are you sure you want to remove this plan?</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setEventToDelete(null)}
                        className="flex-1 py-3 text-stone-500 font-medium hover:bg-stone-50 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDeleteEvent}
                        className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
          </div>
        )}

      </main>

      <Navigation currentView={currentView} setView={setCurrentView} />
    </div>
  );
};

export default App;