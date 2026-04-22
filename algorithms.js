/**
 * algorithms.js — Merge Algorithm Implementations
 * K-Way Merge Sort, Heap Merge, Naive Merge
 * All with step-by-step visualization tracking
 */

// ──────────────────────────────────────────────
// Min-Heap Implementation
// ──────────────────────────────────────────────
class MinHeap {
  constructor() { this.heap = []; }

  insert(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  extractMin() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      const parentTime = this.heap[parent]._time || new Date(this.heap[parent].timestamp).getTime();
      const iTime = this.heap[i]._time || new Date(this.heap[i].timestamp).getTime();
      if (parentTime <= iTime) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1, right = 2 * i + 2;
      
      if (left < n) {
        const leftTime = this.heap[left]._time || new Date(this.heap[left].timestamp).getTime();
        const smallestTime = this.heap[smallest]._time || new Date(this.heap[smallest].timestamp).getTime();
        if (leftTime < smallestTime) smallest = left;
      }
      
      if (right < n) {
        const rightTime = this.heap[right]._time || new Date(this.heap[right].timestamp).getTime();
        const smallestTime = this.heap[smallest]._time || new Date(this.heap[smallest].timestamp).getTime();
        if (rightTime < smallestTime) smallest = right;
      }

      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }

  size() { return this.heap.length; }
  peek() { return this.heap[0] || null; }
  toArray() { return [...this.heap]; }
}

// ──────────────────────────────────────────────
// K-Way Merge Sort (Min-Heap Based)
// ──────────────────────────────────────────────
function kWayMerge(arrays) {
  const heap = new MinHeap();
  const pointers = new Array(arrays.length).fill(0);
  const result = [];
  const steps = [];

  // Pre-parse timestamps for performance and reliability
  const preParsedArrays = arrays.map(arr => 
    arr.map(item => ({ ...item, _time: new Date(item.timestamp).getTime() }))
       .sort((a, b) => a._time - b._time)
  );

  // Initialize heap with first element of each array
  preParsedArrays.forEach((arr, idx) => {
    if (arr.length > 0) {
      heap.insert({ ...arr[0], _srcIdx: idx });
    }
  });

  steps.push({
    type: 'init',
    desc: `Initialized min-heap with ${heap.size()} elements (one from each satellite)`,
    heapState: heap.toArray().map(x => `[${x.satellite}] ${new Date(x.timestamp).toLocaleTimeString()}`),
    extracted: null,
    columns: preParsedArrays.map((arr, i) => ({ sat: arr[0]?.satellite || `Array${i}`, ptr: 0, len: arr.length })),
  });

  while (heap.size() > 0) {
    const min = heap.extractMin();
    const srcIdx = min._srcIdx;
    pointers[srcIdx]++;

    const clean = { ...min };
    delete clean._srcIdx;
    delete clean._time; // Remove internal tracking property
    result.push(clean);

    // Always advance the heap with next element from the same source
    if (preParsedArrays[srcIdx][pointers[srcIdx]]) {
      heap.insert({ ...preParsedArrays[srcIdx][pointers[srcIdx]], _srcIdx: srcIdx });
    }

    // Track up to 30 steps for visualization
    if (steps.length < 30) {
      steps.push({
        type: 'extract',
        desc: `Extracted [${min.satellite}] @ ${new Date(min.timestamp).toLocaleTimeString()} → result[${result.length - 1}]`,
        heapState: heap.toArray().slice(0, 8).map(x => `[${x.satellite}] ${new Date(x.timestamp).toLocaleTimeString()}`),
        extracted: min.satellite,
        columns: preParsedArrays.map((arr, i) => ({ sat: arr[0]?.satellite || `Array${i}`, ptr: pointers[i], len: arr.length })),
      });
    }
  }

  steps.push({
    type: 'done',
    desc: `✅ Merge complete! ${result.length} records unified in chronological order`,
    heapState: [],
    extracted: null,
    columns: [],
  });

  return { result, steps };
}

// ──────────────────────────────────────────────
// Heap Merge (Similar but tracks differently)
// ──────────────────────────────────────────────
function heapMerge(arrays) {
  const heap = new MinHeap();
  const steps = [];

  // Pre-parse and sort sources
  const preParsedArrays = arrays.map(arr => 
    arr.map(item => ({ ...item, _time: new Date(item.timestamp).getTime() }))
       .sort((a, b) => a._time - b._time)
  );

  let totalInserted = 0;
  preParsedArrays.forEach((arr, idx) => {
    arr.forEach(item => {
      heap.insert({ ...item, _srcIdx: idx });
      totalInserted++;
    });
    steps.push({
      type: 'insert',
      desc: `Inserted all ${arr.length} records from ${arr[0]?.satellite} into priority queue (total: ${totalInserted})`,
      heapState: heap.toArray().slice(0, 8).map(x => `[${x.satellite}] ${new Date(x.timestamp).toLocaleTimeString()}`),
      extracted: arr[0]?.satellite,
      columns: [],
    });
  });

  const result = [];
  while (heap.size() > 0) {
    const min = heap.extractMin();
    const clean = { ...min };
    delete clean._srcIdx;
    delete clean._time;
    result.push(clean);

    if (steps.length < 30) {
      steps.push({
        type: 'extract',
        desc: `Extracted min: [${min.satellite}] @ ${new Date(min.timestamp).toLocaleTimeString()}`,
        heapState: heap.toArray().slice(0, 8).map(x => `[${x.satellite}] ${new Date(x.timestamp).toLocaleTimeString()}`),
        extracted: min.satellite,
        columns: [],
      });
    }
  }

  steps.push({
    type: 'done',
    desc: `✅ Heap merge complete! ${result.length} records processed`,
    heapState: [],
    extracted: null,
    columns: [],
  });

  return { result, steps };
}

// ──────────────────────────────────────────────
// Naive Merge (Concatenate + Sort)
// ──────────────────────────────────────────────
function naiveMerge(arrays) {
  const steps = [];
  const combined = [];
  
  arrays.forEach(arr => {
    // Pre-parse timestamps for reliable sorting
    const parsed = arr.map(item => ({ ...item, _time: new Date(item.timestamp).getTime() }));
    combined.push(...parsed);
    
    steps.push({
      type: 'concat',
      desc: `Concatenated ${arr.length} records from ${arr[0]?.satellite} — running total: ${combined.length}`,
      heapState: [],
      extracted: arr[0]?.satellite,
      columns: [],
    });
  });

  steps.push({
    type: 'sort',
    desc: `Sorting ${combined.length} records using JavaScript Array.sort (TimSort) — O(N log N)`,
    heapState: [],
    extracted: null,
    columns: [],
  });

  // Sort by pre-parsed time
  const result = combined.sort((a, b) => a._time - b._time);
  
  // Clean up internal tracking property
  result.forEach(r => delete r._time);

  steps.push({
    type: 'done',
    desc: `✅ Naive merge complete! ${result.length} records sorted chronologically`,
    heapState: [],
    extracted: null,
    columns: [],
  });

  return { result, steps };
}

// ──────────────────────────────────────────────
// Main Merge Dispatcher
// ──────────────────────────────────────────────
function runMerge(arrays, algorithm) {
  const start = performance.now();
  let output;

  switch (algorithm) {
    case 'heap':  output = heapMerge(arrays); break;
    case 'naive': output = naiveMerge(arrays); break;
    default:      output = kWayMerge(arrays);  break;
  }

  const elapsed = +(performance.now() - start).toFixed(3);
  return { ...output, elapsed, algorithm };
}
