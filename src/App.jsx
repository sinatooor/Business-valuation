// src/App.jsx
import ValuationDecisionTree from './components/ValuationDecisionTree';
import './App.css';

function App() {
  // We add a div with a height of the full screen (h-screen)
  // This ensures the React Flow component has a sized container to render in.
  return (
    <div className="h-screen w-screen">
      <ValuationDecisionTree />
    </div>
  );
}

export default App;