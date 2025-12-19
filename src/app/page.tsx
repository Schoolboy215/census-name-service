"use client";
import { useState } from "react";
import "tuicss";

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
  const [percentileValue, setPercentileValue] = useState("100");

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
    <body className="center" style={{padding: "50px"}}>
      <div className="tui-window">
        <form onSubmit={handleSubmit}>
          <fieldset className="tui-fieldset">
            <legend className="center">CENSUS NAME GENERATOR</legend>
            <fieldset className="tui-input-fieldset">
              <legend>Demographics</legend>
              <div>
                <label htmlFor="sex">Sex..........:</label>
                <select className="tui-input" name="sex">
                  <option value=""></option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div>
                <label htmlFor="race">Race.........:</label>
                <select name="race" className="tui-input">
                  <option value=""></option>
                  <option value="white">White</option>
                  <option value="black">Black</option>
                  <option value="asian">Asian</option>
                  <option value="native">Native</option>
                  <option value="hispanic">Hispanic</option>
                </select>
              </div>
              <div>
                <label htmlFor="yob">Year of Birth:</label>
                <input
                  type="number"
                  min="1910"
                  max="2023"
                  step="1"
                  name="yob"
                  className="tui-input"
                />
              </div>
              <div>
                <label htmlFor="state">State........:</label>
                <select name="state" className="tui-input">
                  <option value=""></option>
                  {stateAbbreviations.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>
            <fieldset className="tui-input-fieldset">
              <legend>Rarity</legend>
              <div>
                <label htmlFor="top">Top/Bottom....:</label>
                <select name="top" className="tui-input">
                  <option value="true">Top</option>
                  <option value="false">Bottom</option>
                </select>
              </div>
              <div>
                <label htmlFor="percentile">Nth Percentile:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  name="percentile"
                  className="tui-input"
                  value={percentileValue}
                  onChange={e => setPercentileValue(e.target.value)}
                />
              </div>
            </fieldset>
            
            <button
              type="submit"
              disabled={loading}
              className="tui-button"
              data-modal="modal"
            >
              {loading ? "Loading..." : "Submit"}
            </button>
          </fieldset>
        </form>
      </div>
      <div className="tui-overlap"></div>
      {showModal && (
        <div className={`fixed inset-0 flex items-center justify-center backdrop-brightness-50`}>
          <div className="tui-window red-168">
            <fieldset className="tui-fieldset">
              <legend className="red-255 yellow-255-text">{help ? "Data sourcing" : "Result"}</legend>
              <h1 className="text-lg font-semibold mb-4 dark:text-black">{result}</h1>
              <button className="tui-button right" data-modal="modal" onClick={closeModal}>close</button>
            </fieldset>
          </div>
        </div>
      )}
      <div className="tui-statusbar absolute cyan-168">
        <ul>
          <li><button className={`white-255-text ${showModal || loading ? ' disabled' : ''}`} disabled={showModal || loading} onClick={handleHelp}>ABOUT</button></li>
          <li><p>James McKay <strong>2025</strong></p></li>
        </ul>
      </div>
    </body>
  );
}
