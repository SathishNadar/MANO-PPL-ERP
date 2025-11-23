import React, { useEffect, useState } from 'react'
import { ToastContainer, toast } from 'react-toastify';


const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

function VendorCreate({ onClose }) {
  // Add state for job natures and locations
  const [jobNatures, setJobNatures] = useState([]);
  const [locations, setLocations] = useState([]);
  const [jobNatureMap, setJobNatureMap] = useState({});
  const [locationMap, setLocationMap] = useState({});
  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    mobile: '',
    telephone_no: '',
    gst_no: '',
    address: '',
    reference: '',
    remarks: '',
    constitution: '',
    website: '',
    category_id: '',
    job_nature_text: '',
    location_text: '',
  });

  // Fetch metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`${API_BASE}/vendor_api/metadata/`, {
          credentials: 'include',});
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

  const categoryMap = {
    Contractor: 2,
    Consultant: 1,
    Supplier: 3
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.job_nature_text ||
      !form.category_id ||
      !form.mobile ||
      !form.email ||
      !form.location_text ||
      !form.website
    ) {
      toast.error("Please fill all required fields: Company Name, Nature of Job, Category, Phone, Email, Location, Website.");
      return;
    }

    const payload = {
      name: form.name,
      contact_person: form.contact_person,
      email: form.email,
      mobile: form.mobile,
      telephone_no: form.telephone_no,
      gst_no: form.gst_no,
      address: form.address,
      reference: form.reference,
      remarks: form.remarks,
      constitution: form.constitution,
      website: form.website,
      category_id: categoryMap[form.category_id],
      job_nature_id: jobNatureMap[form.job_nature_text],
      location_id: locationMap[form.location_text]
    };

    try {
      console.log("Submitting vendor with payload:", payload);
      const response = await fetch(`${API_BASE}/vendor_api/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log("Vendor added:", result);
      toast.success("Vendor successfully added into Database");
      onClose(); // Close modal on success
    } catch (err) {
      console.error("Error submitting vendor:", err);
    }
  };

  return (
    <div className="bg-gray-800 text-white rounded-xl shadow-xl w-full p-6 border border-gray-600 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Add New Vendor</h1>
            <p className="mt-2 text-[var(--text-secondary)]">
              Fill in the details below to add a new vendor to the system.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <label className="form-label" htmlFor="vendor-name">
                Company Name
              </label>
              <input
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                id="vendor-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder=""
              />
            </div>
            <div>
              <label className="form-label" htmlFor="contractor">Category</label>
              <select
                id="contractor"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="" disabled hidden>Select Category</option>
                <option value="Contractor">Contractor</option>
                <option value="Consultant">Consultant</option>
                <option value="Supplier">Supplier</option>
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="contact-person">
                Contact Person
              </label>
              <input
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                id="contact-person"
                type="text"
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                placeholder=" "
              />
            </div>
            <div>
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder=""
              />
            </div>
            <div>
              <label className="form-label" htmlFor="phone">
                Phone Number
              </label>
              <input
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                id="phone"
                type="tel"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder=""
              />
            </div>
            <div>
              <label className="form-label" htmlFor="field1">
                Website
              </label>
              <input
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                id="field1"
                type="text"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder=""
              />
            </div>
            <div>
              <label className="form-label" htmlFor="field2">
                GST Number
              </label>
              <input
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                id="field2"
                type="text"
                value={form.gst_no}
                onChange={(e) => setForm({ ...form, gst_no: e.target.value })}
                placeholder=""
              />
            </div>
            <div>
              <label className="form-label" htmlFor="field3">
                Address
              </label>
              <input
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                id="field3"
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder=""
              />
            </div>
            <div>
              <label className="form-label" htmlFor="field4">
                Reference
              </label>
              <input
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                id="field4"
                type="text"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder=""
              />
            </div>
            <div>
              <label className="form-label" htmlFor="field5">
                Remarks
              </label>
              <input
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                id="field5"
                type="text"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder=""
              />
            </div>
            <div>
              <label className="form-label" htmlFor="category">Nature of Job</label>
              <input
                id="category"
                list="jobNatureList"
                placeholder="Start typing to search..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                value={form.job_nature_text}
                onChange={(e) => setForm({ ...form, job_nature_text: e.target.value })}
              />
              <datalist id="jobNatureList">
                {jobNatures.map((job, i) => (
                  <option key={i} value={job} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="form-label" htmlFor="location">Location</label>
              <input
                id="location"
                list="locationList"
                placeholder="Start typing to search..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                value={form.location_text}
                onChange={(e) => setForm({ ...form, location_text: e.target.value })}
              />
              <datalist id="locationList">
                {locations.map((loc, i) => (
                  <option key={i} value={loc} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="mt-10 flex justify-end items-center gap-4">
            <button onClick={onClose} type="button" className="text-[var(--text-secondary)] font-medium py-3 px-6 rounded-lg hover:bg-[var(--input-background)] transition-colors duration-200">
              Cancel
            </button>
            
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Vendor
            </button>
          </div>
        </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default VendorCreate