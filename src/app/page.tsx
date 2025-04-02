"use client";
import { useState } from "react";
import "xp.css/dist/XP.css";

export default function MyForm() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [help, setHelp] = useState(false);
  const stateAbbreviations = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY",
    "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH",
    "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let retries = 0;
    const formData = new FormData(e.currentTarget);

    while(true)
    {
      setLoading(true);
      let res = null;

      try
      {
        res = await fetch('/api/fullName', {
          method: 'POST',
          body: formData,
        });
        if (res.status == 504)
        {
          throw new Error("Timeout");
        }
        const data = await res.json();
        setResult(data.firstName + " " + data.lastName);
        setHelp(false);
        setShowModal(true);
        break;
      }
      catch (error)
      {
        if (res?.status == 504)
        {
          retries++;
          if (retries < 3)
          {
            continue;
          }
          else
          {
            console.error("Timed out, too many retries");
            setResult(`Timed out. Try again later`);
          }
        }
        else
        {
          console.error("Error fetching data:", {res});
          setResult(`Error fetching data: ${error}. Try again?`);
        }
        setHelp(false);
        setShowModal(true);
        setLoading(false); 
        break;
      }
      finally
      {
        setLoading(false);  
      }
    }
  }

  async function handleHelp() {
    setResult(`This tool uses publicly available data from the US Social Security Administration as well as the Census Bureau. Last names are from the 2010 census and first names are by year from 1910 to 2023.`);
    setHelp(true);
    setShowModal(true);
    setLoading(false);
  }

  function closeModal() {
    setTimeout(() => setShowModal(false), 10); // Delay unmounting to allow animation
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-white-100">
      <div className="window" style={{width: 350}}>
        <div className="title-bar">
          <div className="title-bar-text">Generate a name!</div>
          <div className="title-bar-controls">
            <button aria-label="Help" onClick={handleHelp}></button>
          </div>
        </div>
        <div className="window-body">
          <form onSubmit={handleSubmit} className="space-y-3">
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
                className="w-full p-2 border bg-white dark:bg-white dark:text-black"
              />
            </div>
            <div>
              <label htmlFor="state" className="font-medium">State:</label>
              <select name="state" className="w-full p-2 border rounded-md dark:bg-white dark:text-black">
                <option value=""></option>
                {stateAbbreviations.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <section className="field-row">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? "Loading..." : "Submit"}
              </button>
            </section>
          </form>
          {loading && <progress style={{width: "90%", marginLeft: "5%", marginTop: 10, marginBottom: 10}}/>}
          <div className="status-bar">
            <div className="status-bar-field">James McKay 2025</div>
            <div className="status-bar-field">Click the ? for info</div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div 
          className={`fixed inset-0 flex items-center justify-center
            transition-all duration-300`}
        >
          <div className="window" style={help ? {}: {}}>
            <div className="title-bar">
              <div className="title-bar-text">{help ? "Data sourcing" : "Result"}</div>
              <div className="title-bar-controls">
                <button
                  onClick={closeModal}
                  aria-label = "Close">
                </button>
              </div>
            </div>
            {!help && (
            <h2 className="dark:text-black" style={{margin:5}}>{result}</h2>
            )}
            {help && (
              <div className="window-body">
              <pre>
              <p>This tool uses publicly available data</p>
              <p>from the US Social Security Administration</p>
              <p>as well as the Census Bureau. Last names</p>
              <p>are from the 2010 census and first names</p>
              <p>are by year from 1910 to 2023.</p>
              </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
