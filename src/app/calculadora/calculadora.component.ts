import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/* -------------------------------------------------------------------------- */
/*                            Interfaces y tipados                            */
/* -------------------------------------------------------------------------- */
interface Equation {
  formula: string;
  variables: string[];
  compute: (inputs: { [key: string]: number }) => number;
}

interface Conversions {
  f: string;  // femto
  p: string;  // pico
  n: string;  // nano
  u: string;  // micro (µ)
  m: string;  // mili
  base: string;
  k: string;  // kilo
  M: string;  // mega
  G: string;  // giga
  T: string;  // tera
}

/* -------------------------------------------------------------------------- */
/*                                 Componente                                 */
/* -------------------------------------------------------------------------- */
@Component({
  selector: 'app-calculadora',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calculadora.component.html',
  styleUrls: ['./calculadora.component.css']
})
export class CalculadoraComponent implements AfterViewInit {

  /* ------------------------- Configuración de UI ------------------------- */
  decimales: number = 2;                                  // cifras decimales elegidas
  conversiones: Conversions = this.crearConversiones(0);  // tabla inicial

  opcionesPrincipales: string[] = [
    'Sistemas monofásicos',
    'Sistemas trifásicos',
    'Análisis AC coseno de φ',
    'Análisis AC velocidad angular',
    'Análisis AC General'
  ];

  subopciones: { [key: string]: string[] } = {
    'Sistemas monofásicos': ['Vatios', 'Resistencia', 'Corriente', 'Voltaje'],
    'Sistemas trifásicos': ['Vatios', 'Resistencia', 'Corriente', 'Voltaje'],
    'Análisis AC coseno de φ': ['Potencia', 'VA', 'Corriente', 'Resistencia', 'Voltaje', 'coseno de φ'],
    'Análisis AC velocidad angular': ['Frecuencia Angular (ω)', 'Reactancia Inductiva (XL)', 'Reactancia Capacitiva (XC)', 'Impedancia (Z)'],
    'Análisis AC General': ['KVAR', 'KW', 'KVA', 'X', 'I', 'V', 'R', 'W', 'tan(φ)', 'cos(φ)', 'sen(φ)']
  };

  opcionSeleccionada: string | null = null;
  subopcionSeleccionada: string | null = null;
  subsubopcionSeleccionada: string | null = null;

  formulario: { [key: string]: number | null } = { input1: null, input2: null, input3: null };

  resultado: number | null = null;
  unidad: string = '';

  selectedEquation: Equation | null = null;

  /* -------------------------------------------------------------------------- */
  /*                               Bloque completo                              */
  /* -------------------------------------------------------------------------- */
  monofasicoEquations: { [sub: string]: Equation[] } = {
    'Vatios': [
      { formula: 'W = V² / R', variables: ['V', 'R'], compute: inp => Math.pow(+inp['V'], 2) / +inp['R'] },
      { formula: 'W = I² * R', variables: ['I', 'R'], compute: inp => Math.pow(+inp['I'], 2) * +inp['R'] },
      { formula: 'W = V * I', variables: ['V', 'I'], compute: inp => +inp['V'] * +inp['I'] }
    ],
    'Resistencia': [
      { formula: 'R = V / I', variables: ['V', 'I'], compute: inp => +inp['V'] / +inp['I'] },
      { formula: 'R = V² / W', variables: ['V', 'W'], compute: inp => Math.pow(+inp['V'], 2) / +inp['W'] },
      { formula: 'R = W / I²', variables: ['W', 'I'], compute: inp => +inp['W'] / Math.pow(+inp['I'], 2) }
    ],
    'Corriente': [
      { formula: 'I = V / R', variables: ['V', 'R'], compute: inp => +inp['V'] / +inp['R'] },
      { formula: 'I = W / V', variables: ['W', 'V'], compute: inp => +inp['W'] / +inp['V'] },
      { formula: 'I = sqrt(W / R)', variables: ['W', 'R'], compute: inp => Math.sqrt(+inp['W'] / +inp['R']) }
    ],
    'Voltaje': [
      { formula: 'V = I * R', variables: ['I', 'R'], compute: inp => +inp['I'] * +inp['R'] },
      { formula: 'V = W / I', variables: ['W', 'I'], compute: inp => +inp['W'] / +inp['I'] },
      { formula: 'V = sqrt(W * R)', variables: ['W', 'R'], compute: inp => Math.sqrt(+inp['W'] * +inp['R']) }
    ]
  };

  trifasicoEquations: { [sub: string]: Equation[] } = {
    'Vatios': [
      { formula: 'W = V * I * sqrt(3)', variables: ['V', 'I'], compute: inp => +inp['V'] * +inp['I'] * Math.sqrt(3) },
      { formula: 'W = V² / (R * sqrt(3))', variables: ['V', 'R'], compute: inp => Math.pow(+inp['V'], 2) / (+inp['R'] * Math.sqrt(3)) },
      { formula: 'W = I² * R * sqrt(3)', variables: ['I', 'R'], compute: inp => Math.pow(+inp['I'], 2) * +inp['R'] * Math.sqrt(3) }
    ],
    'Resistencia': [
      { formula: 'R = V / I', variables: ['V', 'I'], compute: inp => +inp['V'] / +inp['I'] },
      { formula: 'R = V² / W', variables: ['V', 'W'], compute: inp => Math.pow(+inp['V'], 2) / +inp['W'] },
      { formula: 'R = W / I²', variables: ['W', 'I'], compute: inp => +inp['W'] / Math.pow(+inp['I'], 2) }
    ],
    'Corriente': [
      { formula: 'I = V / (R * sqrt(3))', variables: ['V', 'R'], compute: inp => +inp['V'] / (+inp['R'] * Math.sqrt(3)) },
      { formula: 'I = W / (V * sqrt(3))', variables: ['W', 'V'], compute: inp => +inp['W'] / (+inp['V'] * Math.sqrt(3)) },
      { formula: 'I = sqrt(W / (R * sqrt(3)))', variables: ['W', 'R'], compute: inp => Math.sqrt(+inp['W'] / (+inp['R'] * Math.sqrt(3))) }
    ],
    'Voltaje': [
      { formula: 'V = I * R * sqrt(3)', variables: ['I', 'R'], compute: inp => +inp['I'] * +inp['R'] * Math.sqrt(3) },
      { formula: 'V = W / (I * sqrt(3))', variables: ['W', 'I'], compute: inp => +inp['W'] / (+inp['I'] * Math.sqrt(3)) },
      { formula: 'V = sqrt(W * R * sqrt(3))', variables: ['W', 'R'], compute: inp => Math.sqrt(+inp['W'] * +inp['R'] * Math.sqrt(3)) }
    ]
  };

