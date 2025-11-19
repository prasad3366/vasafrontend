import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import AdminNavigation from "@/components/admin/AdminNavigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ErrorBoundary from '@/components/ErrorBoundary';
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { ApiClient } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import formatPriceINR from '@/lib/formatting';

const emptyForm = { id: null, title: "", price: "", description: "", image: "", discounted_price: "", discount_percentage: "", end_date: "" };

export default function AdminProducts() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [inStockCount, setInStockCount] = useState(0);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [productDescriptions, setProductDescriptions] = useState({});
  const [bestSellerIds, setBestSellerIds] = useState(new Set());

  // Track in-flight actions per product to prevent double clicks and show UI state
  const [loadingMap, setLoadingMap] = useState({}); // { [id]: 'adding'|'removing'|'deleting' }
  const setLoading = (id, action) => setLoadingMap(m => ({ ...m, [id]: action }));
  const clearLoading = (id) => setLoadingMap(m => {
    const copy = { ...m };
    delete copy[id];
    return copy;
  });

  // Helper to set bestSellerIds state, persist to localStorage and broadcast within the tab
  const setAndPersistBestSellerIds = (newSet) => {
    try {
      setBestSellerIds(newSet);
    } catch (e) {
      console.error('Error setting bestSellerIds state', e);
    }
    try {
      localStorage.setItem('bestSellerIds', JSON.stringify(Array.from(newSet)));
    } catch (e) {
      console.error('Error saving bestSellerIds to localStorage', e);
    }
    try {
      // Notify other components in the same tab
      window.dispatchEvent(new CustomEvent('bestSellerIdsUpdated', { detail: Array.from(newSet) }));
    } catch (e) {}
  };

  const handleAddToBestSeller = async (product) => {
    // Add product to best sellers - mark locally and on backend
    const formData = new FormData();
    formData.append('id', String(product.id));
    formData.append('is_best_seller', 'true');

    try {
      setLoading(product.id, 'adding');
      // Optimistically update UI state immediately
      const newBestSellerIds = new Set(bestSellerIds);
      newBestSellerIds.add(product.id);
      
      // Persist and broadcast best seller IDs
      setAndPersistBestSellerIds(newBestSellerIds);
      
      // Send to backend
      await ApiClient.adminUpdatePerfumeBestSeller(formData, token);
      console.log('[AdminProducts] Successfully added product', product.id, 'to best sellers');
      try { toast({ title: 'Added to Best Sellers', description: `${product.name || product.title} was added to best sellers.` }); } catch (e) {}
      
    } catch (err) {
      console.error('Error adding to best sellers:', err);
      // Revert on error
      const revertIds = new Set(bestSellerIds);
      revertIds.delete(product.id);
      setAndPersistBestSellerIds(revertIds);
      alert('Failed to add to best sellers');
    } finally {
      clearLoading(product.id);
    }
  };

  const handleRemoveFromBestSeller = async (product) => {
    // Remove product from best sellers - mark locally and on backend
    const formData = new FormData();
    formData.append('id', String(product.id));
    formData.append('is_best_seller', 'false');

    try {
      setLoading(product.id, 'removing');
      // Optimistically update UI state immediately
      const newBestSellerIds = new Set(bestSellerIds);
      newBestSellerIds.delete(product.id);
      setBestSellerIds(newBestSellerIds);

      // Persist and broadcast best seller IDs, update local product state
      setAndPersistBestSellerIds(newBestSellerIds);

      // Update local product state to reflect is_best_seller = false
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, is_best_seller: false } : p
      ));

      // Send to backend
      await ApiClient.adminUpdatePerfumeBestSeller(formData, token);
      console.log('[AdminProducts] Successfully removed product', product.id, 'from best sellers');
  try { toast({ title: 'Removed from Best Sellers', description: `${product.name || product.title} was removed from best sellers.` }); } catch (e) {}

  } catch (err) {
      console.error('Error removing from best sellers:', err);
      // Revert on error
      const revertIds = new Set(bestSellerIds);
      revertIds.add(product.id);
      setBestSellerIds(revertIds);
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, is_best_seller: true } : p
      ));
      alert('Failed to remove from best sellers');
    } finally {
      clearLoading(product.id);
    }
  };

  useEffect(() => {
    // load products from backend (admin)
    const fetchProducts = async () => {
      if (!token) {
        console.error('No auth token available');
        return;
      }

      // Load best seller IDs from localStorage (source of truth for UI state)
      try {
        const stored = localStorage.getItem('bestSellerIds');
        if (stored) {
          const ids = JSON.parse(stored);
          setBestSellerIds(new Set(ids));
          console.log('[AdminProducts] Loaded best seller IDs from localStorage:', ids);
        }
      } catch (e) {
        console.error('Error loading best seller IDs:', e);
      }

      try {
        console.log('Loading admin products with token:', token);
        const res = await ApiClient.adminGetPerfumes(token);
        console.log('Admin products response:', res);

        if (res && res.perfumes) {
          setProducts(res.perfumes);
          try {
            const count = (res.perfumes || []).filter(p => {
              const q = Number(p.quantity ?? p.qty ?? p.available_quantity ?? p.available ?? 0) || 0;
              return q > 0;
            }).length;
            setInStockCount(count);
          } catch (e) { setInStockCount(0); }
          console.log('Set products:', res.perfumes);
        } else {
          console.warn('No products in response:', res);
          setProducts([]);
          setInStockCount(0);
        }
      } catch (e) {
        console.error('Failed to load admin products:', e);
        setProducts([]);
      }
    };

    // Initial fetch
    fetchProducts();

    // When the tab/window regains focus or becomes visible, re-fetch so changes made
    // in other pages/tabs (e.g. removing a product from Best Sellers) are reconciled
    const onFocus = () => {
      console.log('[AdminProducts] Window focus event - re-fetching products and best sellers');
      try { fetchProducts(); } catch (e) { console.error('Error fetching products on focus', e); }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log('[AdminProducts] Tab visibility change to visible - re-fetching products and best sellers');
        try { fetchProducts(); } catch (e) { console.error('Error fetching products on visibilitychange', e); }
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [token]);

  // Listen for changes to bestSellerIds in other tabs/windows and reconcile local state.
  // This allows the products list to reflect removals made from the Best Seller section in another tab.
  useEffect(() => {
    const onStorage = (e) => {
      if (!e) return;
      try {
        if (e.key === 'bestSellerIds') {
          const val = e.newValue;
          if (!val) {
            setBestSellerIds(new Set());
            return;
          }
          const ids = JSON.parse(val || '[]');
          setBestSellerIds(new Set(ids));
        }
      } catch (err) {
        console.error('Error handling storage event for bestSellerIds', err);
      }
    };

    const onCustom = (e) => {
      try {
        const ids = (e && e.detail) || [];
        setBestSellerIds(new Set(ids));
      } catch (err) {
        console.error('Error handling custom bestSellerIdsUpdated event', err);
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('bestSellerIdsUpdated', onCustom);
    // Also listen for a broader productsChanged event so other admin pages can notify us
    const onProductsChanged = () => {
      console.log('[AdminProducts] productsChanged event received - re-fetching products');
      try { fetchProducts(); } catch (e) { console.error('Error fetching products on productsChanged', e); }
    };
    window.addEventListener('productsChanged', onProductsChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('bestSellerIdsUpdated', onCustom);
      window.removeEventListener('productsChanged', onProductsChanged);
    };
  }, []);

  const form = useForm({
    defaultValues: {
      title: "",
      price: "",
      discounted_price: "",
      end_date: "",
      image: "",
      description: "",
      quantity: 100,
      category: 'unisex',
      top_notes: '',
      heart_notes: '',
      base_notes: '',
    },
    mode: 'onBlur',
    shouldFocusError: false,
    reValidateMode: 'onBlur',
  });
  const { reset, control, setValue, getValues, handleSubmit, trigger } = form;
  // `size` field removed — size-related local state omitted

  // Only reset the form when we exit edit mode
  useEffect(() => {
    if (!editingId) {
      // Only reset when NOT editing, to avoid clearing the form while editing
      reset({
        title: "",
        price: "",
        image: "",
        description: "",
        quantity: 100,
        category: "unisex",
        top_notes: "",
        heart_notes: "",
        base_notes: "",
        discounted_price: "",
        end_date: "",
      });
      // size state removed
      if (import.meta.env.DEV) console.log('[AdminProducts] Form reset - not in edit mode');
    }
  }, [editingId]);

  useEffect(() => {
    reset({
      title: "",
      price: "",
      image: "",
      description: "",
      quantity: 100,
      category: "unisex",
      top_notes: "",
      heart_notes: "",
      base_notes: "",
      discounted_price: "",
      end_date: ""
    });
    if (import.meta.env.DEV) console.log('[AdminProducts] (mount useEffect) reset called');
  }, []);
  // mount-only reset done above; no size state to clear

  // onSubmit handled inline in the form below - removed duplicate definition to avoid syntax/brace issues
  const handleEdit = (product) => {
    console.debug('[AdminProducts:handleEdit] editing product id:', product.id);
    // Try to get description from backend or localStorage
    const descriptionToUse = product.description || productDescriptions[product.id] || '';
    reset({
      title: product.name || product.title,
      price: product.originalPrice || product.price,
      discounted_price: product.discounted_price || (product.price !== product.originalPrice ? product.price : ''),
      end_date: product.end_date ? new Date(product.end_date).toISOString().split('T')[0] : '',
      image: '',
      description: descriptionToUse,
      quantity: product.quantity || 100,
      category: product.category || 'unisex',
      top_notes: product.notes?.top?.join(',') || '',
      heart_notes: product.notes?.heart?.join(',') || '',
      base_notes: product.notes?.base?.join(',') || ''
    });
    // `size` removed: do not populate any size state
    setEditingId(product.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    const productToDelete = products.find(p => p.id === id);
    // Optimistically remove the product locally so UI updates immediately
    const prevProducts = products;
    const prevBestSellerIds = new Set(bestSellerIds);
    const prevDescriptions = { ...productDescriptions };

    try {
      setLoading(id, 'deleting');
      setProducts(prev => prev.filter(p => p.id !== id));

      // Remove this id from local bestSellerIds and cached descriptions to avoid stale UI
      // compute new set and persist/broadcast
      try {
        const copy = new Set(bestSellerIds);
        copy.delete(id);
        setAndPersistBestSellerIds(copy);
      } catch (e) { console.error('Error updating bestSellerIds after delete', e); }

      setProductDescriptions(prev => {
        const copy = { ...prev };
        if (copy.hasOwnProperty(id)) delete copy[id];
        try { localStorage.setItem('productDescriptions', JSON.stringify(copy)); } catch (e) { console.error('Error saving productDescriptions after delete', e); }
        return copy;
      });

      // Also remove any queued best-seller entries for this id from sessionStorage
      try {
        const key = 'addedBestSellers';
        const queued = JSON.parse(sessionStorage.getItem(key) || '[]');
        if (Array.isArray(queued) && queued.length) {
          const filtered = queued.filter(q => q.id !== id);
          if (filtered.length) sessionStorage.setItem(key, JSON.stringify(filtered)); else sessionStorage.removeItem(key);
          console.log('[AdminProducts] Removed deleted product from sessionStorage addedBestSellers if present', id);
        }
      } catch (e) { console.error('Error clearing session queued best sellers', e); }

      // Call backend to delete
      await ApiClient.adminDeletePerfume(id, token);

      // Refresh canonical list from server
      const res = await ApiClient.adminGetPerfumes(token);
      if (res && res.perfumes) {
        setProducts(res.perfumes);
        // Reconcile bestSellerIds from backend truth but DO NOT overwrite local decisions
        try {
          const idsFromServer = new Set(res.perfumes.filter(p => p.is_best_seller).map(p => p.id));
          // Merge server-provided best-seller IDs into our existing set (prevBestSellerIds),
          // but ensure the deleted id remains removed.
          const merged = new Set(prevBestSellerIds || []);
          for (const sid of idsFromServer) merged.add(sid);
          // ensure deleted id isn't present
          merged.delete(id);
          // Persist and broadcast the merged set
          setAndPersistBestSellerIds(merged);
        } catch (e) { console.error('Error reconciling bestSellerIds after delete', e); }
      }

      // Notify other admin pages to refresh (keep pages in sync)
      try { window.dispatchEvent(new CustomEvent('productsChanged')); } catch (e) { console.error('Error dispatching productsChanged', e); }

      try { toast({ title: 'Product deleted', description: `${productToDelete?.name || productToDelete?.title || 'Product'} was deleted.` }); } catch (e) {}

      if (editingId === id) {
        reset({ title: "", price: "", discounted_price: "", end_date: "", image: "", description: "", quantity: 100, category: 'unisex', top_notes: '', heart_notes: '', base_notes: '' });
        setEditingId(null);
      }
  } catch (err) {
      console.error('Error deleting perfume', err);
      // Revert optimistic changes
      try { setProducts(prevProducts); } catch (e) {}
      try { setBestSellerIds(prevBestSellerIds); localStorage.setItem('bestSellerIds', JSON.stringify(Array.from(prevBestSellerIds))); } catch (e) {}
      try { setProductDescriptions(prevDescriptions); localStorage.setItem('productDescriptions', JSON.stringify(prevDescriptions)); } catch (e) {}
      alert(err.message || 'Failed to delete perfume');
    } finally {
      clearLoading(id);
    }
  };

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <AdminNavigation />
        <div style={{ marginTop: 8, marginBottom: 16 }}>
          <strong>Products with stock:</strong> {inStockCount} / {products.length}
        </div>

      <Form {...form}>
        <form 
          onSubmit={handleSubmit(async (data) => {
            console.log('[AdminProducts] ===== SUBMIT START =====');
            console.log('[AdminProducts] onSubmit called with data:', data);
            
            const title = (data.title || "").trim();
            if (!title) {
              console.error('[AdminProducts] Title is empty:', data.title);
              toast({ title: 'Error', description: 'Title is required' });
              return;
            }
            
            // `size` removed: no size validation required
            
            try {
              // IMPORTANT: Cache the description IMMEDIATELY before sending to backend
              // This ensures descriptions persist even if backend doesn't return them
              if (data.description) {
                const updatedDescriptions = { ...productDescriptions };
                if (editingId) {
                  // For edits, we have the ID, so save immediately
                  updatedDescriptions[editingId] = data.description;
                  console.log('[AdminProducts] Pre-cached description for EDITING ID', editingId, ':', data.description);
                } else {
                  // For new products, store with a temp key that we'll update later
                  // We'll use a composite key: timestamp + title to avoid collisions
                  const tempKey = `temp_${Date.now()}_${title.replace(/\s+/g, '_')}`;
                  updatedDescriptions[tempKey] = data.description;
                  console.log('[AdminProducts] Pre-cached description with temp key', tempKey, ':', data.description);
                }
                setProductDescriptions(updatedDescriptions);
                try {
                  localStorage.setItem('productDescriptions', JSON.stringify(updatedDescriptions));
                  console.log('[AdminProducts] Pre-cached descriptions:', updatedDescriptions);
                } catch (e) {
                  console.error('Error pre-caching descriptions:', e);
                }
              }
              
              const form = new FormData();
              // backend expects name price description quantity category size etc.
              form.append('name', title);
              form.append('price', String(data.price || '0'));
              form.append('description', data.description || '');
              form.append('quantity', String(data.quantity ?? 100));
              
              // Always send both regular price and special offer price
              form.append('original_price', String(data.price || '0')); // Regular price
              form.append('price', String(data.price || '0')); // Current price
              
              // If there's a special offer
              if (data.discounted_price && Number(data.discounted_price) < Number(data.price)) {
                form.append('discounted_price', String(data.discounted_price));
                form.append('price', String(data.discounted_price)); // Set current price to discounted price
                
                // Calculate discount percentage
                const originalPrice = Number(data.price);
                const discountedPrice = Number(data.discounted_price);
                const discountPercentage = ((originalPrice - discountedPrice) / originalPrice) * 100;
                form.append('discount_percentage', String(Math.round(discountPercentage)));
                
                // Add end date if provided
                if (data.end_date) {
                  form.append('end_date', data.end_date);
                }
              } else {
                form.append('discounted_price', '');
                form.append('discount_percentage', '0');
                form.append('end_date', '');
              }
              form.append('category', data.category || 'unisex');
              
              // `size` removed: do not append size to the payload
              
              form.append('top_notes', data.top_notes || '');
              form.append('heart_notes', data.heart_notes || '');
              form.append('base_notes', data.base_notes || '');
              if (file) {
                console.log('[AdminProducts] Appending photo file:', file.name, 'Size:', file.size, 'Type:', file.type);
                form.append('photo', file);
              } else {
                console.log('[AdminProducts] No photo file to append');
              }

              let apiResponse;
              if (editingId) {
                form.append('id', String(editingId));
                // If there's a special offer price, use the special offers endpoint
                if (data.discounted_price) {
                  apiResponse = await ApiClient.adminUpdateSpecialOffer(editingId, form, token);
                } else {
                  apiResponse = await ApiClient.adminUpdatePerfume(form, token);
                }
              } else {
                // For new products with special offer price, use special offers endpoint
                if (data.discounted_price) {
                  apiResponse = await ApiClient.adminAddSpecialOffer(form, token);
                  console.log('[AdminProducts] adminAddSpecialOffer response:', apiResponse);
                } else {
                  apiResponse = await ApiClient.adminAddPerfume(form, token);
                  console.log('[AdminProducts] adminAddPerfume response:', apiResponse);
                }
              }
              
              // Try to extract product ID from the response to update temp keys
              if (apiResponse && !editingId) {
                const productId = apiResponse.id || apiResponse.perfume_id || (apiResponse.perfume && apiResponse.perfume.id);
                if (productId && data.description) {
                  const updatedDescriptions = { ...productDescriptions };
                  // Find and update any temp keys for this product
                  Object.keys(updatedDescriptions).forEach(key => {
                    if (key.startsWith('temp_') && updatedDescriptions[key] === data.description) {
                      delete updatedDescriptions[key];
                    }
                  });
                  // Add with real ID
                  updatedDescriptions[productId] = data.description;
                  setProductDescriptions(updatedDescriptions);
                  try {
                    localStorage.setItem('productDescriptions', JSON.stringify(updatedDescriptions));
                    console.log('[AdminProducts] Updated temp key to real ID', productId, ':', data.description);
                  } catch (e) {
                    console.error('Error updating cache with real ID:', e);
                  }
                }
              }

              // reload list
              const res = await ApiClient.adminGetPerfumes(token);
              if (res && res.perfumes) {
                setProducts(res.perfumes);
                
                // Final pass: map all product IDs to their descriptions
                const finalDescriptions = { ...productDescriptions };
                res.perfumes.forEach(p => {
                  // If we already have a description for this product, keep it
                  if (!finalDescriptions[p.id] && productDescriptions[p.id]) {
                    finalDescriptions[p.id] = productDescriptions[p.id];
                  }
                  // If backend returned description, use it
                  if (p.description && p.id) {
                    finalDescriptions[p.id] = p.description;
                  }
                });
                
                setProductDescriptions(finalDescriptions);
                try {
                  localStorage.setItem('productDescriptions', JSON.stringify(finalDescriptions));
                  console.log('[AdminProducts] Final descriptions cache:', finalDescriptions);
                } catch (e) {
                  console.error('Error saving final descriptions:', e);
                }
              }
              
              // Keep form values and uploaded file visible after successful creation
              // (do not reset form automatically) — admin requested fields/photo to remain.
              toast({ title: 'Success', description: editingId ? 'Product updated successfully' : 'Product created successfully' });
            } catch (err) {
              console.error('Error saving perfume', err);
              // Clear file on error so it doesn't persist
              setFile(null);
              toast({ title: 'Error', description: err.message || 'Failed to save perfume' });
            }

            // Clear form fields and file input after successfully creating a product
            reset();
            setFile(null);
          })}
          style={{ marginBottom: 20, display: "grid", gap: 8 }}
        >
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg" placeholder="Title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regular Price</FormLabel>
                <FormControl>
                  <Input className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg" type="number" placeholder="Regular Price" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg" type="number" placeholder="Quantity" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <select {...field} className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg">
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          

          <FormField
            control={control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL (optional) or upload</FormLabel>
                <FormControl>
                  <Input className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg" placeholder="Image URL (optional)" {...field} />
                </FormControl>
                <div className="mt-2">
                  <input
                    id="photo-input"
                    className="w-full"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (f) {
                        // Don't clear the form data, just set the file
                        setFile(f);
                        console.log('[AdminProducts] Image file selected:', f.name);
                      }
                    }}
                  />
                  {file && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <div style={{ display: 'inline-block', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                          <img
                            src={URL.createObjectURL(file)}
                            alt="preview"
                            style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6 }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setFile(null);
                            try { /* keep form.image untouched; UI file state cleared via setFile */ } catch (e) {}
                            const input = document.getElementById('photo-input');
                            if (input) input.value = '';
                          }}
                        >
                          Remove Image
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea className="w-full" rows={3} placeholder="Description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="top_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Top Notes</FormLabel>
                <FormControl>
                  <Input className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg" placeholder="Comma separated top notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="heart_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heart Notes</FormLabel>
                <FormControl>
                  <Input className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg" placeholder="Comma separated heart notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="base_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Notes</FormLabel>
                <FormControl>
                  <Input className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg" placeholder="Comma separated base notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <Button type="submit">
              {editingId ? "Update Product" : "Create Product"}
            </Button>
            {/* Reset button removed as per admin request */}
          </div>
        </form>
      </Form>

      <div style={{ display: "grid", gap: 12 }}>
        {products.length === 0 && <div>No products yet.</div>}
        {products.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              gap: 12,
              padding: 12,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            {
              (() => {
                const placeholder = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='80'%20height='80'%3E%3Crect%20width='100%25'%20height='100%25'%20fill='%23e5e7eb'/%3E%3Ctext%20x='50%25'%20y='50%25'%20dominant-baseline='middle'%20text-anchor='middle'%20fill='%239ca3af'%20font-family='Arial,%20sans-serif'%20font-size='12'%3ENo%20Image%3C/text%3E%3C/svg%3E";
                
                // Build image URL using the perfume ID and the /perfumes/photo/{id} endpoint
                const photoUrl = `http://127.0.0.1:5000/perfumes/photo/${p.id}`;
                
                return (
                  <img
                    src={photoUrl}
                    alt={p.name || p.title}
                    title={photoUrl}
                    onError={(e) => { if ((e.currentTarget.dataset.fallback ?? "") !== "1") { e.currentTarget.dataset.fallback = "1"; e.currentTarget.src = placeholder; } }}
                    style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6 }}
                  />
                );
              })()
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{p.name || p.title}</div>
              <div style={{ color: "#6b7280", marginTop: 4, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordWrap: 'break-word', minHeight: '2.5rem' }}>
                {(() => {
                  const desc = p.description || productDescriptions[p.id];
                  if (import.meta.env.DEV) {
                    console.log(`[AdminProducts Display] Product ${p.id} (${p.name}):`, {
                      fromBackend: p.description,
                      fromLocalStorage: productDescriptions[p.id],
                      final: desc,
                      allStoredDescriptions: productDescriptions
                    });
                  }
                  return desc ? (
                    <span>{desc}</span>
                  ) : (
                    <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>No description available</span>
                  );
                })()}
              </div>
              <div style={{ marginTop: 6 }}>{formatPriceINR(p.price)}</div>
              <div style={{ marginTop: 6, color: p.quantity && Number(p.quantity) > 0 ? '#065f46' : '#9ca3af' }}>
                Stock: {typeof p.quantity !== 'undefined' ? p.quantity : (typeof p.available !== 'undefined' ? (p.available ? 'Available' : 'Out of stock') : 'Unknown')}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: 'center' }}>
              <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)} disabled={loadingMap[p.id] === 'deleting'}>
                {loadingMap[p.id] === 'deleting' ? 'Deleting...' : 'Delete'}
              </Button>
              {!bestSellerIds.has(p.id) ? (
                <Button size="sm" variant="default" onClick={() => handleAddToBestSeller(p)} disabled={loadingMap[p.id] === 'adding'}>
                  {loadingMap[p.id] === 'adding' ? 'Adding...' : 'Add to Best Seller'}
                </Button>
              ) : (
                <Button size="sm" variant="secondary" disabled>
                  ✓ Added to Best Seller
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
    <Footer />
    </div>
    </ErrorBoundary>
  );
}
