# Quantum Circuit Simulator

## Overview
A modern web-based quantum circuit simulator featuring an intuitive drag-and-drop interface for designing and experimenting with quantum circuits. Built with Flask and Qiskit, this application makes quantum computing accessible and visual.

## Key Features

### Circuit Design
- Intuitive drag-and-drop interface
- Support for up to 10 qubits
- Real-time circuit validation
- Interactive gate placement

### Quantum Gates
**Single-Qubit Gates:**
- Hadamard (H)
- Pauli Gates (X, Y, Z)
- Phase Gates (S, T)
- Root Operations (√X, √Y)

**Multi-Qubit Gates:**
- CNOT (Controlled-NOT)
- SWAP
- Toffoli (CCNOT)

### Visualization
- Real-time state vector display
- Probability histogram
- Circuit depth metrics
- Gate connection visualization
- Download circuit information as .json format

## Technical Architecture

### Frontend Technologies
- **Core:** HTML5, CSS3, Vanilla JavaScript
- **Visualization:** Chart.js
- **Styling:** Custom CSS variables for theming
- **Responsiveness:** Mobile-friendly design

### Backend Stack
- **Runtime:** Python 3.8+
- **Web Framework:** Flask 2.0+
- **Quantum Framework:** Qiskit 0.44.0+
- **Mathematical Operations:** NumPy 1.21.0+

## Getting Started

### System Requirements
- Python 3.8 or higher
- Modern web browser with HTML5 support
- 4GB RAM minimum
- Internet connection for initial setup

### Setup Instructions

1. **Environment Setup**
   - Install Python 3.8+
   - Set up a virtual environment
   - Install required dependencies

2. **Application Launch**
   - Start the Flask server
   - Access via web browser at localhost:5000

### Configuration Options
- Customizable circuit depth
- Adjustable simulation parameters
- Theme preferences
- Gate set customization

## Usage Guide

### Basic Operations
1. **Circuit Building**
   - Select gates from the toolbox
   - Drag gates onto the circuit grid
   - Connect multi-qubit gates

2. **Circuit Management**
   - Add or remove qubits
   - Clear the entire circuit
   - Save circuit configurations

3. **Simulation**
   - Run quantum simulations
   - View measurement results
   - Analyze state probabilities

### Advanced Features
- Circuit state preservation
- Custom gate sequences
- Measurement statistics export
- Circuit configuration sharing

## Development

### Project Structure
```
quantum-circuit/
├── static/
│   ├── css/
│   ├── js/
│   └── images/
├── templates/
├── app.py
└── requirements.txt
```

### Contributing Guidelines
1. Fork the repository
2. Create feature branches
3. Follow coding standards
4. Submit pull requests

## Support
1. Contact via the users profile


### Documentation
- In-app tutorials
- Code documentation
- API reference

### Community
- Issue tracking
- Feature requests
- Bug reports


## Acknowledgments
- IBM Qiskit Team
- Flask Framework
- Chart.js Contributors
- Open Source Community

## Made during-
-VIT Bhopal Third sem Project Submission.`