"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Pencil,
  Save, 
  Settings, 
  Globe, 
  Code, 
  Search,
  X,
  AlertCircle
} from "lucide-react";

interface SelectorConfig {
  id: string;
  sourceName: string;
  category: string;
  urlSlug: string;
  selector: string;
  isActive: boolean;
  lastSuccessAt: string | null;
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<SelectorConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newConfig, setNewConfig] = useState({
    sourceName: "",
    category: "Search",
    urlSlug: "",
    selector: "",
    isActive: true
  });
  const [editingConfig, setEditingConfig] = useState<SelectorConfig | null>(null);

  const fetchConfigs = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get("/scrape/configs");
      setConfigs(response.data.data);
    } catch (err: any) {
      setError("Failed to fetch scraper configurations.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!newConfig.sourceName || !newConfig.urlSlug || !newConfig.selector) {
      setError("All fields are required.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingConfig) {
        // Update
        await api.put(`/scrape/configs/${editingConfig.id}`, newConfig);
      } else {
        // Create
        await api.post("/scrape/configs", newConfig);
      }
      
      setShowAddModal(false);
      setEditingConfig(null);
      setNewConfig({
        sourceName: "",
        category: "Search",
        urlSlug: "",
        selector: "",
        isActive: true
      });
      fetchConfigs();
    } catch (err: any) {
      setError(`Failed to ${editingConfig ? 'update' : 'save'} configuration.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditConfig = (config: SelectorConfig) => {
    setEditingConfig(config);
    setNewConfig({
      sourceName: config.sourceName,
      category: config.category,
      urlSlug: config.urlSlug,
      selector: config.selector,
      isActive: config.isActive
    });
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingConfig(null);
    setNewConfig({
      sourceName: "",
      category: "Search",
      urlSlug: "",
      selector: "",
      isActive: true
    });
    setShowAddModal(true);
  };

  const handleDeleteConfig = async (id: string) => {
    if (!confirm("Are you sure you want to delete this portal?")) return;
    
    try {
      await api.delete(`/scrape/configs/${id}`);
      fetchConfigs();
    } catch (err: any) {
      setError("Failed to delete configuration.");
    }
  };

  const toggleStatus = async (config: SelectorConfig) => {
    try {
      await api.put(`/scrape/configs/${config.id}`, {
        ...config,
        isActive: !config.isActive
      });
      fetchConfigs();
    } catch (err: any) {
      setError("Failed to update status.");
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center">
            <Settings className="mr-3 text-red-600" size={32} />
            Scraper Settings
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Manage high-precision news portal discovery rules and search templates.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
        >
          <Plus size={20} className="mr-2" />
          Add New Portal
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center text-red-700 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} className="mr-3 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Configurations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 text-red-600 animate-spin" />
            <p className="text-slate-500 font-bold">Loading discovery rules...</p>
          </div>
        ) : configs.length === 0 ? (
          <div className="py-32 text-center">
            <Globe size={48} className="mx-auto text-slate-200 mb-4" />
            <h2 className="text-xl font-bold text-slate-800">No portals configured</h2>
            <p className="text-slate-500 max-w-xs mx-auto mt-2">
              Add your first news source to begin targeted discovery scans.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Portal & Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">URL Template</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">CSS Selector</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {configs.map((config) => (
                  <tr key={config.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-6">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${config.isActive ? 'bg-green-500' : 'bg-slate-300'} ring-4 ${config.isActive ? 'ring-green-50' : 'ring-slate-50'}`} />
                        <div>
                          <div className="text-sm font-black text-slate-900">{config.sourceName}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1">
                            {config.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center group max-w-xs xl:max-w-md">
                        <Search size={14} className="text-slate-300 mr-2 shrink-0" />
                        <code className="text-xs font-mono text-slate-600 truncate bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          {config.urlSlug}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-mono text-xs text-slate-500">
                      <div className="flex items-center">
                        <Code size={14} className="mr-2 text-slate-300" />
                        {config.selector}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <button
                        onClick={() => toggleStatus(config)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight transition-all ${
                          config.isActive 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {config.isActive ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditConfig(config)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit portal"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteConfig(config.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete portal"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD PORTAL MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {editingConfig ? 'Update Portal Settings' : 'Integrate New Portal'}
                </h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                  {editingConfig ? 'Modify existing configuration' : 'Add to Discovery Network'}
                </p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block ml-1">Source Name</label>
                  <input
                    type="text"
                    placeholder="e.g., THE_DAILY_STAR"
                    value={newConfig.sourceName}
                    onChange={(e) => setNewConfig({...newConfig, sourceName: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-red-500 font-bold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block ml-1">Pipeline Mode</label>
                  <select
                    value={newConfig.category}
                    onChange={(e) => setNewConfig({...newConfig, category: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-red-500 font-bold transition-all appearance-none cursor-pointer"
                  >
                    <option value="Search">Search-First (Slug)</option>
                    <option value="General">Baseline (Homepage)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block ml-1 flex justify-between">
                  URL Template 
                  <span className="text-red-500 normal-case font-bold px-1 rounded">Required: {'{query}'}</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text"
                    placeholder="https://www.news.com/tags/{query}"
                    value={newConfig.urlSlug}
                    onChange={(e) => setNewConfig({...newConfig, urlSlug: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-red-500 font-mono text-xs transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block ml-1">Headline CSS Selector</label>
                <div className="relative">
                  <Code className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text"
                    placeholder="h3.card-headline a"
                    value={newConfig.selector}
                    onChange={(e) => setNewConfig({...newConfig, selector: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-red-500 font-mono text-xs transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={20} />}
                  {editingConfig ? 'Update Discovery Rule' : 'Save Discovery Rule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
