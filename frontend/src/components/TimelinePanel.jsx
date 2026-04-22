import React, { useState } from 'react';
import { Database, Download } from 'lucide-react';

export default function TimelinePanel({ mergedData, mergeSteps }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSat, setFilterSat] = useState('all');

  const handleExport = () => {
    if(!mergedData.length) return;
    const csvRows = [];
    const headers = Object.keys(mergedData[0]);
    csvRows.push(headers.join(','));
    mergedData.forEach(row => {
      const vals = headers.map(h => row[h]);
      csvRows.push(vals.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fusion_export_${Date.now()}.csv`;
    a.click();
  };

  const filteredData = mergedData.filter(d => {
    if(filterSat !== 'all' && d.satellite !== filterSat) return false;
    if(searchQuery && !JSON.stringify(d).toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const uniqueSats = [...new Set(mergedData.map(d => d.satellite))];

  return (
    <div className="panel panel-timeline">
      <div className="panel-header" style={{justifyContent: 'space-between', width: '100%'}}>
        <div style={{display:'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 1}}>
            <Database className="panel-icon" size={18} style={{flexShrink: 0}}/>
            <h2 style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>Fusion Results</h2>
        </div>
        <div className="timeline-controls">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select className="filter-select" value={filterSat} onChange={(e) => setFilterSat(e.target.value)}>
            <option value="all">All</option>
            {uniqueSats.map(sat => <option key={sat} value={sat}>{sat}</option>)}
          </select>
        </div>
      </div>
      <div className="algo-viz">
        <div className="algo-viz-header">Algorithm Steps Trace</div>
        <div className="merge-steps">
            {mergeSteps.length === 0 && <div className="merge-step">Awaiting run...</div>}
            {mergeSteps.map((step, idx) => (
               <div key={idx} className="merge-step">
                 ▸ {step.desc}
               </div>
            ))}
        </div>
      </div>
      <div className="timeline-list">
        {filteredData.length === 0 ? (
          <div className="timeline-empty">No records.</div>
        ) : (
          <table style={{ width: '100%', fontSize: '0.75rem', color: '#e2e8f0', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead style={{ borderBottom: '1px solid rgba(0, 212, 255, 0.12)', color: '#00d4ff'}}>
                <tr>
                    <th style={{padding: '6px'}}>Time</th>
                    <th style={{padding: '6px'}}>Satellite</th>
                    <th style={{padding: '6px'}}>Payload</th>
                </tr>
            </thead>
            <tbody>
                {filteredData.slice(0, 500).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{padding: '6px', whiteSpace: 'nowrap'}}>{new Date(row.timestamp).toLocaleTimeString()}</td>
                        <td style={{padding: '6px', fontWeight: 'bold'}}>{row.satellite}</td>
                        <td style={{padding: '6px', opacity: 0.8}}>
                            {Object.entries(row).filter(([k]) => k !== 'timestamp' && k !== 'satellite').map(([k,v]) => `${k}:${v}`).join(' | ')}
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="export-section">
        <button className="export-btn" onClick={handleExport}>
          <Download size={14} style={{display:'inline', marginRight:'4px'}}/> Export CSV
        </button>
      </div>
    </div>
  );
}
