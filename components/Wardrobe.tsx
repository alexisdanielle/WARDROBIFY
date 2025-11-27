import React, { useRef, useState } from 'react';
import { ClothingItem, ClothingCategory } from '../types';
import { analyzeClothingItem } from '../services/geminiService';

interface WardrobeProps {
  items: ClothingItem[];
  addItem: (item: ClothingItem) => void;
  deleteItem: (id: string) => void;
}

const CATEGORIES: ClothingCategory[] = ['Top', 'Bottom', 'One-Piece', 'Outerwear', 'Shoes', 'Accessory'];

const Wardrobe: React.FC<WardrobeProps> = ({ items, addItem, deleteItem }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ClothingCategory | 'All'>('All');
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      try {
        const metadata = await analyzeClothingItem(base64String);
        const newItem: ClothingItem = {
          id: Date.now().toString(),
          imageUrl: base64String,
          category: metadata.category as ClothingCategory || "Other",
          color: metadata.color || "Unknown",
          season: metadata.season || "All",
          description: metadata.description || "Added from closet"
        };
        addItem(newItem);
      } catch (e) {
        alert("Oops! Couldn't scan that item.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const confirmDelete = () => {
      if (itemToDelete) {
          deleteItem(itemToDelete);
          setItemToDelete(null);
      }
  };

  // Get unique colors for filter
  const colors: string[] = (Array.from(new Set(items.map(i => i.color.split(' ')[0]))) as string[]).slice(0, 8);

  const filteredItems = items.filter(item => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchColor = !activeColor || item.color.toLowerCase().includes(activeColor.toLowerCase());
    return matchCat && matchColor;
  });

  return (
    <div className="pb-24 min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 bg-stone-50/95 backdrop-blur z-20 px-4 py-4 border-b border-stone-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif font-bold text-stone-800">My Closet 🧺</h2>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="bg-stone-900 text-white px-5 py-2 rounded-full text-sm font-medium shadow-md hover:bg-stone-800 transition-colors flex items-center gap-2"
          >
            {isAnalyzing ? 'Scanning...' : (
              <>
                <span>📷</span> Add Item
              </>
            )}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload}
          />
        </div>

        {/* Categories Scroller */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === 'All' 
                ? 'bg-rose-400 text-white shadow-md' 
                : 'bg-white border border-stone-200 text-stone-600'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat 
                  ? 'bg-rose-400 text-white shadow-md' 
                  : 'bg-white border border-stone-200 text-stone-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* Color Filters */}
        {colors.length > 0 && (
          <div className="flex gap-2 mt-2 items-center overflow-x-auto">
             <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mr-1">Filter:</span>
             <button 
                onClick={() => setActiveColor(null)}
                className={`w-5 h-5 rounded-full border border-stone-300 flex items-center justify-center ${!activeColor ? 'ring-2 ring-rose-300' : ''}`}
             >
               <span className="block w-3 h-3 bg-stone-200 rounded-full"></span>
             </button>
             {colors.map(color => (
                <button
                  key={color}
                  onClick={() => setActiveColor(color)}
                  className={`w-5 h-5 rounded-full border border-stone-200 shadow-sm ${activeColor === color ? 'ring-2 ring-rose-400 scale-110' : ''}`}
                  style={{ backgroundColor: color.toLowerCase() }} // Rough approximation, won't work for all fancy color names
                  title={color}
                />
             ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="p-4">
        {items.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <p className="text-6xl mb-4">✨</p>
            <p className="text-lg text-stone-600 font-serif">Wardrobe Empty</p>
            <p className="text-sm text-stone-500">Take a photo of your clothes to get started!</p>
          </div>
        ) : filteredItems.length === 0 ? (
           <div className="text-center py-20 opacity-50">
             <p className="text-lg text-stone-600">No matching items.</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="group relative bg-white rounded-xl p-2 shadow-sm border border-stone-100 flex flex-col h-full">
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToDelete(item.id);
                  }}
                  className="absolute top-3 right-3 bg-white shadow-sm p-1.5 rounded-full text-xs text-red-400 z-10 hover:bg-red-50 transition-colors"
                 >
                   🗑️
                 </button>
                <div className="relative aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-stone-50">
                  <img src={item.imageUrl} alt={item.category} className="w-full h-full object-cover" />
                </div>
                <div className="mt-auto px-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-stone-800 text-xs uppercase tracking-wide">{item.category}</h3>
                      <p className="text-[10px] text-stone-500 font-medium">{item.color}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-400 line-clamp-1 mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

       {/* Custom Delete Modal */}
      {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center">
                <p className="text-lg font-bold text-stone-800 mb-2">Delete Item?</p>
                <p className="text-sm text-stone-500 mb-6">Are you sure you want to remove this from your closet?</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setItemToDelete(null)}
                        className="flex-1 py-3 text-stone-500 font-medium hover:bg-stone-50 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default Wardrobe;