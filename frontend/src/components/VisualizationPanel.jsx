import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, Filler, RadialLinearScale } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Activity } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, Filler, Title, Tooltip, Legend);

ChartJS.defaults.color = '#a1a1aa';
ChartJS.defaults.font.family = 'Inter, sans-serif';

const MOCK_COLORS = {
  'SAT-A': { bg: 'rgba(255, 255, 255, 0.1)', border: '#ffffff' },
  'SAT-B': { bg: 'rgba(161, 161, 170, 0.15)', border: '#a1a1aa' },
  'SAT-C': { bg: 'rgba(244, 63, 94, 0.15)', border: '#f43f5e' },
  'SAT-D': { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981' }
};

export default function VisualizationPanel({ mergedData, activeTab, setActiveTab, customDatasets, performanceHistory }) {
  const chartData = useMemo(() => {
    if(!mergedData || mergedData.length === 0) return null;
    const grouped = {};
    mergedData.forEach(d => {
      if(!grouped[d.satellite]) grouped[d.satellite] = [];
      grouped[d.satellite].push(d);
    });
    const allTimes = [...new Set(mergedData.map(d => d.timestamp))].sort();
    const labels = allTimes.map(t => new Date(t).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12: false}));
    if(activeTab === 'timeline') {
      const datasets = Object.keys(grouped).map(sat => {
        const dataArr = allTimes.map(t => {
          const rec = grouped[sat].find(r => r.timestamp === t);
          if(!rec) return null;
          const numKey = Object.keys(rec).find(k => k!=='timestamp' && k!=='satellite' && typeof rec[k]==='number');
          return numKey ? rec[numKey] : null;
        });
        let colorConfig = MOCK_COLORS[sat];
        if(!colorConfig && customDatasets[sat]) {
            colorConfig = { bg: customDatasets[sat].bg, border: customDatasets[sat].color };
        } else if(!colorConfig) {
            colorConfig = { bg: 'rgba(255,255,255,0.1)', border: '#ffffff' };
        }
        return {
          label: sat,
          data: dataArr,
          borderColor: colorConfig.border,
          backgroundColor: colorConfig.bg,
          borderWidth: 2,
          pointRadius: 3,
          spanGaps: true,
        };
      });
      return { type: 'line', data: { labels, datasets } };
    }
    if(activeTab === 'multi') {
      const metrics = [];
      Object.keys(grouped).forEach(sat => {
        const records = grouped[sat];
        if(!records.length) return;
        const numKeys = Object.keys(records[0]).filter(k => k!=='timestamp' && k!=='satellite' && typeof records[0][k]==='number');
        numKeys.slice(0,3).forEach(key => {
          const valid = records.map(r => r[key]).filter(v => v!=null);
          const avg = valid.reduce((a,b)=>a+b, 0) / valid.length;
          let cc = MOCK_COLORS[sat] || (customDatasets[sat] ? {bg: customDatasets[sat].bg, border: customDatasets[sat].color} : {bg: 'rgba(255,255,255,0.1)', border: '#ffffff'});
          metrics.push({
             label: `${sat} - ${key}`,
             avg,
             bg: cc.bg,
             border: cc.border
          });
        });
      });
      return {
        type: 'bar',
        data: {
          labels: metrics.map(m => m.label),
          datasets: [{
            label: 'Average',
            data: metrics.map(m => m.avg),
            backgroundColor: metrics.map(m => m.bg),
            borderColor: metrics.map(m => m.border),
            borderWidth: 1
          }]
        }
      }
    }
    if(activeTab === 'performance') {
      return {
        type: 'bar',
        data: {
          labels: performanceHistory.map((h, i) => `${h.algorithm} (#${i+1})`),
          datasets: [{
            label: 'Latency (ms)',
            data: performanceHistory.map(h => h.elapsed),
            backgroundColor: performanceHistory.map(h => h.algorithm === 'kway' ? 'rgba(255,255,255,0.8)' : 'rgba(161,161,170,0.5)'),
            borderColor: '#fff',
            borderWidth: 1
          }]
        }
      }
    }

    return null;
  }, [mergedData, activeTab, customDatasets, performanceHistory]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { right: 30, left: 10 }
    },
    plugins: {
      legend: { position: 'top', labels: { color: '#e2e8f0'} },
    },
    scales: activeTab === 'timeline' ? {
      y: { grid: { color: 'rgba(255,255,255,0.05)'}, ticks: {color: '#94a3b8'} },
      x: { grid: { color: 'rgba(255,255,255,0.05)'}, ticks: {color: '#94a3b8', maxTicksLimit: 15} }
    } : undefined
  };

  return (
    <div className="panel panel-viz">
      <div className="panel-header">
        <Activity className="panel-icon"/>
        <h2>Live Fusion Visualization</h2>
        <div className="viz-controls">
          <button className={`viz-tab ${activeTab==='timeline'?'active':''}`} onClick={()=>setActiveTab('timeline')}>Timeline</button>
          <button className={`viz-tab ${activeTab==='multi'?'active':''}`} onClick={()=>setActiveTab('multi')}>Multi-Metric</button>
          <button className={`viz-tab ${activeTab==='performance'?'active':''}`} onClick={()=>setActiveTab('performance')}>Performance</button>
        </div>
      </div>
      <div className="chart-container">
        {mergedData.length === 0 ? (
          <div className="chart-placeholder">
            <p>Run Fusion to visualize generated satellite data</p>
          </div>
        ) : (
          <div className="canvas-wrapper" style={{position:'relative', minWidth: activeTab==='timeline' ? Math.max(800, mergedData.length * 5) : '100%', height:'100%'}}>
              {chartData?.type === 'line' && <Line id="mainChart" data={chartData.data} options={options} />}
              {chartData?.type === 'bar' && <Bar id="mainChart" data={chartData.data} options={options} />}
          </div>
        )}
      </div>
    </div>
  );
}
