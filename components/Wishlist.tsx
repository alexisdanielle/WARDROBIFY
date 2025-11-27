import React, { useRef, useState } from 'react';
import { WishlistItem, ClothingItem } from '../types';
import { checkSimilarity, analyzeClothingItem } from '../services/geminiService';

interface WishlistProps {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  wardrobe: ClothingItem[];
}

const Wishlist: React.FC<WishlistProps> = ({ wishlist, addToWishlist, removeFromWishlist, wardrobe }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ isSimilar: boolean; message: string } | null>(null);

  // Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setName('');
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setPreviewImage(base64String);
      
      try {
        // Parallel execution: 1. Name the item, 2. Check for duplicates
        const [metadata, similarityCheck] = await Promise.all([
            analyzeClothingItem(base64String),
            checkSimilarity(base64String, wardrobe)
        ]);

        // Auto-fill name
        if (metadata.color && metadata.category) {
            setName(`${metadata.color} ${metadata.category}`);
        } else {
            setName(metadata.description || "New Item");
        }

        // Set feedback
        setAnalysisResult({
            isSimilar: similarityCheck.isSimilar,
            message: similarityCheck.explanation
        });

      } catch (e) {
        console.error(e);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !previewImage) {
        if (!previewImage) alert("Please upload a photo!");
        return;
    }

    const newItem: WishlistItem = {
      id: Date.now().toString(),
      name: `${name} ${brand ? `(${brand})` : ''}`,
      price: parseFloat(price) || 0,
      imageUrl: previewImage
    };
    addToWishlist(newItem);
    
    // Reset form
    setName('');
    setPrice('');
    setBrand('');
    setPreviewImage(null);
    setAnalysisResult(null);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
        removeFromWishlist(itemToDelete);
        setItemToDelete(null);
    }
  };

  const total = wishlist.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="p-4 pb-24">
       <div className="mb-6 sticky top-0 bg-pink-50/95 backdrop-blur z-10 py-2">
        <h2 className="text-2xl font-bold text-gray-800">Wishlist 🛍️</h2>
        <div className="text-sm text-gray-500 font-medium">
          Total: <span className="text-pink-600 font-bold">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100 mb-8">
        <h3 className="font-bold text-gray-800 mb-4 text-sm">Add New Item</h3>
        
        {/* Step 1: Image Upload (if no image yet) */}
        {!previewImage ? (
           <div 
             className="border-2 border-dashed border-pink-200 rounded-xl p-8 text-center cursor-pointer hover:bg-pink-50 transition-colors mb-4"
             onClick={() => fileInputRef.current?.click()}
          >
             {isAnalyzing ? (
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-pink-400">Stylist is analyzing...</span>
                 </div>
             ) : (
                <>
                    <p className="text-3xl mb-2">📷</p>
                    <p className="text-xs font-bold text-pink-500">Tap to Upload Photo</p>
                    <p className="text-[10px] text-gray-400 mt-1">I'll name it for you!</p>
                </>
             )}
          </div>
        ) : (
            <div className="mb-4 relative">
                <img src={previewImage} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-pink-100" />
                <button 
                    onClick={() => { setPreviewImage(null); setAnalysisResult(null); }}
                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-xs shadow-sm hover:text-red-500"
                >
                    ✕
                </button>
                
                {/* Analysis Feedback Badge */}
                {analysisResult && (
                    <div className={`mt-2 p-3 rounded-lg border flex gap-2 items-start text-xs ${
                        analysisResult.isSimilar 
                        ? 'bg-amber-50 text-amber-800 border-amber-100' 
                        : 'bg-green-50 text-green-800 border-green-100'
                    }`}>
                        <span className="text-lg">{analysisResult.isSimilar ? '⚠️' : '✨'}</span>
                        <div>
                            <p className="font-bold uppercase tracking-wide text-[10px] mb-0.5">
                                {analysisResult.isSimilar ? 'Similar Item Found' : 'New Find'}
                            </p>
                            <p className="opacity-90">{analysisResult.message}</p>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Step 2: Form Details */}
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Item Name</label>
            <input
                type="text"
                placeholder="e.g. Red Silk Dress"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-300 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
                 <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Price</label>
                 <input
                    type="number"
                    placeholder="$0.00"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-300 transition-colors"
                />
            </div>
             <div className="flex-1">
                 <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Brand</label>
                 <input
                    type="text"
                    placeholder="Optional"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-300 transition-colors"
                />
            </div>
          </div>
          
           <button 
            type="submit"
            disabled={!previewImage || !name || !price || isAnalyzing}
            className="w-full bg-pink-400 text-white font-bold py-3 rounded-xl shadow-md hover:bg-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            Add to Wishlist ✨
          </button>
          
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
        </form>
      </div>

      <div className="space-y-4">
        {wishlist.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">No wishes yet. Go window shopping! 🛒</p>}
        {wishlist.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-3 flex items-center gap-4 shadow-sm border border-stone-50">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
              <p className="text-pink-500 font-medium text-sm">${item.price.toFixed(2)}</p>
            </div>
            <button 
              onClick={() => setItemToDelete(item.id)}
              className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Custom Delete Modal */}
      {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center">
                <p className="text-lg font-bold text-stone-800 mb-2">Remove Item?</p>
                <p className="text-sm text-stone-500 mb-6">Are you sure you want to delete this from your wishlist?</p>
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

export default Wishlist;