  acTrifasicoEquations: { [sub: string]: Equation[] } = {
    'Potencia': [
      { formula: 'W = V * I * cos(φ)', variables: ['V', 'I', 'cos(φ)'], compute: inp => +inp['V'] * +inp['I'] * +inp['cos(φ)'] },
      { formula: 'W = VA * cos(φ)', variables: ['VA', 'cos(φ)'], compute: inp => +inp['VA'] * +inp['cos(φ)'] },
      { formula: 'W = (V * cos(φ))² / R', variables: ['V', 'cos(φ)', 'R'], compute: inp => Math.pow(+inp['V'] * +inp['cos(φ)'], 2) / +inp['R'] }
    ],
    'VA': [
      { formula: 'VA = V * I', variables: ['V', 'I'], compute: inp => +inp['V'] * +inp['I'] },
      { formula: 'VA = W / cos(φ)', variables: ['W', 'cos(φ)'], compute: inp => +inp['W'] / +inp['cos(φ)'] },
      { formula: 'VA = I² * R / cos(φ)', variables: ['I', 'R', 'cos(φ)'], compute: inp => Math.pow(+inp['I'], 2) * +inp['R'] / +inp['cos(φ)'] }
    ],
    'Corriente': [
      { formula: 'I = V * cos(φ) / R', variables: ['V', 'cos(φ)', 'R'], compute: inp => (+inp['V'] * +inp['cos(φ)']) / +inp['R'] },
      { formula: 'I = W / (V * cos(φ))', variables: ['W', 'V', 'cos(φ)'], compute: inp => +inp['W'] / (+inp['V'] * +inp['cos(φ)']) },
      { formula: 'I = VA / V', variables: ['VA', 'V'], compute: inp => +inp['VA'] / +inp['V'] }
    ],
    'Resistencia': [
      { formula: 'R = (V * cos(φ)) / I', variables: ['V', 'cos(φ)', 'I'], compute: inp => (+inp['V'] * +inp['cos(φ)']) / +inp['I'] },
      { formula: 'R = (VA * cos(φ)) / I²', variables: ['VA', 'cos(φ)', 'I'], compute: inp => (+inp['VA'] * +inp['cos(φ)']) / Math.pow(+inp['I'], 2) },
      { formula: 'R = (V * cos(φ))² / W', variables: ['V', 'cos(φ)', 'W'], compute: inp => Math.pow(+inp['V'] * +inp['cos(φ)'], 2) / +inp['W'] }
    ],
    'Voltaje': [
      { formula: 'V = VA / I', variables: ['VA', 'I'], compute: inp => +inp['VA'] / +inp['I'] },
      { formula: 'V = (I * R) / cos(φ)', variables: ['I', 'R', 'cos(φ)'], compute: inp => (+inp['I'] * +inp['R']) / +inp['cos(φ)'] },
      { formula: 'V = W / (I * cos(φ))', variables: ['W', 'I', 'cos(φ)'], compute: inp => +inp['W'] / (+inp['I'] * +inp['cos(φ)']) }
    ],
    'coseno de φ': [
      { formula: 'cos(φ) = W / (V * I)', variables: ['W', 'V', 'I'], compute: inp => +inp['W'] / (+inp['V'] * +inp['I']) },
      { formula: 'cos(φ) = W / VA', variables: ['W', 'VA'], compute: inp => +inp['W'] / +inp['VA'] },
      { formula: 'cos(φ) = (I² * R) / VA', variables: ['I', 'R', 'VA'], compute: inp => Math.pow(+inp['I'], 2) * +inp['R'] / +inp['VA'] }
    ]
  };

  acVelocidadEquations: { [sub: string]: Equation[] } = {
    'Frecuencia Angular (ω)': [
      { formula: 'ω = 2 * π * f', variables: ['f'], compute: inp => 2 * Math.PI * +inp['f'] },
      { formula: 'ω = 2 * 3.1416 * f', variables: ['f'], compute: inp => 2 * 3.1416 * +inp['f'] }
    ],
    'Reactancia Inductiva (XL)': [
      { formula: 'XL = 2 * π * f * L', variables: ['f', 'L'], compute: inp => 2 * Math.PI * +inp['f'] * +inp['L'] },
      { formula: 'XL = ω * L', variables: ['ω', 'L'], compute: inp => +inp['ω'] * +inp['L'] }
    ],
    'Reactancia Capacitiva (XC)': [
      { formula: 'XC = 1 / (2 * π * f * C)', variables: ['f', 'C'], compute: inp => 1 / (2 * Math.PI * +inp['f'] * +inp['C']) },
      { formula: 'XC = 1 / (ω * C)', variables: ['ω', 'C'], compute: inp => 1 / (+inp['ω'] * +inp['C']) }
    ],
    'Impedancia (Z)': [
      { formula: 'Z = R + j(XL - XC)', variables: ['R', 'XL', 'XC'], compute: inp => Math.sqrt(Math.pow(+inp['R'], 2) + Math.pow(+inp['XL'] - +inp['XC'], 2)) },
      { formula: 'Z = sqrt(R² + (XL - XC)²)', variables: ['R', 'XL', 'XC'], compute: inp => Math.sqrt(Math.pow(+inp['R'], 2) + Math.pow(+inp['XL'] - +inp['XC'], 2)) }
    ]
  };

