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
            return jsonify({'success': False, 'error': 'Empty circuit'})

        # Create circuit with classical bits for measurement
        qc = QuantumCircuit(num_qubits, num_qubits)
        
        # Process gates from left to right (website's convention)
        for gate in sorted(circuit, key=lambda x: x['position']):
            gate_type = gate['type'].lower()
            qubit = num_qubits - 1 - gate['qubit']  # Reverse qubit ordering to match website
            
            try:
                if gate_type == 'h':
                    qc.h(qubit)  # Creates superposition
                elif gate_type == 'x':
                    qc.x(qubit)  # NOT gate / bit flip
                elif gate_type == 'y':
                    qc.y(qubit)  # Pauli-Y rotation
                elif gate_type == 'z':
                    qc.z(qubit)  # Phase flip
                elif gate_type == 's':
                    qc.s(qubit)  # √Z gate
                elif gate_type == 't':
                    qc.t(qubit)  # π/8 gate
                elif gate_type == 'cnot':
                    if qubit > 0:  # Ensure target qubit exists
                        control = qubit
                        target = control - 1  # Target is the qubit below
                        qc.cx(control, target)
                elif gate_type == 'swap':
                    if qubit > 0:
                        qc.swap(qubit, qubit - 1)
                elif gate_type == 'toff':
                    if qubit > 1:  # Need three qubits
                        qc.ccx(qubit, qubit - 1, qubit - 2)
            except Exception as e:
                print(f"Gate error ({gate_type} on {qubit}): {str(e)}")
                continue

        # Measure qubits
        qc.measure_all()
        
        # Run simulation
        backend = Aer.get_backend('qasm_simulator')
        job = backend.run(transpile(qc, backend), shots=SIMULATION_SHOTS)
        result = job.result()
        counts = result.get_counts(qc)
        print(f"Raw counts: {counts}")

        # Format raw states correctly
        formatted_counts = {}
        for state, count in counts.items():
            # Remove spaces and split into groups
            raw_bits = ''.join(state.split())
            
            # Process each bit pair
            state_bits = []
            for i in range(0, len(raw_bits), 2):
                pair = raw_bits[i:i+2]
                # Add first bit of each pair to state
                state_bits.append(pair[0])
            
            # Create final state with bits in correct qubit order
            final_state = ''.join(reversed(state_bits[:num_qubits]))
            formatted_counts[final_state] = formatted_counts.get(final_state, 0) + count

            print(f"State mapping for {state}:")
            print(f"  Raw bits: {raw_bits}")
            print(f"  State bits: {state_bits}")
            print(f"  Final state: {final_state}")
            print(f"  Count: {count}")

        # Ensure all possible states are represented
        all_states = [format(i, f'0{num_qubits}b') for i in range(2**num_qubits)]
        complete_counts = {state: formatted_counts.get(state, 0) for state in all_states}

        print(f"Complete state mapping:")
        print(f"  Raw counts: {counts}")
        print(f"  Formatted counts: {formatted_counts}")
        print(f"  Final counts: {complete_counts}")
        
        return jsonify({
            'counts': complete_counts,
            'success': True,
            'circuit_depth': qc.depth(),
            'num_qubits': num_qubits
        })
        
    except Exception as e:
        print(f"Simulation error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
