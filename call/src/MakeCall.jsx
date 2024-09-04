import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

const MakeCall = () => {
  const [to, setTo] = useState('');
  const [fileNumbers, setFileNumbers] = useState([]);
  const [callSid, setCallSid] = useState('');
  const [error, setError] = useState('');
  const [isCalling, setIsCalling] = useState(false);

  const checkCallStatus = async (sid) => {
    console.log(`Checking status for SID: ${sid}`);

    while (true) {
      try {
        const response = await fetch(`http://localhost:3001/call-status/${sid}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (['completed', 'failed', 'canceled'].includes(data.status)) {
            console.log(`Call status for SID ${sid}: ${data.status}`);
            return;
          }
        } else {
          console.error('Error checking call status:', response.statusText);
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before checking again
      } catch (error) {
        console.error('Error checking call status:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Retry after a delay
      }
    }
  };

  const handleMakeCall = async (numbers) => {
    if (numbers.length === 0) {
      setError('No numbers to call.');
      return;
    }

    setIsCalling(true);
    setError(''); // Clear any previous error

    try {
      for (const number of numbers) {
        // Initiate the call
        const response = await fetch('http://localhost:3001/make-call', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ to: number }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setCallSid(data.sid);

        // Check the status of the call
        await checkCallStatus(data.sid);

        console.log(`Call completed for ${number}. Moving to the next.`);
      }
    } catch (error) {
      console.error('Error making call:', error);
      setError('Failed to make call. Please try again.');
    } finally {
      setIsCalling(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert the sheet to JSON
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log('Sheet JSON:', json);

        // Extract numbers
        const numbers = [];
        json.forEach((row) => {
          row.forEach((cell) => {
            if (typeof cell === 'string') {
              const cleaned = cell.replace(/[^\d]/g, '');
              if (/^\d+$/.test(cleaned)) {
                numbers.push(cleaned);
              }
            } else if (typeof cell === 'number') {
              numbers.push(cell.toString());
            }
          });
        });

        console.log('Extracted numbers:', numbers);

        if (numbers.length === 0) {
          setError('No valid phone numbers found in the file.');
        } else {
          setFileNumbers(numbers);
        }
      } catch (error) {
        console.error('Error reading file:', error);
        setError('Failed to read file. Please check the file format.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="make-call-container">
      <h2 className="title">Make a Call</h2>
      <input
        type="text"
        className="input-field"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        placeholder="To (Recipient's Number)"
        disabled={isCalling}
      />
      <button
        className="button"
        onClick={() => handleMakeCall([to])}
        disabled={isCalling}
      >
        {isCalling ? 'Calling...' : 'Make Call'}
      </button>
      <input
        type="file"
        className="input-file"
        accept=".xlsx"
        onChange={handleFileUpload}
        disabled={isCalling}
      />
      <button
        className="button"
        onClick={() => handleMakeCall(fileNumbers)}
        disabled={isCalling}
      >
        {isCalling ? 'Calling...' : 'Make Calls from Excel'}
      </button>
      {callSid && <p className="success-message">Call SID: {callSid}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default MakeCall;