  acGeneralEquations: { [sub: string]: Equation[] } = {
    /* ------------------------- KVAR ------------------------------------- */
    'KVAR': [
      { formula: 'kVAR = kVA * sen(φ)', variables: ['kVA', 'sen(φ)'], compute: inp => +inp['kVA'] * +inp['sen(φ)'] },
      { formula: 'kVAR = kW * tan(φ)', variables: ['kW', 'tan(φ)'], compute: inp => +inp['kW'] * +inp['tan(φ)'] },
      { formula: 'kVAR = (kW * X) / R', variables: ['kW', 'X', 'R'], compute: inp => +inp['kW'] * +inp['X'] / +inp['R'] },
      { formula: 'kVAR = (kVA * X) / Z', variables: ['kVA', 'X', 'Z'], compute: inp => +inp['kVA'] * +inp['X'] / +inp['Z'] },
      { formula: 'kVAR = (kW * X) / (Z * cos(φ))', variables: ['kW', 'X', 'Z', 'cos(φ)'], compute: inp => +inp['kW'] * +inp['X'] / (+inp['Z'] * +inp['cos(φ)']) },
      { formula: 'kVAR = (kVA * X) / sqrt(R² + X²)', variables: ['kVA', 'X', 'R'], compute: inp => +inp['kVA'] * +inp['X'] / Math.sqrt(Math.pow(+inp['R'], 2) + Math.pow(+inp['X'], 2)) },
      { formula: 'kVAR = 1.73 * V * I * sen(φ) / 1000', variables: ['V', 'I', 'sen(φ)'], compute: inp => 1.73 * +inp['V'] * +inp['I'] * +inp['sen(φ)'] / 1000 },
      { formula: 'kVAR = (kVA * cos(φ) * X) / R', variables: ['kVA', 'cos(φ)', 'X', 'R'], compute: inp => +inp['kVA'] * +inp['cos(φ)'] * +inp['X'] / +inp['R'] },
      { formula: 'kVAR = 3 * I² * Z * sen(φ) / 1000', variables: ['I', 'Z', 'sen(φ)'], compute: inp => 3 * Math.pow(+inp['I'], 2) * +inp['Z'] * +inp['sen(φ)'] / 1000 },
      { formula: 'kVAR = (V² * sen(φ)) / Z', variables: ['V', 'sen(φ)', 'Z'], compute: inp => Math.pow(+inp['V'], 2) * +inp['sen(φ)'] / +inp['Z'] },
      { formula: 'kVAR = kW * X / sqrt(R² + X²)', variables: ['kW', 'X', 'R'], compute: inp => +inp['kW'] * +inp['X'] / Math.sqrt(Math.pow(+inp['R'], 2) + Math.pow(+inp['X'], 2)) },
      { formula: 'kVAR = kVA * X / sqrt(R² + X²)', variables: ['kVA', 'X', 'R'], compute: inp => +inp['kVA'] * +inp['X'] / Math.sqrt(Math.pow(+inp['R'], 2) + Math.pow(+inp['X'], 2)) },
      { formula: 'kVAR = kW * X / (R * Z)', variables: ['kW', 'X', 'R', 'Z'], compute: inp => +inp['kW'] * +inp['X'] / (+inp['R'] * +inp['Z']) }
    ],
    /* --------------------------- KW -------------------------------------- */
    'KW': [
      { formula: 'kW = kVA * cos(φ)', variables: ['kVA', 'cos(φ)'], compute: inp => +inp['kVA'] * +inp['cos(φ)'] },
      { formula: 'kW = kVAR / tan(φ)', variables: ['kVAR', 'tan(φ)'], compute: inp => +inp['kVAR'] / +inp['tan(φ)'] },
      { formula: 'kW = (kVA * R) / Z', variables: ['kVA', 'R', 'Z'], compute: inp => +inp['kVA'] * +inp['R'] / +inp['Z'] },
      { formula: 'kW = (V² * kVA - kVA² * Z) / (V² * Z)', variables: ['V', 'kVA', 'Z'], compute: inp => (Math.pow(+inp['V'], 2) * +inp['kVA'] - Math.pow(+inp['kVA'], 2) * +inp['Z']) / (Math.pow(+inp['V'], 2) * +inp['Z']) },
      { formula: 'kW = (kVA * R) / sqrt(R² + X²)', variables: ['kVA', 'R', 'X'], compute: inp => +inp['kVA'] * +inp['R'] / Math.sqrt(Math.pow(+inp['R'], 2) + Math.pow(+inp['X'], 2)) },
      { formula: 'kW = (kVA * cos(φ) * R) / Z', variables: ['kVA', 'cos(φ)', 'R', 'Z'], compute: inp => +inp['kVA'] * +inp['cos(φ)'] * +inp['R'] / +inp['Z'] },
      { formula: 'kW = (kVA * cos(φ) * X) / Z', variables: ['kVA', 'cos(φ)', 'X', 'Z'], compute: inp => +inp['kVA'] * +inp['cos(φ)'] * +inp['X'] / +inp['Z'] },
      { formula: 'kW = 3 * I² * Z * cos(φ) / 1000', variables: ['I', 'Z', 'cos(φ)'], compute: inp => 3 * Math.pow(+inp['I'], 2) * +inp['Z'] * +inp['cos(φ)'] / 1000 },
      { formula: 'kW = (V * I * 1.73 * cos(φ)) / 1000', variables: ['V', 'I', 'cos(φ)'], compute: inp => +inp['V'] * +inp['I'] * 1.73 * +inp['cos(φ)'] / 1000 },
      { formula: 'kW = (kVA * R) / sqrt(Z² + X²)', variables: ['kVA', 'R', 'Z', 'X'], compute: inp => +inp['kVA'] * +inp['R'] / Math.sqrt(Math.pow(+inp['Z'], 2) + Math.pow(+inp['X'], 2)) },
      { formula: 'kW = kVAR / tan(φ)', variables: ['kVAR', 'tan(φ)'], compute: inp => +inp['kVAR'] / +inp['tan(φ)'] },
      { formula: 'kW = kVA * R / sqrt(Z² + X²)', variables: ['kVA', 'R', 'Z', 'X'], compute: inp => +inp['kVA'] * +inp['R'] / Math.sqrt(Math.pow(+inp['Z'], 2) + Math.pow(+inp['X'], 2)) },
      { formula: 'kW = kVA * R / Z', variables: ['kVA', 'R', 'Z'], compute: inp => +inp['kVA'] * +inp['R'] / +inp['Z'] }
    ],
    /* --------------------------- KVA ------------------------------------- */
    'KVA': [
      { formula: 'kVA = kW / cos(φ)', variables: ['kW', 'cos(φ)'], compute: inp => +inp['kW'] / +inp['cos(φ)'] },
      { formula: 'kVA = sqrt(kW² + kVAR²)', variables: ['kW', 'kVAR'], compute: inp => Math.sqrt(Math.pow(+inp['kW'], 2) + Math.pow(+inp['kVAR'], 2)) },
      { formula: 'kVA = (3 * I² * Z) / 1000', variables: ['I', 'Z'], compute: inp => 3 * Math.pow(+inp['I'], 2) * +inp['Z'] / 1000 },
      { formula: 'kVA = (1.73 * V * I) / 1000', variables: ['V', 'I'], compute: inp => 1.73 * +inp['V'] * +inp['I'] / 1000 },
      { formula: 'kVA = sqrt(3 * I² * (R² + X²)) / 1000', variables: ['I', 'R', 'X'], compute: inp => Math.sqrt(3 * Math.pow(+inp['I'], 2) * (Math.pow(+inp['R'], 2) + Math.pow(+inp['X'], 2))) / 1000 },
      { formula: 'kVA = (V * kW² + kVAR²) / (V² * Z)', variables: ['V', 'kW', 'kVAR', 'Z'], compute: inp => (+inp['V'] * Math.pow(+inp['kW'], 2) + Math.pow(+inp['kVAR'], 2)) / (Math.pow(+inp['V'], 2) * +inp['Z']) },
      { formula: 'kVA = kVAR / sen(φ)', variables: ['kVAR', 'sen(φ)'], compute: inp => +inp['kVAR'] / +inp['sen(φ)'] },
      { formula: 'kVA = (kVA * Z) / sqrt(Z² - R²)', variables: ['kVA', 'Z', 'R'], compute: inp => +inp['kVA'] * +inp['Z'] / Math.sqrt(Math.pow(+inp['Z'], 2) - Math.pow(+inp['R'], 2)) },
      { formula: 'kVA = (kVAR * Z) / X', variables: ['kVAR', 'Z', 'X'], compute: inp => +inp['kVAR'] * +inp['Z'] / +inp['X'] },
      { formula: 'kVA = (kVAR * Z) / sqrt(Z² + X²)', variables: ['kVAR', 'Z', 'X'], compute: inp => +inp['kVAR'] * +inp['Z'] / Math.sqrt(Math.pow(+inp['Z'], 2) + Math.pow(+inp['X'], 2)) },
      { formula: 'kVA = (kVAR * Z) / (R * tan(φ))', variables: ['kVAR', 'Z', 'R', 'tan(φ)'], compute: inp => +inp['kVAR'] * +inp['Z'] / (+inp['R'] * +inp['tan(φ)']) },
      { formula: 'kVA = kW * Z / R', variables: ['kW', 'Z', 'R'], compute: inp => +inp['kW'] * +inp['Z'] / +inp['R'] },
      { formula: 'kVA = (kVAR * Z) / sqrt(Z² - R²)', variables: ['kVAR', 'Z', 'R'], compute: inp => +inp['kVAR'] * +inp['Z'] / Math.sqrt(Math.pow(+inp['Z'], 2) - Math.pow(+inp['R'], 2)) }
    ],
    /* ---------------------------- X -------------------------------------- */
    'X': [
      { formula: 'X = sqrt(Z² - R²)', variables: ['Z', 'R'], compute: inp => Math.sqrt(Math.pow(+inp['Z'], 2) - Math.pow(+inp['R'], 2)) },
      { formula: 'X = (kVAR * Z) / VA', variables: ['kVAR', 'Z', 'VA'], compute: inp => +inp['kVAR'] * +inp['Z'] / +inp['VA'] },
      { formula: 'X = (VAR * Z) / W', variables: ['VAR', 'Z', 'W'], compute: inp => +inp['VAR'] * +inp['Z'] / +inp['W'] },
      { formula: 'X = R * tan(φ)', variables: ['R', 'tan(φ)'], compute: inp => +inp['R'] * +inp['tan(φ)'] },
      { formula: 'X = Z * sen(φ)', variables: ['Z', 'sen(φ)'], compute: inp => +inp['Z'] * +inp['sen(φ)'] },
      { formula: 'X = (V² / VA) * tan(φ)', variables: ['V', 'VA', 'tan(φ)'], compute: inp => Math.pow(+inp['V'], 2) / +inp['VA'] * +inp['tan(φ)'] },
      { formula: 'X = (V * sen(φ)) / (1.73 * I)', variables: ['V', 'sen(φ)', 'I'], compute: inp => +inp['V'] * +inp['sen(φ)'] / (1.73 * +inp['I']) },
      { formula: 'X = (cos(φ) * V) / (1.73 * I)', variables: ['cos(φ)', 'V', 'I'], compute: inp => +inp['cos(φ)'] * +inp['V'] / (1.73 * +inp['I']) },
      { formula: 'X = (W * tan(φ)) / VA', variables: ['W', 'tan(φ)', 'VA'], compute: inp => +inp['W'] * +inp['tan(φ)'] / +inp['VA'] },
      { formula: 'X = (cos(φ) * tan(φ) * Z)', variables: ['cos(φ)', 'tan(φ)', 'Z'], compute: inp => +inp['cos(φ)'] * +inp['tan(φ)'] * +inp['Z'] },
      { formula: 'X = (W * tan(φ)) / (3 * I²)', variables: ['W', 'tan(φ)', 'I'], compute: inp => +inp['W'] * +inp['tan(φ)'] / (3 * Math.pow(+inp['I'], 2)) },
      { formula: 'X = (VAR * VA) / (VA + W)', variables: ['VAR', 'VA', 'W'], compute: inp => +inp['VAR'] * +inp['VA'] / (+inp['VA'] + +inp['W']) },
      { formula: 'X = (R * sen(φ)) / cos(φ)', variables: ['R', 'sen(φ)', 'cos(φ)'], compute: inp => +inp['R'] * +inp['sen(φ)'] / +inp['cos(φ)'] }
    ],
    /* ---------------------------- I -------------------------------------- */
    'I': [
      { formula: 'I = V / (1.73 * Z)', variables: ['V', 'Z'], compute: inp => +inp['V'] / (1.73 * +inp['Z']) },
      { formula: 'I = V / (1.73 * R)', variables: ['V', 'R'], compute: inp => +inp['V'] / (1.73 * +inp['R']) },
      { formula: 'I = W / (1.73 * V * cos(φ))', variables: ['W', 'V', 'cos(φ)'], compute: inp => +inp['W'] / (1.73 * +inp['V'] * +inp['cos(φ)']) },
      { formula: 'I = kVA / (1.73 * V)', variables: ['kVA', 'V'], compute: inp => +inp['kVA'] / (1.73 * +inp['V']) },
      { formula: 'I = V * sen(φ) / (1.73 * Z)', variables: ['V', 'sen(φ)', 'Z'], compute: inp => +inp['V'] * +inp['sen(φ)'] / (1.73 * +inp['Z']) },
      { formula: 'I = VAR / (1.73 * V * sen(φ))', variables: ['VAR', 'V', 'sen(φ)'], compute: inp => +inp['VAR'] / (1.73 * +inp['V'] * +inp['sen(φ)']) },
      { formula: 'I = sqrt(W / R)', variables: ['W', 'R'], compute: inp => Math.sqrt(+inp['W'] / +inp['R']) },
      { formula: 'I = sqrt(W / (Z * cos(φ)))', variables: ['W', 'Z', 'cos(φ)'], compute: inp => Math.sqrt(+inp['W'] / (+inp['Z'] * +inp['cos(φ)'])) },
      { formula: 'I = sqrt(VAR / X)', variables: ['VAR', 'X'], compute: inp => Math.sqrt(+inp['VAR'] / +inp['X']) },
      { formula: 'I = sqrt(VAR / (Z * sen(φ)))', variables: ['VAR', 'Z', 'sen(φ)'], compute: inp => Math.sqrt(+inp['VAR'] / (+inp['Z'] * +inp['sen(φ)'])) },
      { formula: 'I = sqrt(kVA² / X)', variables: ['kVA', 'X'], compute: inp => Math.sqrt(Math.pow(+inp['kVA'], 2) / +inp['X']) },
      { formula: 'I = sqrt(kVA² / (Z * sen(φ)))', variables: ['kVA', 'Z', 'sen(φ)'], compute: inp => Math.sqrt(Math.pow(+inp['kVA'], 2) / (+inp['Z'] * +inp['sen(φ)'])) },
      { formula: 'I = V * cos(φ) / (1.73 * sqrt(Z² - R²))', variables: ['V', 'cos(φ)', 'Z', 'R'], compute: inp => +inp['V'] * +inp['cos(φ)'] / (1.73 * Math.sqrt(Math.pow(+inp['Z'], 2) - Math.pow(+inp['R'], 2))) }
    ],
    /* ----------------------------- V ------------------------------------- */
    'V': [
      { formula: 'V = I * Z * 1.73', variables: ['I', 'Z'], compute: inp => +inp['I'] * +inp['Z'] * 1.73 },
      { formula: 'V = kVA / (1.73 * I)', variables: ['kVA', 'I'], compute: inp => +inp['kVA'] / (1.73 * +inp['I']) },
      { formula: 'V = I * R * 1.73 / cos(φ)', variables: ['I', 'R', 'cos(φ)'], compute: inp => +inp['I'] * +inp['R'] * 1.73 / +inp['cos(φ)'] },
      { formula: 'V = sqrt(W * R) / cos(φ)', variables: ['W', 'R', 'cos(φ)'], compute: inp => Math.sqrt(+inp['W'] * +inp['R']) / +inp['cos(φ)'] },
      { formula: 'V = I * 1.73 * sqrt(Z² - R²)', variables: ['I', 'Z', 'R'], compute: inp => +inp['I'] * 1.73 * Math.sqrt(Math.pow(+inp['Z'], 2) - Math.pow(+inp['R'], 2)) },
      { formula: 'V = (kVA - V²) * R / W', variables: ['kVA', 'V', 'R', 'W'], compute: inp => (+inp['kVA'] - Math.pow(+inp['V'], 2)) * +inp['R'] / +inp['W'] },
      { formula: 'V = (W * R) / (I * cos(φ) * 1.73)', variables: ['W', 'R', 'I', 'cos(φ)'], compute: inp => +inp['W'] * +inp['R'] / (+inp['I'] * +inp['cos(φ)'] * 1.73) },
      { formula: 'V = (V * W * R) / cos(φ)', variables: ['V', 'W', 'R', 'cos(φ)'], compute: inp => +inp['V'] * +inp['W'] * +inp['R'] / +inp['cos(φ)'] },
      { formula: 'V = (X * I * 1.73) / (cos(φ) * tan(φ))', variables: ['X', 'I', 'cos(φ)', 'tan(φ)'], compute: inp => +inp['X'] * +inp['I'] * 1.73 / (+inp['cos(φ)'] * +inp['tan(φ)']) },
      { formula: 'V = (Z * W) / cos(φ)', variables: ['Z', 'W', 'cos(φ)'], compute: inp => +inp['Z'] * +inp['W'] / +inp['cos(φ)'] },
      { formula: 'V = (I * 1.73 * V² - X²) / sen(φ)', variables: ['I', 'V', 'X', 'sen(φ)'], compute: inp => (+inp['I'] * 1.73 * Math.pow(+inp['V'], 2) - Math.pow(+inp['X'], 2)) / +inp['sen(φ)'] },
      { formula: 'V = (I * 1.73 * sqrt(Z² - R²)) / sen(φ)', variables: ['I', 'Z', 'R', 'sen(φ)'], compute: inp => +inp['I'] * 1.73 * Math.sqrt(Math.pow(+inp['Z'], 2) - Math.pow(+inp['R'], 2)) / +inp['sen(φ)'] },
      { formula: 'V = kVA / (1.73 * I * sen(φ))', variables: ['kVA', 'I', 'sen(φ)'], compute: inp => +inp['kVA'] / (1.73 * +inp['I'] * +inp['sen(φ)']) }
    ],
    /* ----------------------------- R ------------------------------------- */
    'R': [
      { formula: 'R = Z * cos(φ)', variables: ['Z', 'cos(φ)'], compute: inp => +inp['Z'] * +inp['cos(φ)'] },
      { formula: 'R = sqrt(Z² - X²)', variables: ['Z', 'X'], compute: inp => Math.sqrt(Math.pow(+inp['Z'], 2) - Math.pow(+inp['X'], 2)) },
      { formula: 'R = (V * cos(φ)) / I', variables: ['V', 'cos(φ)', 'I'], compute: inp => +inp['V'] * +inp['cos(φ)'] / +inp['I'] },
      { formula: 'R = (V * cos(φ))² / W', variables: ['V', 'cos(φ)', 'W'], compute: inp => Math.pow(+inp['V'] * +inp['cos(φ)'], 2) / +inp['W'] },
      { formula: 'R = (VA * cos(φ)) / (3 * I²)', variables: ['VA', 'cos(φ)', 'I'], compute: inp => +inp['VA'] * +inp['cos(φ)'] / (3 * Math.pow(+inp['I'], 2)) },
      { formula: 'R = (X * cos(φ)) / sen(φ)', variables: ['X', 'cos(φ)', 'sen(φ)'], compute: inp => +inp['X'] * +inp['cos(φ)'] / +inp['sen(φ)'] },
      { formula: 'R = (W * X) / (VA * sen(φ))', variables: ['W', 'X', 'VA', 'sen(φ)'], compute: inp => +inp['W'] * +inp['X'] / (+inp['VA'] * +inp['sen(φ)']) },
      { formula: 'R = W / VA', variables: ['W', 'VA'], compute: inp => +inp['W'] / +inp['VA'] },
      { formula: 'R = (W * Z) / (VA * sen(φ))', variables: ['W', 'Z', 'VA', 'sen(φ)'], compute: inp => +inp['W'] * +inp['Z'] / (+inp['VA'] * +inp['sen(φ)']) },
      { formula: 'R = (W * Z) / (3 * I²)', variables: ['W', 'Z', 'I'], compute: inp => +inp['W'] * +inp['Z'] / (3 * Math.pow(+inp['I'], 2)) },
      { formula: 'R = (Z * sen(φ)) / tan(φ)', variables: ['Z', 'sen(φ)', 'tan(φ)'], compute: inp => +inp['Z'] * +inp['sen(φ)'] / +inp['tan(φ)'] },
      { formula: 'R = (N² * W) / (VAR * W)', variables: ['N', 'W', 'VAR'], compute: inp => Math.pow(+inp['N'], 2) * +inp['W'] / (+inp['VAR'] * +inp['W']) }
    ],
    /* ----------------------------- W ------------------------------------- */
    'W': [
      { formula: 'W = V * I * 1.73 * cos(φ)', variables: ['V', 'I', 'cos(φ)'], compute: inp => +inp['V'] * +inp['I'] * 1.73 * +inp['cos(φ)'] },
      { formula: 'W = 2 * 3.1416 * f * cos(φ) * I²', variables: ['f', 'cos(φ)', 'I'], compute: inp => 2 * 3.1416 * +inp['f'] * +inp['cos(φ)'] * Math.pow(+inp['I'], 2) },
      { formula: 'W = (V² * cos²(φ)) / Z', variables: ['V', 'cos(φ)', 'Z'], compute: inp => Math.pow(+inp['V'], 2) * Math.pow(+inp['cos(φ)'], 2) / +inp['Z'] },
      { formula: 'W = (VA * cos(φ) * tan(φ)) / X', variables: ['VA', 'cos(φ)', 'tan(φ)', 'X'], compute: inp => +inp['VA'] * +inp['cos(φ)'] * +inp['tan(φ)'] / +inp['X'] },
      { formula: 'W = (VA² * cos²(φ)) / Z', variables: ['VA', 'cos(φ)', 'Z'], compute: inp => Math.pow(+inp['VA'], 2) * Math.pow(+inp['cos(φ)'], 2) / +inp['Z'] },
      { formula: 'W = (V² * cos²(φ)) / R', variables: ['V', 'cos(φ)', 'R'], compute: inp => Math.pow(+inp['V'], 2) * Math.pow(+inp['cos(φ)'], 2) / +inp['R'] },
      { formula: 'W = (X * tan(φ)) / Z', variables: ['X', 'tan(φ)', 'Z'], compute: inp => +inp['X'] * +inp['tan(φ)'] / +inp['Z'] },
      { formula: 'W = (VA * sen(φ)) / X', variables: ['VA', 'sen(φ)', 'X'], compute: inp => +inp['VA'] * +inp['sen(φ)'] / +inp['X'] },
      { formula: 'W = VA * cos(φ)', variables: ['VA', 'cos(φ)'], compute: inp => +inp['VA'] * +inp['cos(φ)'] },
      { formula: 'W = (VA * X) / tan(φ)', variables: ['VA', 'X', 'tan(φ)'], compute: inp => +inp['VA'] * +inp['X'] / +inp['tan(φ)'] },
      { formula: 'W = (V² * X) / Z', variables: ['V', 'X', 'Z'], compute: inp => Math.pow(+inp['V'], 2) * +inp['X'] / +inp['Z'] },
      { formula: 'W = (V² * X) / (2 * X² + Z²)', variables: ['V', 'X', 'Z'], compute: inp => Math.pow(+inp['V'], 2) * +inp['X'] / (2 * Math.pow(+inp['X'], 2) + Math.pow(+inp['Z'], 2)) },
      { formula: 'W = (VA² * X) / (2 * X² + Z²)', variables: ['VA', 'X', 'Z'], compute: inp => Math.pow(+inp['VA'], 2) * +inp['X'] / (2 * Math.pow(+inp['X'], 2) + Math.pow(+inp['Z'], 2)) }
    ],
    /* --------------------------- tan(φ) ---------------------------------- */
    'tan(φ)': [
      { formula: 'tan(φ) = VAR / W', variables: ['VAR', 'W'], compute: inp => +inp['VAR'] / +inp['W'] },
      { formula: 'tan(φ) = X / R', variables: ['X', 'R'], compute: inp => +inp['X'] / +inp['R'] },
      { formula: 'tan(φ) = (Z * sen(φ)) / R', variables: ['Z', 'sen(φ)', 'R'], compute: inp => +inp['Z'] * +inp['sen(φ)'] / +inp['R'] },
      { formula: 'tan(φ) = sen(φ) / cos(φ)', variables: ['sen(φ)', 'cos(φ)'], compute: inp => +inp['sen(φ)'] / +inp['cos(φ)'] },
      { formula: 'tan(φ) = (V * I * 1.73 * cos(φ)) / W', variables: ['V', 'I', 'cos(φ)', 'W'], compute: inp => +inp['V'] * +inp['I'] * 1.73 * +inp['cos(φ)'] / +inp['W'] },
      { formula: 'tan(φ) = (VA * sen(φ)) / W', variables: ['VA', 'sen(φ)', 'W'], compute: inp => +inp['VA'] * +inp['sen(φ)'] / +inp['W'] },
      { formula: 'tan(φ) = (VAR * VA) / (VA² - VAR²)', variables: ['VAR', 'VA'], compute: inp => +inp['VAR'] * +inp['VA'] / (Math.pow(+inp['VA'], 2) - Math.pow(+inp['VAR'], 2)) },
      { formula: 'tan(φ) = VAR / (VA * cos(φ))', variables: ['VAR', 'VA', 'cos(φ)'], compute: inp => +inp['VAR'] / (+inp['VA'] * +inp['cos(φ)']) },
      { formula: 'tan(φ) = (X * V²) / (Z² - X²)', variables: ['X', 'V', 'Z'], compute: inp => +inp['X'] * Math.pow(+inp['V'], 2) / (Math.pow(+inp['Z'], 2) - Math.pow(+inp['X'], 2)) },
      { formula: 'tan(φ) = (sen(φ) * V * I) / cos(φ)', variables: ['sen(φ)', 'V', 'I', 'cos(φ)'], compute: inp => +inp['sen(φ)'] * +inp['V'] * +inp['I'] / +inp['cos(φ)'] },
      { formula: 'tan(φ) = X / (Z * cos(φ))', variables: ['X', 'Z', 'cos(φ)'], compute: inp => +inp['X'] / (+inp['Z'] * +inp['cos(φ)']) },
      { formula: 'tan(φ) = VAR / (1.73 * V * I * cos(φ))', variables: ['VAR', 'V', 'I', 'cos(φ)'], compute: inp => +inp['VAR'] / (1.73 * +inp['V'] * +inp['I'] * +inp['cos(φ)']) },
      { formula: 'tan(φ) = (V * IA * Z - W) / W', variables: ['V', 'IA', 'Z', 'W'], compute: inp => (+inp['V'] * +inp['IA'] * +inp['Z'] - +inp['W']) / +inp['W'] }
    ],
    /* --------------------------- cos(φ) ---------------------------------- */
    'cos(φ)': [
      { formula: 'cos(φ) = W / sqrt(W² + VAR²)', variables: ['W', 'VAR'], compute: inp => +inp['W'] / Math.sqrt(Math.pow(+inp['W'], 2) + Math.pow(+inp['VAR'], 2)) },
      { formula: 'cos(φ) = W / (1.73 * V * I)', variables: ['W', 'V', 'I'], compute: inp => +inp['W'] / (1.73 * +inp['V'] * +inp['I']) },
      { formula: 'cos(φ) = sqrt(VA² - VAR²) / VA', variables: ['VA', 'VAR'], compute: inp => Math.sqrt(Math.pow(+inp['VA'], 2) - Math.pow(+inp['VAR'], 2)) / +inp['VA'] },
      { formula: 'cos(φ) = R / sqrt(R² + X²)', variables: ['R', 'X'], compute: inp => +inp['R'] / Math.sqrt(Math.pow(+inp['R'], 2) + Math.pow(+inp['X'], 2)) },
      { formula: 'cos(φ) = 1 / sqrt(1 + tan²(φ))', variables: ['tan(φ)'], compute: inp => 1 / Math.sqrt(1 + Math.pow(+inp['tan(φ)'], 2)) },
      { formula: 'cos(φ) = R / Z', variables: ['R', 'Z'], compute: inp => +inp['R'] / +inp['Z'] },
      { formula: 'cos(φ) = W / VA', variables: ['W', 'VA'], compute: inp => +inp['W'] / +inp['VA'] },
      { formula: 'cos(φ) = VAR / (VA * tan(φ))', variables: ['VAR', 'VA', 'tan(φ)'], compute: inp => +inp['VAR'] / (+inp['VA'] * +inp['tan(φ)']) },
      { formula: 'cos(φ) = (W * sen(φ)) / VAR', variables: ['W', 'sen(φ)', 'VAR'], compute: inp => +inp['W'] * +inp['sen(φ)'] / +inp['VAR'] },
      { formula: 'cos(φ) = sen(φ) / tan(φ)', variables: ['sen(φ)', 'tan(φ)'], compute: inp => +inp['sen(φ)'] / +inp['tan(φ)'] },
      { formula: 'cos(φ) = X / (Z * tan(φ))', variables: ['X', 'Z', 'tan(φ)'], compute: inp => +inp['X'] / (+inp['Z'] * +inp['tan(φ)']) },
      { formula: 'cos(φ) = (Z * W) / V²', variables: ['Z', 'W', 'V'], compute: inp => +inp['Z'] * +inp['W'] / Math.pow(+inp['V'], 2) },
      { formula: 'cos(φ) = (V * I * sen²(φ))', variables: ['V', 'I', 'sen(φ)'], compute: inp => +inp['V'] * +inp['I'] * Math.pow(+inp['sen(φ)'], 2) }
    ],
    /* --------------------------- sen(φ) ---------------------------------- */
    'sen(φ)': [
      { formula: 'sen(φ) = VAR / sqrt(W² + VAR²)', variables: ['VAR', 'W'], compute: inp => +inp['VAR'] / Math.sqrt(Math.pow(+inp['W'], 2) + Math.pow(+inp['VAR'], 2)) },
      { formula: 'sen(φ) = VAR / (3 * Z)', variables: ['VAR', 'Z'], compute: inp => +inp['VAR'] / (3 * +inp['Z']) },
      { formula: 'sen(φ) = sqrt(VA² - W²) / VA', variables: ['VA', 'W'], compute: inp => Math.sqrt(Math.pow(+inp['VA'], 2) - Math.pow(+inp['W'], 2)) / +inp['VA'] },
      { formula: 'sen(φ) = (X * 1.73 * I) / (V * cos(φ))', variables: ['X', 'I', 'V', 'cos(φ)'], compute: inp => +inp['X'] * 1.73 * +inp['I'] / (+inp['V'] * +inp['cos(φ)']) },
      { formula: 'sen(φ) = tan(φ) / sqrt(1 + tan²(φ))', variables: ['tan(φ)'], compute: inp => +inp['tan(φ)'] / Math.sqrt(1 + Math.pow(+inp['tan(φ)'], 2)) },
      { formula: 'sen(φ) = (VAR * cos(φ)) / W', variables: ['VAR', 'cos(φ)', 'W'], compute: inp => +inp['VAR'] * +inp['cos(φ)'] / +inp['W'] },
      { formula: 'sen(φ) = sqrt(Z² + R²) / Z', variables: ['Z', 'R'], compute: inp => Math.sqrt(Math.pow(+inp['Z'], 2) + Math.pow(+inp['R'], 2)) / +inp['Z'] },
      { formula: 'sen(φ) = VAR / (1.73 * V * I)', variables: ['VAR', 'V', 'I'], compute: inp => +inp['VAR'] / (1.73 * +inp['V'] * +inp['I']) },
      { formula: 'sen(φ) = 1 - cos(φ)', variables: ['cos(φ)'], compute: inp => 1 - +inp['cos(φ)'] },
      { formula: 'sen(φ) = VAR / VA', variables: ['VAR', 'VA'], compute: inp => +inp['VAR'] / +inp['VA'] },
      { formula: 'sen(φ) = cos(φ) * tan(φ)', variables: ['cos(φ)', 'tan(φ)'], compute: inp => +inp['cos(φ)'] * +inp['tan(φ)'] },
      { formula: 'sen(φ) = (W * tan(φ)) / VA', variables: ['W', 'tan(φ)', 'VA'], compute: inp => +inp['W'] * +inp['tan(φ)'] / +inp['VA'] },
      { formula: 'sen(φ) = X / Z', variables: ['X', 'Z'], compute: inp => +inp['X'] / +inp['Z'] }
    ]
  };

