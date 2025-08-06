import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from '../../SidebarComponent/sidebar'
import VendorCreate from "./VendorCreate";

const API_URI = import.meta.env.VITE_API_URI;
const PORT = import.meta.env.VITE_BACKEND_PORT;

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
  const itemsPerPage = 11;
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryFromQuery = parseInt(queryParams.get("category") || "0");

  const flipObject = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));

  const fetchMetadata = async () => {
    try {
      const response = await fetch(`http://${API_URI}:${PORT}/vendor_api/metadata/`);
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
        const res = await fetch(`http://${API_URI}:${PORT}/vendor_api/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tab: 1,
            order: "ASC",
            locationIds: [],
            jobNatureIds: [],
            category: categoryFromQuery,
          }),
        });
        const data = await res.json();
        const enrichedVendors = (data.vendors || []).map(vendor => ({
          ...vendor,
          job_nature_name: jobNatures[vendor.job_nature_id] || "--",
          location_name: locations[vendor.location_id] || "--",
          category_name: CategoryDict[vendor.category_id] || "-"
        }));
        setVendors(enrichedVendors);
      } catch (err) {
        console.error("Error fetching vendors", err);
      }
    };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (Object.keys(jobNatures).length && Object.keys(locations).length) {
      fetchVendors();
    }
  }, [categoryFromQuery, jobNatures, locations]);

  const paginatedVendors = vendors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
    <Sidebar />
    <div className="flex flex-col flex-1 h-full">
    <main className="flex-1 p-8 bg-gray-900 text-white">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Vendor List
          </h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="bg-gray-800 border border-gray-700 rounded-full py-2 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                search
              </span>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full flex items-center space-x-2 transition duration-300">
              <span>Filter</span>
              <span className="material-icons">filter_list</span>
            </button>
            <button
              onClick={() => setShowVendorForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full flex items-center space-x-2 transition duration-300"
            >
              <span>Add Vendor</span>
              <span className="material-icons">add</span>
            </button>
          </div>
        </header>

        <div className="bg-gray-800 rounded-lg shadow-lg w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-700">
                <tr>
                  {[
                    "Company Name",
                    "Nature of Job",
                    "Category",
                    "Phone",
                    "Email",
                    "Location",
                    "Website",
                    "",
                  ].map((heading, idx) => (
                    <th
                      key={idx}
                      className="p-4 text-sm font-semibold text-gray-400"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedVendors.map((vendor, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-700 hover:bg-gray-700 transition duration-300"
                    onClick={() => setSelectedVendor(vendor)}
                  >
                    <td className="p-4 text-white">{vendor.name}</td>
                    <td className="p-4 text-gray-300">{vendor.job_nature_name}</td>
                    <td className="p-4 text-gray-300">{vendor.category_name}</td>
                    <td className="p-4 text-gray-300">{vendor.mobile}</td>
                    <td className="p-4 text-gray-300">{vendor.email}</td>
                    <td className="p-4 text-gray-300">{vendor.location_name}</td>
                    <td className="p-4 text-blue-400 hover:underline">
                      <a href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noopener noreferrer">
                        {vendor.website}
                      </a>
                    </td>
                    <td className="p-4">
                      <button className="text-gray-400 hover:text-white">
                        <span className="material-icons">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: Math.ceil(vendors.length / itemsPerPage) }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {selectedVendor && (
          <>
            <div className="fixed inset-0 bg-opacity-30 backdrop-blur-[2px] z-40" />
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="bg-gray-800 text-white rounded-xl shadow-xl w-11/12 max-w-2xl p-6 border border-gray-600">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Vendor Details</h2>
                  <button onClick={() => setSelectedVendor(null)} className="text-gray-400 hover:text-white">
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Company Name:</strong> {selectedVendor.name}</div>
                  <div><strong>Contact Person:</strong> {selectedVendor.contact_person}</div>
                  <div><strong>Mobile:</strong> {selectedVendor.mobile}</div>
                  <div><strong>Email:</strong> {selectedVendor.email}</div>
                  <div><strong>Telephone:</strong> {selectedVendor.telephone_no}</div>
                  <div><strong>Website:</strong> {selectedVendor.website}</div>
                  <div><strong>Location:</strong> {selectedVendor.location_name}</div>
                  <div><strong>Category:</strong> {selectedVendor.category_name}</div>
                  <div><strong>Nature of Job:</strong> {selectedVendor.job_nature_name}</div>
                  <div><strong>GST No:</strong> {selectedVendor.gst_no}</div>
                  <div><strong>Constitution:</strong> {selectedVendor.constitution}</div>
                  <div><strong>Address:</strong> {selectedVendor.address}</div>
                  <div><strong>Reference:</strong> {selectedVendor.reference}</div>
                  <div><strong>Remarks:</strong> {selectedVendor.remarks}</div>
                </div>
                <div className="mt-6 text-right">
                  <button
                    onClick={() => {
                      const vendorDetails = `
                        Company Name: ${selectedVendor.name}
                        Contact Person: ${selectedVendor.contact_person}
                        Mobile: ${selectedVendor.mobile}
                        Email: ${selectedVendor.email}
                        Telephone: ${selectedVendor.telephone_no}
                        Website: ${selectedVendor.website}
                        Location: ${selectedVendor.location_name}
                        Category: ${selectedVendor.category_name}
                        Nature of Job: ${selectedVendor.job_nature_name}
                        GST No: ${selectedVendor.gst_no}
                        Constitution: ${selectedVendor.constitution}
                        Address: ${selectedVendor.address}
                        Reference: ${selectedVendor.reference}
                        Remarks: ${selectedVendor.remarks}
                      `.trim();
                      navigator.clipboard.writeText(vendorDetails);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition"
                  >
                    Copy Details
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {showVendorForm && (
      <>
       <div className="fixed inset-0 bg-opacity-30 backdrop-blur-[2px] z-40" />
         <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-8">
          <div className="relative w-full max-w-4xl bg-transparent">
           <VendorCreate onClose={() => setShowVendorForm(false)} />
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