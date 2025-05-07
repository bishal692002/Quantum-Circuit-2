from flask import Flask, render_template, jsonify, request
from qiskit import QuantumCircuit
from qiskit_aer import Aer
from qiskit.compiler import transpile
import numpy as np

SIMULATION_SHOTS = 200

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/simulate', methods=['POST'])
def simulate():
    try:
        data = request.json
        circuit = data.get('circuit', [])
        num_qubits = data.get('num_qubits', 4)
        
        if not circuit:
            return jsonify({
                'success': False,
                'error': 'Empty circuit'
            })

        qc = QuantumCircuit(num_qubits, num_qubits)
        
        # Process gates in order
        for gate in sorted(circuit, key=lambda x: x['position']):
            gate_type = gate['type'].lower()
            qubit = gate['qubit']
            
            if qubit >= num_qubits:
                continue
            
            # Apply quantum gates based on type
            try:
                if gate_type == 'h':
                    qc.h(qubit)  # Hadamard gate
                elif gate_type == 'x':
                    qc.x(qubit)  # Pauli-X gate
                elif gate_type == 'y':
                    qc.y(qubit)  # Pauli-Y gate
                elif gate_type == 'z':
                    qc.z(qubit)  # Pauli-Z gate
                elif gate_type == 'sx':
                    qc.sx(qubit)  # Square root of X gate
                elif gate_type == 'sz':
                    qc.sz(qubit)  # Square root of Z gate
                elif gate_type == 's':
                    qc.s(qubit)  # S gate (phase gate)
                elif gate_type == 't':
                    qc.t(qubit)  # T gate (π/8 gate)
                elif gate_type == 'tdg':
                    qc.tdg(qubit)  # T dagger gate
                elif gate_type == 'cnot':
                    # For CNOT, we need both control and target qubits
                    control = qubit
                    target = (control + 1) % num_qubits  # Target is next qubit
                    qc.cx(control, target)
                elif gate_type == 'swap':
                    # For SWAP, we need two qubits
                    first = qubit
                    second = (first + 1) % num_qubits  # Swap with next qubit
                    qc.swap(first, second)
                elif gate_type == 'i':
                    # Identity gate - does nothing
                    pass
            except Exception as e:
                print(f"Error applying gate {gate_type}: {str(e)}")
                continue
        
        # Measure all qubits
        qc.measure_all()
        
        # Use Aer simulator
        backend = Aer.get_backend('qasm_simulator')
        transpiled_circuit = transpile(qc, backend)
        job = backend.run(transpiled_circuit, shots=SIMULATION_SHOTS)
        result = job.result()
        counts = result.get_counts(qc)
        
        # Ensure all possible states are represented
        all_states = [format(i, f'0{num_qubits}b') for i in range(2**num_qubits)]
        complete_counts = {state: counts.get(state, 0) for state in all_states}
        
        # Format the results for histogram display
        formatted_counts = {}
        for state in all_states:
            # Keep it simple - just use the binary state as key
            formatted_counts[state] = counts.get(state, 0)

        return jsonify({
            'counts': formatted_counts,
            'success': True,
            'circuit_depth': qc.depth()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    app.run(debug=True)
