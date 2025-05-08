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
            qubit = num_qubits - 1 - gate['qubit']  # Primary qubit
            target = gate.get('target')  # Get target qubit if specified
            
            try:
                if gate_type in ['i', 'h', 'x', 'y', 'z', 's', 't', 'sx', 'sy']:
                    getattr(qc, gate_type)(qubit)
                
                elif gate_type == 'cnot' and target is not None:
                    target_qubit = num_qubits - 1 - target
                    if 0 <= target_qubit < num_qubits and target_qubit != qubit:
                        qc.cx(qubit, target_qubit)
                    else:
                        raise ValueError(f"Invalid CNOT: control={qubit}, target={target_qubit}")
                
                elif gate_type == 'swap' and target is not None:
                    target_qubit = num_qubits - 1 - target
                    if 0 <= target_qubit < num_qubits and target_qubit != qubit:
                        qc.swap(qubit, target_qubit)
                    else:
                        raise ValueError(f"Invalid SWAP: q1={qubit}, q2={target_qubit}")
                
                elif gate_type == 'toff':
                    control2 = gate.get('control2')
                    if target is not None and control2 is not None:
                        target_qubit = num_qubits - 1 - target
                        control2_qubit = num_qubits - 1 - control2
                        if (0 <= target_qubit < num_qubits and 
                            0 <= control2_qubit < num_qubits and 
                            len({qubit, control2_qubit, target_qubit}) == 3):
                            qc.ccx(qubit, control2_qubit, target_qubit)
                        else:
                            raise ValueError("Invalid Toffoli configuration")
                        
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
        print(f"Circuit state after simulation:")
        print(f"Expected: Approximately 50% |01⟩ and 50% |10⟩")
        print(f"Raw counts: {counts}")
        
        # Format raw states correctly
        formatted_counts = {}
        for state, count in counts.items():
            # Remove spaces and split into groups
            raw_bits = ''.join(state.split())
            
            # Convert to list and take only the first num_qubits bits
            state_bits = list(raw_bits[:num_qubits])
            
            # Reverse the bits to match the desired qubit ordering
            # This ensures q0 is rightmost, q1 is second from right, etc.
            state_bits.reverse()
            final_state = ''.join(state_bits)
            
            formatted_counts[final_state] = formatted_counts.get(final_state, 0) + count

            print(f"State mapping for {state}:")
            print(f"  Raw bits: {raw_bits}")
            print(f"  Final state (q0 rightmost): {final_state}")
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
