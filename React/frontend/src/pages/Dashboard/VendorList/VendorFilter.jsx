import React, { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

function VendorFilter({ onClose, onApplyFilters, initialCategories = [], initialJobNatureIds = [] }) {
  const [jobNatures, setJobNatures] = useState([
    "3D Animation/Corporate Video",
    "Acoustic Consulting",
    "Advocate",
    "Architect",
    "Architectural & Interior Fittings",
    "Art & Décor",
    "Audio Video Equipments"
  ]);
  const [jobNatureMap, setJobNatureMap] = useState({});
  const [selectedJobNatures, setSelectedJobNatures] = useState([]);

  const categories = ["Contractor", "Consultants", "Supplier"];
  const [selectedCategories, setSelectedCategories] = useState(initialCategories);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`${API_BASE}/vendor_api/metadata/`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        const serverJobNatures = Object.keys(data.jobNatures || {});
        if (serverJobNatures.length > 0) {
          setJobNatures(serverJobNatures);
        }
        setJobNatureMap(data.jobNatures || {});
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };
    fetchMetadata();
  }, []);

  // Sync initial IDs to names once metadata is loaded
  useEffect(() => {
    if (Object.keys(jobNatureMap).length > 0 && initialJobNatureIds.length > 0) {
      const names = Object.entries(jobNatureMap)
        .filter(([name, id]) => initialJobNatureIds.includes(id))
        .map(([name]) => name);
      setSelectedJobNatures(names);
    }
  }, [jobNatureMap, initialJobNatureIds]);

  return (
    <div className="fixed inset-0 flex items-center justify-center font-poppins bg-transparent z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-lg p-8 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Filters</h1>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Nature of Job</h2>
            <div className="relative mb-4">
              <span className="material-icons absolute left-3 top-3 text-gray-500">search</span>
              <input
                list="jobNatures"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search Jobs..."
                type="text"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = e.target.value.trim();
                    if (jobNatures.includes(value) && !selectedJobNatures.includes(value)) {
                      setSelectedJobNatures(prev => [...prev, value]);
                    }
                    e.target.value = '';
                  }
                }}
              />
              <datalist id="jobNatures">
                {jobNatures.map((nature, index) => (
                  <option key={index} value={nature} />
                ))}
              </datalist>
            </div>
            <div className="border border-gray-700 rounded-lg p-2 h-64 overflow-y-auto space-y-3">
              {jobNatures.map((nature, index) => (
                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    className="form-checkbox h-5 w-5 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    type="checkbox"
                    checked={selectedJobNatures.includes(nature)}
                    onChange={() => {
                      if (selectedJobNatures.includes(nature)) {
                        setSelectedJobNatures(prev => prev.filter(n => n !== nature));
                      } else {
                        setSelectedJobNatures(prev => [...prev, nature]);
                      }
                    }}
                  />
                  <span>{nature}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Category</h2>
            {/* Spacer to align with search bar on the left */}
            <div className="h-[42px] mb-4"></div>
            <div className="border border-gray-700 rounded-lg p-2 h-64 overflow-y-auto space-y-3">
              {categories.map((cat, index) => (
                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    className="form-checkbox h-5 w-5 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => {
                      if (selectedCategories.includes(cat)) {
                        setSelectedCategories(prev => prev.filter(c => c !== cat));
                      } else {
                        setSelectedCategories(prev => [...prev, cat]);
                      }
                    }}
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-4">
          <button
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            onClick={() => {
              setSelectedJobNatures([]);
              setSelectedCategories([]);
              onApplyFilters({ jobNatureIds: [], categories: [] });
            }}
          >
            Clear Filters
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            onClick={() => {
              const appliedJobNatureIds = selectedJobNatures.map(nature => jobNatureMap[nature]);
              onApplyFilters({
                jobNatureIds: appliedJobNatureIds,
                categories: selectedCategories
              });
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export default VendorFilter