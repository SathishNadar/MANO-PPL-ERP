import React, {useState, useEffect} from 'react'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

function VendorFilter({ onClose, onApplyFilters }) {
  const [jobNatures, setJobNatures] = useState([]);
  const [locations, setLocations] = useState([]);
  const [jobNatureMap, setJobNatureMap] = useState({});
  const [locationMap, setLocationMap] = useState({});
  const [selectedJobNatures, setSelectedJobNatures] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`${API_BASE}/vendor_api/metadata/`, {
          credentials: 'include',
          });
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setJobNatures(Object.keys(data.jobNatures || {}));
        setLocations(Object.keys(data.locations || {}));
        setJobNatureMap(data.jobNatures || {});
        setLocationMap(data.locations || {});
      } catch (error) {
        console.error("Error fetching metadata:", error); 
      }
    };
    fetchMetadata();
  }, []);
  useEffect(() => {
    console.log("Selected Filters =>", { selectedJobNatures, selectedLocations });
  }, [selectedJobNatures, selectedLocations]);
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
            <h2 className="text-xl font-semibold mb-4">Location</h2>
            <div className="relative mb-4">
              <span className="material-icons absolute left-3 top-3 text-gray-500">search</span>
              <input
                list="locations"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search Locations..."
                type="text"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = e.target.value.trim();
                    if (locations.includes(value) && !selectedLocations.includes(value)) {
                      setSelectedLocations(prev => [...prev, value]);
                    }
                    e.target.value = '';
                  }
                }}
              />
              <datalist id="locations">
                {locations.map((loc, index) => (
                  <option key={index} value={loc} />
                ))}
              </datalist>
            </div>
            <div className="border border-gray-700 rounded-lg p-2 h-64 overflow-y-auto space-y-3">
              {locations.map((loc, index) => (
                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    className="form-checkbox h-5 w-5 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    type="checkbox"
                    checked={selectedLocations.includes(loc)}
                    onChange={() => {
                      if (selectedLocations.includes(loc)) {
                        setSelectedLocations(prev => prev.filter(l => l !== loc));
                      } else {
                        setSelectedLocations(prev => [...prev, loc]);
                      }
                    }}
                  />
                  <span>{loc}</span>
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
              setSelectedLocations([]);
            }}
          >
            Clear Filters
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            onClick={() => {
              const appliedJobNatureIds = selectedJobNatures.map(nature => jobNatureMap[nature]);
              const appliedLocationIds = selectedLocations.map(loc => locationMap[loc]);
              onApplyFilters({
                jobNatureIds: appliedJobNatureIds,
                locationIds: appliedLocationIds
              });
              onClose();
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