  /* -------------------------------------------------------------------------- */
  /*                                   Getters                                   */
  /* -------------------------------------------------------------------------- */
  get equationVariableLabels(): string[] {
    return this.selectedEquation ? this.selectedEquation.variables : [];
  }

  /* -------------------------------------------------------------------------- */
  /*                              Lógica de selección                            */
  /* -------------------------------------------------------------------------- */
  seleccionarOpcion(opcion: string): void {
    this.opcionSeleccionada = opcion;
    this.subopcionSeleccionada = null;
    this.subsubopcionSeleccionada = null;
    this.resetearFormulario();
    this.selectedEquation = null;
  }

  seleccionarSubopcion(subopcion: string): void {
    this.subopcionSeleccionada = subopcion;
    this.subsubopcionSeleccionada = null;
    this.resetearFormulario();
    this.selectedEquation = null;
  }

  seleccionarSubsubopcion(index: number): void {
    if (!this.subopcionSeleccionada) { return; }
    switch (this.opcionSeleccionada) {
      case 'Sistemas monofásicos':
        this.selectedEquation = this.monofasicoEquations[this.subopcionSeleccionada][index];
        break;
      case 'Sistemas trifásicos':
        this.selectedEquation = this.trifasicoEquations[this.subopcionSeleccionada][index];
        break;
      case 'Análisis AC coseno de φ':
        this.selectedEquation = this.acTrifasicoEquations[this.subopcionSeleccionada][index];
        break;
      case 'Análisis AC velocidad angular':
        this.selectedEquation = this.acVelocidadEquations[this.subopcionSeleccionada][index];
        break;
      case 'Análisis AC General':
        this.selectedEquation = this.acGeneralEquations[this.subopcionSeleccionada][index];
        break;
    }
    this.resetearFormulario(true);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Cálculo                                   */
  /* -------------------------------------------------------------------------- */
  calcular(): void {
    if (this.selectedEquation) {
      for (const v of this.selectedEquation.variables) {
        if (this.formulario[v] == null) {
          alert(`Por favor, ingrese el valor de ${v}.`);
          return;
        }
      }
      const inputs: { [k: string]: number } = {};
      this.selectedEquation.variables.forEach(v => inputs[v] = +this.formulario[v]!);
      this.resultado = this.selectedEquation.compute(inputs);
      this.asignarUnidad();
    } else {
      this.resultado = Math.random() * 100;
      this.unidad = '';
    }
    this.conversiones = this.crearConversiones(this.resultado ?? 0);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Auxiliares UI                                */
  /* -------------------------------------------------------------------------- */
  resetearFormulario(resetInputs = true): void {
    if (resetInputs) {
      if (this.selectedEquation) {
        this.formulario = {};
        this.selectedEquation.variables.forEach(v => this.formulario[v] = null);
      } else {
        this.formulario = { input1: null, input2: null, input3: null };
      }
    }
    this.resultado = null;
    this.unidad = '';
    this.conversiones = this.crearConversiones(0);
  }

  asignarUnidad(): void {
    const s = this.subopcionSeleccionada || '';
    const mapa: { [k: string]: string } = {
      'Vatios': 'W', 'W': 'W', 'Potencia': 'W',
      'Resistencia': 'Ω', 'R': 'Ω', 'X': 'Ω', 'Impedancia (Z)': 'Ω',
      'Corriente': 'A', 'I': 'A',
      'Voltaje': 'V', 'V': 'V',
      'VA': 'VA',
      'Frecuencia Angular (ω)': 'rad/s',
      'Reactancia Inductiva (XL)': 'Ω',
      'Reactancia Capacitiva (XC)': 'Ω',
      'KVAR': 'VAR',
      'KW': 'W',
      'KVA': 'VA'
    };
    this.unidad = mapa[s] ?? '';
  }

  crearConversiones(valor: number): Conversions {
    const d = Math.min(Math.max(this.decimales, 0), 6);
    const f = (v: number) => Number.isFinite(v) ? v.toFixed(d) : '--';
    return {
      f: f(valor * 1e15),
      p: f(valor * 1e12),
      n: f(valor * 1e9),
      u: f(valor * 1e6),
      m: f(valor * 1e3),
      base: f(valor),
      k: f(valor / 1e3),
      M: f(valor / 1e6),
      G: f(valor / 1e9),
      T: f(valor / 1e12)
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                          Inicialización del DOM                            */
  /* -------------------------------------------------------------------------- */
  ngAfterViewInit(): void {
    const toggle = document.querySelector('.menu-header .menu-toggle-modern') as HTMLElement | null;
    const nav    = document.querySelector('.menu-header .nav-modern')        as HTMLElement | null;
    const close  = document.querySelector('.menu-header .close-menu')        as HTMLElement | null;

    toggle?.addEventListener('click', () => {
      toggle.classList.toggle('active');
      nav?.classList.toggle('active');
    });

    close?.addEventListener('click', () => {
      nav?.classList.remove('active');
      toggle?.classList.remove('active');
    });
  }
}

