"use client";
import { useState } from "react";

export default function MyForm() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [visible, setVisible] = useState(false); // Track visibility for animation
  const stateAbbreviations = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY",
    "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH",
    "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "AS", "GU", "MP",
    "PR", "VI"
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch('/api/fullName', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data.firstName + " " + data.lastName);
      setShowModal(true);
      setTimeout(() => setVisible(true), 10); // Allow animation to apply
    } catch (error) {
      console.error("Error fetching data:", error);
      setResult("Error fetching data.");
      setShowModal(true);
      setTimeout(() => setVisible(true), 10);
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setVisible(false);
    setTimeout(() => setShowModal(false), 300); // Delay unmounting to allow animation
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-white-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 dark:bg-gray-800 text-black dark:text-white">
        <h2 className="text-xl font-semibold mb-4 text-center">Generate a name!</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sex">Sex:</label>
            <select name="sex" className="w-full p-2 border rounded-md dark:bg-white dark:text-black">
              <option value=""></option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
          <div>
            <label htmlFor="race" className="block font-medium">Race:</label>
            <select name="race" className="w-full p-2 border rounded-md dark:bg-white dark:text-black">
              <option value=""></option>
              <option value="white">White</option>
              <option value="black">Black</option>
              <option value="asian">Asian</option>
              <option value="native">Native</option>
              <option value="hispanic">Hispanic</option>
            </select>
          </div>
          <div>
            <label htmlFor="yob" className="block font-medium">Year of Birth:</label>
            <input
              type="number"
              min="1910"
              max="2023"
              step="1"
              name="yob"
              className="w-full p-2 border rounded-md dark:bg-white dark:text-black"
            />
          </div>
          <div>
            <label htmlFor="state" className="block font-medium">State:</label>
            <select name="state" className="w-full p-2 border rounded-md dark:bg-white dark:text-black">
              <option value=""></option>
              {stateAbbreviations.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
      {/* Footer Bar */}
      <footer className="fixed bottom-0 w-full bg-gray-800 text-white text-sm p-4 text-center">
        <p>This tool uses publicly available data from the US Social Security Administration as well as the Census Bureau. Last names are from the 2010 census and first names are by year from 1910 to 2023.</p>
        <p>James McKay <strong>2025</strong></p>
      </footer>

      {/* MODAL */}
      {showModal && (
        <div 
          className={`fixed inset-0 flex items-center justify-center backdrop-blur-sm 
            transition-all duration-300`}
        >
          <div 
            className={`bg-white p-6 rounded-lg shadow-lg w-80 transform transition-all duration-300 
              ${visible ? "opacity-100 scale-100" : "opacity-0 scale-15"}`}
          >
            <h1 className="text-lg font-semibold mb-4 dark:text-black">{result}</h1>
            <button
              onClick={closeModal}
              className="w-full bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
