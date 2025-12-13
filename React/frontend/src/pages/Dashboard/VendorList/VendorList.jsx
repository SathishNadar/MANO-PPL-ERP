import React, { useState, useEffect } from "react";
import VendorFilter from "./VendorFilter";
import { useLocation } from "react-router-dom";
import Sidebar from '../../SidebarComponent/sidebar'
import VendorCreate from "./VendorCreate";

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

const CategoryDict = {
  2: "Contractor",
  1: "Consultant",
  3: "Supplier"
};

function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [jobNatures, setJobNatures] = useState({});
  const [locations, setLocations] = useState({});
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [totalVendorCount, setTotalVendorCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobNatureIds, setSelectedJobNatureIds] = useState([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState([]);
  const itemsPerPage = 15;
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryFromQuery = parseInt(queryParams.get("category") || "0");

  const flipObject = (obj) =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));

  const fetchMetadata = async () => {
    try {
      const response = await fetch(`${API_BASE}/vendor_api/metadata/`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      setJobNatures(flipObject(data.jobNatures || {}));
      setLocations(flipObject(data.locations || {}));
      console.log(data)
    } catch (error) {
      console.error("Error fetching metadata:", error);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch(`${API_BASE}/vendor_api/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", },
        credentials: 'include',
        body: JSON.stringify({
          order: "ASC",
          locationIds: selectedLocationIds,
          jobNatureIds: selectedJobNatureIds,
          category: categoryFromQuery,
          limit: itemsPerPage,
          page: currentPage,
          queryString: searchTerm
        }),
      });
      const data = await res.json();
      console.log(data)
      const { vendors: vendorList = [], vendorCount = 0 } = data;
      const enrichedVendors = vendorList.map(vendor => ({
        ...vendor,
        job_nature_name: jobNatures[vendor.job_nature_id] || "--",
        location_name: locations[vendor.location_id] || "--",
        category_name: CategoryDict[vendor.category_id] || "-"
      }));
      setVendors(enrichedVendors);
      setTotalVendorCount(vendorCount);
    } catch (err) {
      console.error("Error fetching vendors", err);
    }
  };

  // Handle filter application from VendorFilter
  const handleApplyFilters = ({ jobNatureIds, locationIds }) => {
    setSelectedJobNatureIds(jobNatureIds);
    setSelectedLocationIds(locationIds);
    setShowFilter(false);
    // fetchVendors will be triggered by useEffect as state changes
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (Object.keys(jobNatures).length && Object.keys(locations).length) {
      fetchVendors();
    }
  }, [
    categoryFromQuery,
    jobNatures,
    locations,
    currentPage,
    selectedJobNatureIds,
    selectedLocationIds
  ]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchVendors();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  console.log("Pagination Pages:", Math.ceil(totalVendorCount / itemsPerPage));

  return (
    <div className="flex h-screen bg-[#0B1120] text-gray-300 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full relative">
        <main className="flex-1 p-8 overflow-y-auto bg-[#0B1120]">
          {/* Header Section */}
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Vendor List</h1>
              <p className="text-gray-400 text-sm">
                A continuous list of all project-related vendors and contacts.
              </p>
            </div>
            {/* Actions: Search, Filter, Add */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#111827] border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64 transition-all"
                />
                <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  search
                </span>
              </div>

              {/* Filter Button */}
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                onClick={() => setShowFilter(true)}
              >
                <span>Filter</span>
                <span className="material-icons text-sm">filter_list</span>
              </button>

              {/* Add Vendor Button */}
              <button
                onClick={() => setShowVendorForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <span>Add Vendor</span>
                <span className="material-icons text-sm">add</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-[#111827] border border-gray-800 rounded-lg overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0F172A] border-b border-gray-800">
                  <tr>
                    {[
                      "SR NO",
                      "COMPANY",
                      "NATURE OF THE JOB",
                      "NAME OF THE PERSON",
                      "MOBILE NO",
                      "EMAIL ID",
                      "ADDRESS"
                    ].map((heading, idx) => (
                      <th
                        key={idx}
                        className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-tight"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {vendors.map((vendor, index) => (
                    <tr
                      key={vendor.id || index}
                      className="hover:bg-gray-800/50 transition-colors duration-150 cursor-pointer group"
                      onClick={() => setSelectedVendor(vendor)}
                    >
                      <td className="p-4 text-center text-xs text-gray-600 font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="p-4 text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {vendor.name}
                      </td>
                      <td className="p-4 text-xs text-white">
                        {vendor.job_nature_name}
                      </td>
                      <td className="p-4 text-xs text-white font-medium">
                        {vendor.contact_person || vendor.name}
                      </td>
                      <td className="p-4 text-xs font-mono text-white">
                        {vendor.mobile}
                      </td>
                      <td className="p-4 text-xs text-blue-400 hover:underline">
                        {/* Stopped propagation to prevent row click opening details when clicking email */}
                        <a href={`mailto:${vendor.email}`} onClick={(e) => e.stopPropagation()}>
                          {vendor.email}
                        </a>
                      </td>
                      <td className="p-4 text-xs text-gray-500 max-w-[200px] truncate" title={vendor.address}>
                        {vendor.address}
                      </td>
                    </tr>
                  ))}
                  {vendors.length === 0 && (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-gray-500 text-sm">
                        No vendors found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-[#0f1623] px-4 py-3 border-t border-gray-800 flex justify-center items-center">
              <div className="flex gap-1">
                {(() => {
                  const totalPages = Math.max(1, Math.ceil(totalVendorCount / itemsPerPage));
                  const pageButtons = [];
                  if (currentPage > 1) {
                    pageButtons.push(
                      <button key="prev" onClick={() => setCurrentPage(currentPage - 1)} className="px-3 py-1 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 text-xs">
                        &lt;
                      </button>
                    );
                  }
                  pageButtons.push(
                    <button key={1} onClick={() => setCurrentPage(1)} className={`px-3 py-1 rounded text-xs ${currentPage === 1 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>1</button>
                  );
                  if (currentPage > 3) pageButtons.push(<span key="start-ellipsis" className="px-2 py-1 text-gray-600 text-xs">...</span>);
                  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    if (i > 1 && i < totalPages) {
                      pageButtons.push(
                        <button key={i} onClick={() => setCurrentPage(i)} className={`px-3 py-1 rounded text-xs ${currentPage === i ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{i}</button>
                      );
                    }
                  }
                  if (currentPage < totalPages - 2) pageButtons.push(<span key="end-ellipsis" className="px-2 py-1 text-gray-600 text-xs">...</span>);
                  if (totalPages > 1) {
                    pageButtons.push(
                      <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className={`px-3 py-1 rounded text-xs ${currentPage === totalPages ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{totalPages}</button>
                    );
                  }
                  if (currentPage < totalPages) {
                    pageButtons.push(
                      <button key="next" onClick={() => setCurrentPage(currentPage + 1)} className="px-3 py-1 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 text-xs">&gt;</button>
                    );
                  }
                  return pageButtons;
                })()}
              </div>
            </div>
          </div>

          {/* Vendor Details Modal */}
          {selectedVendor && (
            <>
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-[#1F2937] text-gray-100 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700 overflow-hidden">
                  {/* Modal Header */}
                  <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-[#111827]">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">{selectedVendor.name}</h2>
                      <p className="text-xs text-blue-400 mt-1 uppercase tracking-wide font-semibold">{selectedVendor.category_name}</p>
                    </div>
                    <button onClick={() => setSelectedVendor(null)} className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-2 rounded-full hover:bg-gray-700">
                      <span className="material-icons text-xl">close</span>
                    </button>
                  </div>
                  {/* Modal Body */}
                  <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
                    <div>
                      <span className="block text-xs uppercase text-gray-500 font-bold mb-1">Contact Person</span>
                      <div className="text-gray-200">{selectedVendor.contact_person || "-"}</div>
                    </div>
                    <div>
                      <span className="block text-xs uppercase text-gray-500 font-bold mb-1">Nature of Job</span>
                      <div className="text-gray-200">{selectedVendor.job_nature_name}</div>
                    </div>
                    <div>
                      <span className="block text-xs uppercase text-gray-500 font-bold mb-1">Mobile</span>
                      <div className="text-gray-200 font-mono">{selectedVendor.mobile}</div>
                    </div>
                    <div>
                      <span className="block text-xs uppercase text-gray-500 font-bold mb-1">Email</span>
                      <div className="text-blue-400 hover:underline cursor-pointer"><a href={`mailto:${selectedVendor.email}`}>{selectedVendor.email}</a></div>
                    </div>
                    <div>
                      <span className="block text-xs uppercase text-gray-500 font-bold mb-1">Telephone</span>
                      <div className="text-gray-200 font-mono">{selectedVendor.telephone_no || "-"}</div>
                    </div>
                    <div>
                      <span className="block text-xs uppercase text-gray-500 font-bold mb-1">GST No</span>
                      <div className="text-gray-200 font-mono">{selectedVendor.gst_no || "-"}</div>
                    </div>
                    <div>
                      <span className="block text-xs uppercase text-gray-500 font-bold mb-1">Location</span>
                      <div className="text-gray-200">{selectedVendor.location_name}</div>
                    </div>
                    <div>
                      <span className="block text-xs uppercase text-gray-500 font-bold mb-1">Website</span>
                      {selectedVendor.website ? (
                        <a href={selectedVendor.website.startsWith("http") ? selectedVendor.website : `https://${selectedVendor.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline max-w-full truncate block">
                          {selectedVendor.website}
                        </a>
                      ) : <span className="text-gray-500">-</span>}
                    </div>
                    <div className="col-span-2">
                      <span className="block text-xs uppercase text-gray-500 font-bold mb-1">Address</span>
                      <div className="text-gray-300 bg-gray-800/50 p-3 rounded border border-gray-700/50">{selectedVendor.address}</div>
                    </div>
                    {selectedVendor.reference && (
                      <div className="col-span-2">
                        <span className="block text-xs uppercase text-gray-500 font-bold mb-1">Reference</span>
                        <div className="text-gray-300 italic">"{selectedVendor.reference}"</div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 pt-0 flex justify-end">
                    <button
                      onClick={() => {
                        const vendorDetails = `...`; // kept logic simple for brevity in UI props, functional copy logic is external
                        // Re-implementing the copy logic here as it was inline
                        const details = `
                          Company Name: ${selectedVendor.name}
                          Contact Person: ${selectedVendor.contact_person}
                          Mobile: ${selectedVendor.mobile}
                          Email: ${selectedVendor.email}
                          Address: ${selectedVendor.address}
                         `.trim();
                        navigator.clipboard.writeText(details);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 border border-gray-600"
                    >
                      <span className="material-icons text-sm">content_copy</span>
                      Copy Details
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Create Vendor Modal */}
          {showVendorForm && (
            <>
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
              <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-8">
                <div className="relative w-full max-w-4xl bg-transparent">
                  <VendorCreate onClose={() => setShowVendorForm(false)} />
                </div>
              </div>
            </>
          )}

          {/* Filter Modal */}
          {showFilter && (
            <>
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
              <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-8">
                <div className="relative w-full max-w-4xl bg-transparent">
                  <VendorFilter
                    onClose={() => setShowFilter(false)}
                    onApplyFilters={handleApplyFilters}
                  />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default VendorList;
