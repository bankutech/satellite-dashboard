import React, { useRef } from 'react';
import { Upload, Satellite, Cpu, Shuffle, SortAsc } from 'lucide-react';

export default function UploadPanel({ 
  preloadedSats, setPreloadedSats, 
  customDatasets, setCustomDatasets,
  disabledCustom, setDisabledCustom,
  selectedAlgo, setSelectedAlgo,
  handleRunFusion, isMerging 
}) {
  const fileInputRef = useRef();

  const toggleSat = (id) => {
    setPreloadedSats(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleCustomSat = (id) => {
    setDisabledCustom(prev => {
      const newSet = new Set(prev);
      if(newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target.result;
        let data;
        if(file.name.endsWith('.json')) data = JSON.parse(content);
        else data = parseCSV(content);
        const satId = `CUST-${file.name.replace(/\.[^.]+$/, '').toUpperCase().slice(0,6)}`;
        const _hue = Math.floor(Math.random() * 360);
        const newDataset = {
          id: satId,
          name: file.name.replace(/\.[^.]+$/, ''),
          color: `hsl(${_hue}, 80%, 60%)`,
          bg: `hsla(${_hue}, 80%, 60%, 0.15)`,
          data: data.map(d => ({...d, satellite: satId}))
        };
        setCustomDatasets(prev => ({...prev, [satId]: newDataset}));
      } catch(err) {
        alert("Error parsing file. Ensure valid JSON or CSV.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const parseCSV = (csv) => {
    const lines = csv.split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const vals = line.split(',');
      const obj = {};
      headers.forEach((h, i) => {
        let v = vals[i].trim();
        if(!isNaN(v)) v = parseFloat(v);
        obj[h] = v;
      });
      return obj;
    });
  };

  return (
    <div className="panel panel-upload">
      <div className="panel-header">
        <Satellite className="panel-icon"/>
        <h2>Data Sources</h2>
      </div>
      <div className="section-label">Preloaded Satellites</div>
      <div className="preload-satellites">
        {['SAT-A', 'SAT-B', 'SAT-C', 'SAT-D'].map(sat => (
          <div key={sat} className={`satellite-card ${preloadedSats.includes(sat) ? 'active' : ''}`} onClick={() => toggleSat(sat)}>
            <div className="sat-icon">📡</div>
            <div className="sat-info">
              <div className="sat-name">{sat}</div>
            </div>
            <div className={`sat-toggle ${preloadedSats.includes(sat) ? 'active' : ''}`}>
              {preloadedSats.includes(sat) ? 'ON' : 'OFF'}
            </div>
          </div>
        ))}
      </div>
      <div className="section-label" style={{marginTop:'10px'}}>Custom Upload</div>
      <div className="upload-zone" onClick={() => fileInputRef.current.click()}>
        <Upload className="upload-icon" />
        <div className="upload-text">Drop CSV/JSON or Click</div>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{display:'none'}} accept=".csv,.json"/>
      </div>
      <div className="preload-satellites" style={{marginTop:'5px'}}>
        {Object.values(customDatasets).map(dataset => (
          <div key={dataset.id} className={`satellite-card ${!disabledCustom.has(dataset.id) ? 'active' : ''}`} onClick={() => toggleCustomSat(dataset.id)}>
             <div className="sat-icon" style={{background: dataset.color}}>📡</div>
             <div className="sat-info">
               <div className="sat-name">{dataset.name}</div>
               <div className="sat-meta">{dataset.data.length} records</div>
             </div>
             <div className={`sat-toggle ${!disabledCustom.has(dataset.id) ? 'active' : ''}`}>
               {!disabledCustom.has(dataset.id) ? 'ON' : 'OFF'}
             </div>
          </div>
        ))}
      </div>
      <div className="section-label" style={{marginTop:'10px'}}>Merge Algorithm</div>
      <div className="algo-selector">
        <button className={`algo-btn ${selectedAlgo === 'kway' ? 'active':''}`} onClick={() => setSelectedAlgo('kway')}>
          <Cpu className="algo-icon"/>
          <div>
            <div className="algo-name">K-Way Merge (Min-Heap)</div>
            <div className="algo-desc">O(N log K) - Best for multi-streams</div>
          </div>
        </button>
        <button className={`algo-btn ${selectedAlgo === 'heap' ? 'active':''}`} onClick={() => setSelectedAlgo('heap')}>
          <SortAsc className="algo-icon"/>
          <div>
            <div className="algo-name">Heap Merge</div>
            <div className="algo-desc">O(N log N) - Queue entire set</div>
          </div>
        </button>
        <button className={`algo-btn ${selectedAlgo === 'naive' ? 'active':''}`} onClick={() => setSelectedAlgo('naive')}>
          <Shuffle className="algo-icon"/>
          <div>
            <div className="algo-name">Naive Concat + Sort</div>
            <div className="algo-desc">O(N log N) - Python Timsort baseline</div>
          </div>
        </button>
      </div>
      <button className={`run-btn ${isMerging ? 'running':''}`} onClick={handleRunFusion} disabled={isMerging}>
        {isMerging ? 'FUSING...' : 'RUN FUSION'}
      </button>
    </div>
  );
}
