import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity } from 'lucide-react';
import VisualizationPanel from './components/VisualizationPanel';
import UploadPanel from './components/UploadPanel';
import TimelinePanel from './components/TimelinePanel';

const API_BASE = 'http://localhost:8080/api';

function App() {
  const [preloadedSats, setPreloadedSats] = useState(['SAT-A', 'SAT-B', 'SAT-C']);
  const [disabledCustom, setDisabledCustom] = useState(new Set());
  const [customDatasets, setCustomDatasets] = useState({});
  const [selectedAlgo, setSelectedAlgo] = useState('kway');
  const [isMerging, setIsMerging] = useState(false);
  const [mergedData, setMergedData] = useState([]);
  const [mergeSteps, setMergeSteps] = useState([]);
  const [algoStats, setAlgoStats] = useState({ name: '-', elapsed: 0, count: 0 });
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('timeline');
  const [mockData, setMockData] = useState({});

  useEffect(() => {
    handleRunFusion();
  }, []);

  const handleRunFusion = async () => {
    setIsMerging(true);
    setMergedData([]);
    
    let currentMockData = mockData;
    try {
      const res = await axios.get(`${API_BASE}/preloaded`);
      currentMockData = res.data;
      setMockData(res.data);
    } catch(err) {
      console.error("Failed to refresh mock data", err);
    }

    const payloadArrays = [];
    preloadedSats.forEach(id => {
      if(currentMockData[id]) payloadArrays.push(currentMockData[id]);
    });
    Object.keys(customDatasets).forEach(id => {
      if(!disabledCustom.has(id)) payloadArrays.push(customDatasets[id].data);
    });
    if(payloadArrays.length === 0) {
      alert("No datasets selected.");
      setIsMerging(false);
      return;
    }
    try {
      const resp = await axios.post(`${API_BASE}/merge`, {
        algorithm: selectedAlgo,
        datasets: payloadArrays
      });
      const { result, steps, algorithm, elapsed } = resp.data;
      setMergedData(result);
      setMergeSteps(steps);
      setAlgoStats({ name: algorithm, elapsed, count: result.length });
      setPerformanceHistory(prev => [...prev.slice(-9), { algorithm, elapsed, timestamp: new Date().toLocaleTimeString() }]);
    } catch(err) {
      console.error(err);
      alert("Merge failed.");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon"><Activity /></div>
            <div>
              <h1 className="logo-title">SatFusion</h1>
              <span className="logo-sub">Satellite Data Fusion Dashboard</span>
            </div>
          </div>
          <div className="header-nav">
            <div className="status-badge"><div className="status-dot"></div> Live</div>
            <div className="algo-indicator">Algorithm: <span>{algoStats.name}</span></div>
          </div>
        </div>
      </header>
      <main className="main-layout">
        <UploadPanel 
          preloadedSats={preloadedSats} 
          setPreloadedSats={setPreloadedSats}
          customDatasets={customDatasets}
          setCustomDatasets={setCustomDatasets}
          disabledCustom={disabledCustom}
          setDisabledCustom={setDisabledCustom}
          selectedAlgo={selectedAlgo}
          setSelectedAlgo={setSelectedAlgo}
          handleRunFusion={handleRunFusion}
          isMerging={isMerging}
        />
        <VisualizationPanel 
          mergedData={mergedData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          customDatasets={customDatasets}
          performanceHistory={performanceHistory}
        />
        <TimelinePanel 
          mergedData={mergedData} 
          mergeSteps={mergeSteps} 
        />
      </main>
    </>
  );
}

export default App;
