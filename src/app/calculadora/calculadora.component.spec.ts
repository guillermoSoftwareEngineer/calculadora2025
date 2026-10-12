import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalculadoraComponent } from './calculadora.component';

describe('Calculadora: renderizado y flujo de usuario', () => {
  let fixture: ComponentFixture<CalculadoraComponent>;
  let component: CalculadoraComponent;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CalculadoraComponent] }).compileComponents();
    fixture = TestBed.createComponent(CalculadoraComponent);
    component = fixture.componentInstance;
    page = fixture.nativeElement;
    spyOn(component, 'scrollHacia');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renderiza los cinco sistemas y abre y cierra el menu', () => {
    expect(page.querySelectorAll('.btn-option').length).toBe(5);
    const menu = page.querySelector<HTMLButtonElement>('#menuBtn')!;
    menu.click();
    fixture.detectChanges();
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    menu.click();
    fixture.detectChanges();
    expect(menu.getAttribute('aria-expanded')).toBe('false');
  });

  it('renderiza resultados y conversiones para los cuatro ejemplos', () => {
    const results = [220 * 10 * Math.sqrt(3), 12, 2 * Math.PI * 60, 2 * Math.PI * 60 * 0.05];
    page.querySelectorAll<HTMLButtonElement>('.btn-preset').forEach((button, index) => {
      button.click();
      fixture.detectChanges();
      expect(component.resultado).toBeCloseTo(results[index], 2);
      expect(page.querySelector('#paso-resultado')).not.toBeNull();
      expect(page.querySelector('.error-alert')).toBeNull();
    });
  });

  it('permite recorrer todos los sistemas, variables y formulas sin errores de plantilla', () => {
    for (const system of component.opcionesPrincipales) {
      component.seleccionarOpcion(system);
      for (const variable of component.subopciones[system]) {
        component.seleccionarSubopcion(variable);
        component.getSubsubopciones().forEach((equation, index) => {
          component.seleccionarSubsubopcion(index);
          fixture.detectChanges();
          expect(page.querySelectorAll('.inputs-grid input').length).toBe(equation.variables.length + 1);
        });
      }
    }
  });

  it('acepta entradas decimales y oculta el resultado anterior al detectar datos invalidos', async () => {
    page.querySelectorAll<HTMLButtonElement>('.btn-preset')[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    const input = page.querySelector<HTMLInputElement>('#input_R')!;
    input.value = '0.5';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(input.validity.stepMismatch).toBeFalse();
    component.calcular();
    expect(component.resultado).toBe(240);
    component.formulario['R'] = null;
    component.calcular();
    fixture.detectChanges();
    expect(page.querySelector('#paso-resultado')).toBeNull();
    expect(page.querySelector('.error-alert')).not.toBeNull();
    component.formulario['R'] = 0;
    component.calcular();
    expect(component.resultado).toBeNull();
    component.resetearFormulario();
    fixture.detectChanges();
    expect(page.querySelector('.error-alert')).toBeNull();
  });
});
