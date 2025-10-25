import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import ProfRequestModal from '../componentes/ProfRequestModal';

describe('ProfRequestModal', () => {
  test('no renderiza cuando open=false', () => {
    const { container } = render(<ProfRequestModal open={false} />);
    // usar comprobación básica: no contenido HTML
    expect(container.innerHTML).toBe('');
  });

  test('renderiza formulario y dispara onSubmit', () => {
    const materia = { nombre: 'Fisica', codigo: 'FIS1' };
    const form = { horarioPropuesto: '', diasPropuestos: [], cargaHorariaPropuesta: '' };
  const setForm = vi.fn();
  const onSubmit = vi.fn();
    render(<ProfRequestModal open={true} materia={materia} form={form} setForm={setForm} onSubmit={onSubmit} onClose={() => {}} />);

  // el texto debe existir en el DOM
  const el = screen.getByText(/Solicitar asignación/i);
  expect(el).toBeTruthy();
    fireEvent.click(screen.getByText(/Enviar solicitud/i));
    expect(onSubmit).toHaveBeenCalled();
  });
});
