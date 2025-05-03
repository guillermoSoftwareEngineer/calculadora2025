import { Component } from '@angular/core';
import { CalculadoraComponent } from './calculadora/calculadora.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CalculadoraComponent],
  templateUrl: './app.component.html'   // ahora usamos el HTML externo
})
export class AppComponent {}
