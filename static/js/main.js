let circuit = [];
let numQubits = 4;
let histogramChart = null;

// Update these constants
const MIN_QUBITS = 1;
const MAX_QUBITS = 10;
const SIMULATION_SHOTS = 200;

function initializeCircuit() {
    const qubitArea = document.getElementById('qubit-area');
    qubitArea.innerHTML = '';
    
    for (let i = 0; i < numQubits; i++) {
        const line = createQubitLine(i);
        qubitArea.appendChild(line);
    }
    
    document.getElementById('qubit-count').textContent = numQubits;
}

function createQubitLine(index) {
    const line = document.createElement('div');
    line.className = 'qubit-line';
    
    const label = document.createElement('div');
    label.className = 'qubit-label';
    label.textContent = `q${index}`;
    line.appendChild(label);
    
    const wire = document.createElement('div');
    wire.className = 'qubit-wire';
    line.appendChild(wire);
    
    const cells = document.createElement('div');
    cells.className = 'cell-container';
    
    for (let j = 0; j < 8; j++) {
        const cell = document.createElement('div');
        cell.className = 'circuit-cell';
        cell.dataset.qubit = index;
        cell.dataset.position = j;
        
        cell.addEventListener('dragover', e => {
            e.preventDefault();
            cell.classList.add('dragover');
        });
        
        cell.addEventListener('dragleave', () => {
            cell.classList.remove('dragover');
        });
        
        cell.addEventListener('drop', handleGateDrop);
        
        cells.appendChild(cell);
    }
    
    line.appendChild(cells);
    return line;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeCircuit();
    setupGateListeners();
    
    document.getElementById('add-qubit').addEventListener('click', addQubit);
    document.getElementById('remove-qubit').addEventListener('click', removeQubit);
    document.getElementById('clear-circuit').addEventListener('click', clearCircuit);
    document.getElementById('run-circuit').addEventListener('click', runSimulation);
});

function setupGateListeners() {
    document.querySelectorAll('.gate').forEach(gate => {
        gate.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('gate', gate.dataset.gate);
            gate.classList.add('dragging');
        });
        
        gate.addEventListener('dragend', (e) => {
            gate.classList.remove('dragging');
        });
    });
}

function handleGateDrop(e) {
    e.preventDefault();
    const cell = e.currentTarget;
    cell.classList.remove('dragover');
    
    const gateType = e.dataTransfer.getData('gate');
    if (!gateType) return;
    
    // Only allow placement if cell is empty
    if (cell.children.length === 0) {
        const qubit = parseInt(cell.dataset.qubit);
        const position = parseInt(cell.dataset.position);
        
        placeGate(gateType, qubit, position, cell);
    }
}

function restoreCircuitState() {
    circuit.forEach(gate => {
        const cell = document.querySelector(
            `.circuit-cell[data-qubit="${gate.qubit}"][data-position="${gate.position}"]`
        );
        if (cell) {
            placeGate(gate.type, gate.qubit, gate.position, cell);
        }
    });
}

function placeGate(gateType, qubit, position, cell) {
    // Clear any existing content
    cell.innerHTML = '';
    
    const gate = document.createElement('div');
    gate.className = `gate-placed ${gateType.toLowerCase()}`;
    gate.textContent = gateType.toUpperCase();
    
    // Add color based on gate type
    const gateColors = {
        h: '#1976d2',
        x: '#e91e63',
        y: '#9c27b0',
        z: '#673ab7',
        cnot: '#2196f3',
        swap: '#009688',
        t: '#4caf50',
        s: '#ff9800'
    };
    
    gate.style.backgroundColor = gateColors[gateType.toLowerCase()] || '#1976d2';
    
    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'delete-gate';
    deleteBtn.textContent = '×';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        cell.innerHTML = '';
        removeGateFromCircuit(qubit, position);
    };
    
    gate.appendChild(deleteBtn);
    cell.appendChild(gate);
    
    // Add animation
    gate.style.opacity = '0';
    gate.style.transform = 'scale(0.8)';
    setTimeout(() => {
        gate.style.opacity = '1';
        gate.style.transform = 'scale(1)';
    }, 50);
    
    circuit.push({ type: gateType, qubit, position });
    updateCircuitStats();
}

function clearCircuit() {
    circuit = [];
    document.querySelectorAll('.circuit-cell').forEach(cell => {
        cell.innerHTML = '';
    });
    
    // Clear histogram
    if (histogramChart) {
        histogramChart.destroy();
        histogramChart = null;
    }
    
    // Reset statistics
    document.getElementById('circuit-depth').textContent = '0';
    document.getElementById('total-gates').textContent = '0';
}

function addQubit() {
    if (numQubits < MAX_QUBITS) {
        // Store the current circuit state
        const currentCircuit = [...circuit];
        numQubits++;
        initializeCircuit();
        restoreCircuitState(currentCircuit);
        updateQubitCount();
    } else {
        alert(`Maximum ${MAX_QUBITS} qubits allowed`);
    }
}

function removeQubit() {
    if (numQubits > MIN_QUBITS) {
        // Store current circuit without the last qubit's gates
        circuit = circuit.filter(gate => gate.qubit < numQubits - 1);
        numQubits--;
        initializeCircuit();
        restoreCircuitState(circuit);
        updateQubitCount();
    } else {
        alert(`Minimum ${MIN_QUBITS} qubit required`);
    }
}

function runSimulation() {
    if (circuit.length === 0) {
        alert('Please add gates to the circuit before running simulation');
        return;
    }

    // Sort circuit by position to ensure correct gate order
    const sortedCircuit = circuit.sort((a, b) => a.position - b.position);

    fetch('/simulate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            circuit: sortedCircuit,
            num_qubits: numQubits
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateHistogram(data);
        } else {
            alert('Simulation error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Simulation error:', error);
        alert('Failed to run simulation. Please try again.');
    });
}

function downloadCircuit() {
    const data = {
        circuit,
        num_qubits: numQubits
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quantum_circuit.json';
    a.click();
    URL.revokeObjectURL(url);
}

function updateQubitCount() {
    document.getElementById('qubit-count').textContent = numQubits;
}

function updateHistogram(data) {
    const ctx = document.getElementById('measurement-histogram').getContext('2d');
    
    if (histogramChart) {
        histogramChart.destroy();
    }
    
    // Generate all possible states
    const states = Array.from({length: Math.pow(2, numQubits)}, (_, i) => 
        i.toString(2).padStart(numQubits, '0')
    );
    
    const values = states.map(state => data.counts[state] || 0);
    
    // Format labels to show qubit indices
    const labels = states.map(state => {
        const indices = state.split('').map((bit, idx) => `q[${numQubits - 1 - idx}]`).join('');
        return `${state}=${indices}`;
    });

    histogramChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Shots',
                data: values,
                backgroundColor: 'rgba(25, 118, 210, 0.5)',
                borderColor: 'rgba(25, 118, 210, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: SIMULATION_SHOTS,
                    title: {
                        display: true,
                        text: 'Number of Shots'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Quantum States'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const shots = context.raw;
                            const probability = (shots / SIMULATION_SHOTS * 100).toFixed(1);
                            return `Shots: ${shots} (${probability}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateCircuitStats() {
    document.getElementById('total-gates').textContent = circuit.length;
    document.getElementById('circuit-depth').textContent = Math.max(...circuit.map(gate => gate.position), 0);
}
