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

function removeGateFromCircuit(qubit, position) {
    const index = circuit.findIndex(gate => gate.qubit === qubit && gate.position === position);
    if (index > -1) {
        circuit.splice(index, 1);
        updateCircuitStats();
    }
}

function placeGate(gateType, qubit, position, cell) {
    // Validate gate placement
    if (!validateGatePlacement(gateType, qubit, position)) {
        return;
    }

    // Remove any existing gate at this position first
    removeGateFromCircuit(qubit, position);

    cell.innerHTML = '';
    const gate = document.createElement('div');
    gate.className = `gate-placed ${gateType.toLowerCase()}`;
    gate.textContent = gateType.toUpperCase();

    // Add visual indicators for multi-qubit gates
    if (gateType === 'cnot') {
        addCNOTConnections(gate, qubit);
    } else if (gateType === 'swap') {
        addSWAPConnections(gate, qubit);
    } else if (gateType === 'toff') {
        addToffoliConnections(gate, qubit);
    }

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

function addCNOTConnections(gate, qubit) {
    const control = document.createElement('div');
    control.className = 'control-point';
    gate.appendChild(control);

    const target = document.createElement('div');
    target.className = 'target-point';
    
    // Add connection line
    const connection = document.createElement('div');
    connection.className = 'gate-connection';
    connection.style.height = '50px';
    gate.appendChild(connection);
}

function addSWAPConnections(gate, qubit) {
    const connection = document.createElement('div');
    connection.className = 'gate-connection swap';
    connection.style.height = '50px';
    gate.appendChild(connection);
}

function addToffoliConnections(gate, qubit) {
    // Add two control points and one target
    for (let i = 0; i < 2; i++) {
        const control = document.createElement('div');
        control.className = 'control-point';
        control.style.top = `${(i + 1) * 50}px`;
        gate.appendChild(control);
    }

    const connection = document.createElement('div');
    connection.className = 'gate-connection toffoli';
    connection.style.height = '100px';
    gate.appendChild(connection);
}

function validateGatePlacement(gateType, qubit, position) {
    // Hadamard gate can be placed on any qubit
    if (gateType === 'h') {
        return true;
    }
    
    // CNOT and SWAP need two adjacent qubits
    if ((gateType === 'cnot' || gateType === 'swap') && qubit >= numQubits - 1) {
        alert(`${gateType.toUpperCase()} gate requires two adjacent qubits`);
        return false;
    }

    // Toffoli needs three adjacent qubits
    if (gateType === 'toff' && qubit >= numQubits - 2) {
        alert('Toffoli gate requires three adjacent qubits');
        return false;
    }

    return true;
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
        console.log("Simulation response:", data); // Debug log
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
    if (!data || !data.counts) {
        console.error('Invalid data received');
        return;
    }

    const ctx = document.getElementById('measurement-histogram').getContext('2d');
    if (histogramChart) {
        histogramChart.destroy();
    }

    // Generate states in proper order
    const states = Array.from({length: Math.pow(2, numQubits)}, (_, i) => 
        i.toString(2).padStart(numQubits, '0')
    ).sort();

    // Map values maintaining circuit qubit order
    const values = states.map(state => {
        // Get count for this state directly - no need to transform
        return data.counts[state] || 0;
    });

    // Create labels showing qubit indices
    const labels = states.map(state => {
        // Split state into individual bits
        const bits = state.split('');
        // Create qubit labels with q[0] at bottom
        const indices = bits.map((_, idx) => `q[${numQubits - 1 - idx}]`);
        return `${state}=${indices.join('')}`;
    });

    console.log("State mapping debug:", {
        incomingStates: Object.keys(data.counts),
        processedStates: states,
        counts: data.counts,
        values,
        total: values.reduce((a, b) => a + b, 0)
    });

    const totalShots = values.reduce((a, b) => a + b, 0);

    // Create histogram
    histogramChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Shots',
                data: values,
                backgroundColor: 'rgba(25, 118, 210, 0.5)',
                borderColor: 'rgba(25, 118, 210, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: SIMULATION_SHOTS
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const shots = context.raw;
                            const probability = (shots / SIMULATION_SHOTS * 100).toFixed(1);
                            return `${shots} shots (${probability}%)`;
                        }
                    }
                }
            },
            animation: {
                duration: 0
            }
        }
    });

    // Update debug info
    document.getElementById('debug-info').textContent = 
        JSON.stringify({
            states,
            values,
            total: totalShots,
            expected: SIMULATION_SHOTS,
            difference: SIMULATION_SHOTS - totalShots
        }, null, 2);
}

function updateCircuitStats() {
    document.getElementById('total-gates').textContent = circuit.length;
    document.getElementById('circuit-depth').textContent = Math.max(...circuit.map(gate => gate.position), 0);
}

// Theme switching logic
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme based on user preference
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    updateThemeIcon(prefersDark);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        updateThemeIcon(newTheme === 'dark');
        
        // Save theme preference
        localStorage.setItem('theme', newTheme);
    });
}

function updateThemeIcon(isDark) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    if (isDark) {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
}

// Call initTheme when DOM is loaded
document.addEventListener('DOMContentLoaded', initTheme);
