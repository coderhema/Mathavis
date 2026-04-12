
export enum VisualType {
  NONE = 'NONE',
  PLOT = 'PLOT',       // 2D functions like y = x^2
  PLOT3D = 'PLOT3D',   // 3D surfaces like z = x^2 + y^2
  GRAPH = 'GRAPH',     // Nodes and edges (trees, graph theory)
  FLOWCHART = 'FLOWCHART', // Algorithms or logical flows
  MATRIX = 'MATRIX',    // Matrix operations visual
  GEOMETRY3D = 'GEOMETRY3D', // 3D shapes like spheres, cones
  STEPS = 'STEPS',       // Step-by-step problem solver
  QUIZ = 'QUIZ',         // Multiple choice questions
  VECTOR_FIELD = 'VECTOR_FIELD', // 2D Vector fields (Calculus)
  UNIT_CIRCLE = 'UNIT_CIRCLE',    // Trigonometry unit circle
  COMPLEX_PLANE = 'COMPLEX_PLANE', // Complex numbers
  VENN_DIAGRAM = 'VENN_DIAGRAM'   // Set theory
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizData {
  question: string;
  options: QuizOption[];
  explanation: string;
}

export interface Geometry3DData {
  shape: 'sphere' | 'cone' | 'cylinder' | 'box' | 'torus' | 'paraboloid';
  params?: {
    radius?: number;
    height?: number;
    width?: number;
    depth?: number;
    tubularSegments?: number;
    radialSegments?: number;
  };
  label: string;
}

export interface GraphNode {
  id: string;
  label?: string;
  group?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  value?: number;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  directed?: boolean;
}

export interface PlotPoint {
  x: number;
  y: number;
  [key: string]: any; // Allow extra properties for multiple lines
}

export interface PlotData {
  points: PlotPoint[];
  label: string;
  domain: [number, number];
  extraLines?: { key: string; color: string; label: string; dashed?: boolean }[];
  extraPoints?: { x: number; y: number; label: string; color: string }[];
}

export interface Plot3DData {
  formula: string; // z in terms of x and y
  xRange: [number, number];
  yRange: [number, number];
  label: string;
}

export interface FlowchartNode {
  id: string;
  label: string;
  type: 'start' | 'step' | 'decision' | 'end';
}

export interface FlowchartData {
  nodes: FlowchartNode[];
  links: GraphLink[];
}

export interface MatrixData {
  matrix: number[][];
  label?: string;
}

export interface VectorFieldData {
  formulaX: string; // P(x, y)
  formulaY: string; // Q(x, y)
  domain: [number, number];
  range: [number, number];
  density?: number;
}

export interface UnitCircleData {
  angle: number; // in degrees
  showSine?: boolean;
  showCosine?: boolean;
  showTangent?: boolean;
}

export interface ComplexPlaneData {
  real: number;
  imaginary: number;
  showPolar?: boolean;
}

export interface VennDiagramData {
  sets: { label: string; size: number }[];
  intersections: { sets: number[]; size: number }[];
}

export interface MathStep {
  title: string;
  explanation: string;
  visual?: VisualContent;
}

export interface StepByStepData {
  problem: string;
  steps: MathStep[];
}

export interface VisualContent {
  type: VisualType;
  graphData?: GraphData;
  plotData?: PlotData;
  plot3DData?: Plot3DData;
  matrixData?: MatrixData;
  flowchartData?: FlowchartData;
  geometry3DData?: Geometry3DData;
  vectorFieldData?: VectorFieldData;
  unitCircleData?: UnitCircleData;
  complexPlaneData?: ComplexPlaneData;
  vennDiagramData?: VennDiagramData;
  stepByStepData?: StepByStepData;
  quizData?: QuizData;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 data URL
  visual?: VisualContent;
  suggestedActions?: string[]; 
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  completed: number; // 0 to 100
}

export interface MathResponseSchema {
  explanation: string;
  visualType: string; // "PLOT" | "PLOT3D" | "GRAPH" | "FLOWCHART" | "MATRIX" | "NONE"
  suggestedActions: string[];
  // For Plot
  plotFormula?: string;
  plotDomainMin?: number;
  plotDomainMax?: number;
  // For Plot3D
  plot3DFormula?: string; // e.g. "Math.pow(x, 2) + Math.pow(y, 2)"
  // For Graph/Flowchart
  graphNodes?: { id: string; label: string; group?: number; type?: string }[];
  graphLinks?: { source: string; target: string; label?: string }[];
  graphDirected?: boolean;
  // For Matrix
  matrixRows?: number[][];
  // For Geometry3D
  geometryShape?: string;
  geometryParams?: any;
  // For Vector Field
  vectorFieldFormulaX?: string;
  vectorFieldFormulaY?: string;
  // For Unit Circle
  unitCircleAngle?: number;
  // For Complex Plane
  complexReal?: number;
  complexImaginary?: number;
  // For Venn Diagram
  vennSets?: { label: string; size: number }[];
  vennIntersections?: { sets: number[]; size: number }[];
  // For Quiz
  quiz?: {
    question: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    explanation: string;
  };
  // For Step-by-Step
  stepByStep?: {
    problem: string;
    steps: {
      title: string;
      explanation: string;
      visualType: string;
      // ... same fields as MathResponseSchema for each step
      plotFormula?: string;
      plotDomainMin?: number;
      plotDomainMax?: number;
      plot3DFormula?: string;
      graphNodes?: { id: string; label: string; group?: number; type?: string }[];
      graphLinks?: { source: string; target: string; label?: string }[];
      graphDirected?: boolean;
      matrixRows?: number[][];
      geometryShape?: string;
      geometryParams?: any;
      vectorFieldFormulaX?: string;
      vectorFieldFormulaY?: string;
      unitCircleAngle?: number;
      complexReal?: number;
      complexImaginary?: number;
      vennSets?: { label: string; size: number }[];
      vennIntersections?: { sets: number[]; size: number }[];
      quiz?: {
        question: string;
        options: { id: string; text: string; isCorrect: boolean }[];
        explanation: string;
      };
    }[];
  };
}

export type View = 'auth' | 'path' | 'practice' | 'library' | 'leaderboard' | 'shop';
