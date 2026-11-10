import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingDown, 
  Cpu, 
  Sliders, 
  BarChart3,
  CheckCircle2,
  Copy,
  Moon,
  Sun,
  Search,
  Award,
  ArrowUpDown,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Layers3,
  X
} from 'lucide-react';

import catalog from './catalog.json';

const { models, media, shortlists, masterCount } = catalog;
const providers = [...new Set(models.map((model) => model.provider))].sort();
const categories = [...new Set(models.map((model) => model.category))].sort();
const hasTokenRates = (model) => model.inputPrice !== null && model.outputPrice !== null;
const comparableModels = models.filter(hasTokenRates);
const formatPrice = (rate) => rate === null ? '—' : `$${rate.toLocaleString('en-US', { maximumFractionDigits: 10 })}`;

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog', 'roi', 'leaders', 'media'
  const [activeLeaderCategory, setActiveLeaderCategory] = useState('Best Text');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // ROI Calculator Config
  const [dailyRequests, setDailyRequests] = useState(25000);
  const [inputTokens, setInputTokens] = useState(2000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [baselineModelId, setBaselineModelId] = useState('openai/gpt-4o');
  const [baselineSearch, setBaselineSearch] = useState('');
  const baselineQuery = baselineSearch.trim().toLowerCase();
  const matchingBaselines = comparableModels.filter((model) =>
    [model.name, model.provider, model.id].some((value) => value.toLowerCase().includes(baselineQuery))
  );
  const baselineOptions = matchingBaselines.some((model) => model.id === baselineModelId)
    ? matchingBaselines
    : [comparableModels.find((model) => model.id === baselineModelId), ...matchingBaselines];

  const [roiTargetModelIds, setRoiTargetModelIds] = useState([
    'openai/gpt-4o',
    'anthropic/claude-sonnet-5-5',
    'google/gemini-3.5-flash-lite',
    'openai/gpt-6-astra'
  ]);

  // Utility UI
  const [darkMode, setDarkMode] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedModelForModal, setSelectedModelForModal] = useState(null);

  // Sorting Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter Catalog
  const filteredCatalog = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const direction = sortOrder === 'asc' ? 1 : -1;

    return models.filter((model) => (
      [model.name, model.provider, model.id, model.domain, model.useCase]
        .some((value) => value?.toLowerCase().includes(query)) &&
      (selectedProvider === 'All' || model.provider === selectedProvider) &&
      (selectedCategory === 'All' || model.category === selectedCategory)
    )).sort((a, b) => {
      const left = a[sortField];
      const right = b[sortField];
      if (left === null) return right === null ? 0 : 1;
      if (right === null) return -1;
      return direction * (typeof left === 'string' ? left.localeCompare(right) : left - right);
    });
  }, [searchTerm, selectedProvider, selectedCategory, sortField, sortOrder]);

  // Paginated Catalog Slicing
  const totalPages = Math.ceil(filteredCatalog.length / itemsPerPage);
  const currentPaginatedModels = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCatalog.slice(start, start + itemsPerPage);
  }, [filteredCatalog, currentPage]);

  // ROI Calculations Engine
  const roiCalculations = useMemo(() => {
    const totalDailyInput = dailyRequests * inputTokens;
    const totalDailyOutput = dailyRequests * outputTokens;
    const modelResults = comparableModels.filter((model) => (
      model.id === baselineModelId || roiTargetModelIds.includes(model.id)
    )).map((model) => {
      const dailyTotalCost = (totalDailyInput * model.inputPrice + totalDailyOutput * model.outputPrice) / 1_000_000;
      const monthlyTotalCost = dailyTotalCost * 30.4375;
      const annualTotalCost = dailyTotalCost * 365;

      return {
        ...model,
        dailyTotalCost,
        monthlyTotalCost,
        annualTotalCost
      };
    });

    const baseline = modelResults.find((m) => m.id === baselineModelId);
    const baselineMonthly = baseline.monthlyTotalCost;

    const processed = modelResults.map((m) => {
      const monthlySavings = baselineMonthly - m.monthlyTotalCost;
      const annualSavings = baseline.annualTotalCost - m.annualTotalCost;
      const savingsPct = baselineMonthly > 0 ? (monthlySavings / baselineMonthly) * 100 : 0;
      return {
        ...m,
        monthlySavings,
        annualSavings,
        savingsPct
      };
    });

    processed.sort((a, b) => a.monthlyTotalCost - b.monthlyTotalCost);

    return {
      results: processed,
      baseline
    };
  }, [dailyRequests, inputTokens, outputTokens, roiTargetModelIds, baselineModelId]);

  const maxMonthlyRoiCost = Math.max(...roiCalculations.results.map((r) => r.monthlyTotalCost), 1);

  // Toggle Model Selection for ROI Comparison
  const toggleModelForRoi = (modelId) => {
    setRoiTargetModelIds((selected) => selected.includes(modelId)
      ? selected.filter((id) => id !== modelId)
      : [...selected, modelId]);
  };

  // Export Executive Summary to Clipboard / File
  const handleExportSummary = () => {
    const text = `
============================================================
EXECUTIVE AI MODEL ROI & COST COMPARISON REPORT (${models.length} CATALOG ENTRIES)
============================================================

[ WORKLOAD SIMULATION PARAMETERS ]
Daily Request Volume: ${dailyRequests.toLocaleString()} reqs/day
Prompt Tokens / Req: ${inputTokens.toLocaleString()} | Response Tokens / Req: ${outputTokens.toLocaleString()}
Workbook snapshot rates before caching, batch discounts, and other fees.

[ BASELINE MODEL BENCHMARK ]
Baseline Model: ${roiCalculations.baseline?.name || 'N/A'} ($${roiCalculations.baseline?.monthlyTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo)

[ COST RANKING & ROI BREAKDOWN ]
${roiCalculations.results
  .map(
    (m, i) =>
      `${i + 1}. ${m.name} (${m.provider})
   - Monthly Spend: $${m.monthlyTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
   - Annual Spend:  $${m.annualTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
   - Net Annual ROI Savings vs Baseline: ${m.annualSavings >= 0 ? '+' : ''}$${m.annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${m.savingsPct.toFixed(1)}%)`
  )
  .join('\n\n')}

Catalog: ${masterCount} workbook models plus ${models.length - masterCount} additional hosting IDs.
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={darkMode ? 'dark bg-slate-950 text-slate-100 min-h-screen font-sans' : 'bg-slate-50 text-slate-800 min-h-screen font-sans'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
              <Cpu className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                AI Models Catalog & ROI Calculator
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {masterCount} workbook models plus {models.length - masterCount} additional hosting IDs. Compare workbook prices and estimate token costs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
            <button
              onClick={handleExportSummary}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition active:scale-95"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied Report!' : 'Export Report'}
            </button>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex flex-wrap gap-2 my-6 pb-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'catalog'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            Full Catalog ({models.length} Entries)
          </button>
          
          <button
            onClick={() => setActiveTab('roi')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'roi'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Token ROI Calculator
          </button>

          <button
            onClick={() => setActiveTab('leaders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'leaders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            Domain Leaders
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === 'media'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers3 className="w-4 h-4" />
            Media & Non-Token Models
          </button>
        </div>

        {/* TAB 1: MODEL CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            
            {/* Search & Provider Filters */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                
                {/* Search Bar */}
                <div className="md:col-span-6 relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by model, provider, ID, or use case..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Category Filter */}
                <div className="md:col-span-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="All">All Categories</option>
                    {categories.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </div>

                {/* Stats counter */}
                <div className="md:col-span-3 flex items-center justify-end px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Showing {filteredCatalog.length} of {models.length} Entries
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                Provider
                <select
                  value={selectedProvider}
                  onChange={(event) => {
                    setSelectedProvider(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="max-w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="All">All Providers</option>
                  {providers.map((provider) => <option key={provider}>{provider}</option>)}
                </select>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Workbook snapshot rates. A dash means the workbook has no comparable rate.
                Workload cost assumes 2,000 input and 500 output tokens per request.
              </p>
            </div>

            {/* Main Data Table */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-semibold">
                    <th className="py-3 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">Model Name <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="py-3 px-3">Provider</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('inputPrice')}>
                      <div className="flex items-center gap-1">Input / 1M <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="py-3 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('outputPrice')}>
                      <div className="flex items-center gap-1">Output / 1M <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="py-3 px-3">1k Workload Cost</th>
                    <th className="py-3 px-3">ROI Target</th>
                    <th className="py-3 px-3">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                  {currentPaginatedModels.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No models found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    currentPaginatedModels.map((m) => {
                      const isBaseline = m.id === baselineModelId;
                      const isSelectedForRoi = isBaseline || roiTargetModelIds.includes(m.id);
                      // Benchmark Cost = 1,000 reqs * (2,000 in + 500 out)
                      const benchmarkCost = hasTokenRates(m) ? 2 * m.inputPrice + 0.5 * m.outputPrice : null;

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>{m.name}</span>
                            {m.isNew && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20">
                                NEW
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {m.provider}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
                              {m.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {formatPrice(m.inputPrice)}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {formatPrice(m.outputPrice)}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {formatPrice(benchmarkCost)}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              disabled={!hasTokenRates(m) || isBaseline}
                              onClick={() => toggleModelForRoi(m.id)}
                              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition ${
                                isSelectedForRoi
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {isBaseline ? 'Baseline' : !hasTokenRates(m) ? 'Rate unavailable' : isSelectedForRoi ? 'Selected' : '+ Select'}
                            </button>
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => setSelectedModelForModal(m)}
                              className="text-indigo-500 hover:underline text-[11px] font-medium"
                            >
                              View Meta
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Pagination Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: INTERACTIVE TOKEN ROI & COST CALCULATOR */}
        {activeTab === 'roi' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Controls Column */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
                      <Sliders className="w-4 h-4 text-indigo-500" />
                      <span>Workload Inputs</span>
                    </div>
                  </div>

                  {/* Baseline Model Selector */}
                  <div className="space-y-1.5">
                    <label htmlFor="roi-baseline" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Baseline Model Benchmark
                    </label>
                    <input
                      type="search"
                      aria-label="Search baseline models"
                      placeholder="Search baseline models by name, provider, or ID"
                      value={baselineSearch}
                      onChange={(event) => setBaselineSearch(event.target.value)}
                      className="w-full py-2 px-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                    {baselineQuery && <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
                      {matchingBaselines.length ? `${matchingBaselines.length} matching models` : 'No matching models. The current baseline is still selected.'}
                    </p>}
                    <select id="roi-baseline"
                      value={baselineModelId}
                      onChange={(e) => setBaselineModelId(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {baselineOptions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.provider}) - {formatPrice(m.inputPrice)} / {formatPrice(m.outputPrice)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Daily Requests */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-medium text-slate-700 dark:text-slate-300">Daily Request Volume</label>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                        {dailyRequests.toLocaleString()} reqs/d
                      </span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="1000000"
                      step="500"
                      value={dailyRequests}
                      onChange={(e) => setDailyRequests(Number(e.target.value))}
                      className="w-full accent-indigo-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Prompt Input Tokens */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-medium text-slate-700 dark:text-slate-300">Prompt Input Tokens / Req</label>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                        {inputTokens.toLocaleString()} tokens
                      </span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="128000"
                      step="500"
                      value={inputTokens}
                      onChange={(e) => setInputTokens(Number(e.target.value))}
                      className="w-full accent-indigo-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Completion Tokens */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-medium text-slate-700 dark:text-slate-300">Completion Output Tokens / Req</label>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                        {outputTokens.toLocaleString()} tokens
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="16000"
                      step="100"
                      value={outputTokens}
                      onChange={(e) => setOutputTokens(Number(e.target.value))}
                      className="w-full accent-indigo-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Estimates use workbook input and output rates before caching, batch discounts, and other fees.
                    Select comparison models from the Full Catalog.
                  </p>

                </div>
              </div>

              {/* Graphic ROI Breakdown */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      <span>Monthly Spend & Net Annual ROI</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">Real-time Comparative Engine</span>
                  </div>

                  <div className="space-y-4">
                    {roiCalculations.results.map((res) => {
                      const widthPercentage = (res.monthlyTotalCost / maxMonthlyRoiCost) * 100;
                      const isBaseline = res.id === baselineModelId;

                      return (
                        <div key={res.id} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2 font-medium">
                              <span className="text-slate-800 dark:text-slate-200 font-bold">{res.name}</span>
                              <span className="text-[10px] text-slate-400">({res.provider})</span>
                              {isBaseline && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 text-[10px] font-bold border border-indigo-500/20">
                                  BASELINE
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 font-mono">
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                ${res.monthlyTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /mo
                              </span>
                            </div>
                          </div>

                          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(widthPercentage, 1)}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Annual Spend: ${res.annualTotalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            {!isBaseline && (
                              <span className={res.annualSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-500 font-semibold'}>
                                {res.annualSavings >= 0 ? (
                                  <span className="inline-flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    Net ROI: +${res.annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr ({res.savingsPct.toFixed(1)}%)
                                  </span>
                                ) : (
                                  `+${Math.abs(res.savingsPct).toFixed(1)}% vs baseline`
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: DOMAIN LEADERS */}
        {activeTab === 'leaders' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              {Object.keys(shortlists).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveLeaderCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
                    activeLeaderCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shortlists[activeLeaderCategory].map((m) => (
                <div key={m.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-indigo-500/20 bg-indigo-500/10 text-indigo-500">
                      {m.fit}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{m.parameters}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    {m.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {m.useCase}
                  </p>

                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                    <p>{m.pricing}</p>
                    <a href={m.source} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">Model source</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MEDIA & NON-TOKEN BILLING MODELS */}
        {activeTab === 'media' && (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Layers3 className="w-5 h-5 text-indigo-500" />
              Specialized Media & Non-Token Pricing Models
            </h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-semibold">
                  <th className="py-3 px-3">Company</th>
                  <th className="py-3 px-3">Model</th>
                  <th className="py-3 px-3">Capability Type</th>
                  <th className="py-3 px-3">Billing Rate / Unit</th>
                  <th className="py-3 px-3">Primary Use Case</th>
                  <th className="py-3 px-3">Key Highlights</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {media.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">{m.company}</td>
                    <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">{m.model}</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{m.type}</span></td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{m.rateUnit}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{m.domain}</td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{m.notes} <a href={m.source} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">Pricing source</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* METADATA MODAL */}
        {selectedModelForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                  {selectedModelForModal.name}
                </h3>
                <button
                  onClick={() => setSelectedModelForModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Canonical Identifier:</span>
                  <span className="font-mono text-indigo-500 font-bold">{selectedModelForModal.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-medium">Provider:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedModelForModal.provider}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Parameters:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{selectedModelForModal.parameters || 'Not listed'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Input / 1M</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{formatPrice(selectedModelForModal.inputPrice)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Output / 1M</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{formatPrice(selectedModelForModal.outputPrice)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Rate basis</span>
                    <span>{selectedModelForModal.basis}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Use Case & Domain Capabilities:</span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                    {selectedModelForModal.useCase} {selectedModelForModal.domain}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <a href={selectedModelForModal.source} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline">Pricing or model source</a>
                <button
                  onClick={() => setSelectedModelForModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
                >
                  Close Metadata
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}