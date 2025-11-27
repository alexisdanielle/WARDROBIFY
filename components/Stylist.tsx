import React, { useRef, useState } from 'react';
import { ClothingItem, Outfit, WeeklyPlan } from '../types';
import { generateOutfit, generateWeeklyPlan, generateOutfitFromImage } from '../services/geminiService';

interface StylistProps {
  wardrobe: ClothingItem[];
  weatherContext: string;
}

const Stylist: React.FC<StylistProps> = ({ wardrobe, weatherContext }) => {
  const [vibeInput, setVibeInput] = useState('');
  const [mode, setMode] = useState<'SINGLE' | 'WEEKLY' | 'INSPO'>('SINGLE');
  const [generatedOutfit, setGeneratedOutfit] = useState<Outfit | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUGGESTED_VIBES = ["Chill Coffee Run", "Dinner Date", "City Walk", "Sunday Brunch"];
  const SUGGESTED_WEEKS = ["Finals Mode", "Busy Week", "Vacation Mode"];

  const handleGenerate = async (preset?: string) => {
    const query = preset || vibeInput;
    if (!query) return;

    setIsLoading(true);
    
    // Use the real weather context passed from App
    const context = weatherContext || "Temperature is 20°C, clear skies.";

    if (mode === 'SINGLE') {
      const outfit = await generateOutfit(wardrobe, context, query);
      setGeneratedOutfit(outfit);
      setWeeklyPlan(null);
    } else {
      const plan = await generateWeeklyPlan(wardrobe, context, query);
      setWeeklyPlan(plan);
      setGeneratedOutfit(null);
    }
    setIsLoading(false);
  };

  const handleInspoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const outfit = await generateOutfitFromImage(wardrobe, base64String);
      setGeneratedOutfit(outfit);
      setWeeklyPlan(null);
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const renderOutfitVisual = (itemIds: string[], compact = false) => {
    // Find items in wardrobe
    const items = itemIds.map(id => wardrobe.find(w => w.id === id)).filter(Boolean) as ClothingItem[];
    
    // Sort roughly by head-to-toe for display: Top -> One-Piece -> Bottom -> Outerwear -> Shoes -> Accessory
    const categoryOrder = { 'Top': 1, 'One-Piece': 2, 'Outerwear': 3, 'Bottom': 4, 'Shoes': 5, 'Accessory': 6, 'Other': 7 };
    items.sort((a, b) => (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99));

    if (compact) {
        return (
            <div className="grid grid-cols-2 gap-1 bg-stone-100 p-2 rounded-xl">
                {items.slice(0, 4).map(item => (
                    <img key={item.id} src={item.imageUrl} className="w-full h-20 object-cover rounded-md" alt="" />
                ))}
            </div>
        )
    }

    return (
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-stone-100 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
            {/* Pinterest Masonry-ish layout */}
            {items.length === 0 ? (
                <div className="col-span-2 p-8 text-center text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                    No exact items found, but check the advice below!
                </div>
            ) : items.map((item, idx) => (
                <div key={item.id} className={`relative rounded-xl overflow-hidden ${idx === 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-square'}`}>
                    <img src={item.imageUrl} alt={item.category} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                        <span className="text-white text-xs font-bold">{item.category}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24 min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="p-6 pb-4 bg-white border-b border-stone-100 sticky top-0 z-10">
        <h2 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
          Your Stylist <span className="text-xl">✨</span>
        </h2>
        <div className="flex gap-4 mt-4 text-sm font-medium border-b border-stone-200 overflow-x-auto scrollbar-hide">
            <button 
                onClick={() => { setMode('SINGLE'); setGeneratedOutfit(null); setWeeklyPlan(null); }} 
                className={`pb-2 whitespace-nowrap transition-colors ${mode === 'SINGLE' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400'}`}
            >
                Daily Vibe
            </button>
            <button 
                onClick={() => { setMode('WEEKLY'); setGeneratedOutfit(null); setWeeklyPlan(null); }} 
                className={`pb-2 whitespace-nowrap transition-colors ${mode === 'WEEKLY' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400'}`}
            >
                Week Planner
            </button>
            <button 
                onClick={() => { setMode('INSPO'); setGeneratedOutfit(null); setWeeklyPlan(null); }} 
                className={`pb-2 whitespace-nowrap transition-colors ${mode === 'INSPO' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400'}`}
            >
                Match Inspo
            </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="p-4 space-y-4">
        {/* If no result yet, show input interface */}
        {!generatedOutfit && !weeklyPlan && !isLoading && (
            <div className="animate-fade-in-up">
                
                {mode === 'INSPO' ? (
                     <div 
                        className="text-center py-12 border-2 border-dashed border-stone-200 rounded-2xl bg-white hover:bg-stone-50 transition-colors cursor-pointer active:scale-95 transform duration-150" 
                        onClick={() => fileInputRef.current?.click()}
                     >
                        <div className="text-4xl mb-3">📌</div>
                        <h3 className="font-bold text-stone-800">Drop an Inspo Pic</h3>
                        <p className="text-xs text-stone-500 mt-2 px-8">Upload a photo (e.g. Hailey Bieber, Pinterest fit) or take a pic, and I'll find matches in your closet!</p>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleInspoUpload} />
                     </div>
                ) : (
                    <>
                        <div className="relative mb-6">
                            <input
                                type="text"
                                value={vibeInput}
                                onChange={(e) => setVibeInput(e.target.value)}
                                placeholder={mode === 'SINGLE' ? "What's the vibe today?" : "What's the week's theme?"}
                                className="w-full bg-white border border-stone-300 text-stone-800 rounded-2xl px-5 py-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 shadow-sm"
                            />
                            <button 
                                onClick={() => handleGenerate()}
                                disabled={!vibeInput}
                                className="absolute right-3 top-3 bg-stone-900 text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-50"
                            >
                                ➤
                            </button>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                                {mode === 'SINGLE' ? 'Popular Vibes' : 'Themes'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {(mode === 'SINGLE' ? SUGGESTED_VIBES : SUGGESTED_WEEKS).map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => { setVibeInput(suggestion); handleGenerate(suggestion); }}
                                        className="px-4 py-2 bg-white border border-stone-200 rounded-full text-xs font-medium text-stone-600 hover:bg-stone-50 hover:border-stone-400 transition-all"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                
                {wardrobe.length < 3 && (
                    <div className="mt-8 p-4 bg-rose-50 rounded-2xl text-rose-800 text-sm border border-rose-100">
                        ⚠️ You need at least a few items in your closet for me to style you properly!
                    </div>
                )}
            </div>
        )}

        {/* Loading State */}
        {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mb-4"></div>
                <p className="font-serif animate-pulse">{mode === 'INSPO' ? 'Analyzing photo & checking your closet...' : 'Styling you...'}</p>
            </div>
        )}

        {/* Single Outfit Result */}
        {generatedOutfit && !isLoading && (
            <div className="space-y-4 animate-fade-in-up">
                <div className="flex justify-between items-center">
                    <h3 className="font-serif font-bold text-xl text-stone-800">
                        {generatedOutfit.vibe}
                    </h3>
                    <button onClick={() => setGeneratedOutfit(null)} className="text-xs text-stone-400 underline">Reset</button>
                </div>
                
                {renderOutfitVisual(generatedOutfit.itemIds)}
                
                <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                    <p className="text-sm text-stone-600 italic">" {generatedOutfit.explanation} "</p>
                </div>
            </div>
        )}

        {/* Weekly Plan Result */}
        {weeklyPlan && !isLoading && (
            <div className="space-y-6 animate-fade-in-up">
                 <div className="flex justify-between items-center">
                    <h3 className="font-serif font-bold text-xl text-stone-800">
                        Weekly Plan
                    </h3>
                    <button onClick={() => setWeeklyPlan(null)} className="text-xs text-stone-400 underline">Reset</button>
                </div>

                <div className="flex flex-col gap-6">
                    {Object.entries(weeklyPlan).map(([day, outfit]: [string, Outfit]) => (
                         <div key={day} className="border-b border-stone-100 pb-6 last:border-0">
                            <div className="flex justify-between items-baseline mb-3">
                                <h4 className="text-lg font-bold text-stone-900">{day}</h4>
                                <span className="text-xs px-2 py-1 bg-rose-100 text-rose-600 rounded-md font-bold uppercase">{mode === 'WEEKLY' ? vibeInput.split(' ')[0] : 'Plan'}</span>
                            </div>
                            
                            {renderOutfitVisual(outfit.itemIds, true)}
                            <p className="mt-3 text-xs text-stone-500 leading-relaxed">{outfit.explanation}</p>
                         </div>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Stylist;
