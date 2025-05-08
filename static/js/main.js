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
    // Sort circuit by position for consistent restoration
    const sortedCircuit = [...circuit].sort((a, b) => a.position - b.position);
    
    // Clear all cells first to avoid conflicts
    document.querySelectorAll('.circuit-cell').forEach(cell => {
        cell.innerHTML = '';
    });

    // Restore gates
    sortedCircuit.forEach(gate => {
        const cell = document.querySelector(
            `.circuit-cell[data-qubit="${gate.qubit}"][data-position="${gate.position}"]`
        );
        if (cell) {
            // Store current circuit state
            const tempCircuit = [...circuit];
            // Clear circuit temporarily to avoid duplicate checks
            circuit = [];
            // Place gate with all its original properties
            placeGate(gate.type, gate.qubit, gate.position, cell, gate.target, gate.control2);
            // Restore remaining gates
            circuit = tempCircuit;
        }
    });

    updateCircuitStats();
}

function removeGateFromCircuit(qubit, position) {
    const index = circuit.findIndex(gate => gate.qubit === qubit && gate.position === position);
    if (index > -1) {
        circuit.splice(index, 1);
        updateCircuitStats();
    }
}

function placeGate(gateType, qubit, position, cell, existingTarget = null, existingControl2 = null) {
    // Validate gate placement
    if (!validateGatePlacement(gateType, qubit, position)) {
        return;
    }

    // Remove any existing gate at this position first
    removeGateFromCircuit(qubit, position);

    // For multi-qubit gates, get target selection
    let gateObj = {
        type: gateType,
        qubit: qubit,
        position: position
    };

    if (['cnot', 'swap'].includes(gateType.toLowerCase()) && numQubits >= 2) {
        const targetQubit = existingTarget !== null ? 
            existingTarget : 
            prompt(`Enter target qubit number (0 to ${numQubits-1}, different from ${qubit}):`);
        
        if (!validateTwoQubitGate(qubit, parseInt(targetQubit))) {
            return;
        }
        gateObj.target = parseInt(targetQubit);
    } else if (gateType === 'toff' && numQubits >= 3) {
        const targetQubit = existingTarget !== null ? 
            existingTarget : 
            prompt(`Enter target qubit number (0 to ${numQubits-1}):`);
        const control2 = existingControl2 !== null ? 
            existingControl2 : 
            prompt(`Enter second control qubit number (0 to ${numQubits-1}):`);
            
        if (!validateToffoliQubits(qubit, parseInt(control2), parseInt(targetQubit))) {
            return;
        }
        gateObj.target = parseInt(targetQubit);
        gateObj.control2 = parseInt(control2);
    }

    cell.innerHTML = '';
    const gate = document.createElement('div');
    gate.className = `gate-placed ${gateType.toLowerCase()}`;
    gate.textContent = gateType.toUpperCase();

    // Add visual indicators for multi-qubit gates
    if (gateType === 'cnot') {
        addCNOTConnections(gate, qubit, gateObj.target);
    } else if (gateType === 'swap') {
        addSWAPConnections(gate, qubit, gateObj.target);
    } else if (gateType === 'toff') {
        addToffoliConnections(gate, qubit, gateObj.control2, gateObj.target);
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
    
    circuit.push(gateObj);
    updateCircuitStats();
}

function addCNOTConnections(gate, control, target) {
    // Create connection line
    const connection = document.createElement('div');
    connection.className = 'gate-connection';
    connection.style.height = Math.abs(target - control) * 50 + 'px';
    gate.appendChild(connection);

    // Add control point
    const controlPoint = document.createElement('div');
    controlPoint.className = 'control-point';
    controlPoint.style.position = 'absolute';
    controlPoint.style.top = '50%';
    gate.appendChild(controlPoint);

    // Add target point
    const targetPoint = document.createElement('div');
    targetPoint.className = 'target-point';
    targetPoint.style.top = (target > control ? '100%' : '-20px');
    gate.appendChild(targetPoint);
}

function addSWAPConnections(gate, qubit1, qubit2) {
    // Create wrapper to hold the line
    const wrapper = document.createElement('div');
    wrapper.className = 'connection-wrapper';
    
    // Add connection line first
    const connection = document.createElement('div');
    connection.className = 'gate-connection';
    connection.style.height = Math.abs(qubit2 - qubit1) * 50 + 'px';
    wrapper.appendChild(connection);
    
    // Insert wrapper before any other content
    gate.insertBefore(wrapper, gate.firstChild);

    // Add SWAP symbols after
    const topSymbol = document.createElement('div');
    topSymbol.className = 'swap-symbol';
    topSymbol.innerHTML = '×';
    topSymbol.style.position = 'absolute';
    topSymbol.style.left = '50%';
    topSymbol.style.transform = 'translateX(-50%)';
    topSymbol.style.top = qubit2 > qubit1 ? '-10px' : 'calc(100% - 10px)';
    gate.appendChild(topSymbol);

    const bottomSymbol = document.createElement('div');
    bottomSymbol.className = 'swap-symbol';
    bottomSymbol.innerHTML = '×';
    bottomSymbol.style.position = 'absolute';
    bottomSymbol.style.left = '50%';
    bottomSymbol.style.transform = 'translateX(-50%)';
    bottomSymbol.style.top = qubit2 > qubit1 ? 'calc(100% - 10px)' : '-10px';
    gate.appendChild(bottomSymbol);
}

function addToffoliConnections(gate, control1, control2, target) {
    // Create wrapper to hold the line
    const wrapper = document.createElement('div');
    wrapper.className = 'connection-wrapper';
    
    // Add connection line first
    const connection = document.createElement('div');
    connection.className = 'gate-connection';
    const minQubit = Math.min(control1, control2, target);
    const maxQubit = Math.max(control1, control2, target);
    connection.style.height = (maxQubit - minQubit) * 50 + 'px';
    wrapper.appendChild(connection);
    
    // Insert wrapper before any other content
    gate.insertBefore(wrapper, gate.firstChild);

    // Add control points after
    [control1, control2].forEach(controlQubit => {
        const controlPoint = document.createElement('div');
        controlPoint.className = 'control-point';
        controlPoint.style.top = (controlQubit - minQubit) * 50 + 'px';
        gate.appendChild(controlPoint);
    });

    // Add target point after
    const targetPoint = document.createElement('div');
    targetPoint.className = 'target-point';
    targetPoint.style.top = (target - minQubit) * 50 + 'px';
    gate.appendChild(targetPoint);
}

function validateTwoQubitGate(control, target) {
    target = parseInt(target);
    const maxIndex = numQubits - 1;
    
    if (isNaN(target) || target < 0 || target > maxIndex || target === control) {
        alert(`Invalid target qubit. Must be between 0 and ${maxIndex}, excluding ${control}`);
        return false;
    }
    return true;
}

function validateToffoliQubits(control1, control2, target) {
    if (isNaN(control2) || isNaN(target) || 
        new Set([control1, control2, target]).size !== 3 ||
        Math.min(control1, control2, target) < 0 ||
        Math.max(control1, control2, target) >= numQubits) {
        alert(`Invalid qubit selection. Must be three different values between 0 and ${numQubits-1}`);
        return false;
    }
    return true;
}

function validateGatePlacement(gateType, qubit, position) {
    // Single qubit gates can be placed anywhere
    if (!['cnot', 'swap', 'toff'].includes(gateType.toLowerCase())) {
        return true;
    }
    
    // Check if enough qubits for multi-qubit gates
    if (gateType === 'toff' && numQubits < 3) {
        alert('Toffoli gate requires at least 3 qubits');
        return false;
    }
    
    if ((gateType === 'cnot' || gateType === 'swap') && numQubits < 2) {
        alert(`${gateType.toUpperCase()} gate requires at least 2 qubits`);
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
        const lastQubitIndex = numQubits - 1;
        
        // Remove all gates involving the last qubit
        circuit = circuit.filter(gate => {
            const involvedQubits = [gate.qubit];
            if (gate.target !== undefined) involvedQubits.push(gate.target);
            if (gate.control2 !== undefined) involvedQubits.push(gate.control2);
            
            // Keep gate if it doesn't involve the last qubit
            return !involvedQubits.includes(lastQubitIndex);
        });
        
        numQubits--;
        initializeCircuit();
        restoreCircuitState();
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

    // Create labels showing state values
    const labels = states.map(state => state);  // Just use the state value directly

    console.log("State mapping debug:", {
        incomingStates: Object.keys(data.counts),
        processedStates: states,
        counts: data.counts,
        values,
        total: values.reduce((a, b) => a + b, 0)
    });

    const totalShots = values.reduce((a, b) => a + b, 0);

    // Normalize values to 0-100 scale
    const maxValue = Math.max(...values);
    const normalizedValues = values.map(value => 
        maxValue > 0 ? Math.round((value / SIMULATION_SHOTS) * 100) : value
    );

    // Create histogram
    histogramChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Probability (%)',
                data: normalizedValues,
                backgroundColor: '#fbbf24',
                borderColor: '#f59e0b',
                borderWidth: 1,
                barThickness: 40,
                maxBarThickness: 40,
                minBarLength: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 30,
                    bottom: 10
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: '#e5e5e5',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 14
                        },
                        stepSize: 20,
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const percentage = context.raw;
                            const actualCount = values[context.dataIndex];
                            return `${actualCount} shots (${percentage}%)`;
                        }
                    }
                },
                legend: {
                    display: false
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
