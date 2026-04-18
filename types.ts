export enum VisualType {
  NONE = 'NONE',
  PLOT = 'PLOT',
  PLOT3D = 'PLOT3D',
  GRAPH = 'GRAPH',
  FLOWCHART = 'FLOWCHART',
  MATRIX = 'MATRIX',
  GEOMETRY3D = 'GEOMETRY3D',
  STEPS = 'STEPS',
  QUIZ = 'QUIZ',
  VECTOR_FIELD = 'VECTOR_FIELD',
  UNIT_CIRCLE = 'UNIT_CIRCLE',
  COMPLEX_PLANE = 'COMPLEX_PLANE',
  VENN_DIAGRAM = 'VENN_DIAGRAM',
  BENTO = 'BENTO',
  TREE = 'TREE',
  PARTICLE = 'PARTICLE'
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
  type?: 'start' | 'step' | 'decision' | 'end';
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
  [key: string]: any;
}

export interface PlotData {
  points: PlotPoint[];
  label: string;
  domain: [number, number];
  extraLines?: { key: string; color: string; label: string; dashed?: boolean }[];
  extraPoints?: { x: number; y: number; label: string; color: string }[];
}

export interface Plot3DData {
  formula: string;
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
  formulaX: string;
  formulaY: string;
  domain: [number, number];
  range: [number, number];
  density?: number;
}

export interface UnitCircleData {
  angle: number;
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

export interface BentoItem {
  title: string;
  description?: string;
  accent?: string;
  metric?: string;
}

export interface BentoData {
  title: string;
  subtitle?: string;
  items: BentoItem[];
}

export interface TreeNode {
  id: string;
  label: string;
  parentId?: string;
  note?: string;
  group?: number;
}

export interface TreeData {
  title: string;
  subtitle?: string;
  rootId?: string;
  nodes: TreeNode[];
}

export interface ParticleNode {
  id: string;
  label?: string;
  x?: number;
  y?: number;
  weight?: number;
  group?: number;
}

export interface ParticleLink {
  source: string;
  target: string;
  strength?: number;
}

export interface ParticleData {
  title: string;
  subtitle?: string;
  particles: ParticleNode[];
  links?: ParticleLink[];
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
  bentoData?: BentoData;
  treeData?: TreeData;
  particleData?: ParticleData;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
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
  completed: number;
}

export interface MathResponseSchema {
  explanation: string;
  visualType: string;
  suggestedActions: string[];
  graphMode?: 'network' | 'flowchart' | 'tree';
  plotFormula?: string;
  plotDomainMin?: number;
  plotDomainMax?: number;
  plot3DFormula?: string;
  plot3DXMin?: number;
  plot3DXMax?: number;
  plot3DYMin?: number;
  plot3DYMax?: number;
  graphNodes?: { id: string; label: string; group?: number; type?: string; parentId?: string; note?: string }[];
  graphLinks?: { source: string; target: string; label?: string; value?: number }[];
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
  stepByStep?: {
    problem: string;
    steps: {
      title: string;
      explanation: string;
      visualType: string;
      graphMode?: 'network' | 'flowchart' | 'tree';
      plotFormula?: string;
      plotDomainMin?: number;
      plotDomainMax?: number;
      plot3DFormula?: string;
      plot3DXMin?: number;
      plot3DXMax?: number;
      plot3DYMin?: number;
      plot3DYMax?: number;
      graphNodes?: { id: string; label: string; group?: number; type?: string; parentId?: string; note?: string }[];
      graphLinks?: { source: string; target: string; label?: string; value?: number }[];
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
      bentoTitle?: string;
      bentoSubtitle?: string;
      bentoItems?: BentoItem[];
      treeTitle?: string;
      treeSubtitle?: string;
      treeRootId?: string;
      treeNodes?: TreeNode[];
      particleTitle?: string;
      particleSubtitle?: string;
      particleNodes?: ParticleNode[];
      particleLinks?: ParticleLink[];
    }[];
  };
  bentoTitle?: string;
  bentoSubtitle?: string;
  bentoItems?: BentoItem[];
  treeTitle?: string;
  treeSubtitle?: string;
  treeRootId?: string;
  treeNodes?: TreeNode[];
  particleTitle?: string;
  particleSubtitle?: string;
  particleNodes?: ParticleNode[];
  particleLinks?: ParticleLink[];
}

export type View = 'auth' | 'path' | 'practice' | 'library' | 'leaderboard' | 'shop';
